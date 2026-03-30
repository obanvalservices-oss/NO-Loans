import { Badge, loanStatusVariant } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { DataTableShell, Table, Td, Th } from "@/components/ui/data-table";
import {
  listCompanyOptions,
  listLoansForCompany,
} from "@/lib/loan-queries";
import { getEffectiveNavFlags, getPermissionsForSession } from "@/lib/app-policies";
import { centsToDisplay } from "@/lib/money";
import { requireCompanyScope, requireSession } from "@/lib/require-auth";
import { getSystemSettings } from "@/lib/system-settings";
import { ExternalLink, Pencil, Plus } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LoansCompanyFilter } from "./LoansCompanyFilter";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ company?: string }>;
};

export default async function LoansPage({ searchParams }: Props) {
  const sp = await searchParams;
  const session = await requireSession();
  const perms = await getPermissionsForSession(session);
  const system = await getSystemSettings();
  const nav = await getEffectiveNavFlags(session, system);
  const canManageLoans = perms.canManageLoans;
  const showContract = nav.showContractActions;

  const scope = await requireCompanyScope();
  const companies = await listCompanyOptions(scope);

  if (companies.length === 0) {
    return (
      <div className="space-y-10">
        <PageHeader
          title="Loans"
          description="You need at least one company you can access before creating loans."
        />
        <p className="text-sm text-zinc-400">
          Ask an administrator to grant company access, or{" "}
          <Link
            href="/companies"
            className="font-medium text-brand-400 underline decoration-brand-500/50 underline-offset-2 hover:text-brand-300"
          >
            open Companies
          </Link>
          .
        </p>
      </div>
    );
  }

  const raw = sp.company;
  const parsed = raw != null ? Number(raw) : NaN;
  const valid =
    Number.isInteger(parsed) && companies.some((c) => c.id === parsed);

  if (!valid) {
    redirect(`/loans?company=${companies[0].id}`);
  }

  const companyId = parsed;
  const loans = await listLoansForCompany(companyId, scope);
  const companyName =
    companies.find((c) => c.id === companyId)?.name ?? "Company";

  return (
    <div className="space-y-10">
      <PageHeader
        title="Loans"
        description={`${companyName} — schedules, payments, and printable contracts.`}
        actions={
          canManageLoans ? (
            <ButtonLink
              href={`/loans/new?company_id=${companyId}`}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              New loan
            </ButtonLink>
          ) : null
        }
      />

      <div className="no-print rounded-xl border border-white/10 bg-brand-900/35 px-4 py-4 shadow-lg shadow-black/20">
        <LoansCompanyFilter companies={companies} companyId={companyId} />
      </div>

      <DataTableShell>
        <Table>
          <thead>
            <tr>
              <Th>ID</Th>
              <Th>Borrower</Th>
              <Th>Farm</Th>
              <Th>Approved by</Th>
              <Th className="text-right">Principal</Th>
              <Th className="text-right">Total owed</Th>
              <Th>Start</Th>
              <Th>Status</Th>
              {showContract ? <Th>Contract</Th> : null}
              <Th className="w-24 text-right" />
            </tr>
          </thead>
          <tbody>
            {loans.length === 0 ? (
              <tr className="group">
                <Td
                  colSpan={showContract ? 10 : 9}
                  className="py-14 text-center"
                >
                  <p className="text-zinc-500">
                    No loans for this company yet.
                    {canManageLoans ? (
                      <>
                        {" "}
                        <Link
                          href={`/loans/new?company_id=${companyId}`}
                          className="font-medium text-brand-400 underline decoration-brand-500/50 underline-offset-2 transition-colors hover:text-brand-300"
                        >
                          Create one
                        </Link>
                        .
                      </>
                    ) : null}
                  </p>
                </Td>
              </tr>
            ) : (
              loans.map((l) => (
                <tr key={l.id} className="group">
                  <Td className="font-mono text-xs text-zinc-500">#{l.id}</Td>
                  <Td className="font-medium text-zinc-50">{l.employee_name}</Td>
                  <Td className="max-w-[120px] truncate text-zinc-300" title={l.farm}>
                    {l.farm || "—"}
                  </Td>
                  <Td className="max-w-[120px] truncate text-zinc-300" title={l.approved_by}>
                    {l.approved_by || "—"}
                  </Td>
                  <Td className="text-right tabular-nums">
                    {centsToDisplay(l.principal_cents)}
                  </Td>
                  <Td className="text-right tabular-nums font-medium text-zinc-50">
                    {centsToDisplay(l.total_owed_cents)}
                  </Td>
                  <Td className="text-zinc-400">{l.start_date}</Td>
                  <Td>
                    <Badge variant={loanStatusVariant(l.status)} className="capitalize">
                      {l.status}
                    </Badge>
                  </Td>
                  {showContract ? (
                    <Td>
                      <Link
                        href={`/loans/${l.id}/contract`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm font-medium text-brand-400 transition-colors hover:text-brand-300"
                      >
                        View / print
                        <ExternalLink className="h-3.5 w-3.5 opacity-70" />
                      </Link>
                    </Td>
                  ) : null}
                  <Td className="text-right">
                    <div className="flex flex-wrap items-center justify-end gap-3">
                      {canManageLoans ? (
                        <Link
                          href={`/loans/${l.id}/edit`}
                          className="inline-flex items-center gap-1 text-sm font-medium text-brand-400 transition-colors hover:text-brand-300"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Edit
                        </Link>
                      ) : null}
                      <Link
                        href={`/loans/${l.id}`}
                        className="text-sm font-medium text-zinc-400 transition-colors hover:text-brand-400"
                      >
                        Open →
                      </Link>
                    </div>
                  </Td>
                </tr>
              ))
            )}
          </tbody>
        </Table>
      </DataTableShell>
    </div>
  );
}
