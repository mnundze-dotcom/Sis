"use client";

import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { LoaderCircle } from "lucide-react";
import { buttonClass, type ButtonSize, type ButtonVariant } from "./ui";

/** Submit button for server-action forms; disables itself while the form is pending. */
export function SubmitButton({
  children,
  variant = "primary",
  size = "md",
  className,
  formAction,
  name,
  value,
}: {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  formAction?: (formData: FormData) => void | Promise<void>;
  name?: string;
  value?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" formAction={formAction} name={name} value={value} disabled={pending} className={buttonClass(variant, size, className)}>
      {pending && <LoaderCircle className="animate-spin" />}
      {children}
    </button>
  );
}
