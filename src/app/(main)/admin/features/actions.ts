"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { logServerException } from "@/lib/logger";
import { requireAdmin } from "@/lib/require-auth";
import { SETTING_KEYS } from "@/lib/system-settings";

/** Plain `<form action>` passes only `FormData` (not the useActionState pair). */
export async function saveSystemSettingsAction(
  formData: FormData,
): Promise<void> {
  await requireAdmin();
  const branding = String(formData.get("branding_subtitle") ?? "").trim();
  const helpText = String(formData.get("sidebar_help_text") ?? "").trim();
  const rateRaw = String(formData.get("default_interest_rate_percent") ?? "");
  const rate = Number(rateRaw);
  const weekly = formData.get("feature_weekly_report") === "on" ? "1" : "0";
  const contracts = formData.get("feature_contract_print") === "on" ? "1" : "0";

  try {
    const upserts = [
      {
        key: SETTING_KEYS.BRANDING_SUBTITLE,
        value: branding || "Management",
      },
      {
        key: SETTING_KEYS.SIDEBAR_HELP_TEXT,
        value:
          helpText ||
          "Loans, schedules, payroll reports & printable contracts.",
      },
      { key: SETTING_KEYS.FEATURE_WEEKLY_REPORT, value: weekly },
      { key: SETTING_KEYS.FEATURE_CONTRACT_PRINT, value: contracts },
      {
        key: SETTING_KEYS.DEFAULT_INTEREST_RATE_PERCENT,
        value: Number.isFinite(rate) && rate >= 0 ? String(rate) : "12",
      },
    ];
    for (const { key, value } of upserts) {
      await prisma.systemSetting.upsert({
        where: { key },
        create: { key, value },
        update: { value },
      });
    }
  } catch (e) {
    logServerException("saveSystemSettingsAction", e);
    throw new Error("Could not save settings. Check server logs.");
  }

  revalidatePath("/", "layout");
  revalidatePath("/admin/features");
}
