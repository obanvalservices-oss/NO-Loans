import { cn } from "@/lib/cn";

const styles = {
  default:
    "bg-brand-500/20 text-brand-200 ring-brand-400/25",
  success:
    "bg-emerald-500/20 text-emerald-300 ring-emerald-400/20",
  warning:
    "bg-amber-500/15 text-amber-200 ring-amber-400/25",
  muted:
    "bg-zinc-500/15 text-zinc-400 ring-zinc-500/20",
  danger:
    "bg-red-500/15 text-red-300 ring-red-400/25",
} as const;

export function Badge({
  children,
  variant = "default",
  className,
}: {
  children: React.ReactNode;
  variant?: keyof typeof styles;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-lg px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset transition-colors",
        styles[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function loanStatusVariant(status: string): keyof typeof styles {
  switch (status) {
    case "active":
      return "success";
    case "completed":
      return "muted";
    default:
      return "default";
  }
}
