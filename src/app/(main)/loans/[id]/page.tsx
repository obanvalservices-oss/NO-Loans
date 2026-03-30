import { Badge, loanStatusVariant } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { DataTableShell, Table, Td, Th } from "@/components/ui/data-table";
import { getEffectiveNavFlags, getPermissionsForSession } from "@/lib/app-policies";
import { getLoanDetail } from "@/lib/loan-queries";
import { listInstallments } from "@/lib/loan-service";
import { requireCompanyScope, requireSession } from "@/lib/require-auth";
import { getSystemSettings } from "@/lib/system-settings";
import { centsToDisplay } from "@/lib/money";
import { ExternalLink, FileText, Pencil } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PayInstallmentForm, SkipInstallmentForm } from "./InstallmentForms";
import { DeleteLoanButton } from "./DeleteLoanButton";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

function statusLabel(status: string) {
  switch (status) {
    case "paid":
      return "Paid";
    case "partial":
      return "Partial";
    case "skipped":
      return "Skipped";
    default:
      return "Pending";
  }
}

function installmentBadge(
  status: string,
): "success" | "warning" | "muted" | "default" {
  switch (status) {
    case "paid":
      return "success";
    case "partial":
      return "warning";
    case "skipped":
      return "muted";
    default:
      return "default";
  }
}

export default async function LoanDetailPage({ params }: Props) {
  const { id: raw } = await params;
  const id = Number(raw);
  if (Number.isNaN(id)) notFound();

  const session = await requireSession();
  const perms = await getPermissionsForSession(session);
  const system = await getSystemSettings();
  const nav = await getEffectiveNavFlags(session, system);
  const canManageLoans = perms.canManageLoans;
  const showContract = nav.showContractActions;

  const scope = await requireCompanyScope();
  const detail = await getLoanDetail(id, scope);
  if (!detail) notFound();

  const installments = await listInstallments(id);
  let remainingTotal = 0;
  for (const i of installments) {
    if (i.status === "skipped") continue;
    const left = i.amount_due_cents - i.amount_paid_cents;
    if (left > 0) remainingTotal += left;
  }

  const { loan, company, employee } = detail;

  return (
    <div className="space-y-10">
      <PageHeader
        title={`Loan #${loan.id}`}
        description={`${employee.full_name} · ${company.name}`}
        actions={
          <div className="no-print flex flex-wrap gap-2">
            <Link
              href="/loans"
              className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-brand-950/50 px-4 py-2.5 text-sm font-medium text-zinc-200 shadow-sm transition-all duration-200 hover:border-brand-400/35 hover:bg-brand-900/50"
            >
              All loans
            </Link>
            <ButtonLink
              href={`/loans/${loan.id}/edit`}
              variant="secondary"
              className="gap-2"
            >
              <Pencil className="h-4 w-4" />
              Edit loan
            </ButtonLink>
            <ButtonLink
              href={`/loans/${loan.id}/contract`}
              target="_blank"
              rel="noopener noreferrer"
              variant="dark"
              className="gap-2"
            >
              <FileText className="h-4 w-4" />
              View / print contract
              <ExternalLink className="h-3.5 w-3.5 opacity-80" />
            </ButtonLink>
          </div>
        }
      />

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
          <CardTitle>Summary</CardTitle>
          <Badge variant={loanStatusVariant(loan.status)} className="capitalize">
            {loan.status}
          </Badge>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-xl bg-brand-950/50 p-4 ring-1 ring-brand-400/20">
              <dt className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Remaining balance
              </dt>
              <dd className="mt-1 text-xl font-bold tabular-nums text-zinc-50">
                {centsToDisplay(remainingTotal)}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Company owner (lender)
              </dt>
              <dd className="mt-1 text-zinc-50">
                {company.owner_name || "—"}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Farm / workplace
              </dt>
              <dd className="mt-1 text-zinc-50">{loan.farm || "—"}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Approved by
              </dt>
              <dd className="mt-1 text-zinc-50">{loan.approved_by || "—"}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Principal
              </dt>
              <dd className="mt-1 tabular-nums text-zinc-50">
                {centsToDisplay(loan.principal_cents)}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Total owed (w/ interest)
              </dt>
              <dd className="mt-1 tabular-nums text-zinc-50">
                {centsToDisplay(loan.total_owed_cents)}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Annual interest
              </dt>
              <dd className="mt-1">{loan.annual_interest_rate_percent}%</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Term (initial)
              </dt>
              <dd className="mt-1">{loan.term_weeks} weeks</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                First due
              </dt>
              <dd className="mt-1">{loan.start_date}</dd>
            </div>
            <div className="sm:col-span-2 lg:col-span-3">
              <dt className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Typical weekly payment
              </dt>
              <dd className="mt-1 tabular-nums font-medium text-zinc-50">
                {centsToDisplay(loan.weekly_payment_cents)}
              </dd>
            </div>
          </dl>
          {loan.notes ? (
            <p className="mt-6 rounded-xl border border-white/10 bg-brand-950/40 px-4 py-3 text-sm text-zinc-300">
              <span className="font-semibold text-zinc-50">Notes:</span>{" "}
              {loan.notes}
            </p>
          ) : null}
        </CardContent>
      </Card>

      <section>
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-zinc-50">Weekly schedule</h2>
          <p className="mt-1 text-sm text-zinc-400">
            Record partial or full payments. Skipping defers that week to the end of
            the schedule.
          </p>
        </div>
        <DataTableShell>
          <Table>
            <thead>
              <tr>
                <Th>#</Th>
                <Th>Due</Th>
                <Th className="text-right">Due amount</Th>
                <Th className="text-right">Paid</Th>
                <Th>Status</Th>
                <Th className="no-print min-w-[220px]">
                  {canManageLoans ? "Actions" : "—"}
                </Th>
              </tr>
            </thead>
            <tbody>
              {installments.map((i) => (
                <tr key={i.id} className="group">
                  <Td className="font-mono text-xs text-zinc-500">{i.sequence}</Td>
                  <Td>{i.due_date}</Td>
                  <Td className="text-right tabular-nums">
                    {centsToDisplay(i.amount_due_cents)}
                  </Td>
                  <Td className="text-right tabular-nums">
                    {centsToDisplay(i.amount_paid_cents)}
                  </Td>
                  <Td>
                    <Badge variant={installmentBadge(i.status)}>
                      {statusLabel(i.status)}
                    </Badge>
                  </Td>
                  <Td className="no-print">
                    {canManageLoans ? (
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                        <PayInstallmentForm loanId={loan.id} inst={i} />
                        <SkipInstallmentForm loanId={loan.id} inst={i} />
                      </div>
                    ) : (
                      <span className="text-xs text-zinc-500">View only</span>
                    )}
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </DataTableShell>
      </section>

      {canManageLoans ? (
        <Card className="no-print border-red-500/30 bg-red-950/25 shadow-none">
          <CardHeader>
            <CardTitle className="text-red-200">Danger zone</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-red-200/85">
              Delete this loan if the case is closed or was created by mistake. All
              installments and payment history for this loan will be removed.
            </p>
            <div className="mt-4">
              <DeleteLoanButton loanId={loan.id} />
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
