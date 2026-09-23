"use server";

import { and, eq, inArray, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { records, reports, scans, type RecordRow } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { detectProvince, normalizePlate, verificationLabel } from "@/lib/domain";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { findNameMatches, getWantedList, nameTokens } from "@/lib/saps";

export type SourceStatus = "hit" | "pending" | "clear" | "unavailable" | "restricted" | "skipped";
export type SourceResult = { key: string; name: string; status: SourceStatus; detail: string };

export type PublicRecord = {
  id: number;
  plate: string;
  displayName: string | null;
  driverDescription: string | null;
  category: string;
  riskLevel: string;
  verification: string;
  status: string;
  province: string | null;
  vehicleMake: string | null;
  vehicleColour: string | null;
  summary: string;
  photoUrl: string | null;
  reportCount: number;
  isSample: boolean;
  updatedAt: string;
};

export type CheckResult = {
  plate: string;
  province: string | null;
  outcome: "match" | "caution" | "clear";
  record: PublicRecord | null;
  pendingReports: number;
  sapsMatches: { bid: string; fullName: string; crime: string; photoId: string | null }[];
  sources: SourceResult[];
  checkedAt: string;
};

function toPublic(rec: RecordRow): PublicRecord {
  return {
    id: rec.id,
    plate: rec.plate,
    displayName: rec.displayName,
    driverDescription: rec.driverDescription,
    category: rec.category,
    riskLevel: rec.riskLevel,
    verification: rec.verification,
    status: rec.status,
    province: rec.province,
    vehicleMake: rec.vehicleMake,
    vehicleColour: rec.vehicleColour,
    summary: rec.summary,
    photoUrl: rec.photoUrl,
    reportCount: rec.reportCount,
    isSample: rec.isSample,
    updatedAt: rec.updatedAt.toISOString(),
  };
}

export async function checkPlate(input: string, method: string): Promise<CheckResult | { error: string }> {
  const plate = normalizePlate(String(input ?? ""));
  if (plate.length < 4) return { error: "Enter the full number plate, e.g. CA 123-456 or BC 12 DF GP." };
  if (!rateLimit(`scan:${await clientIp()}`, 40, 10 * 60_000)) {
    return { error: "You've run a lot of checks in a short time. Please wait a few minutes." };
  }

  const user = await getCurrentUser();
  const [rec] = await db.select().from(records).where(eq(records.plate, plate)).limit(1);
  const visible = rec && rec.status !== "removed" ? rec : null;
  const [{ pending }] = await db
    .select({ pending: sql<number>`count(*)::int` })
    .from(reports)
    .where(and(eq(reports.plate, plate), inArray(reports.status, ["pending", "needs_info"])));

  let saps: SourceResult = {
    key: "saps",
    name: "SAPS public wanted persons list",
    status: "skipped",
    detail: visible
      ? "The driver's name isn't known, so a name cross-check isn't possible."
      : "Runs when a registry record includes the driver's name.",
  };
  let sapsMatches: CheckResult["sapsMatches"] = [];
  const name = visible?.displayName ?? "";
  if (name && !/^unknown/i.test(name) && nameTokens(name).length >= 2) {
    const list = await getWantedList();
    if (list.people.length === 0) {
      saps = { ...saps, status: "unavailable", detail: "saps.gov.za couldn't be reached just now. Try again shortly." };
    } else {
      sapsMatches = findNameMatches(name, list.people).map((p) => ({
        bid: p.bid,
        fullName: p.fullName,
        crime: p.crime,
        photoId: p.photoId,
      }));
      saps = {
        ...saps,
        status: sapsMatches.length ? "hit" : "clear",
        detail: sapsMatches.length
          ? "Possible name match. Confirm on the SAPS record before acting."
          : `No name match among ${list.people.length} people on the live SAPS list.`,
      };
    }
  }

  const outcome: CheckResult["outcome"] = visible ? "match" : pending > 0 ? "caution" : "clear";
  await db.insert(scans).values({
    userId: user?.id ?? null,
    plate,
    outcome,
    recordId: visible?.id ?? null,
    method: method === "camera" || method === "photo" ? method : "manual",
  });
  revalidatePath("/");

  const sources: SourceResult[] = [
    {
      key: "registry",
      name: "Sis community registry",
      status: visible ? "hit" : "clear",
      detail: visible
        ? `${verificationLabel(visible.verification)} · ${visible.reportCount} moderated report${visible.reportCount === 1 ? "" : "s"}`
        : "No moderated record for this plate.",
    },
    {
      key: "pending",
      name: "Reports awaiting moderation",
      status: pending > 0 ? "pending" : "clear",
      detail: pending > 0 ? `${pending} report${pending === 1 ? "" : "s"} being reviewed — details stay hidden until verified.` : "None.",
    },
    saps,
    {
      key: "nrso",
      name: "National Register for Sex Offenders",
      status: "restricted",
      detail: "Not publicly searchable in South Africa — only approved employers may apply for checks.",
    },
    {
      key: "enatis",
      name: "eNaTIS vehicle owner details",
      status: "restricted",
      detail: "Owner identity is restricted to authorised bodies under POPIA.",
    },
  ];

  return {
    plate,
    province: visible?.province ?? detectProvince(plate),
    outcome,
    record: visible ? toPublic(visible) : null,
    pendingReports: pending,
    sapsMatches,
    sources,
    checkedAt: new Date().toISOString(),
  };
}
