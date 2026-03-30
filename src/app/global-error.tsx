"use client";

import { useEffect } from "react";
import "./globals.css";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[GlobalError]", error.message, error.digest ?? "");
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-screen bg-[#0a1210] px-6 py-16 font-sans text-zinc-200 antialiased">
        <div className="mx-auto max-w-md text-center">
          <h1 className="text-2xl font-bold text-white">Something went wrong</h1>
          <p className="mt-3 text-sm text-zinc-400">
            The application hit an unexpected error. You can try again or return
            to the home page.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={() => reset()}
              className="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-medium text-white shadow-md transition hover:bg-brand-500"
            >
              Try again
            </button>
            <a
              href="/"
              className="rounded-xl border border-white/15 px-5 py-2.5 text-sm font-medium text-zinc-200 transition hover:border-brand-400/40"
            >
              Home
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
