import Link from "next/link";
import { Container, buttonClass } from "@/components/ui";

export default function NotFound() {
  return (
    <Container className="py-24 text-center md:py-32">
      <p className="font-mono text-[12px] tracking-[0.2em] text-blush-600">404</p>
      <h1 className="mt-4 font-display text-[52px] leading-none text-ink md:text-[68px]">Nothing here, sis.</h1>
      <p className="mx-auto mt-4 max-w-md text-[15px] leading-relaxed text-ink-soft">
        This page doesn&apos;t exist, or the record has been removed after review.
      </p>
      <div className="mt-8 flex justify-center gap-2">
        <Link href="/" className={buttonClass("primary", "md")}>Check a plate</Link>
        <Link href="/registry" className={buttonClass("secondary", "md")}>Browse the registry</Link>
      </div>
    </Container>
  );
}
