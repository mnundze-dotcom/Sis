"use server";

import { and, eq, gte, inArray, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { reports, users } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { CATEGORIES, PLATFORMS, PROVINCES, formatPlate, hasOption, normalizePlate } from "@/lib/domain";
import { todayIso } from "@/lib/format";
import type { FormState } from "./auth";

const str = (fd: FormData, key: string, max = 300) => String(fd.get(key) ?? "").trim().slice(0, max);
const opt = (fd: FormData, key: string, max = 300) => str(fd, key, max) || null;

/** Returns the data URL, null when empty, or undefined when invalid. */
function photo(fd: FormData, key: string): string | null | undefined {
  const value = String(fd.get(key) ?? "");
  if (!value) return null;
  if (value.length > 700_000 || !/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(value)) return undefined;
  return value;
}

export async function submitReportAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Please sign in to submit a report." };

  const plate = normalizePlate(str(fd, "plate", 20));
  const category = str(fd, "category", 40);
  const platform = opt(fd, "platform", 60);
  const province = opt(fd, "province", 40);
  const incidentDate = opt(fd, "incidentDate", 10);
  const description = str(fd, "description", 3000);
  const driverPhotoUrl = photo(fd, "driverPhoto");
  const evidencePhotoUrl = photo(fd, "evidencePhoto");

  if (plate.length < 4) return { error: "Enter the vehicle's full number plate." };
  if (!hasOption(CATEGORIES, category)) return { error: "Choose what kind of incident this was." };
  if (platform && !(PLATFORMS as readonly string[]).includes(platform)) return { error: "Choose a valid type of ride." };
  if (province && !(PROVINCES as readonly string[]).includes(province)) return { error: "Choose a valid province." };
  if (incidentDate && (!/^\d{4}-\d{2}-\d{2}$/.test(incidentDate) || incidentDate > todayIso())) {
    return { error: "The incident date can't be in the future." };
  }
  if (description.length < 40) {
    return { error: "Please describe what happened in a little more detail (at least 40 characters)." };
  }
  if (driverPhotoUrl === undefined || evidencePhotoUrl === undefined) {
    return { error: "One of the photos couldn't be processed. Please try a different image." };
  }
  if (fd.get("declaration") !== "on") return { error: "Please confirm the declaration before submitting." };

  const [{ recent }] = await db
    .select({ recent: sql<number>`count(*)::int` })
    .from(reports)
    .where(and(eq(reports.userId, user.id), gte(reports.createdAt, new Date(Date.now() - 86_400_000))));
  if (recent >= 5) return { error: "You've submitted 5 reports in the last 24 hours. Please wait before submitting more." };

  const duplicate = await db
    .select({ id: reports.id })
    .from(reports)
    .where(and(eq(reports.userId, user.id), eq(reports.plate, plate), inArray(reports.status, ["pending", "needs_info"])))
    .limit(1);
  if (duplicate.length) {
    return { error: "You already have a report for this plate waiting for review. A moderator will be in touch if they need more." };
  }

  await db.insert(reports).values({
    userId: user.id,
    plate,
    category,
    platform,
    province,
    incidentDate,
    description,
    driverName: opt(fd, "driverName", 80),
    driverDescription: opt(fd, "driverDescription", 400),
    vehicleMake: opt(fd, "vehicleMake", 60),
    vehicleColour: opt(fd, "vehicleColour", 30),
    incidentArea: opt(fd, "incidentArea", 120),
    sapsCaseNumber: opt(fd, "sapsCaseNumber", 60),
    driverPhotoUrl,
    evidencePhotoUrl,
  });
  if (!user.guidelinesAcceptedAt) {
    await db.update(users).set({ guidelinesAcceptedAt: new Date() }).where(eq(users.id, user.id));
  }
  revalidatePath("/moderation");
  revalidatePath("/account");
  return { success: `Your report for ${formatPlate(plate)} has been received and is now with our moderators.` };
}
