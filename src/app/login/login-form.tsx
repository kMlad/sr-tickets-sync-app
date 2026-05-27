"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { type LoginState, login } from "./actions";

const initialState: LoginState = {};

const inputClass =
  "h-11 rounded-lg border border-cream/15 bg-void/60 px-3 text-sm text-cream placeholder:text-cream/35 outline-none transition focus:border-orange focus:ring-2 focus:ring-orange/30";

const labelClass =
  "font-mono text-[11px] uppercase tracking-[0.18em] text-cream/55";

export function LoginForm() {
  const [state, formAction, pending] = useActionState(login, initialState);

  return (
    <form action={formAction} className="grid gap-5">
      <div className="grid gap-2">
        <label className={labelClass} htmlFor="email">
          Email
        </label>
        <input
          autoComplete="email"
          className={inputClass}
          id="email"
          name="email"
          required
          type="email"
        />
      </div>
      <div className="grid gap-2">
        <label className={labelClass} htmlFor="password">
          Password
        </label>
        <input
          autoComplete="current-password"
          className={inputClass}
          id="password"
          name="password"
          required
          type="password"
        />
      </div>
      {state.message ? (
        <p className="rounded-md border border-magenta/30 bg-magenta/10 px-3 py-2 text-sm text-magenta">
          {state.message}
        </p>
      ) : null}
      <Button className="w-full" disabled={pending} type="submit">
        {pending ? "Signing in..." : "Sign in"}
      </Button>
    </form>
  );
}
