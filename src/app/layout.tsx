import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "@fontsource/instrument-serif/400.css";
import "@fontsource/instrument-serif/400-italic.css";
import "./globals.css";
import { getCurrentUser, isModerator } from "@/lib/auth";
import { initials } from "@/lib/format";
import { DesktopNav, MobileTabBar } from "@/components/Nav";
import { Container, buttonClass } from "@/components/ui";

export const metadata: Metadata = {
  title: { default: "Sis — Check the car before you get in", template: "%s · Sis" },
  description:
    "Sis helps women in South Africa check a vehicle's number plate against moderated community reports and the live SAPS wanted list before getting in.",
  applicationName: "Sis",
};

export const viewport: Viewport = {
  themeColor: "#1d0c2a",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();

  return (
    <html lang="en-ZA" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="min-h-screen bg-canvas font-sans text-ink antialiased">
        <header className="sticky top-0 z-40 border-b border-line/70 bg-canvas/85 backdrop-blur-xl">
          <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-5 md:px-8">
            <Link href="/" aria-label="Sis home" className="flex items-baseline">
              <span className="font-display text-[34px] leading-none tracking-tight text-ink">Sis</span>
              <span className="font-display text-[34px] leading-none text-blush-500">.</span>
            </Link>
            <DesktopNav moderator={isModerator(user)} />
            <div className="flex items-center gap-2">
              <a
                href="tel:10111"
                className="inline-flex items-center gap-2 rounded-full border border-blush-200 bg-blush-50 px-3.5 py-1.5 text-[12.5px] font-semibold text-blush-700 transition hover:bg-blush-100"
              >
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blush-400 opacity-60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-blush-500" />
                </span>
                SOS 10111
              </a>
              {user ? (
                <Link
                  href="/account"
                  aria-label="Your account"
                  className="hidden h-9 w-9 items-center justify-center rounded-full bg-plum-950 text-[12px] font-semibold text-white ring-2 ring-white lg:flex"
                >
                  {initials(user.displayName)}
                </Link>
              ) : (
                <Link href="/login" className={buttonClass("secondary", "sm", "hidden lg:inline-flex")}>
                  Sign in
                </Link>
              )}
            </div>
          </div>
        </header>

        <main className="pb-28 lg:pb-0">{children}</main>

        <footer className="mt-24 hidden border-t border-line bg-white/70 lg:block">
          <Container className="grid gap-10 py-14 md:grid-cols-[1.5fr_1fr_1fr_1.2fr]">
            <div>
              <p className="font-display text-[34px] leading-none">
                Sis<span className="text-blush-500">.</span>
              </p>
              <p className="mt-4 max-w-xs text-[13.5px] leading-relaxed text-muted">
                A community safety tool built for women in South Africa. Every report is reviewed by a moderator before
                anything is published.
              </p>
              <p className="mt-4 text-[12px] text-muted">Not affiliated with SAPS or any e-hailing company.</p>
            </div>
            <FooterColumn
              title="Product"
              links={[
                ["/", "Check a plate"],
                ["/report", "Report a driver"],
                ["/registry", "Registry"],
                ["/wanted", "SAPS Wanted"],
              ]}
            />
            <FooterColumn
              title="Community"
              links={[
                ["/guidelines", "Community guidelines"],
                ["/guidelines#right-of-reply", "Dispute a record"],
                ["/privacy", "Privacy & POPIA"],
                ["/safety", "Safety toolkit"],
              ]}
            />
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">Emergency</p>
              <ul className="mt-4 space-y-2.5 text-[13.5px]">
                <li>
                  <a href="tel:10111" className="text-ink hover:text-blush-600">SAPS · 10111</a>
                </li>
                <li>
                  <a href="tel:112" className="text-ink hover:text-blush-600">From a cellphone · 112</a>
                </li>
                <li>
                  <a href="tel:0800428428" className="text-ink hover:text-blush-600">GBV Command Centre · 0800 428 428</a>
                </li>
              </ul>
            </div>
          </Container>
          <div className="border-t border-line">
            <Container className="flex justify-between py-5 text-[12px] text-muted">
              <span>© {new Date().getFullYear()} Sis. Made in South Africa.</span>
              <span>In immediate danger? Call 10111 or 112.</span>
            </Container>
          </div>
        </footer>

        <MobileTabBar signedIn={!!user} />
      </body>
    </html>
  );
}

function FooterColumn({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">{title}</p>
      <ul className="mt-4 space-y-2.5 text-[13.5px]">
        {links.map(([href, label]) => (
          <li key={href}>
            <Link href={href} className="text-ink-soft transition hover:text-ink">
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
