import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, inputClassName, selectClassName } from "@/components/ui/field";
import { PageHeader } from "@/components/ui/page-header";
import { DataTableShell, Table, Td, Th } from "@/components/ui/data-table";
import { listCompanyOptions, listEmployeesTable } from "@/lib/loan-queries";
import { getPermissionsForSession } from "@/lib/app-policies";
import { requireCompanyScope, requireSession } from "@/lib/require-auth";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { createEmployee } from "./actions";

export const dynamic = "force-dynamic";

export default async function EmployeesPage() {
  const session = await requireSession();
  const perms = await getPermissionsForSession(session);
  const canManageEmployees = perms.canManageEmployees;

  const scope = await requireCompanyScope();
  const companies = await listCompanyOptions(scope);
  const employees = await listEmployeesTable(scope);

  return (
    <div className="space-y-10">
      <PageHeader
        title="Employees"
        description="Borrowers belong to a company and can be assigned to loans."
      />

      {canManageEmployees ? (
      <Card>
        <CardHeader>
          <CardTitle>Add employee</CardTitle>
        </CardHeader>
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

      <section>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-500">
          All employees
        </h2>
        <DataTableShell>
          <Table>
            <thead>
              <tr>
                <Th>Name</Th>
                <Th>Company</Th>
                <Th>Contact</Th>
                <Th className="w-28 text-right" />
              </tr>
            </thead>
            <tbody>
              {employees.length === 0 ? (
                <tr className="group">
                  <Td colSpan={4} className="py-12 text-center text-zinc-500">
                    No employees yet. Add a company first.
                  </Td>
                </tr>
              ) : (
                employees.map((e) => (
                  <tr key={e.id} className="group">
                    <Td className="font-medium text-zinc-50">{e.full_name}</Td>
                    <Td>{e.company_name}</Td>
                    <Td className="text-zinc-400">
                      {[e.email, e.phone].filter(Boolean).join(" · ") || "—"}
                    </Td>
                    <Td className="text-right">
                      {canManageEmployees ? (
                        <Link
                          href={`/employees/${e.id}`}
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
