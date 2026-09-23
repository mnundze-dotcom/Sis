import type { Metadata } from "next";
import Link from "next/link";
import { SUPPORT_EMAIL, VERIFICATION_LEVELS } from "@/lib/domain";
import { Container, PageHeader, buttonClass } from "@/components/ui";

export const metadata: Metadata = { title: "Community guidelines" };

const RULES = [
  {
    id: "first-hand",
    title: "Report only what you experienced",
    body: "Report what happened to you, or what you directly witnessed. Don't repost social-media warnings, rumours or screenshots you can't verify — share those with SAPS instead.",
  },
  {
    id: "facts",
    title: "Stick to the facts",
    body: "Describe what happened: when, where, and what the driver said or did. Avoid insults, speculation and labels you can't support. Moderators may edit wording so every published summary is neutral and factual.",
  },
  {
    id: "police",
    title: "Go to the police too",
    body: "Sis doesn't replace SAPS. Where you can, open a case and include the CAS number in your report. Reports with a case number or protection order can be marked Evidence verified.",
  },
  {
    id: "privacy",
    title: "Protect everyone's privacy",
    body: "Never include home addresses, ID numbers, phone numbers, family members, children or other passengers. Don't share anything that could identify another victim. Only upload photos of the vehicle, the plate, the driver, or trip evidence such as a receipt.",
  },
  {
    id: "false-reports",
    title: "No false or malicious reports",
    body: "Knowingly false reports hurt real women by eroding trust, and can amount to defamation or crimen injuria under South African law. We remove them, ban the account and cooperate with lawful requests from the authorities.",
  },
  {
    id: "vigilantism",
    title: "No vigilantism",
    body: "Never confront, follow, threaten, dox or harm anyone listed on Sis — or encourage others to. Sis is for avoiding danger, not seeking it out. If you are in danger, call 10111 or 112.",
  },
  {
    id: "respect",
    title: "No hate or discrimination",
    body: "Race, ethnicity, nationality, religion, sexuality or disability are never a reason to report someone, and slurs or xenophobic language will be removed. Report behaviour, not identity.",
  },
];

export default function GuidelinesPage() {
  return (
    <>
      <PageHeader
        eyebrow="Community guidelines"
        title="Safe, fair and true."
        description="Sis exists so women in South Africa can make safer choices about the vehicles they get into. It only works if what's here is true, fair and responsibly shared. By using Sis you agree to these guidelines."
      />
      <Container className="grid gap-12 py-12 md:py-16 lg:grid-cols-[220px_minmax(0,1fr)]">
        <nav className="hidden lg:block">
          <div className="sticky top-28 space-y-1 text-[13px]">
            {[
              ["#rules", "The rules"],
              ["#moderation", "How moderation works"],
              ["#verification", "Verification levels"],
              ["#right-of-reply", "Right of reply"],
              ["#retention", "Data retention"],
              ["#enforcement", "Enforcement"],
            ].map(([href, label]) => (
              <a key={href} href={href} className="block rounded-lg px-3 py-2 text-ink-soft transition hover:bg-plum-50 hover:text-ink">
                {label}
              </a>
            ))}
          </div>
        </nav>

        <div className="max-w-3xl">
          <section id="rules" className="scroll-mt-24">
            <div className="grid gap-3">
              {RULES.map((rule, i) => (
                <article key={rule.id} id={rule.id} className="card scroll-mt-24 p-6 sm:p-7">
                  <div className="flex gap-5">
                    <span className="font-mono text-[12px] leading-8 text-blush-600">{String(i + 1).padStart(2, "0")}</span>
                    <div>
                      <h2 className="font-display text-[28px] leading-tight text-ink">{rule.title}</h2>
                      <p className="mt-2 text-[15px] leading-relaxed text-ink-soft">{rule.body}</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <div className="prose-sis">
            <h2 id="moderation" className="scroll-mt-24">How moderation works</h2>
            <ul>
              <li>Every report is reviewed by a trained moderator before anything is published.</li>
              <li>Moderators check the plate format, look for consistency across reports and review any evidence you supply.</li>
              <li>They may rewrite summaries in neutral language, ask you for more information, or decline to publish.</li>
              <li>Reporters&apos; identities are never shown publicly or to the driver.</li>
              <li>A plate with reports still in review only shows a &ldquo;proceed with caution&rdquo; notice — never names, photos or details.</li>
            </ul>

            <h2 id="verification" className="scroll-mt-24">Verification levels</h2>
            {VERIFICATION_LEVELS.map((v) => (
              <div key={v.value}>
                <h3>{v.label}</h3>
                <p>{v.description}</p>
              </div>
            ))}

            <h2 id="right-of-reply" className="scroll-mt-24">Right of reply</h2>
            <p>
              Anyone named in a record, the vehicle&apos;s owner, or their legal representative can dispute it using{" "}
              <strong>Dispute this record</strong> on the record page. The record is marked &ldquo;Under dispute&rdquo; immediately while we
              review, and we aim to respond within 7 days. If a dispute is upheld, the record is removed.
            </p>
            <p>
              Under the Protection of Personal Information Act (POPIA) you can also ask to access, correct or delete personal information
              about you by emailing <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
            </p>

            <h2 id="retention" className="scroll-mt-24">Data retention</h2>
            <ul>
              <li>Community-level records with no new reports are reviewed after 24 months and removed if no longer relevant.</li>
              <li>Rejected reports are permanently deleted 90 days after review.</li>
              <li>
                You can delete your account at any time. Your check history and trusted contacts are erased; your reports are kept
                anonymously so warnings remain in place.
              </li>
            </ul>

            <h2 id="enforcement" className="scroll-mt-24">Enforcement</h2>
            <ul>
              <li><strong>First breach:</strong> the content is removed and you receive a warning.</li>
              <li><strong>Serious or repeated breaches:</strong> your account is suspended.</li>
              <li><strong>Malicious false reports, doxxing, threats or vigilantism:</strong> a permanent ban, and we may report it to SAPS.</li>
            </ul>
            <p>
              Questions about these guidelines? Email <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
            </p>
          </div>

          <div className="mt-12 flex flex-wrap gap-2">
            <Link href="/report" className={buttonClass("accent", "md")}>Report a driver</Link>
            <Link href="/privacy" className={buttonClass("secondary", "md")}>Privacy &amp; POPIA</Link>
          </div>
        </div>
      </Container>
    </>
  );
}
