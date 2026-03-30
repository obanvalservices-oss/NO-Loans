"use server";

import { revalidatePath } from "next/cache";
import { getPermissionsForSession } from "@/lib/app-policies";
import { ensureCompanyAccess, ensureLoanAccess } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { requireCompanyScope } from "@/lib/require-auth";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { formatISODate, getNextFriday } from "@/lib/dates";
import { parseMoneyToCents } from "@/lib/money";
import {
  canReplaceLoanSchedule,
  createLoanWithSchedule,
  getLoan,
  payInstallment,
  skipInstallment,
  updateLoan,
} from "@/lib/loan-service";

async function loanManageDenied(): Promise<{ error: string } | null> {
  const session = await getSession();
  if (!session) return { error: "Not signed in" };
  const perms = await getPermissionsForSession(session);
  if (session.role !== "admin" && !perms.canManageLoans) {
    return { error: "You do not have permission to manage loans" };
  }
  return null;
}

async function assertCreateLoanWithEmployeeMode(
  formData: FormData,
): Promise<{ error: string } | null> {
  const denied = await loanManageDenied();
  if (denied) return denied;
  const session = await getSession();
  if (!session) return { error: "Not signed in" };
  const employee_mode = String(formData.get("employee_mode") ?? "existing");
  const perms = await getPermissionsForSession(session);
  if (
    session.role !== "admin" &&
    employee_mode === "new" &&
    !perms.canManageEmployees
  ) {
    return {
      error:
        "You do not have permission to add new employees while creating a loan",
    };
  }
  return null;
}

export async function createLoanAction(
  _prevState: { error?: string } | undefined,
  formData: FormData,
) {
  const company_id = Number(formData.get("company_id"));
  const employee_mode = String(formData.get("employee_mode") ?? "existing");
  let employee_id = Number(formData.get("employee_id"));
  const principal = parseMoneyToCents(String(formData.get("principal") ?? ""));
  const annual_interest_rate_percent = Number(
    formData.get("annual_interest_rate_percent"),
  );
  const term_weeks = Number(formData.get("term_weeks"));
  const start_choice = String(formData.get("start_date") ?? "next_friday");
  const notes = String(formData.get("notes") ?? "").trim();
  const farm = String(formData.get("farm") ?? "").trim();
  const approved_by = String(formData.get("approved_by") ?? "").trim();

  if (!company_id) {
    return { error: "Company is required" };
  }

  const scope = await requireCompanyScope();
  ensureCompanyAccess(scope, company_id);

  const permErr = await assertCreateLoanWithEmployeeMode(formData);
  if (permErr) return permErr;

  if (employee_mode === "new") {
    const full_name = String(formData.get("new_employee_full_name") ?? "").trim();
    const email = String(formData.get("new_employee_email") ?? "").trim();
    const phone = String(formData.get("new_employee_phone") ?? "").trim();
    const id_number = String(formData.get("new_employee_id_number") ?? "").trim();
    if (!full_name) {
      return { error: "New employee full name is required" };
    }
    const created = await prisma.employee.create({
      data: {
        company_id,
        full_name,
        email,
        phone,
        id_number,
      },
      select: { id: true },
    });
    employee_id = created.id;
  } else {
    if (!employee_id || Number.isNaN(employee_id)) {
      return { error: "Employee is required" };
    }
    const emp = await prisma.employee.findUnique({
      where: { id: employee_id },
      select: { company_id: true },
    });
    if (!emp || emp.company_id !== company_id) {
      return { error: "Employee must belong to the selected company" };
    }
  }
  if (principal === null || principal <= 0) {
    return { error: "Valid principal amount is required" };
  }
  if (Number.isNaN(annual_interest_rate_percent) || annual_interest_rate_percent < 0) {
    return { error: "Interest rate must be zero or positive" };
  }
  if (!term_weeks || term_weeks < 1) {
    return { error: "Term must be at least 1 week" };
  }
  if (!farm) {
    return { error: "Farm / workplace is required" };
  }
  if (!approved_by) {
    return { error: "Approved by is required" };
  }

  let startDateISO: string;
  if (start_choice === "custom") {
    const custom = String(formData.get("custom_start_date") ?? "");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(custom)) {
      return { error: "Invalid custom start date" };
    }
    startDateISO = custom;
  } else {
    startDateISO = formatISODate(getNextFriday());
  }

  const loan = await createLoanWithSchedule({
    companyId: company_id,
    employeeId: employee_id,
    principalCents: principal,
    annualInterestRatePercent: annual_interest_rate_percent,
    termWeeks: term_weeks,
    startDateISO,
    notes,
    farm,
    approvedBy: approved_by,
  });

  revalidatePath("/loans");
  revalidatePath("/employees");
  revalidatePath("/");
  revalidatePath("/reports/weekly");
  redirect(`/loans/${loan.id}`);
}

