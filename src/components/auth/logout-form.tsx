"use client";

import { logoutAction } from "@/app/actions/auth";
import { LogOut } from "lucide-react";

const defaultBtn =
  "flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 bg-brand-900/40 px-3 py-2 text-xs font-medium text-zinc-300 transition-colors hover:border-brand-500/40 hover:bg-brand-800/50 hover:text-white";

export function LogoutForm({
  buttonClassName,
  formClassName,
}: {
  buttonClassName?: string;
  formClassName?: string;
}) {
  return (
    <form action={logoutAction} className={formClassName}>
      <button
        type="submit"
        className={buttonClassName ?? defaultBtn}
      >
        <LogOut className="h-3.5 w-3.5" aria-hidden />
        Log out
      </button>
    </form>
  );
}
