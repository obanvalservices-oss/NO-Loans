import type { CompanyScope } from "@/lib/company-scope";
import {
  canAccessCompany,
  companiesWhere,
  employeesWhere,
} from "@/lib/company-scope";
import type { CompanyRow, EmployeeRow, LoanRow } from "@/lib/db";
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

export type LoanListRow = {
  id: number;
  status: string;
  principal_cents: number;
  total_owed_cents: number;
  company_name: string;
  employee_name: string;
  start_date: string;
  farm: string;
  approved_by: string;
};

export async function listCompanyOptions(
  scope: CompanyScope,
): Promise<{ id: number; name: string }[]> {
  return prisma.company.findMany({
    where: companiesWhere(scope),
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });
}

export async function listEmployeesForForms(
  scope: CompanyScope,
): Promise<{ id: number; full_name: string; company_id: number }[]> {
  return prisma.employee.findMany({
    where: employeesWhere(scope),
    orderBy: { full_name: "asc" },
    select: { id: true, full_name: true, company_id: true },
  });
}

export async function listEmployeesTable(scope: CompanyScope): Promise<{
  id: number;
  full_name: string;
  email: string;
  phone: string;
  company_name: string;
}[]> {
  const rows = await prisma.employee.findMany({
    where: employeesWhere(scope),
    orderBy: [{ company: { name: "asc" } }, { full_name: "asc" }],
    include: { company: { select: { name: true } } },
  });
  return rows.map((e) => ({
    id: e.id,
    full_name: e.full_name,
    email: e.email,
    phone: e.phone,
    company_name: e.company.name,
  }));
}

export async function listCompaniesDetailed(scope: CompanyScope): Promise<{
  id: number;
  name: string;
  address_line: string;
  phone: string;
  owner_name: string;
}[]> {
  return prisma.company.findMany({
    where: companiesWhere(scope),
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      address_line: true,
      phone: true,
      owner_name: true,
    },
  });
}

export async function listLoansForCompany(
  companyId: number,
  scope: CompanyScope,
): Promise<LoanListRow[]> {
  if (!canAccessCompany(scope, companyId)) return [];
  const rows = await prisma.loan.findMany({
    where: { company_id: companyId },
    orderBy: { id: "desc" },
    include: {
      company: { select: { name: true } },
      employee: { select: { full_name: true } },
    },
  });
  return rows.map((l) => ({
    id: l.id,
    status: l.status,
    principal_cents: l.principal_cents,
    total_owed_cents: l.total_owed_cents,
    start_date: l.start_date,
    farm: l.farm,
    approved_by: l.approved_by,
    company_name: l.company.name,
    employee_name: l.employee.full_name,
  }));
}

export type LoanDetail = {
  loan: LoanRow;
  company: CompanyRow;
  employee: EmployeeRow;
};

export async function getLoanDetail(
  loanId: number,
  scope: CompanyScope,
): Promise<LoanDetail | undefined> {
  const row = await prisma.loan.findFirst({
    where: { id: loanId },
    include: {
      company: true,
      employee: true,
    },
  });
  if (!row) return undefined;
  if (!canAccessCompany(scope, row.company_id)) return undefined;

  return {
    loan: loanToRow(row),
    company: {
      id: row.company.id,
      name: row.company.name,
      address_line: row.company.address_line,
      phone: row.company.phone,
      header_note: row.company.header_note,
      owner_name: row.company.owner_name,
    },
    employee: {
      id: row.employee.id,
      company_id: row.employee.company_id,
      full_name: row.employee.full_name,
      email: row.employee.email,
      phone: row.employee.phone,
      id_number: row.employee.id_number,
    },
  };
}
