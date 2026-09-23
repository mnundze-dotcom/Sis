"use client";

import { useState, useTransition, type FormEvent } from "react";
import type { FormState } from "@/app/actions/auth";

/**
 * Calls a server action from onSubmit (instead of <form action>) so React doesn't
 * reset the fields when validation fails.
 */
export function useServerForm(action: (prev: FormState, fd: FormData) => Promise<FormState>, opts?: { resetOnSuccess?: boolean }) {
  const [state, setState] = useState<FormState>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const fd = new FormData(form);
    startTransition(async () => {
      const result = (await action(null, fd)) ?? null;
      setState(result);
      if (result?.success && opts?.resetOnSuccess) form.reset();
    });
  }

  return { state, pending, onSubmit, reset: () => setState(null) };
}
