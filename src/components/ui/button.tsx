import { cn } from "@/lib/cn";
import Link from "next/link";
import type { ComponentProps } from "react";

const variants = {
  primary:
    "bg-brand-600 text-white shadow-md shadow-brand-600/30 hover:bg-brand-500 hover:shadow-lg hover:shadow-brand-500/25",
  secondary:
    "border border-white/15 bg-brand-950/50 text-zinc-100 shadow-sm hover:border-brand-400/30 hover:bg-brand-900/60",
  ghost:
    "text-zinc-400 hover:bg-white/5 hover:text-zinc-100",
  danger:
    "border border-red-400/30 bg-red-950/40 text-red-200 hover:border-red-400/50 hover:bg-red-950/60",
  dark:
    "bg-brand-950 text-brand-100 shadow-md shadow-black/40 ring-1 ring-white/10 hover:bg-brand-900",
} as const;

const base =
  "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50";

export type ButtonVariant = keyof typeof variants;

export function Button({
  className,
  variant = "primary",
  type = "button",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  return (
    <button
      type={type}
      className={cn(base, variants[variant], className)}
      {...props}
    />
  );
}

export function ButtonLink({
  className,
  variant = "primary",
  href,
  ...props
}: ComponentProps<typeof Link> & { variant?: ButtonVariant }) {
  return (
    <Link
      href={href}
      className={cn(base, variants[variant], className)}
      {...props}
    />
  );
}
