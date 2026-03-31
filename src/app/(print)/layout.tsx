import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

/**
 * Minimal shell for print-friendly routes: no sidebar, no motion wrapper,
 * no flex scroll containers (those break Chrome’s print layout).
 */
export default async function PrintRouteLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div className="min-h-screen bg-white text-slate-900 antialiased">
      <div className="mx-auto max-w-5xl px-4 py-6 print:mx-0 print:max-w-none print:px-[0.35in] print:py-[0.35in]">
        {children}
      </div>
    </div>
  );
}
