import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { firstParam } from "@/lib/format";
import { SignupForm } from "@/components/Forms";
import { AuthShell } from "@/components/ui";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Create an account" };

export default async function SignupPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const raw = firstParam((await searchParams).next);
  const next = raw.startsWith("/") && !raw.startsWith("//") ? raw : "/";
  if (await getCurrentUser()) redirect(next);

  return (
    <AuthShell
      title="Join Sis."
      subtitle="Free, private and built for women in South Africa. Your details are never shown publicly."
      footer={
        <>
          Already have an account?{" "}
          <Link href={`/login?next=${encodeURIComponent(next)}`} className="font-medium text-plum-700 underline underline-offset-4">
            Sign in
          </Link>
        </>
      }
    >
      <SignupForm next={next} />
    </AuthShell>
  );
}
