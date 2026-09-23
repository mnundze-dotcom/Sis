import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight, Phone, TriangleAlert, UserRound } from "lucide-react";
import { getWantedDetail, sapsDetailUrl, type WantedDetail } from "@/lib/saps";
import { Chip, Container, Notice, buttonClass } from "@/components/ui";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Wanted person" };

export default async function WantedDetailPage({ params }: { params: Promise<{ bid: string }> }) {
  const { bid } = await params;
  if (!/^\d{1,8}$/.test(bid)) notFound();

  let detail: WantedDetail | null = null;
  let failed = false;
  try {
    detail = await getWantedDetail(bid);
  } catch {
    failed = true;
  }
  if (!detail && !failed) notFound();

  const phones = (detail?.fields.find((f) => f.label.toLowerCase() === "station telephone")?.value ?? "")
    .split(/[,/]/)
    .map((p) => p.trim())
    .filter((p) => p.replace(/\D/g, "").length >= 9);
  const crime = detail?.fields.find((f) => f.label.toLowerCase() === "crime")?.value;

  return (
    <Container className="py-8 md:py-12">
      <Link href="/wanted" className="inline-flex items-center gap-1.5 text-[13px] text-muted transition hover:text-ink">
        <ArrowLeft className="h-3.5 w-3.5" />
        SAPS wanted persons
      </Link>

      {!detail ? (
        <div className="mt-6 max-w-xl">
          <Notice tone="warning" title="We couldn't reach saps.gov.za">
            The SAPS website isn&apos;t responding right now.{" "}
            <a href={sapsDetailUrl(bid)} target="_blank" rel="noreferrer" className="font-medium underline">Open the record on saps.gov.za</a>.
          </Notice>
        </div>
      ) : (
        <div className="mt-6 grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
          <div className="space-y-4">
            <div className="card overflow-hidden">
              <div className="aspect-[4/5] bg-plum-50">
                {detail.photoId ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={`/api/saps/photo/${detail.photoId}`} alt={detail.fullName} className="h-full w-full object-cover" />
                ) : (
                  <div className="grid h-full place-items-center text-plum-300">
                    <UserRound className="h-16 w-16" strokeWidth={1} />
                  </div>
                )}
              </div>
            </div>
            <div className="rounded-[20px] bg-plum-950 p-6 text-white">
              <p className="flex items-center gap-2 text-[13px] font-semibold text-blush-200">
                <TriangleAlert className="h-4 w-4" />
                Do not approach
              </p>
              <p className="mt-2 text-[13px] leading-relaxed text-white/65">If you recognise this person, call SAPS. You can stay anonymous.</p>
              <div className="mt-4 grid gap-2">
                <a href="tel:0860010111" className={buttonClass("accent", "md", "w-full")}>
                  <Phone />
                  Crime Stop 08600 10111
                </a>
                {phones.slice(0, 2).map((p) => (
                  <a key={p} href={`tel:${p.replace(/[^\d+]/g, "")}`} className={buttonClass("light", "sm", "w-full")}>
                    Station · {p}
                  </a>
                ))}
              </div>
            </div>
          </div>

          <div className="card p-6 sm:p-8">
            <div className="flex flex-wrap items-center gap-2">
              <Chip tone="danger" dot>{detail.status}</Chip>
              {crime && <Chip tone="plum">{crime}</Chip>}
            </div>
            <h1 className="mt-4 font-display text-[44px] leading-none text-ink sm:text-[52px]">{detail.fullName}</h1>
            <dl className="mt-8 divide-y divide-line border-y border-line">
              {detail.fields.map((f) => (
                <div key={f.label} className="grid gap-1 py-3.5 sm:grid-cols-[200px_minmax(0,1fr)] sm:gap-6">
                  <dt className="text-[12px] font-medium uppercase tracking-[0.12em] text-muted">{f.label}</dt>
                  <dd className="text-[14.5px] leading-relaxed text-ink">{f.value}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
              <p className="text-[12px] text-muted">Source: South African Police Service. Sis is not affiliated with SAPS.</p>
              <a href={sapsDetailUrl(bid)} target="_blank" rel="noreferrer" className={buttonClass("secondary", "sm")}>
                View on saps.gov.za
                <ArrowUpRight />
              </a>
            </div>
          </div>
        </div>
      )}
    </Container>
  );
}
