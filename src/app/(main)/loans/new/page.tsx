import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { getApproverNamesByCompany, getFarmNamesByCompany } from "@/lib/company-catalog";
import {
  listCompanyOptions,
  listEmployeesForForms,
} from "@/lib/loan-queries";
import { getPermissionsForSession } from "@/lib/app-policies";
import { requireCompanyScope, requireSession } from "@/lib/require-auth";
import { getSystemSettings } from "@/lib/system-settings";
import { formatISODate, getNextFriday } from "@/lib/dates";
import { computeLoanTotals } from "@/lib/loan-calculator";
import { centsToDisplay } from "@/lib/money";
import { ArrowLeft, Lightbulb } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { NewLoanForm } from "./NewLoanForm";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ company_id?: string }> };

export default async function NewLoanPage({ searchParams }: Props) {
  const sp = await searchParams;
  let initialCompanyId: number | undefined;
  if (sp.company_id && /^\d+$/.test(sp.company_id)) {
    const n = Number(sp.company_id);
    initialCompanyId = Number.isInteger(n) ? n : undefined;
  }
  const session = await requireSession();
  const perms = await getPermissionsForSession(session);
  if (session.role !== "admin" && !perms.canManageLoans) {
    redirect("/loans");
  }

  const scope = await requireCompanyScope();
  const companies = await listCompanyOptions(scope);
  if (companies.length === 0) redirect("/loans");

  const system = await getSystemSettings();

  const validInitial =
    initialCompanyId != null &&
    companies.some((c) => c.id === initialCompanyId);
  const backCompanyQuery =
    validInitial && initialCompanyId != null
      ? `?company=${initialCompanyId}`
      : "";

  const employees = await listEmployeesForForms(scope);

  const nextFriday = getNextFriday();
  const nextFridayLabel = formatISODate(nextFriday);

  const farmNamesByCompany = await getFarmNamesByCompany(scope);
  const approverNamesByCompany = await getApproverNamesByCompany(scope);

  const example = computeLoanTotals(5000_00, 12, 52);
  const exampleWeekly = centsToDisplay(
    Math.floor(example.totalOwedCents / 52),
  );

  return (
    <div className="space-y-10">
      <PageHeader
        title="New loan"
        description="Weekly installments use simple interest: total = principal × (1 + annual rate × weeks/52). Payments split evenly; rounding remainder on the last week."
        actions={
          <Link
            href={`/loans${backCompanyQuery}`}
            className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-brand-950/50 px-4 py-2 text-sm font-medium text-zinc-200 shadow-sm transition-all duration-200 hover:border-brand-400/30 hover:bg-brand-900/50"
          >
            <ArrowLeft className="h-4 w-4" />
            Loans
          </Link>
        }
      />

      <div className="flex gap-3 rounded-2xl border border-brand-500/25 bg-gradient-to-r from-brand-900/50 to-brand-800/30 px-4 py-4 text-sm text-brand-100 shadow-sm shadow-black/20">
        <Lightbulb className="mt-0.5 h-5 w-5 shrink-0 text-brand-400" />
        <p>
          <span className="font-semibold">Example:</span> $5,000 principal, 12%
          annual, 52 weeks → total owed {centsToDisplay(example.totalOwedCents)}{" "}
          (about {exampleWeekly} / week before rounding).
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Loan details</CardTitle>
        </CardHeader>
        <CardContent>
          <NewLoanForm
            companies={companies}
            employees={employees}
            nextFridayLabel={nextFridayLabel}
            initialCompanyId={validInitial ? initialCompanyId : undefined}
            farmNamesByCompany={farmNamesByCompany}
            approverNamesByCompany={approverNamesByCompany}
            defaultInterestRatePercent={system.defaultInterestRatePercent}
          />
        </CardContent>
      </Card>
    </div>
  );
}
