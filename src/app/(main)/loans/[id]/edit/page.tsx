import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { getApproverNamesByCompany, getFarmNamesByCompany } from "@/lib/company-catalog";
import {
  listCompanyOptions,
  listEmployeesForForms,
} from "@/lib/loan-queries";
import { getPermissionsForSession } from "@/lib/app-policies";
import { requireCompanyScope, requireSession } from "@/lib/require-auth";
import { formatISODate, getNextFriday } from "@/lib/dates";
import { canReplaceLoanSchedule } from "@/lib/loan-service";
import { getLoanDetail } from "@/lib/loan-queries";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { EditLoanForm } from "./EditLoanForm";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function EditLoanPage({ params }: Props) {
  const { id: raw } = await params;
  const id = Number(raw);
  if (Number.isNaN(id)) notFound();

  const session = await requireSession();
  const perms = await getPermissionsForSession(session);
  if (session.role !== "admin" && !perms.canManageLoans) {
    redirect(`/loans/${id}`);
  }

  const scope = await requireCompanyScope();
  const detail = await getLoanDetail(id, scope);
  if (!detail) notFound();

  const companies = await listCompanyOptions(scope);
  const employees = await listEmployeesForForms(scope);

  const nextFriday = getNextFriday();
  const nextFridayLabel = formatISODate(nextFriday);
  const scheduleLocked = !(await canReplaceLoanSchedule(id));
  const farmNamesByCompany = await getFarmNamesByCompany(scope);
  const approverNamesByCompany = await getApproverNamesByCompany(scope);

  const { loan } = detail;

  return (
    <div className="space-y-10">
      <PageHeader
        title={`Edit loan #${loan.id}`}
        description="Update borrower details and loan metadata. Principal, interest, and schedule can only be changed before any payments or skips."
        actions={
          <Link
            href={`/loans/${loan.id}`}
            className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-brand-950/50 px-4 py-2 text-sm font-medium text-zinc-200 shadow-sm transition-all duration-200 hover:border-brand-400/30 hover:bg-brand-900/50"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to loan
          </Link>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Loan details</CardTitle>
        </CardHeader>
        <CardContent>
          <EditLoanForm
            loanId={loan.id}
            initialCompanyId={loan.company_id}
            initialEmployeeId={loan.employee_id}
            principalCents={loan.principal_cents}
            annualInterestRatePercent={loan.annual_interest_rate_percent}
            termWeeks={loan.term_weeks}
            startDateISO={loan.start_date}
            farm={loan.farm}
            approvedBy={loan.approved_by}
            notes={loan.notes}
            companies={companies}
            employees={employees}
            scheduleLocked={scheduleLocked}
            nextFridayLabel={nextFridayLabel}
            farmNamesByCompany={farmNamesByCompany}
            approverNamesByCompany={approverNamesByCompany}
          />
        </CardContent>
      </Card>
    </div>
  );
}
