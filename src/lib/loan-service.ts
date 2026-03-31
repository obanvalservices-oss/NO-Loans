import type { CompanyScope } from "@/lib/company-scope";
import { loansWhere } from "@/lib/company-scope";
import { addWeeks, parseISODate } from "@/lib/dates";
import type { InstallmentRow, LoanRow } from "@/lib/db";
import { computeLoanTotals, splitWeeklyAmounts } from "@/lib/loan-calculator";
import { prisma } from "@/lib/prisma";

function loanToRow(l: {
  id: number;
  company_id: number;
  employee_id: number;
  principal_cents: number;
  annual_interest_rate_percent: number;
  term_weeks: number;
  start_date: string;
  total_owed_cents: number;
  weekly_payment_cents: number;
  status: string;
  created_at: Date;
  notes: string;
  farm: string;
  approved_by: string;
}): LoanRow {
  return {
    id: l.id,
    company_id: l.company_id,
    employee_id: l.employee_id,
    principal_cents: l.principal_cents,
    annual_interest_rate_percent: l.annual_interest_rate_percent,
    term_weeks: l.term_weeks,
    start_date: l.start_date,
    total_owed_cents: l.total_owed_cents,
    weekly_payment_cents: l.weekly_payment_cents,
    status: l.status,
    created_at: l.created_at.toISOString(),
    notes: l.notes,
    farm: l.farm,
    approved_by: l.approved_by,
  };
}

export async function createLoanWithSchedule(input: {
  companyId: number;
  employeeId: number;
  principalCents: number;
  annualInterestRatePercent: number;
  termWeeks: number;
  /** YYYY-MM-DD (local calendar day) */
  startDateISO: string;
  notes?: string;
  farm: string;
  approvedBy: string;
}): Promise<LoanRow> {
  const { totalOwedCents } = computeLoanTotals(
    input.principalCents,
    input.annualInterestRatePercent,
    input.termWeeks,
  );
  const amounts = splitWeeklyAmounts(totalOwedCents, input.termWeeks);
  const weeklyPaymentCents = amounts[0] ?? 0;
  const start = parseISODate(input.startDateISO);

  const loan = await prisma.$transaction(async (tx) => {
    const created = await tx.loan.create({
      data: {
        company_id: input.companyId,
        employee_id: input.employeeId,
        principal_cents: input.principalCents,
        annual_interest_rate_percent: input.annualInterestRatePercent,
        term_weeks: input.termWeeks,
        start_date: input.startDateISO,
        total_owed_cents: totalOwedCents,
        weekly_payment_cents: weeklyPaymentCents,
        status: "active",
        notes: input.notes ?? "",
        farm: input.farm,
        approved_by: input.approvedBy,
      },
    });

    await tx.installment.createMany({
      data: amounts.map((amt, i) => ({
        loan_id: created.id,
        sequence: i + 1,
        due_date: addWeeks(start, i).toISOString().slice(0, 10),
        amount_due_cents: amt,
        amount_paid_cents: 0,
        status: "pending",
      })),
    });

    return tx.loan.findUniqueOrThrow({ where: { id: created.id } });
  });

  return loanToRow(loan);
}

export async function getLoan(loanId: number): Promise<LoanRow | undefined> {
  const row = await prisma.loan.findUnique({ where: { id: loanId } });
  return row ? loanToRow(row) : undefined;
}

/** True when every installment is still unpaid pending (no payments, skips, etc.). */
export async function canReplaceLoanSchedule(
  loanId: number,
): Promise<boolean> {
  const bad = await prisma.installment.count({
    where: {
      loan_id: loanId,
      OR: [{ amount_paid_cents: { gt: 0 } }, { status: { not: "pending" } }],
    },
  });
  return bad === 0;
}

/**
 * Update loan: company/borrower and metadata anytime.
 * Changing principal, rate, term, or first due date requires an untouched schedule
 * (see {@link canReplaceLoanSchedule}).
 */
