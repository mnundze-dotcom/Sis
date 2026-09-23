import type { Metadata } from "next";
import Link from "next/link";
import { asc, desc, eq, inArray } from "drizzle-orm";
import { Inbox, Scale } from "lucide-react";
import { db } from "@/db";
import { disputes, records, reports, users } from "@/db/schema";
import { approveReportAction, rejectReportAction, requestInfoAction, resolveDisputeAction } from "@/app/actions/moderation";
import { requireModerator } from "@/lib/auth";
import { ensureSeed } from "@/lib/seed";
import { CATEGORIES, RISK_LEVELS, VERIFICATION_LEVELS, disputeReasonLabel, relationshipLabel } from "@/lib/domain";
import { firstParam, formatDate, timeAgo } from "@/lib/format";
import { SubmitButton } from "@/components/SubmitButton";
import {
  CategoryChip,
  Chip,
  Container,
  EmptyState,
  PageHeader,
  PlateTag,
  RecordStatusChip,
  ReportStatusChip,
  SampleChip,
  cx,
} from "@/components/ui";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Moderation" };

function defaultRisk(category: string) {
  return category === "sexual_offence" || category === "robbery" || category === "gbv" ? "high" : "medium";
}

function Info({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div>
      <dt className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted">{label}</dt>
      <dd className="mt-0.5 text-ink">{value}</dd>
    </div>
  );
}

