import type { Metadata } from "next";
import { SUPPORT_EMAIL } from "@/lib/domain";
import { Container, PageHeader } from "@/components/ui";

export const metadata: Metadata = { title: "Privacy & POPIA" };

export default function PrivacyPage() {
  return (
    <>
      <PageHeader
        eyebrow="Privacy notice & terms"
        title="Your privacy, plainly."
        description="How Sis collects, uses and protects personal information in line with South Africa's Protection of Personal Information Act (POPIA)."
      />
      <Container className="py-12 md:py-16">
        <div className="prose-sis max-w-3xl">
          <h2 style={{ marginTop: 0 }}>What we collect</h2>
          <ul>
            <li><strong>Your account:</strong> the name you give us, your email address and a securely hashed password.</li>
            <li><strong>Reports you submit:</strong> the plate, vehicle and incident details, and any photos you choose to upload.</li>
            <li><strong>Plate checks:</strong> the plate, time and result. If you&apos;re signed in, checks are linked to your account so you can see your history.</li>
            <li><strong>Trusted contacts:</strong> names and numbers you save, used only to build share links on your device.</li>
            <li><strong>Technical data:</strong> your IP address is used briefly to prevent abuse (rate limiting) and isn&apos;t stored with your checks.</li>
          </ul>

          <h2>What we never do</h2>
          <ul>
            <li>We never notify a driver that their plate was checked.</li>
            <li>We never sell personal information or use advertising trackers.</li>
            <li>Your location is only read when you tap &ldquo;Add my location&rdquo;, and it goes straight into your message — it isn&apos;t stored on our servers.</li>
            <li>Plate photos are read on your device. Only the text you confirm is sent to us.</li>
          </ul>

          <h2>Information about alleged criminal behaviour</h2>
          <p>
            POPIA treats information about criminal behaviour as special personal information. We minimise what we publish: every report
            is moderated, public summaries are written in neutral language, reporters are never identified, and anyone named can dispute
            a record. Unverified reports are never shown in detail.
          </p>

          <h2>Your rights</h2>
          <ul>
            <li>Access the personal information we hold about you.</li>
            <li>Ask us to correct or delete information that is inaccurate, outdated or unlawfully held.</li>
            <li>Object to the processing of your personal information.</li>
            <li>Delete your account at any time from your account page.</li>
            <li>Lodge a complaint with the Information Regulator (inforegulator.org.za).</li>
          </ul>
          <p>To exercise these rights, email <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.</p>

          <h2>Security</h2>
          <p>
            Passwords are hashed with scrypt, sessions use secure, HTTP-only cookies, and only trained moderators can see reporter
            details and evidence. Access to moderation tools is restricted and logged against the reviewing moderator.
          </p>

          <h2>Terms of use</h2>
          <ul>
            <li>Sis is for personal safety decisions only. Commercial use, scraping or bulk lookups are not permitted.</li>
            <li>Sis is not an emergency service. In danger, call 10111 or 112.</li>
            <li>A plate with no record is not a guarantee of safety, and a record is not a finding of guilt by a court.</li>
            <li>You&apos;re responsible for what you submit, and must follow the Community Guidelines.</li>
            <li>We may edit, decline or remove content, and suspend accounts that breach these terms.</li>
            <li>Sis is not affiliated with SAPS, any government department or any e-hailing company.</li>
          </ul>
        </div>
      </Container>
    </>
  );
}
