import { prisma } from "@/lib/prisma";

export const SETTING_KEYS = {
  BRANDING_SUBTITLE: "branding_subtitle",
  SIDEBAR_HELP_TEXT: "sidebar_help_text",
  FEATURE_WEEKLY_REPORT: "feature_weekly_report",
  FEATURE_CONTRACT_PRINT: "feature_contract_print",
  DEFAULT_INTEREST_RATE_PERCENT: "default_interest_rate_percent",
} as const;

const DEFAULTS: Record<string, string> = {
  [SETTING_KEYS.BRANDING_SUBTITLE]: "Management",
  [SETTING_KEYS.SIDEBAR_HELP_TEXT]:
    "Loans, schedules, payroll reports & printable contracts.",
  [SETTING_KEYS.FEATURE_WEEKLY_REPORT]: "1",
  [SETTING_KEYS.FEATURE_CONTRACT_PRINT]: "1",
  [SETTING_KEYS.DEFAULT_INTEREST_RATE_PERCENT]: "12",
};

export type SystemSettingsParsed = {
  brandingSubtitle: string;
  sidebarHelpText: string;
  featureWeeklyReport: boolean;
  featureContractPrint: boolean;
  defaultInterestRatePercent: number;
};

export async function getSystemSettingsRaw(): Promise<Record<string, string>> {
  const rows = await prisma.systemSetting.findMany({
    select: { key: true, value: true },
  });
  const map: Record<string, string> = { ...DEFAULTS };
  for (const r of rows) {
    map[r.key] = r.value;
  }
  return map;
}

export async function getSystemSettings(): Promise<SystemSettingsParsed> {
  const raw = await getSystemSettingsRaw();
  const rate = Number(raw[SETTING_KEYS.DEFAULT_INTEREST_RATE_PERCENT]);
  return {
    brandingSubtitle:
      raw[SETTING_KEYS.BRANDING_SUBTITLE] ??
      DEFAULTS[SETTING_KEYS.BRANDING_SUBTITLE],
    sidebarHelpText:
      raw[SETTING_KEYS.SIDEBAR_HELP_TEXT] ??
      DEFAULTS[SETTING_KEYS.SIDEBAR_HELP_TEXT],
    featureWeeklyReport: (raw[SETTING_KEYS.FEATURE_WEEKLY_REPORT] ?? "1") === "1",
    featureContractPrint: (raw[SETTING_KEYS.FEATURE_CONTRACT_PRINT] ?? "1") === "1",
    defaultInterestRatePercent: Number.isFinite(rate) ? rate : 12,
  };
}
