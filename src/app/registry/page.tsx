import type { Metadata } from "next";
import Link from "next/link";
import { and, desc, eq, ilike, inArray, or, type SQL } from "drizzle-orm";
import { Search } from "lucide-react";
import { db } from "@/db";
import { records } from "@/db/schema";
import { ensureSeed } from "@/lib/seed";
import { CATEGORIES, PROVINCES, normalizePlate } from "@/lib/domain";
import { firstParam, timeAgo } from "@/lib/format";
import {
  Avatar,
  CategoryChip,
  Container,
  EmptyState,
  PageHeader,
  PlateTag,
  RecordStatusChip,
  RiskChip,
  SampleChip,
  VerificationChip,
  buttonClass,
} from "@/components/ui";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Registry" };

export default async function RegistryPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await ensureSeed();
  const params = await searchParams;
  const q = firstParam(params.q).trim().slice(0, 60);
  const category = firstParam(params.category);
  const province = firstParam(params.province);

  const conditions: SQL[] = [inArray(records.status, ["active", "disputed"])];
  if (q) {
    const plateQuery = normalizePlate(q);
    const search = or(
      plateQuery ? ilike(records.plate, `%${plateQuery}%`) : undefined,
      ilike(records.displayName, `%${q}%`),
      ilike(records.vehicleMake, `%${q}%`),
    );
    if (search) conditions.push(search);
  }
  if (category) conditions.push(eq(records.category, category));
  if (province) conditions.push(eq(records.province, province));

  const rows = await db.select().from(records).where(and(...conditions)).orderBy(desc(records.updatedAt)).limit(60);

  return (
    <>
      <PageHeader
        eyebrow="Community registry"
        title="Moderated records."
        description="Every record here has been reviewed by a Sis moderator. Reporters' identities are never shown, and anyone named can dispute a record."
      >
        <form className="mt-8 grid gap-2 sm:grid-cols-[minmax(0,1fr)_200px_180px_auto]">
          <label className="relative">
            <span className="sr-only">Search</span>
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input name="q" defaultValue={q} placeholder="Plate, name or vehicle" className="field pl-10" />
          </label>
          <select name="category" defaultValue={category} className="field" aria-label="Category">
            <option value="">All categories</option>
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.short}</option>
            ))}
          </select>
          <select name="province" defaultValue={province} className="field" aria-label="Province">
            <option value="">All provinces</option>
            {PROVINCES.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
          <button type="submit" className={buttonClass("primary", "md", "h-[46px]")}>Search</button>
        </form>
      </PageHeader>

      <Container className="py-10">
        <div className="mb-5 flex items-center justify-between text-[13px] text-muted">
          <span>{rows.length === 1 ? "1 record" : `${rows.length} records`}</span>
          <Link href="/wanted" className="hover:text-ink">SAPS wanted list →</Link>
        </div>
        {rows.length === 0 ? (
          <EmptyState icon={<Search className="h-5 w-5" />} title="No records match">
            Try a different plate or remove a filter. A plate with no record isn&apos;t a guarantee of safety.
          </EmptyState>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {rows.map((r) => (
              <Link
                key={r.id}
                href={`/registry/${r.id}`}
                className="card group flex gap-4 p-5 transition duration-200 hover:-translate-y-0.5 hover:border-plum-200"
              >
                <Avatar name={r.displayName} src={r.photoUrl} size={68} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <PlateTag plate={r.plate} size="sm" />
                    <RiskChip level={r.riskLevel} />
                  </div>
                  <p className="mt-3 truncate text-[15.5px] font-semibold text-ink">{r.displayName ?? "Driver identity unknown"}</p>
                  <p className="mt-0.5 text-[13px] text-muted">
                    {[[r.vehicleColour, r.vehicleMake].filter(Boolean).join(" "), r.province].filter(Boolean).join(" · ")}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    <CategoryChip category={r.category} />
                    <VerificationChip level={r.verification} />
                    <RecordStatusChip status={r.status} />
                    {r.isSample && <SampleChip />}
                  </div>
                  <p className="mt-3 line-clamp-2 text-[13px] leading-relaxed text-ink-soft">{r.summary}</p>
                  <p className="mt-3 text-[11.5px] text-muted">
                    {r.reportCount === 1 ? "1 report" : `${r.reportCount} reports`} · updated {timeAgo(r.updatedAt)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </Container>
    </>
  );
}