export async function updateLoan(input: {
  loanId: number;
  companyId: number;
  employeeId: number;
  principalCents: number;
  annualInterestRatePercent: number;
  termWeeks: number;
  startDateISO: string;
  farm: string;
  approvedBy: string;
  notes: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const existing = await getLoan(input.loanId);
  if (!existing) {
    return { ok: false, error: "Loan not found" };
  }

  const emp = await prisma.employee.findUnique({
    where: { id: input.employeeId },
    select: { company_id: true },
  });
  if (!emp || emp.company_id !== input.companyId) {
    return { ok: false, error: "Employee must belong to the selected company" };
  }
  if (!input.farm.trim()) {
    return { ok: false, error: "Farm / workplace is required" };
  }
  if (!input.approvedBy.trim()) {
    return { ok: false, error: "Approved by is required" };
  }
  if (input.principalCents <= 0) {
    return { ok: false, error: "Valid principal amount is required" };
  }
  if (
    Number.isNaN(input.annualInterestRatePercent) ||
    input.annualInterestRatePercent < 0
  ) {
    return { ok: false, error: "Interest rate must be zero or positive" };
  }
  if (!input.termWeeks || input.termWeeks < 1) {
    return { ok: false, error: "Term must be at least 1 week" };
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.startDateISO)) {
    return { ok: false, error: "Invalid start date" };
  }

  const financialChanged =
    existing.principal_cents !== input.principalCents ||
    existing.annual_interest_rate_percent !== input.annualInterestRatePercent ||
    existing.term_weeks !== input.termWeeks ||
    existing.start_date !== input.startDateISO;

  if (financialChanged && !(await canReplaceLoanSchedule(input.loanId))) {
    return {
      ok: false,
      error:
        "Cannot change principal, interest, term, or first due date after payments or schedule activity (partial pay, skip, etc.). You can still update company, borrower, farm, approved by, and notes.",
    };
  }

  const borrowerOrMetaChanged =
    existing.company_id !== input.companyId ||
    existing.employee_id !== input.employeeId ||
    existing.farm.trim() !== input.farm.trim() ||
    existing.approved_by.trim() !== input.approvedBy.trim() ||
    existing.notes.trim() !== input.notes.trim();

  if (!financialChanged && !borrowerOrMetaChanged) {
    return { ok: true };
  }

  if (financialChanged) {
    const { totalOwedCents } = computeLoanTotals(
      input.principalCents,
      input.annualInterestRatePercent,
      input.termWeeks,
    );
    const amounts = splitWeeklyAmounts(totalOwedCents, input.termWeeks);
    const weeklyPaymentCents = amounts[0] ?? 0;
    const start = parseISODate(input.startDateISO);

    await prisma.$transaction(async (tx) => {
      await tx.installment.deleteMany({ where: { loan_id: input.loanId } });
      await tx.loan.update({
        where: { id: input.loanId },
        data: {
          company_id: input.companyId,
          employee_id: input.employeeId,
          principal_cents: input.principalCents,
          annual_interest_rate_percent: input.annualInterestRatePercent,
          term_weeks: input.termWeeks,
          start_date: input.startDateISO,
          total_owed_cents: totalOwedCents,
          weekly_payment_cents: weeklyPaymentCents,
          farm: input.farm.trim(),
          approved_by: input.approvedBy.trim(),
          notes: input.notes.trim(),
        },
      });
      await tx.installment.createMany({
        data: amounts.map((amt, i) => ({
          loan_id: input.loanId,
          sequence: i + 1,
          due_date: addWeeks(start, i).toISOString().slice(0, 10),
          amount_due_cents: amt,
          amount_paid_cents: 0,
          status: "pending",
        })),
      });
    });
    await refreshLoanStatus(input.loanId);
    return { ok: true };
  }

  await prisma.loan.update({
    where: { id: input.loanId },
    data: {
      company_id: input.companyId,
      employee_id: input.employeeId,
      farm: input.farm.trim(),
      approved_by: input.approvedBy.trim(),
      notes: input.notes.trim(),
    },
  });
  await refreshLoanStatus(input.loanId);
  return { ok: true };
}

export async function listInstallments(
  loanId: number,
): Promise<InstallmentRow[]> {
  const rows = await prisma.installment.findMany({
    where: { loan_id: loanId },
    orderBy: [{ sequence: "asc" }, { id: "asc" }],
  });
  return rows.map((r) => ({
    id: r.id,
    loan_id: r.loan_id,
    sequence: r.sequence,
    due_date: r.due_date,
    amount_due_cents: r.amount_due_cents,
    amount_paid_cents: r.amount_paid_cents,
    status: r.status,
  }));
}

export async function payInstallment(
  loanId: number,
  installmentId: number,
  amountCents: number,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (amountCents <= 0) {
    return { ok: false, error: "Amount must be positive" };
  }
  const row = await prisma.installment.findFirst({
    where: { id: installmentId, loan_id: loanId },
  });
  if (!row) return { ok: false, error: "Installment not found" };
  if (row.status === "skipped") {
    return { ok: false, error: "Cannot pay a skipped installment" };
  }
  if (row.status === "paid") {
    return { ok: false, error: "Already paid" };
  }

  const newPaid = row.amount_paid_cents + amountCents;
  let status: string;
  if (newPaid >= row.amount_due_cents) {
    status = "paid";
  } else {
    status = "partial";
  }

  await prisma.installment.update({
    where: { id: installmentId },
    data: {
      amount_paid_cents: Math.min(newPaid, row.amount_due_cents),
      status,
    },
  });

  await refreshLoanStatus(loanId);
  return { ok: true };
}

