import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, inputClassName, selectClassName } from "@/components/ui/field";
import { PageHeader } from "@/components/ui/page-header";
import { canAccessCompany } from "@/lib/company-scope";
import { getPermissionsForSession } from "@/lib/app-policies";
import { listCompanyOptions } from "@/lib/loan-queries";
import { prisma } from "@/lib/prisma";
import { requireCompanyScope, requireSession } from "@/lib/require-auth";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { deleteEmployee, updateEmployee } from "../actions";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function EmployeeEditPage({ params }: Props) {
  const { id: raw } = await params;
  const id = Number(raw);
  if (Number.isNaN(id)) notFound();

  const row = await prisma.employee.findUnique({ where: { id } });
  if (!row) notFound();

  const scope = await requireCompanyScope();
  if (!canAccessCompany(scope, row.company_id)) notFound();

  const session = await requireSession();
  const perms = await getPermissionsForSession(session);
  if (session.role !== "admin" && !perms.canManageEmployees) {
    redirect("/employees");
  }

  const companies = await listCompanyOptions(scope);

  const update = updateEmployee.bind(null, id);
  const del = deleteEmployee.bind(null, id);

  return (
    <div className="space-y-10">
      <PageHeader
        title="Edit employee"
        description={row.full_name}
        actions={
          <Link
            href="/employees"
            className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-brand-950/50 px-4 py-2 text-sm font-medium text-zinc-200 shadow-sm transition-all duration-200 hover:border-brand-400/35 hover:bg-brand-900/50"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-5 sm:grid-cols-2" action={update}>
            <Field label="Company" className="sm:col-span-2">
              <select
                name="company_id"
                required
                defaultValue={row.company_id}
                className={selectClassName}
              >
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Full name">
              <input
                name="full_name"
                required
                defaultValue={row.full_name}
                className={inputClassName}
              />
            </Field>
            <Field label="ID / reference">
              <input
                name="id_number"
                defaultValue={row.id_number}
                className={inputClassName}
              />
            </Field>
            <Field label="Email">
              <input
                name="email"
                type="email"
                defaultValue={row.email}
                className={inputClassName}
              />
            </Field>
            <Field label="Phone">
              <input name="phone" defaultValue={row.phone} className={inputClassName} />
            </Field>
            <div className="sm:col-span-2">
              <Button type="submit">Save changes</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="border-red-200/80 bg-white shadow-red-50/50">
        <CardHeader>
          <CardTitle className="text-red-900">Danger zone</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={del}>
            <Button type="submit" variant="danger">
              Delete employee
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
