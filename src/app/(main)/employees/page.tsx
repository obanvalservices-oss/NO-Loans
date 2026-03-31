import { Button, ButtonLink } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, inputClassName, selectClassName } from "@/components/ui/field";
import { PageHeader } from "@/components/ui/page-header";
import { DataTableShell, Table, Td, Th } from "@/components/ui/data-table";
import { centsToDisplay } from "@/lib/money";
import { listCompanyOptions, listEmployeesLoanSummary } from "@/lib/loan-queries";
import { getPermissionsForSession } from "@/lib/app-policies";
import { requireCompanyScope, requireSession } from "@/lib/require-auth";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { createEmployee } from "./actions";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ q?: string; add?: string }>;
};

export default async function EmployeesPage({ searchParams }: Props) {
  const session = await requireSession();
  const perms = await getPermissionsForSession(session);
  const canManageEmployees = perms.canManageEmployees;

  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  const showAddForm = sp.add === "1";
  const scope = await requireCompanyScope();
  const companies = await listCompanyOptions(scope);
  const employees = await listEmployeesLoanSummary(scope, q);
  const activeCount = employees.filter((e) => e.status === "active").length;
  const inactiveCount = employees.length - activeCount;
  const totalBorrowed = employees.reduce(
    (s, e) => s + e.total_borrowed_cents,
    0,
  );
  const totalPaid = employees.reduce((s, e) => s + e.total_paid_cents, 0);
  const totalRemaining = employees.reduce(
    (s, e) => s + e.remaining_balance_cents,
    0,
  );
  const loanRows = employees.flatMap((e) =>
    e.loan_history.map((loan) => ({
      employee_id: e.id,
      employee_name: e.full_name,
      company_name: e.company_name,
      loan_id: loan.loan_id,
      start_date: loan.start_date,
      loan_status: loan.status,
      principal_cents: loan.principal_cents,
      remaining_cents: loan.remaining_cents,
    })),
  );
  const addHref = q
    ? `/employees?q=${encodeURIComponent(q)}&add=${showAddForm ? "0" : "1"}`
    : `/employees?add=${showAddForm ? "0" : "1"}`;

  return (
    <div className="space-y-10">
      <PageHeader
        title="Employees"
        description="Search employees and review their loan summary in one place."
      />

      {canManageEmployees ? (
        <>
          <ButtonLink href={addHref} className="w-auto justify-start px-4 py-2 text-sm">
            {showAddForm ? "Hide add employee form" : "Add employee"}
          </ButtonLink>
          {showAddForm ? (
            <Card>
              <CardContent>
                <form className="grid gap-5 sm:grid-cols-2" action={createEmployee}>
                  <Field label="Company" className="sm:col-span-2">
                    <select name="company_id" required className={selectClassName}>
                      <option value="">Select…</option>
                      {companies.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Full name">
                    <input name="full_name" required className={inputClassName} />
                  </Field>
                  <Field label="ID / reference (optional)">
                    <input name="id_number" className={inputClassName} />
                  </Field>
                  <Field label="Email">
                    <input name="email" type="email" className={inputClassName} />
                  </Field>
                  <Field label="Phone">
                    <input name="phone" type="tel" className={inputClassName} />
                  </Field>
                  <div className="sm:col-span-2">
                    <Button type="submit">Save employee</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          ) : null}
        </>
      ) : null}

      <section>
        <Card>
          <CardHeader>
            <CardTitle>Employee summary</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
              <input
                name="q"
                defaultValue={q}
                placeholder="Search employee by name..."
                className={inputClassName}
              />
              <Button type="submit">Search</Button>
              <ButtonLink href="/employees" variant="ghost">
                Clear
              </ButtonLink>
            </form>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <MetricCard label="Employees" value={String(employees.length)} />
              <MetricCard label="Active" value={String(activeCount)} />
              <MetricCard label="Inactive" value={String(inactiveCount)} />
              <MetricCard label="Total borrowed" value={centsToDisplay(totalBorrowed)} />
              <MetricCard label="Total paid" value={centsToDisplay(totalPaid)} />
            </div>
            <div className="mt-3">
              <MetricCard label="Remaining balance" value={centsToDisplay(totalRemaining)} />
            </div>
          </CardContent>
        </Card>

        <h2 className="mb-4 mt-8 text-sm font-semibold uppercase tracking-wider text-zinc-500">
          Employee loan list
        </h2>
        <DataTableShell>
          <Table>
            <thead>
              <tr>
                <Th>Name</Th>
                <Th>Company</Th>
                <Th>Loans</Th>
                <Th>Total borrowed</Th>
                <Th>Total paid</Th>
                <Th>Remaining</Th>
                <Th>Loan</Th>
                <Th>Start date</Th>
                <Th>Loan status</Th>
                <Th className="w-28 text-right" />
              </tr>
            </thead>
            <tbody>
              {loanRows.length === 0 ? (
                <tr className="group">
                  <Td colSpan={10} className="py-12 text-center text-zinc-500">
                    No loans found for this search.
                  </Td>
                </tr>
              ) : (
                loanRows.map((row) => (
                  <tr key={`${row.employee_id}-${row.loan_id}`} className="group">
                    <Td className="font-medium text-zinc-50">{row.employee_name}</Td>
                    <Td>{row.company_name}</Td>
                    <Td className="text-zinc-400">1</Td>
                    <Td>{centsToDisplay(row.principal_cents)}</Td>
                    <Td className="text-zinc-400">—</Td>
                    <Td>{centsToDisplay(row.remaining_cents)}</Td>
                    <Td className="font-medium text-zinc-200">#{row.loan_id}</Td>
                    <Td>{row.start_date}</Td>
                    <Td>
                      <Badge
                        variant={
                          row.loan_status === "active"
                            ? "success"
                            : row.loan_status === "completed"
                              ? "muted"
                              : "default"
                        }
                      >
                        {row.loan_status}
                      </Badge>
                    </Td>
                    <Td className="text-right">
                      {canManageEmployees ? (
                        <Link
                          href={`/employees/${row.employee_id}`}
                          className="inline-flex items-center gap-1 text-sm font-medium text-brand-400 transition-colors hover:text-brand-300"
                        >
                          Edit
                          <ChevronRight className="h-4 w-4 opacity-70 transition-transform duration-200 group-hover:translate-x-0.5" />
                        </Link>
                      ) : (
                        <span className="text-xs text-zinc-500">View only</span>
                      )}
                    </Td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        </DataTableShell>
      </section>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-brand-950/30 px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
        {label}
      </p>
      <p className="mt-1 text-lg font-semibold text-zinc-100">{value}</p>
    </div>
  );
}
