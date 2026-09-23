"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { contacts, reports, scans, users } from "@/db/schema";
import { createSession, destroySession, getCurrentUser, hashPassword, verifyPassword } from "@/lib/auth";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export type FormState = { error?: string; success?: string } | null;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function safeNext(value: FormDataEntryValue | null): string {
  const next = typeof value === "string" ? value : "";
  return next.startsWith("/") && !next.startsWith("//") ? next : "/";
}

export async function signUpAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const displayName = String(fd.get("displayName") ?? "").trim().slice(0, 60);
  const email = String(fd.get("email") ?? "").trim().toLowerCase();
  const password = String(fd.get("password") ?? "");
  const next = safeNext(fd.get("next"));

  if (displayName.length < 2) return { error: "Tell us what to call you." };
  if (!EMAIL_RE.test(email)) return { error: "Enter a valid email address." };
  if (password.length < 8) return { error: "Choose a password with at least 8 characters." };
  if (fd.get("accept") !== "on") return { error: "Please accept the Community Guidelines and Privacy Notice to continue." };
  if (!rateLimit(`signup:${await clientIp()}`, 10, 3_600_000)) {
    return { error: "Too many sign-ups from this network. Please try again later." };
  }

  const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  if (existing.length) return { error: "An account with this email already exists — sign in instead." };

  const [created] = await db
    .insert(users)
    .values({ email, displayName, passwordHash: await hashPassword(password), guidelinesAcceptedAt: new Date() })
    .returning({ id: users.id });
  await createSession(created.id);
  redirect(next);
}

export async function signInAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const email = String(fd.get("email") ?? "").trim().toLowerCase();
  const password = String(fd.get("password") ?? "");
  const next = safeNext(fd.get("next"));

  if (!rateLimit(`login:${email}`, 8, 15 * 60_000) || !rateLimit(`login-ip:${await clientIp()}`, 30, 15 * 60_000)) {
    return { error: "Too many attempts. Please wait 15 minutes and try again." };
  }
  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return { error: "That email and password don't match." };
  }
  if (user.status !== "active") {
    return { error: "This account has been suspended for breaching the Community Guidelines." };
  }
  await createSession(user.id);
  redirect(next);
}

export async function signOutAction(): Promise<void> {
  await destroySession();
  redirect("/");
}

export async function deleteAccountAction(fd: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (String(fd.get("confirm") ?? "").trim().toUpperCase() !== "DELETE") redirect("/account?error=confirm");
  // Reports stay (anonymised) so warnings remain; personal history is erased.
  await db.update(reports).set({ userId: null }).where(eq(reports.userId, user.id));
  await db.delete(scans).where(eq(scans.userId, user.id));
  await db.delete(contacts).where(eq(contacts.userId, user.id));
  await destroySession();
  await db.delete(users).where(eq(users.id, user.id));
  redirect("/?account=deleted");
}
