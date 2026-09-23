import Link from "next/link";
import { desc, eq, inArray, sql } from "drizzle-orm";
import { ArrowRight, ArrowUpRight, Lock, Radio, ScanLine, Share2, ShieldCheck } from "lucide-react";
import { db } from "@/db";
import { contacts, records, reports, scans } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { ensureSeed } from "@/lib/seed";
import { timeAgo } from "@/lib/format";
import Scanner from "@/components/Scanner";
import { Chip, Container, Eyebrow, PlateTag, Stat, buttonClass } from "@/components/ui";

export const dynamic = "force-dynamic";

const STEPS = [
  {
    n: "01",
    icon: ScanLine,
    title: "Scan the plate",
    body: "Point your camera at the number plate or type it in. The plate is read on your phone and the driver is never notified.",
  },
  {
    n: "02",
    icon: ShieldCheck,
    title: "We cross-check",
    body: "Sis searches moderated reports from women, reports still under review, and the live SAPS wanted persons list.",
  },
  {
    n: "03",
    icon: Share2,
    title: "Share your ride",
    body: "Send the plate, result and your location to a trusted contact on WhatsApp or SMS — before the doors close.",
  },
];

const SOURCES: { title: string; body: string; live: boolean; href?: string }[] = [
  { title: "Sis community registry", body: "Reports from women across South Africa, each reviewed by a moderator before it's published.", live: true, href: "/registry" },
  { title: "Reports under review", body: "If a plate has unreviewed reports you'll see a caution — never unverified names, photos or details.", live: true },
  { title: "SAPS wanted persons", body: "Pulled live from saps.gov.za every 6 hours and used to cross-check drivers whose names are known.", live: true, href: "/wanted" },
  { title: "National Register for Sex Offenders", body: "Not publicly searchable in South Africa — only approved employers may apply for checks.", live: false },
  { title: "eNaTIS vehicle owner details", body: "Owner identity is restricted under POPIA, so Sis never claims to know who owns a car.", live: false },
];

const OUTCOME_CHIP = {
  match: <Chip tone="danger" dot>Match</Chip>,
  caution: <Chip tone="warning" dot>Caution</Chip>,
  clear: <Chip tone="success" dot>Clear</Chip>,
} as const;

