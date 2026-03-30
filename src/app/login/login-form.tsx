"use client";

import { loginAction } from "@/app/actions/auth";
import { useActionState } from "react";

export function LoginPanel({ redirectTo }: { redirectTo: string }) {
  const [state, formAction, pending] = useActionState(loginAction, undefined);

  return (
    <div className="w-full max-w-md space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-zinc-50">
          Sign in
        </h2>
        <p className="mt-2 text-sm text-zinc-500">
          Use your work email and password. Sessions are secured with
          HTTP-only cookies.
        </p>
      </div>

      <form action={formAction} className="space-y-5">
        <input type="hidden" name="from" value={redirectTo} />
        <div className="space-y-2">
          <label
            htmlFor="email"
            className="block text-xs font-semibold uppercase tracking-wider text-zinc-500"
          >
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className="w-full rounded-xl border border-white/10 bg-brand-950/60 px-4 py-3 text-sm text-zinc-100 shadow-inner shadow-black/20 outline-none ring-0 transition placeholder:text-zinc-600 focus:border-brand-400/50 focus:ring-2 focus:ring-brand-500/25"
            placeholder="you@company.com"
          />
        </div>
        <div className="space-y-2">
          <label
            htmlFor="password"
            className="block text-xs font-semibold uppercase tracking-wider text-zinc-500"
          >
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className="w-full rounded-xl border border-white/10 bg-brand-950/60 px-4 py-3 text-sm text-zinc-100 shadow-inner shadow-black/20 outline-none ring-0 transition placeholder:text-zinc-600 focus:border-brand-400/50 focus:ring-2 focus:ring-brand-500/25"
            placeholder="••••••••"
          />
        </div>
        {state?.error ? (
          <p className="rounded-lg border border-red-500/30 bg-red-950/40 px-3 py-2 text-sm text-red-200">
            {state.error}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={pending}
          className="group relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-brand-900/40 transition hover:from-brand-500 hover:to-brand-400 disabled:opacity-60"
        >
          <span className="relative z-10">
            {pending ? "Signing in…" : "Continue"}
          </span>
          <span
            aria-hidden
            className="absolute inset-0 translate-x-[-100%] bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-[100%]"
          />
        </button>
      </form>
    </div>
  );
}
