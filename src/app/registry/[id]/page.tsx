import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { and, desc, eq } from "drizzle-orm";
import { ArrowLeft, Flag, Scale } from "lucide-react";
import { db } from "@/db";
import { disputes, records, reports } from "@/db/schema";
import { setRecordStatusAction } from "@/app/actions/moderation";
import { getCurrentUser, isModerator } from "@/lib/auth";
import { ensureSeed } from "@/lib/seed";
import { VERIFICATION_LEVELS, categoryLabel, disputeReasonLabel } from "@/lib/domain";
import { formatDate, timeAgo } from "@/lib/format";
import { SubmitButton } from "@/components/SubmitButton";
import {
  Avatar,
  CategoryChip,
  Container,
  Eyebrow,
  PlateTag,
  RecordStatusChip,
  RiskChip,
  SampleChip,
  VerificationChip,
  buttonClass,
  cx,
} from "@/components/ui";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Record" };

export default async function RecordPage({ params }: { params: Promise<{ id: string }> }) {
  await ensureSeed();
  const recordId = Number((await params).id);
  if (!Number.isInteger(recordId) || recordId <= 0) notFound();

  const user = await getCurrentUser();
  const moderator = isModerator(user);
  const [rec] = await db.select().from(records).where(eq(records.id, recordId)).limit(1);
  if (!rec || (rec.status === "removed" && !moderator)) notFound();

  const [timeline, openDisputes] = await Promise.all([
    db
      .select({ id: reports.id, incidentDate: reports.incidentDate, incidentArea: reports.incidentArea, platform: reports.platform, category: reports.category, createdAt: reports.createdAt })
      .from(reports)
      .where(and(eq(reports.recordId, rec.id), eq(reports.status, "approved")))
      .orderBy(desc(reports.createdAt)),
    moderator
      ? db.select().from(disputes).where(and(eq(disputes.recordId, rec.id), eq(disputes.status, "open")))
      : Promise.resolve([]),
  ]);
  const vehicle = [rec.vehicleColour, rec.vehicleMake].filter(Boolean).join(" ");

  return (
    <Container className="py-8 md:py-12">
      <Link href="/registry" className="inline-flex items-center gap-1.5 text-[13px] text-muted transition hover:text-ink">
        <ArrowLeft className="h-3.5 w-3.5" />
        Registry
      </Link>

      <div className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,1fr)_330px]">
        <div className="space-y-6">
          <section className="card overflow-hidden">
            <div className="relative overflow-hidden bg-plum-950 p-6 text-white sm:p-8">
              <div aria-hidden className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-blush-500/30 blur-3xl" />
              <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center">
                <Avatar name={rec.displayName} src={rec.photoUrl} size={116} dark />
                <div className="min-w-0">
                  <PlateTag plate={rec.plate} size="lg" />
                  <h1 className="mt-4 font-display text-[40px] leading-none sm:text-[46px]">{rec.displayName ?? "Driver identity unknown"}</h1>
                  {rec.driverDescription && <p className="mt-3 max-w-xl text-[14px] leading-relaxed text-white/70">{rec.driverDescription}</p>}
                </div>
              </div>
              <div className="relative mt-6 flex flex-wrap gap-1.5">
                <CategoryChip category={rec.category} dark />
                <RiskChip level={rec.riskLevel} />
                <VerificationChip level={rec.verification} dark />
                <RecordStatusChip status={rec.status} />
                {rec.isSample && <SampleChip dark />}
              </div>
            </div>
            <dl className="grid grid-cols-2 gap-px bg-line sm:grid-cols-4">
              {[
                ["Vehicle", vehicle || "—"],
                ["Province", rec.province ?? "—"],
                ["Reports", String(rec.reportCount)],
                ["Last updated", formatDate(rec.updatedAt)],
              ].map(([label, value]) => (
                <div key={label} className="bg-white p-5">
                  <dt className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted">{label}</dt>
                  <dd className="mt-1.5 text-[14px] font-medium text-ink">{value}</dd>
                </div>
              ))}
            </dl>
            <div className="border-t border-line p-6 sm:p-8">
              <Eyebrow>Moderator summary</Eyebrow>
              <p className="mt-4 text-[16.5px] leading-relaxed text-ink">{rec.summary}</p>
              {rec.status === "disputed" && (
                <p className="mt-5 flex gap-2 rounded-xl bg-[#fff5e1] p-3.5 text-[13px] leading-relaxed text-[#6b4a00]">
                  <Scale className="mt-0.5 h-4 w-4 shrink-0" />
                  Someone connected to this record has disputed it. It stays visible while a moderator reviews the evidence.
                </p>
              )}
            </div>
          </section>

          <section className="card p-6 sm:p-8">
            <h2 className="font-display text-[30px] leading-none text-ink">Incident timeline</h2>
            <p className="mt-2 text-[13px] text-muted">Moderated reports linked to this plate. Personal details are never shown.</p>
            {timeline.length === 0 ? (
              <p className="mt-6 text-[14px] text-muted">No individual reports are linked yet.</p>
            ) : (
              <ol className="relative mt-6 space-y-6 border-l border-line pl-6">
                {timeline.map((t) => (
                  <li key={t.id} className="relative">
                    <span className="absolute -left-[29.5px] top-1.5 h-2.5 w-2.5 rounded-full bg-blush-500 ring-4 ring-white" />
                    <p className="text-[14px] font-semibold text-ink">{formatDate(t.incidentDate ?? t.createdAt)}</p>
                    <p className="mt-1 text-[13px] text-muted">
                      {[categoryLabel(t.category), t.incidentArea, t.platform].filter(Boolean).join(" · ")}
                    </p>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <div className="card p-6">
            <p className="font-display text-[24px] leading-tight text-ink">Had an experience with this driver?</p>
            <p className="mt-2 text-[13px] leading-relaxed text-muted">Adding your report strengthens the warning for other women.</p>
            <Link href={`/report?plate=${rec.plate}`} className={buttonClass("accent", "md", "mt-4 w-full")}>
              <Flag />
              Add a report
            </Link>
          </div>
          <div className="card p-6">
            <p className="text-[14px] font-semibold text-ink">Is this record wrong?</p>
            <p className="mt-2 text-[13px] leading-relaxed text-muted">
              If you&apos;re named here, own this vehicle, or have evidence it&apos;s inaccurate, you have a right of reply.
            </p>
            <Link href={`/registry/${rec.id}/dispute`} className={buttonClass("secondary", "sm", "mt-4")}>
              <Scale />
              Dispute this record
            </Link>
          </div>
          <div className="card p-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">Verification levels</p>
            <ul className="mt-3 space-y-3">
              {VERIFICATION_LEVELS.map((v) => (
                <li key={v.value} className={cx("text-[12.5px] leading-relaxed", v.value === rec.verification ? "text-ink" : "text-muted")}>
                  <span className="font-semibold">{v.label}{v.value === rec.verification ? " · this record" : ""}</span>
                  <span className="block">{v.description}</span>
                </li>
              ))}
            </ul>
          </div>
          {moderator && (
            <div className="card border-plum-200 bg-plum-50/60 p-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-plum-700">Moderator only</p>
              <p className="mt-3 text-[13px] text-ink-soft">
                Evidence reference: <span className="font-medium text-ink">{rec.sapsCaseNumber ?? "None supplied"}</span>
              </p>
              {openDisputes.map((d) => (
                <p key={d.id} className="mt-2 text-[13px] text-ink-soft">
                  Open dispute: {disputeReasonLabel(d.reason)} · {timeAgo(d.createdAt)}
                </p>
              ))}
              <form action={setRecordStatusAction} className="mt-4">
                <input type="hidden" name="recordId" value={rec.id} />
                <input type="hidden" name="status" value={rec.status === "removed" ? "active" : "removed"} />
                <SubmitButton variant={rec.status === "removed" ? "primary" : "danger"} size="sm">
                  {rec.status === "removed" ? "Restore record" : "Remove record"}
                </SubmitButton>
              </form>
            </div>
          )}
        </aside>
      </div>
    </Container>
  );
}
