"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function MainAppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[AppError]", error.message, error.digest ?? "");
  }, [error]);

  const showDetail = process.env.NODE_ENV === "development";

  return (
    <div className="mx-auto max-w-lg space-y-6 py-16 text-center">
      <h1 className="text-2xl font-bold text-zinc-50">Something went wrong</h1>
      <p className="text-sm text-zinc-400">
        {showDetail
          ? error.message
          : "An unexpected error occurred. Please try again."}
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={() => reset()}
          className="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-medium text-white shadow-md transition hover:bg-brand-500"
        >
          Try again
        </button>
        <Link
          href="/"
          className="rounded-xl border border-white/15 px-5 py-2.5 text-sm font-medium text-zinc-200 transition hover:border-brand-400/40"
        >
          Dashboard
        </Link>
      </div>
    </div>
  );
}
