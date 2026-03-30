import { redirect } from "next/navigation";
import { getEffectiveNavFlags } from "@/lib/app-policies";
import { getSession } from "@/lib/session";
import { getSystemSettings } from "@/lib/system-settings";

export async function ensureWeeklyReportAccessible(): Promise<void> {
  const session = await getSession();
  if (!session) redirect("/login");
  const system = await getSystemSettings();
  const flags = await getEffectiveNavFlags(session, system);
  if (!flags.showWeeklyReport) redirect("/");
}

export async function ensureContractPrintAccessible(): Promise<void> {
  const session = await getSession();
  if (!session) redirect("/login");
  const system = await getSystemSettings();
  const flags = await getEffectiveNavFlags(session, system);
  if (!flags.showContractActions) redirect("/loans");
}
