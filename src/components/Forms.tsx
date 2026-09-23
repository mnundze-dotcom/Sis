"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { CircleCheck, LoaderCircle } from "lucide-react";
import { signInAction, signUpAction } from "@/app/actions/auth";
import { addContactAction, submitDisputeAction } from "@/app/actions/community";
import { DISPUTE_REASONS, DISPUTE_RELATIONSHIPS } from "@/lib/domain";
import { buttonClass } from "./ui";
import { useServerForm } from "./useServerForm";

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      {children}
      {hint && <span className="hint">{hint}</span>}
    </label>
  );
}

function FormError({ children }: { children?: ReactNode }) {
  if (!children) return null;
  return <p className="rounded-xl bg-[#fdeeee] px-4 py-3 text-[13.5px] font-medium text-[#a4262c]">{children}</p>;
}

export function LoginForm({ next }: { next: string }) {
  const { state, pending, onSubmit } = useServerForm(signInAction);
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <input type="hidden" name="next" value={next} />
      <Field label="Email">
        <input name="email" type="email" autoComplete="email" required className="field" />
      </Field>
      <Field label="Password">
        <input name="password" type="password" autoComplete="current-password" required className="field" />
      </Field>
      <FormError>{state?.error}</FormError>
      <button type="submit" disabled={pending} className={buttonClass("primary", "lg", "w-full")}>
        {pending && <LoaderCircle className="animate-spin" />}
        Sign in
      </button>
    </form>
  );
}

export function SignupForm({ next }: { next: string }) {
  const { state, pending, onSubmit } = useServerForm(signUpAction);
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <input type="hidden" name="next" value={next} />
      <Field label="What should we call you?" hint="Only moderators can see this.">
        <input name="displayName" autoComplete="given-name" required maxLength={60} className="field" />
      </Field>
      <Field label="Email">
        <input name="email" type="email" autoComplete="email" required className="field" />
      </Field>
      <Field label="Password" hint="At least 8 characters.">
        <input name="password" type="password" autoComplete="new-password" required minLength={8} className="field" />
      </Field>
      <label className="flex items-start gap-3 text-[13.5px] leading-relaxed text-ink-soft">
        <input type="checkbox" name="accept" className="mt-1 h-4 w-4 shrink-0 accent-[#5d2d79]" />
        <span>
          I agree to the{" "}
          <Link href="/guidelines" target="_blank" className="font-medium text-plum-700 underline underline-offset-4">Community Guidelines</Link>{" "}
          and{" "}
          <Link href="/privacy" target="_blank" className="font-medium text-plum-700 underline underline-offset-4">Privacy Notice</Link>.
        </span>
      </label>
      <FormError>{state?.error}</FormError>
      <button type="submit" disabled={pending} className={buttonClass("accent", "lg", "w-full")}>
        {pending && <LoaderCircle className="animate-spin" />}
        Create account
      </button>
    </form>
  );
}

export function DisputeForm({ recordId }: { recordId: number }) {
  const { state, pending, onSubmit } = useServerForm(submitDisputeAction);
  if (state?.success) {
    return (
      <div className="text-center">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[#e9f6ef] text-[#1f6b47]">
          <CircleCheck className="h-7 w-7" strokeWidth={1.75} />
        </div>
        <p className="mt-5 font-display text-[32px] leading-tight text-ink">Request received.</p>
        <p className="mx-auto mt-3 max-w-md text-[14.5px] leading-relaxed text-ink-soft">{state.success}</p>
        <Link href={`/registry/${recordId}`} className={buttonClass("secondary", "md", "mt-6")}>Back to the record</Link>
      </div>
    );
  }
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <input type="hidden" name="recordId" value={recordId} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Your name">
          <input name="name" required maxLength={80} autoComplete="name" className="field" />
        </Field>
        <Field label="Email" hint="We'll only use this to reply to you.">
          <input name="email" type="email" required autoComplete="email" className="field" />
        </Field>
        <Field label="Your connection to this record">
          <select name="relationship" defaultValue="" className="field">
            <option value="" disabled>Select…</option>
            {DISPUTE_RELATIONSHIPS.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </Field>
        <Field label="Main reason">
          <select name="reason" defaultValue="" className="field">
            <option value="" disabled>Select…</option>
            {DISPUTE_REASONS.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </Field>
      </div>
      <Field label="Details" hint="Explain what's wrong and what evidence you can provide (e.g. a change-of-ownership form).">
        <textarea name="details" rows={6} maxLength={3000} className="field resize-y" />
      </Field>
      <label className="flex items-start gap-3 rounded-2xl border border-line bg-plum-50/50 p-4 text-[13.5px] leading-relaxed text-ink-soft">
        <input type="checkbox" name="declaration" className="mt-1 h-4 w-4 shrink-0 accent-[#5d2d79]" />
        <span>The information I&apos;m providing is true. I understand Sis may ask for supporting documents.</span>
      </label>
      <FormError>{state?.error}</FormError>
      <button type="submit" disabled={pending} className={buttonClass("primary", "lg")}>
        {pending && <LoaderCircle className="animate-spin" />}
        Submit request
      </button>
    </form>
  );
}

export function ContactForm() {
  const { state, pending, onSubmit } = useServerForm(addContactAction, { resetOnSuccess: true });
  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <Field label="Name">
          <input name="name" required maxLength={60} placeholder="e.g. Mom" className="field" />
        </Field>
        <Field label="Mobile number">
          <input name="phone" type="tel" required inputMode="tel" placeholder="082 123 4567" className="field" />
        </Field>
        <button type="submit" disabled={pending} className={buttonClass("primary", "md", "h-[46px]")}>
          {pending && <LoaderCircle className="animate-spin" />}
          Add
        </button>
      </div>
      <FormError>{state?.error}</FormError>
      {state?.success && <p className="text-[13px] font-medium text-[#1f6b47]">{state.success}</p>}
    </form>
  );
}
