import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { firstParam } from "@/lib/format";
import { DEMO_ADMIN_EMAIL, DEMO_ADMIN_PASSWORD, ensureSeed, usingDemoAdmin } from "@/lib/seed";
import { LoginForm } from "@/components/Forms";
import { AuthShell } from "@/components/ui";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await ensureSeed();
  const raw = firstParam((await searchParams).next);
  const next = raw.startsWith("/") && !raw.startsWith("//") ? raw : "/";
  if (await getCurrentUser()) redirect(next);

  return (
    <AuthShell
      title="Welcome back."
      subtitle="Sign in to report drivers, save trusted contacts and keep a history of your checks."
      footer={
        <>
          New to Sis?{" "}
          <Link href={`/signup?next=${encodeURIComponent(next)}`} className="font-medium text-plum-700 underline underline-offset-4">
            Create an account
          </Link>
        </>
      }
    >
      <LoginForm next={next} />
      {usingDemoAdmin && (
        <div className="mt-6 rounded-2xl border border-dashed border-plum-200 bg-plum-50/60 p-4 text-[12.5px] leading-relaxed text-ink-soft">
          <p className="font-semibold text-ink">Demo moderator access</p>
          <p className="mt-1">
            <span className="font-mono">{DEMO_ADMIN_EMAIL}</span> · <span className="font-mono">{DEMO_ADMIN_PASSWORD}</span>
          </p>
          <p className="mt-1 text-muted">Set SIS_ADMIN_EMAIL and SIS_ADMIN_PASSWORD to replace this account and hide this box.</p>
        </div>
      )}
    </AuthShell>
  );
}
