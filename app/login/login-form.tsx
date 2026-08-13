"use client";

import { useActionState } from "react";

import { signIn, type LoginState } from "./actions";

const initialState: LoginState = { error: null };

const fieldClass =
  "rounded-md border border-[var(--color-line-strong)] bg-[var(--color-surface)] px-3 py-2.5 text-[16px] text-[var(--color-ink)] outline-none transition placeholder:text-[var(--color-ink-faint)] focus:border-[var(--color-cardinal)] focus:ring-2 focus:ring-[var(--color-cardinal-soft)]";

const labelClass =
  "text-[12px] font-semibold tracking-wide uppercase text-[var(--color-ink-muted)]";

export function LoginForm({ next }: { next: string }) {
  const [state, formAction, pending] = useActionState(signIn, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="next" value={next} />

      <label className="flex flex-col gap-1.5">
        <span className={labelClass}>Email</span>
        <input
          type="email"
          name="email"
          autoComplete="username"
          required
          placeholder="name@usc.edu"
          className={fieldClass}
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className={labelClass}>Password</span>
        <input
          type="password"
          name="password"
          autoComplete="current-password"
          required
          className={fieldClass}
        />
      </label>

      {state.error ? (
        <p
          role="alert"
          className="rounded-md border border-[#e8cccc] bg-[var(--color-cardinal-soft)] px-3 py-2 text-sm text-[var(--color-danger)]"
        >
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="mt-2 rounded-md bg-[var(--color-cardinal)] px-4 py-3 text-[15px] font-semibold text-white transition hover:bg-[var(--color-cardinal-hover)] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
