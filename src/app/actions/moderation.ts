"use server";

import { and, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { disputes, records, reports } from "@/db/schema";
import { requireModerator } from "@/lib/auth";
import { CATEGORIES, RISK_LEVELS, VERIFICATION_LEVELS } from "@/lib/domain";

const text = (fd: FormData, key: string, max = 2000) => String(fd.get(key) ?? "").trim().slice(0, max);
function pick(value: FormDataEntryValue | null, list: readonly { value: string }[], fallback: string): string {
  const v = String(value ?? "");
  return list.some((o) => o.value === v) ? v : fallback;
}

function refresh() {
  revalidatePath("/moderation");
  revalidatePath("/registry", "layout");
  revalidatePath("/account");
  revalidatePath("/");
}

export async function approveReportAction(fd: FormData): Promise<void> {
  const moderator = await requireModerator();
  const [report] = await db.select().from(reports).where(eq(reports.id, Number(fd.get("reportId")))).limit(1);
  if (!report || report.status === "approved" || report.status === "rejected") return;

  const category = pick(fd.get("category"), CATEGORIES, report.category);
  const riskLevel = pick(fd.get("riskLevel"), RISK_LEVELS, "medium");
  const verification = pick(fd.get("verification"), VERIFICATION_LEVELS, "community");
  const displayName = text(fd, "displayName", 80) || null;
  const summary = text(fd, "summary", 1200) || report.description.slice(0, 1200);
  const note = text(fd, "moderatorNote", 500) || null;
  const usePhoto = fd.get("usePhoto") === "on" && !!report.driverPhotoUrl;
  const now = new Date();

  const [existing] = await db.select().from(records).where(eq(records.plate, report.plate)).limit(1);
  let recordId: number;
  if (existing) {
    await db
      .update(records)
      .set({
        category,
        riskLevel,
        verification,
        summary,
        displayName: displayName ?? existing.displayName,
        driverDescription: existing.driverDescription ?? report.driverDescription,
        province: existing.province ?? report.province,
        vehicleMake: existing.vehicleMake ?? report.vehicleMake,
        vehicleColour: existing.vehicleColour ?? report.vehicleColour,
        photoUrl: usePhoto ? report.driverPhotoUrl : existing.photoUrl,
        sapsCaseNumber: existing.sapsCaseNumber ?? report.sapsCaseNumber,
        reportCount: sql`${records.reportCount} + 1`,
        status: existing.status === "removed" ? "active" : existing.status,
        updatedAt: now,
      })
      .where(eq(records.id, existing.id));
    recordId = existing.id;
  } else {
    const [created] = await db
      .insert(records)
      .values({
        plate: report.plate,
        displayName,
        driverDescription: report.driverDescription,
        category,
        riskLevel,
        verification,
        province: report.province,
        vehicleMake: report.vehicleMake,
        vehicleColour: report.vehicleColour,
        summary,
        photoUrl: usePhoto ? report.driverPhotoUrl : null,
        sapsCaseNumber: report.sapsCaseNumber,
        reportCount: 1,
      })
      .returning({ id: records.id });
    recordId = created.id;
  }

  await db
    .update(reports)
    .set({ status: "approved", recordId, moderatorNote: note, reviewedBy: moderator.id, reviewedAt: now })
    .where(eq(reports.id, report.id));
  refresh();
}

async function review(fd: FormData, status: "rejected" | "needs_info", fallbackNote: string) {
  const moderator = await requireModerator();
  const note = text(fd, "moderatorNote", 500) || fallbackNote;
  await db
    .update(reports)
    .set({ status, moderatorNote: note, reviewedBy: moderator.id, reviewedAt: new Date() })
    .where(eq(reports.id, Number(fd.get("reportId"))));
  refresh();
}

export async function rejectReportAction(fd: FormData): Promise<void> {
  await review(fd, "rejected", "This report didn't meet our Community Guidelines for publication.");
}

export async function requestInfoAction(fd: FormData): Promise<void> {
  await review(fd, "needs_info", "Our moderators need a little more detail, such as a SAPS case number or trip receipt.");
}

export async function resolveDisputeAction(fd: FormData): Promise<void> {
  await requireModerator();
  const outcome = fd.get("outcome") === "upheld" ? "upheld" : "dismissed";
  const [dispute] = await db.select().from(disputes).where(eq(disputes.id, Number(fd.get("disputeId")))).limit(1);
  if (!dispute || dispute.status !== "open") return;
  const now = new Date();
  await db
    .update(disputes)
    .set({ status: outcome, resolutionNote: text(fd, "resolutionNote", 800) || null, resolvedAt: now })
    .where(eq(disputes.id, dispute.id));
  if (outcome === "upheld") {
    await db.update(records).set({ status: "removed", updatedAt: now }).where(eq(records.id, dispute.recordId));
  } else {
    const [{ open }] = await db
      .select({ open: sql<number>`count(*)::int` })
      .from(disputes)
      .where(and(eq(disputes.recordId, dispute.recordId), eq(disputes.status, "open")));
    if (open === 0) {
      await db
        .update(records)
        .set({ status: "active", updatedAt: now })
        .where(and(eq(records.id, dispute.recordId), eq(records.status, "disputed")));
    }
  }
  refresh();
}

export async function setRecordStatusAction(fd: FormData): Promise<void> {
  await requireModerator();
  const status = fd.get("status") === "removed" ? "removed" : "active";
  await db.update(records).set({ status, updatedAt: new Date() }).where(eq(records.id, Number(fd.get("recordId"))));
  refresh();
}
