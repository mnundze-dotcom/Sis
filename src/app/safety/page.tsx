import type { Metadata } from "next";
import Link from "next/link";
import { asc, eq } from "drizzle-orm";
import { MessageCircle, Phone, X } from "lucide-react";
import { db } from "@/db";
import { contacts } from "@/db/schema";
import { removeContactAction } from "@/app/actions/community";
import { getCurrentUser } from "@/lib/auth";
import { waNumber } from "@/lib/format";
import { ContactForm } from "@/components/Forms";
import { SubmitButton } from "@/components/SubmitButton";
import { Container, Eyebrow, PageHeader, buttonClass, cx } from "@/components/ui";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Safety toolkit" };

const NUMBERS = [
  { name: "SAPS emergency", number: "10111", tel: "10111", note: "Police emergency response, 24/7", primary: true },
  { name: "Emergency from a cellphone", number: "112", tel: "112", note: "Free from any mobile network", primary: true },
  { name: "GBV Command Centre", number: "0800 428 428", tel: "0800428428", note: "Free, 24/7 counselling and support", primary: true },
  { name: "GBV “Please call me”", number: "*120*7867#", tel: "*120*7867%23", note: "Dial and a counsellor calls you back" },
  { name: "SAPS Crime Stop", number: "08600 10111", tel: "0860010111", note: "Anonymous tip-offs" },
  { name: "LifeLine", number: "0861 322 322", tel: "0861322322", note: "Crisis counselling" },
  { name: "Childline", number: "116", tel: "116", note: "If a child is at risk" },
];

const BEFORE = [
  "Match the plate, make and colour to your app — then check the plate on Sis.",
  "Ask “Who are you here to pick up?” Let the driver say your name first.",
  "Compare the driver's face with the profile photo. Not the same person? Don't get in.",
  "Sit behind the passenger seat and keep your bag on your lap.",
  "Make sure the child lock is off and you can open the door.",
  "Share your trip with a trusted contact before the car moves.",
  "Keep your phone charged and your location switched on.",
  "Trust your instincts. You never owe anyone a ride.",
];

const AFTER = [
  ["Get to safety", "Ask to be let out at a busy, well-lit place such as a filling station or mall."],
  ["Call for help", "Call 10111 or 112, and use the emergency button in your e-hailing app."],
  ["Open a case", "Report it at your nearest SAPS station and ask for the CAS number."],
  ["Tell the platform", "Report the driver to the e-hailing or taxi company."],
  ["Warn other women", "Report the plate on Sis — adding your CAS number helps us verify it."],
  ["Get support", "Call the GBV Command Centre on 0800 428 428. Survivors of sexual violence can also get care at a Thuthuzela Care Centre."],
];

