import type { Metadata } from "next";
import Link from "next/link";
import { BadgeCheck, EyeOff, Phone, ShieldCheck } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { normalizePlate } from "@/lib/domain";
import { firstParam } from "@/lib/format";
import ReportForm from "@/components/ReportForm";
import { Container, PageHeader, buttonClass } from "@/components/ui";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Report a driver" };

export default async function ReportPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const plate = normalizePlate(firstParam((await searchParams).plate));
  const user = await getCurrentUser();
  const next = `/report${plate ? `?plate=${plate}` : ""}`;

  return (
    <>
      <PageHeader
        eyebrow="Report a driver"
        title="Tell us what happened."
        description="Your report helps other women make safer choices. It's reviewed by a moderator before anything is published, and your identity is never shown publicly."
      />
      <Container className="grid gap-8 py-10 md:py-14 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div>
          {user ? (
            <ReportForm initialPlate={plate} />
          ) : (
            <div className="card p-8 sm:p-12">
              <h2 className="font-display text-[34px] leading-tight text-ink">Sign in to report</h2>
              <p className="mt-3 max-w-lg text-[15px] leading-relaxed text-ink-soft">
                Reports come from accountable members so that Sis stays fair and trustworthy. Your name and email are only visible to
                moderators — never to the public or the driver.
              </p>
              <div className="mt-7 flex flex-wrap gap-2">
                <Link href={`/signup?next=${encodeURIComponent(next)}`} className={buttonClass("accent", "md")}>Create a free account</Link>
                <Link href={`/login?next=${encodeURIComponent(next)}`} className={buttonClass("secondary", "md")}>Sign in</Link>
              </div>
            </div>
          )}
        </div>
        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <div className="card p-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">What happens next</p>
            <ol className="mt-4 space-y-4">
              {[
                ["A moderator reviews your report", "Usually within 48 hours. They may ask for more detail."],
                ["It's published — or not", "Approved reports are summarised in neutral language on the plate's record."],
                ["Women are warned", "Anyone who checks this plate will see a clear warning."],
              ].map(([title, body], i) => (
                <li key={title} className="flex gap-3">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-plum-950 font-mono text-[11px] text-white">{i + 1}</span>
                  <div>
                    <p className="text-[13.5px] font-semibold text-ink">{title}</p>
                    <p className="mt-0.5 text-[12.5px] leading-relaxed text-muted">{body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
          <div className="card space-y-3 p-6 text-[13px] leading-relaxed text-ink-soft">
            <p className="flex gap-3"><EyeOff className="h-4 w-4 shrink-0 text-plum-500" strokeWidth={1.75} />Your identity is never published.</p>
            <p className="flex gap-3"><BadgeCheck className="h-4 w-4 shrink-0 text-plum-500" strokeWidth={1.75} />A SAPS case number lets us mark a record as Evidence verified.</p>
            <p className="flex gap-3"><ShieldCheck className="h-4 w-4 shrink-0 text-plum-500" strokeWidth={1.75} />False reports are removed and accounts banned.</p>
          </div>
          <div className="rounded-[20px] bg-plum-950 p-6 text-white">
            <p className="font-display text-[24px] leading-tight">In danger right now?</p>
            <p className="mt-2 text-[13px] leading-relaxed text-white/65">Don&apos;t file a report first. Get somewhere safe and call for help.</p>
            <a href="tel:10111" className={buttonClass("accent", "md", "mt-4 w-full")}>
              <Phone />
              Call SAPS 10111
            </a>
          </div>
        </aside>
      </Container>
    </>
  );
}
