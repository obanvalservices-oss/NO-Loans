import { redirect } from "next/navigation";
import type { CompanyScope } from "@/lib/company-scope";
import { canAccessCompany, canAccessLoan } from "@/lib/company-scope";

export function ensureCompanyAccess(
  scope: CompanyScope,
  companyId: number,
): void {
  if (!canAccessCompany(scope, companyId)) redirect("/");
}

export async function ensureLoanAccess(
  scope: CompanyScope,
  loanId: number,
): Promise<void> {
  if (!(await canAccessLoan(scope, loanId))) redirect("/loans");
}