export default async function HomePage() {
  await ensureSeed();
  const user = await getCurrentUser();
  const [[recordCount], [scanCount], [pendingCount], myContacts, recent] = await Promise.all([
    db.select({ n: sql<number>`count(*)::int` }).from(records).where(inArray(records.status, ["active", "disputed"])),
    db.select({ n: sql<number>`count(*)::int` }).from(scans),
    db.select({ n: sql<number>`count(*)::int` }).from(reports).where(inArray(reports.status, ["pending", "needs_info"])),
    user
      ? db.select({ id: contacts.id, name: contacts.name, phone: contacts.phone }).from(contacts).where(eq(contacts.userId, user.id))
      : Promise.resolve([]),
    user ? db.select().from(scans).where(eq(scans.userId, user.id)).orderBy(desc(scans.createdAt)).limit(5) : Promise.resolve([]),
  ]);

  return (
    <>
      <section className="relative overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -left-40 -top-48 h-[520px] w-[520px] rounded-full bg-plum-200/45 blur-[130px]" />
          <div className="absolute -right-40 top-16 h-[460px] w-[460px] rounded-full bg-blush-200/45 blur-[130px]" />
        </div>
        <Container className="grid items-start gap-12 pb-20 pt-10 md:pt-16 lg:grid-cols-[minmax(0,1fr)_470px] lg:gap-16">
          <div className="lg:pt-10">
            <Eyebrow>For women in South Africa</Eyebrow>
            <h1 className="mt-6 font-display text-[50px] leading-[0.98] tracking-[-0.015em] text-ink sm:text-[64px] md:text-[80px]">
              Check the car <em className="text-sis pr-1">before</em> you get in.
            </h1>
            <p className="mt-6 max-w-lg text-[17px] leading-relaxed text-ink-soft">
              Scan or type a number plate. Sis checks it against moderated reports from women across the country and the live SAPS
              wanted list — then helps you share your ride with someone you trust.
            </p>
            <dl className="mt-10 grid max-w-md grid-cols-3 gap-6 border-t border-line pt-7">
              <Stat value={recordCount.n} label="Moderated records" />
              <Stat value={scanCount.n} label="Plates checked" />
              <Stat value={pendingCount.n} label="Reports in review" />
            </dl>
          </div>
          <div id="check" className="scroll-mt-24">
            <Scanner contacts={myContacts} signedIn={!!user} />
          </div>
        </Container>
      </section>

      {user && recent.length > 0 && (
        <section>
          <Container className="pb-16">
            <div className="card p-6">
              <div className="flex items-center justify-between">
                <p className="text-[13px] font-semibold text-ink">Your recent checks</p>
                <Link href="/account" className="text-[12.5px] text-muted hover:text-ink">View all</Link>
              </div>
              <ul className="mt-3 divide-y divide-line">
                {recent.map((s) => (
                  <li key={s.id} className="flex items-center justify-between gap-3 py-3">
                    <PlateTag plate={s.plate} size="sm" />
                    <div className="flex items-center gap-3">
                      {OUTCOME_CHIP[s.outcome as keyof typeof OUTCOME_CHIP] ?? null}
                      <span className="w-20 text-right text-[12px] text-muted">{timeAgo(s.createdAt)}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </Container>
        </section>
      )}

      <section className="border-y border-line bg-white">
        <Container className="grid gap-12 py-20 md:grid-cols-3 md:gap-10">
          {STEPS.map(({ n, icon: Icon, title, body }) => (
            <div key={n}>
              <div className="flex items-center gap-4">
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-plum-50 text-plum-700 ring-1 ring-plum-100">
                  <Icon className="h-5 w-5" strokeWidth={1.6} />
                </span>
                <span className="font-mono text-[12px] text-blush-600">{n}</span>
              </div>
              <h3 className="mt-6 font-display text-[30px] leading-none text-ink">{title}</h3>
              <p className="mt-3 text-[15px] leading-relaxed text-ink-soft">{body}</p>
            </div>
          ))}
        </Container>
      </section>

      <section id="sources" className="scroll-mt-20">
        <Container className="grid gap-12 py-24 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <Eyebrow>Radical transparency</Eyebrow>
            <h2 className="mt-5 font-display text-[44px] leading-[1.02] text-ink md:text-[54px]">
              What Sis can — and can&apos;t — check.
            </h2>
            <p className="mt-5 max-w-md text-[15.5px] leading-relaxed text-ink-soft">
              A safety tool should never over-promise. Every result shows exactly which sources were searched, and which ones are
              closed to the public by law.
            </p>
          </div>
          <div className="grid gap-3">
            {SOURCES.map((s) => {
              const inner = (
                <>
                  <span className={s.live ? "grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#e9f6ef] text-[#1f6b47]" : "grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-plum-50 text-muted"}>
                    {s.live ? <Radio className="h-[18px] w-[18px]" strokeWidth={1.75} /> : <Lock className="h-[18px] w-[18px]" strokeWidth={1.75} />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-[15px] font-semibold text-ink">{s.title}</p>
                      {s.live ? <Chip tone="success" dot>Live</Chip> : <Chip tone="neutral">Not public</Chip>}
                    </div>
                    <p className="mt-1.5 text-[13.5px] leading-relaxed text-muted">{s.body}</p>
                  </div>
                  {s.href && <ArrowUpRight className="h-4 w-4 shrink-0 text-muted transition group-hover:text-ink" />}
                </>
              );
              return s.href ? (
                <Link key={s.title} href={s.href} className="card group flex items-start gap-4 p-5 transition hover:border-plum-200">
                  {inner}
                </Link>
              ) : (
                <div key={s.title} className="card flex items-start gap-4 p-5">
                  {inner}
                </div>
              );
            })}
          </div>
        </Container>
      </section>

      <section>
        <Container>
          <div className="relative overflow-hidden rounded-[28px] bg-plum-950 px-7 py-12 text-white sm:px-12 md:px-16 md:py-16">
            <div aria-hidden className="absolute -left-24 -top-24 h-80 w-80 rounded-full bg-plum-600/50 blur-[100px]" />
            <div aria-hidden className="absolute -bottom-32 right-0 h-96 w-96 rounded-full bg-blush-500/35 blur-[110px]" />
            <div className="relative grid gap-10 md:grid-cols-[1.4fr_1fr] md:items-end">
              <div>
                <Eyebrow tone="light">Had an unsafe ride?</Eyebrow>
                <h2 className="mt-5 font-display text-[40px] leading-[1.03] md:text-[56px]">
                  Your report could protect <em className="text-blush-300">another sister.</em>
                </h2>
                <p className="mt-5 max-w-xl text-[15.5px] leading-relaxed text-white/70">
                  Your identity is never shown publicly, and every report is reviewed by a moderator before anything is published.
                </p>
              </div>
              <div className="flex flex-wrap gap-3 md:justify-end">
                <Link href="/report" className={buttonClass("accent", "lg")}>
                  Report a driver
                  <ArrowRight />
                </Link>
                <Link href="/guidelines" className={buttonClass("light", "lg")}>
                  Community guidelines
                </Link>
              </div>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
