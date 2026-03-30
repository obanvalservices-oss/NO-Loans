import type { SystemSettingsParsed } from "@/lib/system-settings";
import type { SessionPayload } from "@/lib/session";
import type { UserPermissions } from "@/lib/user-permissions";
import { getUserPermissions } from "@/lib/user-permissions";

export type EffectiveNavFlags = {
  showWeeklyReport: boolean;
  showContractActions: boolean;
};

export async function getEffectiveNavFlags(
  session: SessionPayload,
  system: SystemSettingsParsed,
): Promise<EffectiveNavFlags> {
  if (session.role === "admin") {
    return {
      showWeeklyReport: system.featureWeeklyReport,
      showContractActions: system.featureContractPrint,
    };
  }
  const perms = await getUserPermissions(Number(session.sub));
  return {
    showWeeklyReport:
      system.featureWeeklyReport && perms.canViewWeeklyReport,
    showContractActions:
      system.featureContractPrint && perms.canPrintContracts,
  };
}

export async function getPermissionsForSession(
  session: SessionPayload,
): Promise<UserPermissions> {
  if (session.role === "admin") {
    return {
      canManageLoans: true,
      canManageEmployees: true,
      canEditCompanies: true,
      canViewWeeklyReport: true,
      canPrintContracts: true,
    };
  }
  return getUserPermissions(Number(session.sub));
}
