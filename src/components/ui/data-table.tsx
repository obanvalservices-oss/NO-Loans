import { cn } from "@/lib/cn";

export function DataTableShell({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-white/10 bg-brand-900/35 shadow-lg shadow-black/25 backdrop-blur-md print:max-h-none print:overflow-visible print:border-slate-200 print:bg-white print:shadow-none",
        className,
      )}
    >
      <div className="overflow-x-auto print:max-h-none print:overflow-visible">
        {children}
      </div>
    </div>
  );
}

export function Table({
  className,
  ...props
}: React.TableHTMLAttributes<HTMLTableElement>) {
  return (
    <table
      className={cn("min-w-full text-left text-sm", className)}
      {...props}
    />
  );
}

export function Th({
  className,
  ...props
}: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={cn(
        "whitespace-nowrap bg-brand-950/70 px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-zinc-400 first:rounded-tl-2xl last:rounded-tr-2xl print:bg-slate-100 print:text-slate-800",
        className,
      )}
      {...props}
    />
  );
}

export function Td({
  className,
  ...props
}: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td
      className={cn(
        "border-t border-white/5 px-4 py-3.5 text-zinc-300 transition-colors duration-150 group-hover:bg-white/[0.03] print:border-slate-200 print:bg-white print:text-slate-900 print:group-hover:bg-slate-50",
        className,
      )}
      {...props}
    />
  );
}
