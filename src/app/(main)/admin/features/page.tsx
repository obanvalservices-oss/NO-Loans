import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, inputClassName } from "@/components/ui/field";
import { PageHeader } from "@/components/ui/page-header";
import { getSystemSettingsRaw, SETTING_KEYS } from "@/lib/system-settings";
import { saveSystemSettingsAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminFeaturesPage() {
  const raw = await getSystemSettingsRaw();

  const branding =
    raw[SETTING_KEYS.BRANDING_SUBTITLE] ?? "Management";
  const helpText =
    raw[SETTING_KEYS.SIDEBAR_HELP_TEXT] ??
    "Loans, schedules, payroll reports & printable contracts.";
  const weekly = (raw[SETTING_KEYS.FEATURE_WEEKLY_REPORT] ?? "1") === "1";
  const contracts = (raw[SETTING_KEYS.FEATURE_CONTRACT_PRINT] ?? "1") === "1";
  const rate = raw[SETTING_KEYS.DEFAULT_INTEREST_RATE_PERCENT] ?? "12";

  return (
    <div className="space-y-10">
      <PageHeader
        title="Features & branding"
        description="Turn features on or off for everyone, and tune labels shown in the sidebar. User-level permissions can further restrict access."
      />

      <Card>
        <CardHeader>
          <CardTitle>Branding & defaults</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={saveSystemSettingsAction} className="space-y-6">
            <Field label="Sidebar subtitle (under NO Loan)">
              <input
                name="branding_subtitle"
                defaultValue={branding}
                className={inputClassName}
                placeholder="e.g. Management"
              />
            </Field>
            <Field label="Sidebar footer help text">
              <textarea
                name="sidebar_help_text"
                rows={3}
                defaultValue={helpText}
                className={`${inputClassName} min-h-[88px] resize-y`}
              />
            </Field>
            <Field label="Default annual interest rate (%) for new loans">
              <input
                name="default_interest_rate_percent"
                type="number"
                step="0.01"
                min="0"
                defaultValue={rate}
                className={inputClassName}
              />
            </Field>

            <div className="space-y-3 rounded-xl border border-white/10 bg-brand-950/40 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Global features
              </p>
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  name="feature_weekly_report"
                  defaultChecked={weekly}
                  className="mt-1 h-4 w-4 rounded border-white/20 bg-brand-950"
                />
                <span>
                  <span className="font-medium text-zinc-200">
                    Weekly payroll report
                  </span>
                  <span className="mt-0.5 block text-sm text-zinc-500">
                    When off, the report is hidden and routes are blocked for
                    everyone (unless you re-enable it).
                  </span>
                </span>
              </label>
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  name="feature_contract_print"
                  defaultChecked={contracts}
                  className="mt-1 h-4 w-4 rounded border-white/20 bg-brand-950"
                />
                <span>
                  <span className="font-medium text-zinc-200">
                    Printable loan contracts
                  </span>
                  <span className="mt-0.5 block text-sm text-zinc-500">
                    When off, contract links and the print view are disabled.
                  </span>
                </span>
              </label>
            </div>

            <Button type="submit">Save settings</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
