"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DataTableShell, Table, Td, Th } from "@/components/ui/data-table";
import { cn } from "@/lib/cn";
import { centsToDisplay } from "@/lib/money";
import type { FarmGroup } from "@/lib/weekly-report";
import { Printer } from "lucide-react";
import { useMemo, useState } from "react";

type Props = {
  groups: FarmGroup[];
  rangeLabel: string;
  grandTotalAllCents: number;
};

export function WeeklyReportClient({
  groups,
  rangeLabel,
  grandTotalAllCents,
}: Props) {
  const farmList = useMemo(() => groups.map((g) => g.farm), [groups]);

  const [selected, setSelected] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(groups.map((g) => [g.farm, true])),
  );

  const anySelected = farmList.some((f) => selected[f]);

  const printGrandCents = useMemo(
    () =>
      groups
        .filter((g) => selected[g.farm])
        .reduce((s, g) => s + g.subtotalCents, 0),
    [groups, selected],
  );

  function toggle(farm: string) {
    setSelected((s) => ({ ...s, [farm]: !s[farm] }));
  }

  function selectAll() {
    setSelected(Object.fromEntries(farmList.map((f) => [f, true])));
  }

  function clearAll() {
    setSelected(Object.fromEntries(farmList.map((f) => [f, false])));
  }

  if (groups.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-sm text-zinc-400 print:text-slate-600">
          No installments due this week for active loans.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="weekly-print-root space-y-4">
      <div className="no-print rounded-xl border border-white/10 bg-brand-900/35 p-4 shadow-lg shadow-black/20">
        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
          Farms to include when printing
        </p>
        <p className="mt-1 text-sm text-zinc-400">
          Uncheck farms you do not want on the printed page. The table below always
          shows the full week; excluded farms are omitted from print only.
        </p>
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
          {farmList.map((farm) => (
            <label
              key={farm}
              className="inline-flex cursor-pointer items-center gap-2 text-sm text-zinc-200"
            >
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-white/20 bg-brand-950/80 text-brand-500 focus:ring-brand-400"
                checked={selected[farm] ?? false}
                onChange={() => toggle(farm)}
              />
              <span className="max-w-[220px] truncate" title={farm}>
                {farm}
              </span>
            </label>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            className="text-xs"
            onClick={selectAll}
          >
            Select all
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="text-xs"
            onClick={clearAll}
          >
            Clear all
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="ml-auto gap-2"
            disabled={!anySelected}
            onClick={() => window.print()}
          >
            <Printer className="h-4 w-4" />
            Print report
          </Button>
        </div>
      </div>

      <div className="weekly-print-sheet space-y-3 print:space-y-1">
        <div className="hidden print:block print:pb-1">
          <h1 className="text-[11pt] font-bold leading-tight text-slate-900">
            Weekly payroll deductions
          </h1>
          <p className="text-[8pt] leading-tight text-slate-700">{rangeLabel}</p>
          <p className="text-[7pt] text-slate-500">
            Active loans · {anySelected ? "selected farms" : "no farms selected"}
          </p>
        </div>

        <DataTableShell className="weekly-print-table-wrap print:border print:border-slate-300 print:shadow-none">
          <Table className="weekly-print-table w-full text-sm print:text-[8pt]">
            <thead>
              <tr>
                <Th className="w-[22%] print:py-0.5 print:px-1 print:text-[8pt]">
                  Farm
                </Th>
                <Th className="w-[50%] print:py-0.5 print:px-1 print:text-[8pt]">
                  Name
                </Th>
                <Th className="weekly-print-amount w-[28%] text-right print:py-0.5 print:px-1 print:text-[8pt]">
                  Disc.
                </Th>
              </tr>
            </thead>
            <tbody>
              {groups.map((g) => (
                <FarmGroupRows
                  key={g.farm}
                  group={g}
                  includeOnPrint={selected[g.farm] ?? false}
                />
              ))}
            </tbody>
          </Table>
        </DataTableShell>

        <Card className="weekly-print-grand-total border-brand-500/30 bg-brand-900/50 print:mt-1 print:border print:border-slate-300 print:bg-slate-100 print:py-0 print:shadow-none">
          <CardContent className="flex flex-wrap items-center justify-between gap-2 py-4 print:min-h-0 print:py-2 print:px-3">
            <span className="text-sm font-semibold text-zinc-200 print:text-[8pt] print:text-slate-800">
              {printGrandCents === grandTotalAllCents
                ? "Grand total"
                : "Grand total (selected for print)"}
            </span>
            <span className="text-xl font-bold tabular-nums text-brand-200 print:max-w-none print:text-[11pt] print:text-brand-900">
              {centsToDisplay(printGrandCents)}
            </span>
          </CardContent>
        </Card>
        {printGrandCents !== grandTotalAllCents ? (
          <p className="no-print text-center text-xs text-zinc-500">
            Full week total (all farms):{" "}
            <span className="font-medium text-zinc-300">
              {centsToDisplay(grandTotalAllCents)}
            </span>
          </p>
        ) : null}
      </div>
    </div>
  );
}

function FarmGroupRows({
  group,
  includeOnPrint,
}: {
  group: FarmGroup;
  includeOnPrint: boolean;
}) {
  const rowPrint = !includeOnPrint ? "print:hidden" : "";

  return (
    <>
      {group.rows.map((r) => (
        <tr
          key={`${group.farm}-${r.employee_name}`}
          className={cn("group", rowPrint)}
        >
          <Td
            className="weekly-print-farm-cell max-w-[140px] truncate text-zinc-400 print:max-w-none print:overflow-visible print:whitespace-normal print:break-words print:py-1 print:px-1 print:text-[8pt] print:text-slate-700"
            title={group.farm}
          >
            {group.farm}
          </Td>
          <Td className="font-medium text-zinc-50 print:py-1 print:px-1 print:text-[8pt] print:text-slate-900">
            {r.employee_name}
          </Td>
          <Td className="weekly-print-amount text-right tabular-nums font-medium text-zinc-50 print:py-1 print:px-1 print:text-[8pt] print:text-slate-900">
            {centsToDisplay(r.discount_cents)}
          </Td>
        </tr>
      ))}
      <tr className={cn("bg-brand-950/50 print:bg-slate-200/90", rowPrint)}>
        <Td
          colSpan={2}
          className="text-right text-sm font-semibold text-zinc-200 print:py-1 print:px-1 print:text-[8pt] print:text-slate-800"
        >
          Subtotal ({group.farm})
        </Td>
        <Td className="weekly-print-amount text-right text-sm font-bold tabular-nums text-brand-300 print:py-1 print:px-1 print:text-[8pt] print:text-brand-900">
          {centsToDisplay(group.subtotalCents)}
        </Td>
      </tr>
    </>
  );
}
