"use server";

import { and, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { contacts, disputes, records } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { DISPUTE_REASONS, DISPUTE_RELATIONSHIPS, hasOption } from "@/lib/domain";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import type { FormState } from "./auth";

const str = (fd: FormData, key: string, max = 300) => String(fd.get(key) ?? "").trim().slice(0, max);
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function submitDisputeAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const recordId = Number(fd.get("recordId"));
  const name = str(fd, "name", 80);
  const email = str(fd, "email", 120).toLowerCase();
  const relationship = str(fd, "relationship", 40);
  const reason = str(fd, "reason", 40);
  const details = str(fd, "details", 3000);

  if (name.length < 2) return { error: "Please give your name." };
  if (!EMAIL_RE.test(email)) return { error: "Enter an email address we can reach you on." };
  if (!hasOption(DISPUTE_RELATIONSHIPS, relationship)) return { error: "Tell us how you're connected to this record." };
  if (!hasOption(DISPUTE_REASONS, reason)) return { error: "Choose the main reason for your request." };
  if (details.length < 30) return { error: "Please explain in a little more detail (at least 30 characters)." };
  if (fd.get("declaration") !== "on") return { error: "Please confirm the declaration." };
  if (!rateLimit(`dispute:${await clientIp()}`, 5, 3_600_000)) return { error: "Too many requests. Please try again later." };

  const [rec] = await db.select({ id: records.id, status: records.status }).from(records).where(eq(records.id, recordId)).limit(1);
  if (!rec || rec.status === "removed") return { error: "This record is no longer published." };

  await db.insert(disputes).values({ recordId, name, email, relationship, reason, details });
  if (rec.status === "active") {
    await db.update(records).set({ status: "disputed", updatedAt: new Date() }).where(eq(records.id, recordId));
  }
  revalidatePath(`/registry/${recordId}`);
  revalidatePath("/moderation");
  return {
    success:
      "Thank you. Your request has been logged and the record is now marked as under dispute. A moderator will reply by email, usually within 7 days.",
  };
}

export async function addContactAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Sign in to save trusted contacts." };
  const name = str(fd, "name", 60);
  const phone = str(fd, "phone", 24).replace(/[^\d+]/g, "");
  if (!name) return { error: "Add a name for this contact." };
  if (!/^(\+27|0)\d{9}$/.test(phone)) return { error: "Enter a South African mobile number, e.g. 082 123 4567." };
  const [{ n }] = await db.select({ n: sql<number>`count(*)::int` }).from(contacts).where(eq(contacts.userId, user.id));
  if (n >= 5) return { error: "You can save up to 5 trusted contacts." };
  await db.insert(contacts).values({ userId: user.id, name, phone });
  revalidatePath("/safety");
  revalidatePath("/");
  return { success: `${name} has been added.` };
}

export async function removeContactAction(fd: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user) return;
  await db.delete(contacts).where(and(eq(contacts.id, Number(fd.get("contactId"))), eq(contacts.userId, user.id)));
  revalidatePath("/safety");
  revalidatePath("/");
}