export async function skipInstallment(
  loanId: number,
  installmentId: number,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const row = await prisma.installment.findFirst({
    where: { id: installmentId, loan_id: loanId },
  });
  if (!row) return { ok: false, error: "Installment not found" };
  if (row.status === "skipped") {
    return { ok: false, error: "Already skipped" };
  }
  if (row.amount_paid_cents > 0) {
    return { ok: false, error: "Cannot skip after a payment was recorded" };
  }
  if (row.status === "paid") {
    return { ok: false, error: "Already paid" };
  }

  const maxRow = await prisma.installment.aggregate({
    where: { loan_id: loanId },
    _max: { sequence: true },
  });
  const maxSeq = maxRow._max.sequence ?? 0;

  const lastDue = await prisma.installment.findFirst({
    where: { loan_id: loanId },
    orderBy: [{ sequence: "desc" }, { id: "desc" }],
    select: { due_date: true },
  });
  const nextDue = lastDue
    ? addWeeks(parseISODate(lastDue.due_date), 1)
    : parseISODate(row.due_date);

  await prisma.$transaction(async (tx) => {
    await tx.installment.update({
      where: { id: installmentId },
      data: { status: "skipped", amount_paid_cents: 0 },
    });
    await tx.installment.create({
      data: {
        loan_id: loanId,
        sequence: maxSeq + 1,
        due_date: nextDue.toISOString().slice(0, 10),
        amount_due_cents: row.amount_due_cents,
        amount_paid_cents: 0,
        status: "pending",
      },
    });
  });

  await refreshLoanStatus(loanId);
  return { ok: true };
}

async function refreshLoanStatus(loanId: number) {
  const pending = await prisma.installment.count({
    where: {
      loan_id: loanId,
      status: { in: ["pending", "partial"] },
    },
  });
  if (pending === 0) {
    await prisma.loan.update({
      where: { id: loanId },
      data: { status: "completed" },
    });
  } else {
    await prisma.loan.update({
      where: { id: loanId },
      data: { status: "active" },
    });
  }
}

export async function getDashboardStats(scope: CompanyScope): Promise<{
  totalPrincipalCents: number;
  totalOwedRemainingCents: number;
  activeLoans: number;
  completedLoans: number;
}> {
  const scopeWhere = loansWhere(scope);
  const principal = await prisma.loan.aggregate({
    where: {
      ...scopeWhere,
      status: { not: "void" },
    },
    _sum: { principal_cents: true },
  });

  const rows = await prisma.installment.findMany({
    where: {
      loan: {
        status: { not: "void" },
        ...scopeWhere,
      },
    },
    select: {
      amount_due_cents: true,
      amount_paid_cents: true,
      status: true,
    },
  });

  let remaining = 0;
  for (const r of rows) {
    if (r.status === "skipped") continue;
    const left = r.amount_due_cents - r.amount_paid_cents;
    if (left > 0) remaining += left;
  }

  const counts = await prisma.loan.groupBy({
    by: ["status"],
    where: scopeWhere,
    _count: { _all: true },
  });

  let activeLoans = 0;
  let completedLoans = 0;
  for (const c of counts) {
    if (c.status === "active") activeLoans = c._count._all;
    if (c.status === "completed") completedLoans = c._count._all;
  }

  return {
    totalPrincipalCents: principal._sum.principal_cents ?? 0,
    totalOwedRemainingCents: remaining,
    activeLoans,
    completedLoans,
  };
}

export type DashboardQuickLoan = {
  loan_id: number;
  employee_name: string;
  company_name: string;
  weekly_payment_cents: number;
  current_installment_id: number | null;
  current_due_date: string | null;
  current_remaining_cents: number;
};

export type DashboardLatestLoan = {
  loan_id: number;
  employee_name: string;
  company_name: string;
  principal_cents: number;
  status: string;
  created_at: string;
};

export type DashboardAlertItem = {
  loan_id: number;
  installment_id: number;
  employee_name: string;
  company_name: string;
  due_date: string;
  status: "overdue" | "skipped";
  amount_cents: number;
};

