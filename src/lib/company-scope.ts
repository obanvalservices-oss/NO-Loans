import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export type CompanyScope =
  | { role: "admin"; companyIds: null }
  | { role: "user"; userId: number; companyIds: number[] };

export function canAccessCompany(
  scope: CompanyScope,
  companyId: number,
): boolean {
  if (scope.role === "admin") return true;
  return scope.companyIds.includes(companyId);
}

/** Prisma `where` for `companies` rows visible to the session. */
export function companiesWhere(scope: CompanyScope): Prisma.CompanyWhereInput {
  if (scope.role === "admin") return {};
  if (!scope.companyIds.length) return { id: { in: [] } };
  return { id: { in: scope.companyIds } };
}

/** Prisma `where` for `employees` rows visible to the session. */
export function employeesWhere(scope: CompanyScope): Prisma.EmployeeWhereInput {
  if (scope.role === "admin") return {};
  if (!scope.companyIds.length) return { company_id: { in: [] } };
  return { company_id: { in: scope.companyIds } };
}

/** Prisma `where` for `loans` rows visible to the session. */
export function loansWhere(scope: CompanyScope): Prisma.LoanWhereInput {
  if (scope.role === "admin") return {};
  if (!scope.companyIds.length) return { company_id: { in: [] } };
  return { company_id: { in: scope.companyIds } };
}

export function assertCompanyAccess(
  scope: CompanyScope,
  companyId: number,
): boolean {
  return canAccessCompany(scope, companyId);
}

/** Returns true if loan exists and belongs to an allowed company. */
export async function canAccessLoan(
  scope: CompanyScope,
  loanId: number,
): Promise<boolean> {
  const loan = await prisma.loan.findUnique({
    where: { id: loanId },
    select: { company_id: true },
  });
  if (!loan) return false;
  return canAccessCompany(scope, loan.company_id);
}
