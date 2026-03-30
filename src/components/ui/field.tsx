import { cn } from "@/lib/cn";

export const inputClassName =
  "w-full rounded-xl border border-white/10 bg-brand-950/60 px-3.5 py-2.5 text-sm text-zinc-100 shadow-inner shadow-black/20 transition-all duration-200 placeholder:text-zinc-500 focus:border-brand-400 focus:outline-none focus:ring-4 focus:ring-brand-500/25";

export const selectClassName = inputClassName;

export function Field({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={cn("block", className)}>
      <span className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
        {label}
      </span>
      <div className="mt-2">{children}</div>
    </label>
  );
}
