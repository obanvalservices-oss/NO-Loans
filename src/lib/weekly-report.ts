import type { CompanyScope } from "@/lib/company-scope";
import { loansWhere } from "@/lib/company-scope";
import { prisma } from "@/lib/prisma";

export type WeeklyDeductionRow = {
  installment_id: number;
  farm: string;
  loan_id: number;
  employee_name: string;
  company_name: string;
  due_date: string;
  amount_due_cents: number;
  amount_paid_cents: number;
  remaining_cents: number;
};

/**
 * Payroll deductions for active loans: installments due in [weekStart, weekEnd] (inclusive),
 * excluding skipped lines. Remaining = amount still to collect on that installment.
 */
export async function getWeeklyDeductions(
  weekStartISO: string,
  weekEndISO: string,
  scope: CompanyScope,
): Promise<WeeklyDeductionRow[]> {
  const loanFilter = loansWhere(scope);
  const rows = await prisma.installment.findMany({
    where: {
      loan: {
        status: "active",
        ...loanFilter,
      },
      status: { not: "skipped" },
      due_date: { gte: weekStartISO, lte: weekEndISO },
    },
    orderBy: [{ due_date: "asc" }, { id: "asc" }],
    include: {
      loan: {
        include: {
          employee: { select: { full_name: true } },
          company: { select: { name: true } },
        },
      },
    },
  });

  const mapped: WeeklyDeductionRow[] = rows.map((r) => {
    const remaining = Math.max(
      0,
      r.amount_due_cents - r.amount_paid_cents,
    );
    const farmLabel = r.loan.farm?.trim() || "(No farm)";
    return {
      installment_id: r.id,
      farm: farmLabel,
      loan_id: r.loan_id,
      employee_name: r.loan.employee.full_name,
      company_name: r.loan.company.name,
      due_date: r.due_date,
      amount_due_cents: r.amount_due_cents,
      amount_paid_cents: r.amount_paid_cents,
      remaining_cents: remaining,
    };
  });
  mapped.sort((a, b) => {
    const fa = a.farm.localeCompare(b.farm);
    if (fa !== 0) return fa;
    const fe = a.employee_name.localeCompare(b.employee_name);
    if (fe !== 0) return fe;
    const fd = a.due_date.localeCompare(b.due_date);
    if (fd !== 0) return fd;
    return a.installment_id - b.installment_id;
  });
  return mapped;
}

/** One line per employee per farm: discount = sum of remaining due across their loans this week. */
export type FarmEmployeeDeduction = {
  employee_name: string;
  discount_cents: number;
};

export type FarmGroup = {
  farm: string;
  rows: FarmEmployeeDeduction[];
  subtotalCents: number;
};

/**
 * Group by farm, then merge rows for the same employee (multiple active loans → one line, summed).
 */
export function groupDeductionsByFarm(rows: WeeklyDeductionRow[]): FarmGroup[] {
  const byFarm = new Map<string, WeeklyDeductionRow[]>();
  for (const r of rows) {
    const key = r.farm;
    if (!byFarm.has(key)) byFarm.set(key, []);
    byFarm.get(key)!.push(r);
  }

  const result: FarmGroup[] = [];
  for (const [farm, list] of byFarm.entries()) {
    const byEmployee = new Map<string, number>();
    for (const r of list) {
      const name = r.employee_name.trim();
      byEmployee.set(
        name,
        (byEmployee.get(name) ?? 0) + r.remaining_cents,
      );
    }
    const rowsAgg: FarmEmployeeDeduction[] = [...byEmployee.entries()]
      .map(([employee_name, discount_cents]) => ({
        employee_name,
        discount_cents,
      }))
      .sort((a, b) => a.employee_name.localeCompare(b.employee_name));
    const subtotalCents = rowsAgg.reduce((s, x) => s + x.discount_cents, 0);
    result.push({ farm, rows: rowsAgg, subtotalCents });
  }
  return result.sort((a, b) => a.farm.localeCompare(b.farm));
}
