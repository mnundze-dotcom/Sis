import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { ArrowLeft } from "lucide-react";
import { db } from "@/db";
import { records } from "@/db/schema";
import { SUPPORT_EMAIL } from "@/lib/domain";
import { DisputeForm } from "@/components/Forms";
import { CategoryChip, Container, PageHeader, PlateTag } from "@/components/ui";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Dispute a record" };

export default async function DisputePage({ params }: { params: Promise<{ id: string }> }) {
  const recordId = Number((await params).id);
  if (!Number.isInteger(recordId) || recordId <= 0) notFound();
  const [rec] = await db.select().from(records).where(eq(records.id, recordId)).limit(1);
  if (!rec || rec.status === "removed") notFound();

  return (
    <>
      <PageHeader
        eyebrow="Right of reply"
        title="Dispute this record."
        description="If you're named in this record, own the vehicle, or believe it's inaccurate, tell us. Every request is reviewed by a moderator — usually within 7 days."
      />
      <Container className="grid gap-8 py-10 md:py-14 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="card p-6 sm:p-10">
          <DisputeForm recordId={rec.id} />
        </div>
        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <Link href={`/registry/${rec.id}`} className="card block p-6 transition hover:border-plum-200">
            <span className="inline-flex items-center gap-1.5 text-[12px] text-muted">
              <ArrowLeft className="h-3.5 w-3.5" />
              Record being disputed
            </span>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <PlateTag plate={rec.plate} />
              <CategoryChip category={rec.category} />
            </div>
            <p className="mt-3 line-clamp-3 text-[13px] leading-relaxed text-ink-soft">{rec.summary}</p>
          </Link>
          <div className="card p-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">What happens next</p>
            <ul className="mt-4 space-y-3 text-[13px] leading-relaxed text-ink-soft">
              <li>The record is marked <strong className="text-ink">Under dispute</strong> straight away.</li>
              <li>A moderator reviews your evidence and may contact the original reporters.</li>
              <li>If your dispute is upheld, the record is removed from Sis.</li>
              <li>
                You can also make a POPIA correction or deletion request at{" "}
                <a href={`mailto:${SUPPORT_EMAIL}`} className="text-plum-700 underline underline-offset-4">{SUPPORT_EMAIL}</a>.
              </li>
            </ul>
          </div>
        </aside>
      </Container>
    </>
  );
}