export default async function ModerationPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await ensureSeed();
  const moderator = await requireModerator();
  const tab = firstParam((await searchParams).tab) === "disputes" ? "disputes" : "reports";

  const [queue, openDisputes, recent] = await Promise.all([
    db
      .select({ report: reports, reporterEmail: users.email, reporterName: users.displayName })
      .from(reports)
      .leftJoin(users, eq(reports.userId, users.id))
      .where(inArray(reports.status, ["pending", "needs_info"]))
      .orderBy(asc(reports.createdAt)),
    db
      .select({ dispute: disputes, record: records })
      .from(disputes)
      .innerJoin(records, eq(disputes.recordId, records.id))
      .where(eq(disputes.status, "open"))
      .orderBy(asc(disputes.createdAt)),
    db.select().from(reports).where(inArray(reports.status, ["approved", "rejected"])).orderBy(desc(reports.reviewedAt)).limit(6),
  ]);
  const plates = [...new Set(queue.map((q) => q.report.plate))];
  const existing = plates.length ? await db.select().from(records).where(inArray(records.plate, plates)) : [];
  const byPlate = new Map(existing.map((r) => [r.plate, r]));

  return (
    <>
      <PageHeader eyebrow={`Signed in as ${moderator.displayName}`} title="Moderation." description="Review reports before they're published and resolve right-of-reply disputes. Be neutral, factual and protect every victim's privacy.">
        <div className="mt-8 flex flex-wrap gap-2">
          {(
            [
              ["reports", `Reports · ${queue.length}`],
              ["disputes", `Disputes · ${openDisputes.length}`],
            ] as const
          ).map(([key, label]) => (
            <Link
              key={key}
              href={`/moderation?tab=${key}`}
              className={cx(
                "rounded-full px-4 py-2 text-[13.5px] font-medium transition",
                tab === key ? "bg-plum-950 text-white" : "border border-line bg-white text-ink-soft hover:text-ink",
              )}
            >
              {label}
            </Link>
          ))}
        </div>
      </PageHeader>

      <Container className="space-y-5 py-10">
        {tab === "reports" &&
          (queue.length === 0 ? (
            <EmptyState icon={<Inbox className="h-5 w-5" />} title="Inbox zero">No reports are waiting for review.</EmptyState>
          ) : (
            queue.map(({ report, reporterEmail, reporterName }) => {
              const rec = byPlate.get(report.plate);
              return (
                <article key={report.id} className="card overflow-hidden">
                  <div className="grid lg:grid-cols-[minmax(0,1fr)_400px]">
                    <div className="p-6 sm:p-7">
                      <div className="flex flex-wrap items-center gap-2">
                        <PlateTag plate={report.plate} />
                        <CategoryChip category={report.category} />
                        <ReportStatusChip status={report.status} />
                        {rec && <Chip tone="plum">Existing record · {rec.reportCount} report{rec.reportCount === 1 ? "" : "s"}</Chip>}
                        {report.isSample && <SampleChip />}
                      </div>
                      <p className="mt-3 text-[12.5px] text-muted">
                        Submitted {timeAgo(report.createdAt)} by {reporterName ?? "a sample member"}
                        {reporterEmail ? ` · ${reporterEmail}` : ""}
                      </p>
                      <p className="mt-5 whitespace-pre-line text-[15px] leading-relaxed text-ink">{report.description}</p>
                      <dl className="mt-6 grid gap-x-6 gap-y-3 text-[13px] sm:grid-cols-2">
                        <Info label="Incident date" value={report.incidentDate ? formatDate(report.incidentDate) : null} />
                        <Info label="Area" value={report.incidentArea} />
                        <Info label="Ride" value={report.platform} />
                        <Info label="Province" value={report.province} />
                        <Info label="Vehicle" value={[report.vehicleColour, report.vehicleMake].filter(Boolean).join(" ")} />
                        <Info label="SAPS case number" value={report.sapsCaseNumber} />
                        <Info label="Driver name" value={report.driverName} />
                        <Info label="Driver description" value={report.driverDescription} />
                      </dl>
                      {(report.driverPhotoUrl || report.evidencePhotoUrl) && (
                        <div className="mt-6 flex flex-wrap gap-4">
                          {[
                            [report.driverPhotoUrl, "Driver photo"],
                            [report.evidencePhotoUrl, "Evidence"],
                          ].map(([src, label]) =>
                            src ? (
                              <figure key={label}>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={src} alt={label ?? ""} className="h-32 w-32 rounded-xl object-cover ring-1 ring-line" />
                                <figcaption className="mt-1.5 text-[11.5px] text-muted">{label}</figcaption>
                              </figure>
                            ) : null,
                          )}
                        </div>
                      )}
                      {report.moderatorNote && (
                        <p className="mt-5 rounded-xl bg-blush-50 p-3 text-[13px] text-blush-800">Previous note: {report.moderatorNote}</p>
                      )}
                    </div>

                    <form action={approveReportAction} className="space-y-3 border-t border-line bg-plum-50/40 p-6 sm:p-7 lg:border-l lg:border-t-0">
                      <input type="hidden" name="reportId" value={report.id} />
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">Publishing decision</p>
                      <label className="block">
                        <span className="label">Public name</span>
                        <input name="displayName" defaultValue={rec?.displayName ?? report.driverName ?? "Unknown driver"} maxLength={80} className="field" />
                      </label>
                      <label className="block">
                        <span className="label">Public summary</span>
                        <textarea name="summary" rows={5} defaultValue={rec?.summary ?? report.description} maxLength={1200} className="field resize-y" />
                        <span className="hint">Neutral, factual language. Remove anything that identifies the reporter.</span>
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <label className="block">
                          <span className="label">Category</span>
                          <select name="category" defaultValue={report.category} className="field">
                            {CATEGORIES.map((c) => (
                              <option key={c.value} value={c.value}>{c.short}</option>
                            ))}
                          </select>
                        </label>
                        <label className="block">
                          <span className="label">Risk</span>
                          <select name="riskLevel" defaultValue={rec?.riskLevel ?? defaultRisk(report.category)} className="field">
                            {RISK_LEVELS.map((r) => (
                              <option key={r.value} value={r.value}>{r.label}</option>
                            ))}
                          </select>
                        </label>
                      </div>
                      <label className="block">
                        <span className="label">Verification</span>
                        <select name="verification" defaultValue={rec?.verification ?? (report.sapsCaseNumber ? "verified" : "community")} className="field">
                          {VERIFICATION_LEVELS.map((v) => (
                            <option key={v.value} value={v.value}>{v.label}</option>
                          ))}
                        </select>
                      </label>
                      {report.driverPhotoUrl && (
                        <label className="flex items-center gap-2 text-[13px] text-ink-soft">
                          <input type="checkbox" name="usePhoto" defaultChecked className="h-4 w-4 accent-[#5d2d79]" />
                          Publish the driver photo
                        </label>
                      )}
                      <label className="block">
                        <span className="label">Note to reporter</span>
                        <textarea name="moderatorNote" rows={2} maxLength={500} placeholder="Shown to the reporter. Required when rejecting or asking for more." className="field resize-y" />
                      </label>
                      <div className="flex flex-wrap gap-2 pt-1">
                        <SubmitButton size="sm">Approve &amp; publish</SubmitButton>
                        <SubmitButton size="sm" variant="secondary" formAction={requestInfoAction}>Request info</SubmitButton>
                        <SubmitButton size="sm" variant="ghost" formAction={rejectReportAction}>Reject</SubmitButton>
                      </div>
                    </form>
                  </div>
                </article>
              );
            })
          ))}

        {tab === "disputes" &&
          (openDisputes.length === 0 ? (
            <EmptyState icon={<Scale className="h-5 w-5" />} title="No open disputes">Right-of-reply requests will appear here.</EmptyState>
          ) : (
            openDisputes.map(({ dispute, record }) => (
              <article key={dispute.id} className="card overflow-hidden">
                <div className="grid lg:grid-cols-[minmax(0,1fr)_380px]">
                  <div className="p-6 sm:p-7">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link href={`/registry/${record.id}`}><PlateTag plate={record.plate} /></Link>
                      <CategoryChip category={record.category} />
                      <RecordStatusChip status={record.status} />
                    </div>
                    <p className="mt-3 text-[12.5px] text-muted">Filed {timeAgo(dispute.createdAt)}</p>
                    <dl className="mt-5 grid gap-x-6 gap-y-3 text-[13px] sm:grid-cols-2">
                      <Info label="From" value={dispute.name} />
                      <Info label="Email" value={dispute.email} />
                      <Info label="Connection" value={relationshipLabel(dispute.relationship)} />
                      <Info label="Reason" value={disputeReasonLabel(dispute.reason)} />
                    </dl>
                    <p className="mt-5 whitespace-pre-line text-[15px] leading-relaxed text-ink">{dispute.details}</p>
                    <div className="mt-5 rounded-xl bg-plum-50 p-4 text-[13px] leading-relaxed text-ink-soft">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">Published summary</p>
                      <p className="mt-1.5">{record.summary}</p>
                    </div>
                  </div>
                  <form action={resolveDisputeAction} className="space-y-3 border-t border-line bg-plum-50/40 p-6 sm:p-7 lg:border-l lg:border-t-0">
                    <input type="hidden" name="disputeId" value={dispute.id} />
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">Resolution</p>
                    <label className="block">
                      <span className="label">Note to requester</span>
                      <textarea name="resolutionNote" rows={4} maxLength={800} className="field resize-y" placeholder={`Reply sent to ${dispute.email}`} />
                    </label>
                    <div className="flex flex-wrap gap-2">
                      <SubmitButton size="sm" variant="danger" name="outcome" value="upheld">Uphold · remove record</SubmitButton>
                      <SubmitButton size="sm" variant="secondary" name="outcome" value="dismissed">Dismiss · keep record</SubmitButton>
                    </div>
                  </form>
                </div>
              </article>
            ))
          ))}

        {recent.length > 0 && (
          <section className="card mt-10 p-6 sm:p-7">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">Recently reviewed</p>
            <ul className="mt-3 divide-y divide-line">
              {recent.map((r) => (
                <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div className="flex items-center gap-2">
                    <PlateTag plate={r.plate} size="sm" />
                    <CategoryChip category={r.category} />
                  </div>
                  <div className="flex items-center gap-3">
                    <ReportStatusChip status={r.status} />
                    <span className="text-[12px] text-muted">{timeAgo(r.reviewedAt)}</span>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}
      </Container>
    </>
  );
}
