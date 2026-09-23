import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Search, UserRound } from "lucide-react";
import { SAPS_LIST_URL, getWantedList } from "@/lib/saps";
import { firstParam, timeAgo } from "@/lib/format";
import { Chip, Container, EmptyState, Notice, PageHeader, buttonClass, cx } from "@/components/ui";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "SAPS Wanted Persons" };

const PER_PAGE = 24;

export default async function WantedPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const q = firstParam(params.q).trim().slice(0, 60);
  const page = Math.max(1, Number(firstParam(params.page)) || 1);
  const { people, fetchedAt, error } = await getWantedList();

  const needle = q.toLowerCase();
  const filtered = needle ? people.filter((p) => `${p.fullName} ${p.crime}`.toLowerCase().includes(needle)) : people;
  const pages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const current = Math.min(page, pages);
  const shown = filtered.slice((current - 1) * PER_PAGE, current * PER_PAGE);
  const href = (p: number) => `/wanted?${new URLSearchParams({ ...(q ? { q } : {}), page: String(p) }).toString()}`;

  return (
    <>
      <PageHeader
        eyebrow="Live from saps.gov.za"
        title="SAPS wanted persons."
        description="The official public list of people wanted by the South African Police Service. If you recognise someone, do not approach them — call Crime Stop on 08600 10111."
      >
        <div className="mt-6 flex flex-wrap items-center gap-3 text-[13px] text-muted">
          <Chip tone={people.length ? "success" : "warning"} dot>
            {people.length ? `${people.length} people listed` : "Source unavailable"}
          </Chip>
          {fetchedAt && <span>Refreshed {timeAgo(fetchedAt)}</span>}
          <a href={SAPS_LIST_URL} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-plum-700 hover:underline">
            View on saps.gov.za
            <ArrowUpRight className="h-3.5 w-3.5" />
          </a>
        </div>
        <form className="mt-6 flex max-w-xl gap-2">
          <label className="relative flex-1">
            <span className="sr-only">Search</span>
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input name="q" defaultValue={q} placeholder="Search by name or crime" className="field pl-10" />
          </label>
          <button type="submit" className={buttonClass("primary", "md", "h-[46px]")}>Search</button>
        </form>
      </PageHeader>

      <Container className="py-10">
        {error && (
          <div className="mb-6">
            <Notice tone="warning" title={people.length ? "Showing the last saved copy" : "We couldn't reach saps.gov.za"}>
              {people.length ? "The SAPS site didn't respond just now, so this is the most recent list we have." : "The SAPS website isn't responding right now. Please try again in a few minutes."}
            </Notice>
          </div>
        )}
        {shown.length === 0 ? (
          <EmptyState icon={<Search className="h-5 w-5" />} title={people.length ? "No one matches that search" : "List unavailable"}>
            {people.length ? "Try a surname or a crime such as robbery." : "You can still view the list directly on saps.gov.za."}
          </EmptyState>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {shown.map((p) => (
              <Link key={p.bid} href={`/wanted/${p.bid}`} className="card group overflow-hidden transition hover:-translate-y-0.5 hover:border-plum-200">
                <div className="aspect-square overflow-hidden bg-plum-50">
                  {p.photoId ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={`/api/saps/photo/${p.photoId}`}
                      alt={p.fullName}
                      loading="lazy"
                      className="h-full w-full object-cover grayscale-[20%] transition duration-500 group-hover:scale-[1.03]"
                    />
                  ) : (
                    <div className="grid h-full place-items-center text-plum-300">
                      <UserRound className="h-10 w-10" strokeWidth={1.25} />
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <p className="truncate text-[14.5px] font-semibold text-ink">{p.fullName}</p>
                  <p className="mt-1 line-clamp-1 text-[12.5px] text-blush-700">{p.crime || "Wanted"}</p>
                </div>
              </Link>
            ))}
          </div>
        )}

        {pages > 1 && (
          <nav className="mt-10 flex items-center justify-between gap-3" aria-label="Pagination">
            <Link aria-disabled={current <= 1} href={href(Math.max(1, current - 1))} className={cx(buttonClass("secondary", "sm"), current <= 1 && "pointer-events-none opacity-40")}>
              Previous
            </Link>
            <span className="text-[13px] text-muted">Page {current} of {pages}</span>
            <Link aria-disabled={current >= pages} href={href(Math.min(pages, current + 1))} className={cx(buttonClass("secondary", "sm"), current >= pages && "pointer-events-none opacity-40")}>
              Next
            </Link>
          </nav>
        )}

        <p className="mt-10 text-[12px] leading-relaxed text-muted">
          Source: South African Police Service, saps.gov.za/crimestop/wanted. Sis is not affiliated with SAPS. Names can be shared by
          different people — never assume someone is a wanted person based on a name alone.
        </p>
      </Container>
    </>
  );
}
