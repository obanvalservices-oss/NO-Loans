import { prisma } from "@/lib/prisma";

export type UserPermissions = {
  canManageLoans: boolean;
  canManageEmployees: boolean;
  canEditCompanies: boolean;
  canViewWeeklyReport: boolean;
  canPrintContracts: boolean;
};

function allGranted(): UserPermissions {
  return {
    canManageLoans: true,
    canManageEmployees: true,
    canEditCompanies: true,
    canViewWeeklyReport: true,
    canPrintContracts: true,
  };
}

export async function getUserPermissions(
  userId: number,
): Promise<UserPermissions> {
  const row = await prisma.userPermission.findUnique({
    where: { user_id: userId },
  });
  if (!row) return allGranted();
  return {
    canManageLoans: row.can_manage_loans,
    canManageEmployees: row.can_manage_employees,
    canEditCompanies: row.can_edit_companies,
    canViewWeeklyReport: row.can_view_weekly_report,
    canPrintContracts: row.can_print_contracts,
  };
}