export async function updateLoanAction(
  _prevState: { error?: string } | undefined,
  formData: FormData,
) {
  const loanId = Number(formData.get("loan_id"));
  const company_id = Number(formData.get("company_id"));
  const employee_id = Number(formData.get("employee_id"));
  const notes = String(formData.get("notes") ?? "").trim();
  const farm = String(formData.get("farm") ?? "").trim();
  const approved_by = String(formData.get("approved_by") ?? "").trim();

  if (!loanId || Number.isNaN(loanId)) {
    return { error: "Invalid loan" };
  }
  if (!company_id) {
    return { error: "Company is required" };
  }
  if (!employee_id || Number.isNaN(employee_id)) {
    return { error: "Employee is required" };
  }

  const scope = await requireCompanyScope();
  await ensureLoanAccess(scope, loanId);
  ensureCompanyAccess(scope, company_id);

  const denied = await loanManageDenied();
  if (denied) return denied;

  const existing = await getLoan(loanId);
  if (!existing) {
    return { error: "Loan not found" };
  }

  const locked = !(await canReplaceLoanSchedule(loanId));

  let principalCents: number;
  let annual_interest_rate_percent: number;
  let term_weeks: number;
  let startDateISO: string;

  if (locked) {
    principalCents = existing.principal_cents;
    annual_interest_rate_percent = existing.annual_interest_rate_percent;
    term_weeks = existing.term_weeks;
    startDateISO = existing.start_date;
  } else {
    const principal = parseMoneyToCents(String(formData.get("principal") ?? ""));
    annual_interest_rate_percent = Number(
      formData.get("annual_interest_rate_percent"),
    );
    term_weeks = Number(formData.get("term_weeks"));
    const start_choice = String(formData.get("start_date") ?? "custom");
    if (principal === null || principal <= 0) {
      return { error: "Valid principal amount is required" };
    }
    if (!term_weeks || term_weeks < 1 || Number.isNaN(term_weeks)) {
      return { error: "Term must be at least 1 week" };
    }
    if (Number.isNaN(annual_interest_rate_percent) || annual_interest_rate_percent < 0) {
      return { error: "Interest rate must be zero or positive" };
    }
    principalCents = principal;
    if (start_choice === "custom") {
      const custom = String(formData.get("custom_start_date") ?? "");
      if (!/^\d{4}-\d{2}-\d{2}$/.test(custom)) {
        return { error: "Invalid custom start date" };
      }
      startDateISO = custom;
    } else {
      startDateISO = formatISODate(getNextFriday());
    }
  }

  const result = await updateLoan({
    loanId,
    companyId: company_id,
    employeeId: employee_id,
    principalCents,
    annualInterestRatePercent: annual_interest_rate_percent,
    termWeeks: term_weeks,
    startDateISO,
    farm,
    approvedBy: approved_by,
    notes,
  });

  if (!result.ok) {
    return { error: result.error };
  }

  revalidatePath(`/loans/${loanId}`);
  revalidatePath("/loans");
  revalidatePath("/employees");
  revalidatePath("/");
  revalidatePath("/reports/weekly");
  redirect(`/loans/${loanId}`);
}

export async function payInstallmentFormAction(
  _prev: { error?: string } | undefined,
  formData: FormData,
) {
  const loanId = Number(formData.get("loanId"));
  const installmentId = Number(formData.get("installmentId"));
  const raw = String(formData.get("amount") ?? "");
  const cents = parseMoneyToCents(raw);
  if (!loanId || !installmentId) {
    return { error: "Invalid request" };
  }
  if (cents === null || cents <= 0) {
    return { error: "Enter a valid payment amount" };
  }
  const scope = await requireCompanyScope();
  await ensureLoanAccess(scope, loanId);
  const denied = await loanManageDenied();
  if (denied) return denied;
  const result = await payInstallment(loanId, installmentId, cents);
  if (!result.ok) return { error: result.error };
  revalidatePath(`/loans/${loanId}`);
  revalidatePath("/");
  revalidatePath("/reports/weekly");
  return {};
}

export async function skipInstallmentFormAction(
  _prev: { error?: string } | undefined,
  formData: FormData,
) {
  const loanId = Number(formData.get("loanId"));
  const installmentId = Number(formData.get("installmentId"));
  if (!loanId || !installmentId) {
    return { error: "Invalid request" };
  }
  const scope = await requireCompanyScope();
  await ensureLoanAccess(scope, loanId);
  const denied = await loanManageDenied();
  if (denied) return denied;
  const result = await skipInstallment(loanId, installmentId);
  if (!result.ok) return { error: result.error };
  revalidatePath(`/loans/${loanId}`);
  revalidatePath("/");
  revalidatePath("/reports/weekly");
  return {};
}

export async function deleteLoanAction(loanId: number) {
  if (!loanId || Number.isNaN(loanId)) {
    redirect("/loans");
  }
  const scope = await requireCompanyScope();
  await ensureLoanAccess(scope, loanId);
  const denied = await loanManageDenied();
  if (denied) redirect("/loans");
  const exists = await prisma.loan.findUnique({
    where: { id: loanId },
    select: { id: true },
  });
  if (!exists) {
    redirect("/loans");
  }
  await prisma.loan.delete({ where: { id: loanId } });
  revalidatePath("/loans");
  revalidatePath("/");
  revalidatePath("/reports/weekly");
  redirect("/loans");
}
