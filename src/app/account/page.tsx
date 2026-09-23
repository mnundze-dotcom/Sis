import type { Metadata } from "next";
import Link from "next/link";
import { desc, eq, sql } from "drizzle-orm";
import { FileText, LogOut, ScanLine } from "lucide-react";
import { db } from "@/db";
import { contacts, reports, scans } from "@/db/schema";
import { deleteAccountAction, signOutAction } from "@/app/actions/auth";
import { isModerator, requireUser } from "@/lib/auth";
import { categoryLabel } from "@/lib/domain";
import { firstParam, formatDate, timeAgo } from "@/lib/format";
import { SubmitButton } from "@/components/SubmitButton";
import { Chip, Container, PageHeader, PlateTag, ReportStatusChip, buttonClass } from "@/components/ui";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Your account" };

const OUTCOME = {
  match: <Chip tone="danger" dot>Match</Chip>,
  caution: <Chip tone="warning" dot>Caution</Chip>,
  clear: <Chip tone="success" dot>Clear</Chip>,
} as const;

export default async function AccountPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requireUser("/account");
  const confirmError = firstParam((await searchParams).error) === "confirm";
  const [myReports, myScans, [contactCount]] = await Promise.all([
    db
      .select({ id: reports.id, plate: reports.plate, category: reports.category, status: reports.status, moderatorNote: reports.moderatorNote, recordId: reports.recordId, createdAt: reports.createdAt })
      .from(reports)
      .where(eq(reports.userId, user.id))
      .orderBy(desc(reports.createdAt)),
    db.select().from(scans).where(eq(scans.userId, user.id)).orderBy(desc(scans.createdAt)).limit(12),
    db.select({ n: sql<number>`count(*)::int` }).from(contacts).where(eq(contacts.userId, user.id)),
  ]);

  return (
    <>
      <PageHeader eyebrow="Your account" title={`Hi, ${user.displayName.split(" ")[0]}.`} description="Your reports, checks and privacy settings in one place.">
        <div className="mt-6 flex flex-wrap gap-2">
          {isModerator(user) && <Link href="/moderation" className={buttonClass("primary", "sm")}>Open moderation</Link>}
          <form action={signOutAction}>
            <SubmitButton variant="secondary" size="sm">
              <LogOut />
              Sign out
            </SubmitButton>
          </form>
        </div>
      </PageHeader>

      <Container className="grid gap-6 py-10 md:py-14 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          <section className="card p-6 sm:p-8">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-[30px] leading-none text-ink">My reports</h2>
              <Link href="/report" className={buttonClass("secondary", "sm")}>New report</Link>
            </div>
            {myReports.length === 0 ? (
              <p className="mt-6 flex items-center gap-3 text-[14px] text-muted">
                <FileText className="h-4 w-4" />
                You haven&apos;t submitted any reports.
              </p>
            ) : (
              <ul className="mt-5 divide-y divide-line">
                {myReports.map((r) => (
                  <li key={r.id} className="py-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <PlateTag plate={r.plate} size="sm" />
                        <span className="text-[13px] text-ink-soft">{categoryLabel(r.category)}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <ReportStatusChip status={r.status} />
                        <span className="text-[12px] text-muted">{formatDate(r.createdAt)}</span>
                      </div>
                    </div>
                    {r.moderatorNote && r.status !== "approved" && (
                      <p className="mt-3 rounded-xl bg-plum-50 p-3 text-[13px] leading-relaxed text-ink-soft">
                        <span className="font-semibold text-ink">Moderator note: </span>
                        {r.moderatorNote}
                      </p>
                    )}
                    {r.status === "approved" && r.recordId && (
                      <Link href={`/registry/${r.recordId}`} className="mt-2 inline-block text-[12.5px] font-medium text-plum-700 hover:underline">
                        View published record →
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="card p-6 sm:p-8">
            <h2 className="font-display text-[30px] leading-none text-ink">Recent checks</h2>
            {myScans.length === 0 ? (
              <p className="mt-6 flex items-center gap-3 text-[14px] text-muted">
                <ScanLine className="h-4 w-4" />
                No checks yet.{" "}
                <Link href="/" className="font-medium text-plum-700 hover:underline">Check a plate</Link>
              </p>
            ) : (
              <ul className="mt-5 divide-y divide-line">
                {myScans.map((s) => (
                  <li key={s.id} className="flex items-center justify-between gap-3 py-3">
                    <PlateTag plate={s.plate} size="sm" />
                    <div className="flex items-center gap-3">
                      {OUTCOME[s.outcome as keyof typeof OUTCOME] ?? null}
                      <span className="w-20 text-right text-[12px] text-muted">{timeAgo(s.createdAt)}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <aside className="space-y-4">
          <div className="card p-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">Profile</p>
            <dl className="mt-4 space-y-3 text-[13.5px]">
              <div><dt className="text-muted">Email</dt><dd className="font-medium text-ink">{user.email}</dd></div>
              <div><dt className="text-muted">Member since</dt><dd className="font-medium text-ink">{formatDate(user.createdAt)}</dd></div>
              <div><dt className="text-muted">Role</dt><dd className="font-medium capitalize text-ink">{user.role}</dd></div>
              <div>
                <dt className="text-muted">Guidelines accepted</dt>
                <dd className="font-medium text-ink">{user.guidelinesAcceptedAt ? formatDate(user.guidelinesAcceptedAt) : "Not yet"}</dd>
              </div>
            </dl>
          </div>
          <div className="card p-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">Trusted contacts</p>
            <p className="mt-3 text-[14px] text-ink-soft">{contactCount.n} of 5 saved</p>
            <Link href="/safety#contacts" className={buttonClass("secondary", "sm", "mt-4")}>Manage contacts</Link>
          </div>
          <div className="card border-[#f5cfd0] p-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#a4262c]">Delete account</p>
            <p className="mt-3 text-[13px] leading-relaxed text-ink-soft">
              Erases your profile, check history and contacts. Your reports stay published anonymously so other women stay protected.
            </p>
            <form action={deleteAccountAction} className="mt-4 space-y-3">
              <label className="block">
                <span className="label">Type DELETE to confirm</span>
                <input name="confirm" autoComplete="off" className="field" />
              </label>
              {confirmError && <p className="text-[12.5px] font-medium text-[#a4262c]">Please type DELETE to confirm.</p>}
              <SubmitButton variant="danger" size="sm">Delete my account</SubmitButton>
            </form>
          </div>
        </aside>
      </Container>
    </>
  );
}
