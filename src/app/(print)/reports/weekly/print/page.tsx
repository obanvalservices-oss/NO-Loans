import { centsToDisplay } from "@/lib/money";
import { ensureWeeklyReportAccessible } from "@/lib/policy-guards";
import { requireCompanyScope } from "@/lib/require-auth";
import {
  formatISODate,
  mondayOfWeekContaining,
  parseISODate,
  sundayAfterMonday,
} from "@/lib/dates";
import {
  getWeeklyDeductions,
  groupDeductionsByFarm,
  type FarmGroup,
} from "@/lib/weekly-report";
import Link from "next/link";
import "./print-doc.css";
import { WeeklyPrintAutoprint } from "./WeeklyPrintAutoprint";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{
    week?: string;
    farm?: string | string[];
    autoprint?: string;
  }>;
};

function farmsFromSearchParams(
  farm: string | string[] | undefined,
): Set<string> | null {
  if (farm === undefined) return null;
  const list = (Array.isArray(farm) ? farm : [farm]).filter(Boolean);
  if (list.length === 0) return new Set();
  return new Set(list);
}

function filterGroups(
  groups: FarmGroup[],
  farms: Set<string> | null,
): FarmGroup[] {
  if (farms === null) return groups;
  return groups.filter((g) => farms.has(g.farm));
}

export default async function WeeklyPrintPage({ searchParams }: Props) {
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
  const groupsAll = groupDeductionsByFarm(rows);
  const grandTotalAllCents = rows.reduce((s, r) => s + r.remaining_cents, 0);

  const farmFilter = farmsFromSearchParams(sp.farm);
  const groups = filterGroups(groupsAll, farmFilter);
  const printGrandCents = groups.reduce((s, g) => s + g.subtotalCents, 0);

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

  const autoprint = sp.autoprint === "1" || sp.autoprint === "true";
  const filteredNote =
    farmFilter !== null && farmFilter.size > 0
      ? "Selected farms only"
      : farmFilter !== null && farmFilter.size === 0
        ? "No farms selected"
        : "All farms";

  return (
    <>
      <WeeklyPrintAutoprint enabled={autoprint} />

      <p className="no-print mb-4 text-sm">
        <Link
          href={`/reports/weekly?week=${encodeURIComponent(startISO)}`}
          className="font-medium text-brand-600 underline underline-offset-2 hover:text-brand-500"
        >
          ← Back to weekly report
        </Link>
      </p>

      <header className="mb-4 print:mb-3">
        <h1 className="text-xl font-bold text-slate-900 print:text-[14pt]">
          Weekly payroll deductions
        </h1>
        <p className="mt-1 text-sm text-slate-700 print:text-[9pt]">
          {rangeLabel}
        </p>
        <p className="mt-0.5 text-xs text-slate-500 print:text-[8pt]">
          Active loans · {filteredNote}
        </p>
      </header>

      {groups.length === 0 ? (
        <p className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-600">
          No installments in this selection for the selected week.
        </p>
      ) : (
        <>
          <table className="weekly-print-doc-table">
            <colgroup>
              <col style={{ width: "22%" }} />
              <col style={{ width: "53%" }} />
              <col style={{ width: "25%" }} />
            </colgroup>
            <thead>
              <tr>
                <th scope="col">Farm</th>
                <th scope="col">Name</th>
                <th scope="col" className="weekly-print-doc-num">
                  Discount
                </th>
              </tr>
            </thead>
            <tbody>
              {groups.map((g) => (
                <FarmTableFragment key={g.farm} group={g} />
              ))}
            </tbody>
          </table>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border border-slate-300 bg-slate-100 px-4 py-3 print:mt-3 print:border-slate-400 print:bg-slate-100 print:py-2 print:text-[9pt]">
            <span className="font-semibold text-slate-800">
              {printGrandCents === grandTotalAllCents
                ? "Grand total"
                : "Grand total (this print)"}
            </span>
            <span className="text-lg font-bold tabular-nums text-slate-900 print:text-[11pt]">
              {centsToDisplay(printGrandCents)}
            </span>
          </div>

          {printGrandCents !== grandTotalAllCents ? (
            <p className="no-print mt-2 text-center text-xs text-slate-500">
              Full week total (all farms):{" "}
              <span className="font-medium text-slate-700">
                {centsToDisplay(grandTotalAllCents)}
              </span>
            </p>
          ) : null}
        </>
      )}
    </>
  );
}

function FarmTableFragment({ group }: { group: FarmGroup }) {
  return (
    <>
      {group.rows.map((r) => (
        <tr key={`${group.farm}-${r.employee_name}`}>
          <td>{group.farm}</td>
          <td>{r.employee_name}</td>
          <td className="weekly-print-doc-num">
            {centsToDisplay(r.discount_cents)}
          </td>
        </tr>
      ))}
      <tr className="weekly-print-doc-subtotal">
        <td colSpan={2} className="text-right">
          Subtotal ({group.farm})
        </td>
        <td className="weekly-print-doc-num">
          {centsToDisplay(group.subtotalCents)}
        </td>
      </tr>
    </>
  );
}