export async function getDashboardOverview(
  scope: CompanyScope,
  companyId?: number,
): Promise<{
  totalPrincipalCents: number;
  totalOwedRemainingCents: number;
  activeLoans: number;
  completedLoans: number;
  quickLoans: DashboardQuickLoan[];
  latestLoans: DashboardLatestLoan[];
  alerts: DashboardAlertItem[];
}> {
  const baseWhere = loansWhere(scope);
  const scopedWhere = companyId
    ? ({ ...baseWhere, company_id: companyId } as const)
    : baseWhere;

  const principal = await prisma.loan.aggregate({
    where: {
      ...scopedWhere,
      status: { not: "void" },
    },
    _sum: { principal_cents: true },
  });

  const installmentRows = await prisma.installment.findMany({
    where: {
      loan: {
        status: { not: "void" },
        ...scopedWhere,
      },
    },
    select: {
      amount_due_cents: true,
      amount_paid_cents: true,
      status: true,
    },
  });

  let remaining = 0;
  for (const r of installmentRows) {
    if (r.status === "skipped") continue;
    const left = r.amount_due_cents - r.amount_paid_cents;
    if (left > 0) remaining += left;
  }

  const counts = await prisma.loan.groupBy({
    by: ["status"],
    where: scopedWhere,
    _count: { _all: true },
  });

  let activeLoans = 0;
  let completedLoans = 0;
  for (const c of counts) {
    if (c.status === "active") activeLoans = c._count._all;
    if (c.status === "completed") completedLoans = c._count._all;
  }

  const quickLoanRows = await prisma.loan.findMany({
    where: {
      ...scopedWhere,
      status: "active",
    },
    orderBy: [{ id: "desc" }],
    include: {
      employee: { select: { full_name: true } },
      company: { select: { name: true } },
      installments: {
        where: { status: { in: ["pending", "partial"] } },
        orderBy: [{ due_date: "asc" }, { sequence: "asc" }],
        take: 1,
        select: {
          id: true,
          due_date: true,
          amount_due_cents: true,
          amount_paid_cents: true,
        },
      },
    },
  });

  const quickLoans: DashboardQuickLoan[] = quickLoanRows.map((l) => {
    const inst = l.installments[0];
    const currentRemaining = inst
      ? Math.max(0, inst.amount_due_cents - inst.amount_paid_cents)
      : 0;
    return {
      loan_id: l.id,
      employee_name: l.employee.full_name,
      company_name: l.company.name,
      weekly_payment_cents: l.weekly_payment_cents,
      current_installment_id: inst?.id ?? null,
      current_due_date: inst?.due_date ?? null,
      current_remaining_cents: currentRemaining,
    };
  });

  const latestLoanRows = await prisma.loan.findMany({
    where: scopedWhere,
    orderBy: [{ created_at: "desc" }],
    take: 3,
    include: {
      employee: { select: { full_name: true } },
      company: { select: { name: true } },
    },
  });

  const latestLoans: DashboardLatestLoan[] = latestLoanRows.map((l) => ({
    loan_id: l.id,
    employee_name: l.employee.full_name,
    company_name: l.company.name,
    principal_cents: l.principal_cents,
    status: l.status,
    created_at: l.created_at.toISOString(),
  }));

  const todayISO = new Date().toISOString().slice(0, 10);
  const overdueRows = await prisma.installment.findMany({
    where: {
      due_date: { lt: todayISO },
      status: { in: ["pending", "partial"] },
      loan: {
        ...scopedWhere,
        status: "active",
      },
    },
    orderBy: [{ due_date: "asc" }, { id: "asc" }],
    take: 8,
    include: {
      loan: {
        select: {
          id: true,
          employee: { select: { full_name: true } },
          company: { select: { name: true } },
        },
      },
    },
  });

  const skippedRows = await prisma.installment.findMany({
    where: {
      status: "skipped",
      loan: {
        ...scopedWhere,
      },
    },
    orderBy: [{ due_date: "desc" }, { id: "desc" }],
    take: 8,
    include: {
      loan: {
        select: {
          id: true,
          employee: { select: { full_name: true } },
          company: { select: { name: true } },
        },
      },
    },
  });

  const alerts: DashboardAlertItem[] = [
    ...overdueRows.map((r) => ({
      loan_id: r.loan.id,
      installment_id: r.id,
      employee_name: r.loan.employee.full_name,
      company_name: r.loan.company.name,
      due_date: r.due_date,
      status: "overdue" as const,
      amount_cents: Math.max(0, r.amount_due_cents - r.amount_paid_cents),
    })),
    ...skippedRows.map((r) => ({
      loan_id: r.loan.id,
      installment_id: r.id,
      employee_name: r.loan.employee.full_name,
      company_name: r.loan.company.name,
      due_date: r.due_date,
      status: "skipped" as const,
      amount_cents: r.amount_due_cents,
    })),
  ].slice(0, 10);

  return {
    totalPrincipalCents: principal._sum.principal_cents ?? 0,
    totalOwedRemainingCents: remaining,
    activeLoans,
    completedLoans,
    quickLoans,
    latestLoans,
    alerts,
  };
}
