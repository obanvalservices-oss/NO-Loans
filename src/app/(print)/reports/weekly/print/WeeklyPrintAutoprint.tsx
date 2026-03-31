"use client";

import { useEffect } from "react";

/** Opens the system print dialog shortly after the print view loads (new tab). */
export function WeeklyPrintAutoprint({ enabled }: { enabled: boolean }) {
  useEffect(() => {
    if (!enabled) return;
    const id = window.setTimeout(() => {
      window.print();
    }, 250);
    return () => window.clearTimeout(id);
  }, [enabled]);

  return null;
}