export default async function SafetyPage() {
  const user = await getCurrentUser();
  const myContacts = user ? await db.select().from(contacts).where(eq(contacts.userId, user.id)).orderBy(asc(contacts.createdAt)) : [];

  return (
    <>
      <PageHeader eyebrow="Safety toolkit" title="Help, one tap away." description="Emergency numbers, trusted contacts and practical checks for every trip — whether it's e-hailing, a taxi or a lift." />

      <Container className="space-y-20 py-12 md:py-16">
        <section id="emergency" className="scroll-mt-24">
          <Eyebrow>Emergency numbers</Eyebrow>
          <h2 className="mt-4 font-display text-[36px] leading-none text-ink md:text-[44px]">Tap to call.</h2>
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {NUMBERS.map((n) => (
              <a
                key={n.name}
                href={`tel:${n.tel}`}
                className={cx(
                  "group flex items-center justify-between gap-4 rounded-[20px] p-5 transition",
                  n.primary ? "bg-plum-950 text-white hover:bg-plum-900" : "card hover:border-plum-200",
                )}
              >
                <div>
                  <p className={cx("text-[13px] font-medium", n.primary ? "text-white/70" : "text-muted")}>{n.name}</p>
                  <p className="mt-1 font-display text-[32px] leading-none">{n.number}</p>
                  <p className={cx("mt-2 text-[12px]", n.primary ? "text-white/50" : "text-muted")}>{n.note}</p>
                </div>
                <span className={cx("grid h-11 w-11 shrink-0 place-items-center rounded-full transition", n.primary ? "bg-sis" : "bg-plum-50 text-plum-700 group-hover:bg-plum-100")}>
                  <Phone className="h-[18px] w-[18px]" strokeWidth={1.75} />
                </span>
              </a>
            ))}
          </div>
          <p className="mt-4 text-[12.5px] text-muted">Deaf or hard of hearing? SMS “Help” to 31531 to reach the GBV Command Centre.</p>
        </section>

        <section id="contacts" className="grid scroll-mt-24 gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <Eyebrow>Trusted contacts</Eyebrow>
            <h2 className="mt-4 font-display text-[36px] leading-[1.05] text-ink md:text-[44px]">Someone always knows where you are.</h2>
            <p className="mt-4 max-w-md text-[15px] leading-relaxed text-ink-soft">
              Save up to five people. After every plate check you can send them the plate, result, time and your location on
              WhatsApp in one tap. Numbers are only used to build the message on your phone.
            </p>
          </div>
          <div className="card p-6 sm:p-8">
            {user ? (
              <>
                {myContacts.length > 0 ? (
                  <ul className="mb-6 divide-y divide-line">
                    {myContacts.map((c) => (
                      <li key={c.id} className="flex items-center justify-between gap-3 py-3">
                        <div>
                          <p className="text-[14.5px] font-medium text-ink">{c.name}</p>
                          <p className="text-[12.5px] text-muted">{c.phone}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <a
                            href={`https://wa.me/${waNumber(c.phone)}?text=${encodeURIComponent("Hi, I'm using Sis to share my rides with you. If I send you a ride check, please keep an eye on me.")}`}
                            target="_blank"
                            rel="noreferrer"
                            className={buttonClass("ghost", "sm")}
                            aria-label={`Message ${c.name} on WhatsApp`}
                          >
                            <MessageCircle />
                          </a>
                          <form action={removeContactAction}>
                            <input type="hidden" name="contactId" value={c.id} />
                            <SubmitButton variant="ghost" size="sm" className="text-muted">
                              <X />
                              <span className="sr-only">Remove {c.name}</span>
                            </SubmitButton>
                          </form>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mb-6 text-[14px] text-muted">You haven&apos;t added anyone yet.</p>
                )}
                {myContacts.length < 5 && <ContactForm />}
              </>
            ) : (
              <div>
                <p className="font-display text-[26px] leading-tight text-ink">Sign in to save contacts</p>
                <p className="mt-2 text-[14px] leading-relaxed text-muted">You can still share any ride check on WhatsApp or SMS without an account.</p>
                <div className="mt-5 flex flex-wrap gap-2">
                  <Link href="/signup?next=%2Fsafety%23contacts" className={buttonClass("accent", "md")}>Create account</Link>
                  <Link href="/login?next=%2Fsafety%23contacts" className={buttonClass("secondary", "md")}>Sign in</Link>
                </div>
              </div>
            )}
          </div>
        </section>

        <section className="grid gap-10 lg:grid-cols-2">
          <div className="card p-6 sm:p-8">
            <Eyebrow>Before you get in</Eyebrow>
            <ol className="mt-6 space-y-4">
              {BEFORE.map((item, i) => (
                <li key={item} className="flex gap-4">
                  <span className="font-mono text-[12px] leading-6 text-blush-600">{String(i + 1).padStart(2, "0")}</span>
                  <p className="text-[14.5px] leading-relaxed text-ink-soft">{item}</p>
                </li>
              ))}
            </ol>
          </div>
          <div className="card p-6 sm:p-8">
            <Eyebrow>If something goes wrong</Eyebrow>
            <ol className="mt-6 space-y-4">
              {AFTER.map(([title, body], i) => (
                <li key={title} className="flex gap-4">
                  <span className="font-mono text-[12px] leading-6 text-blush-600">{String(i + 1).padStart(2, "0")}</span>
                  <div>
                    <p className="text-[14.5px] font-semibold text-ink">{title}</p>
                    <p className="mt-0.5 text-[14px] leading-relaxed text-ink-soft">{body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>
      </Container>
    </>
  );
}
