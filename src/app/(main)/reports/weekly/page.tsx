import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import {
  formatISODate,
  mondayOfWeekContaining,
  parseISODate,
  sundayAfterMonday,
} from "@/lib/dates";
import { ensureWeeklyReportAccessible } from "@/lib/policy-guards";
import { requireCompanyScope } from "@/lib/require-auth";
import {
  getWeeklyDeductions,
  groupDeductionsByFarm,
} from "@/lib/weekly-report";
import { CalendarRange } from "lucide-react";
import { WeeklyReportClient } from "./WeeklyReportClient";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ week?: string }>;
};

export default async function WeeklyReportPage({ searchParams }: Props) {
  await ensureWeeklyReportAccessible();
  const sp = await searchParams;
  let anchor = new Date();
  if (sp.week && /^\d{4}-\d{2}-\d{2}$/.test(sp.week)) {
    anchor = parseISODate(sp.week);
  }
  const monday = mondayOfWeekContaining(anchor);
  const sunday = sundayAfterMonday(monday);
  const startISO = formatISODate(monday);

  const scope = await requireCompanyScope();
  const rows = await getWeeklyDeductions(
    startISO,
    formatISODate(sunday),
    scope,
  );
  const groups = groupDeductionsByFarm(rows);
  const grandTotalAllCents = rows.reduce((s, r) => s + r.remaining_cents, 0);

  const rangeLabel = `${monday.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  })} – ${sunday.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  })}`;

  return (
    <div className="space-y-10">
      <PageHeader
        className="no-print"
        title="Weekly payroll deductions"
        description="Active loans only: installments due in the selected week (Mon–Sun). One row per employee per farm (multiple loans combined). Choose farms for print."
      />

      <Card className="no-print">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarRange className="h-5 w-5 text-brand-400" />
            Report week
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form method="GET" className="flex flex-wrap items-end gap-3">
            <label className="block text-sm">
              <span className="font-semibold uppercase tracking-wide text-zinc-500">
                Week (pick any day)
              </span>
              <input
                type="date"
                name="week"
                defaultValue={startISO}
                className="mt-2 block rounded-xl border border-white/15 bg-brand-950/50 px-3 py-2.5 text-sm text-zinc-100 shadow-sm focus:border-brand-400 focus:outline-none focus:ring-4 focus:ring-brand-500/20"
              />
            </label>
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-medium text-white shadow-md shadow-brand-900/40 transition-all duration-200 hover:bg-brand-500 active:scale-[0.98]"
            >
              Update report
            </button>
          </form>
          <p className="mt-3 text-sm text-zinc-400">
            Showing <strong className="text-zinc-200">{rangeLabel}</strong>
          </p>
        </CardContent>
      </Card>

      <WeeklyReportClient
        key={startISO}
        groups={groups}
        rangeLabel={rangeLabel}
        grandTotalAllCents={grandTotalAllCents}
      />
    </div>
  );
}
