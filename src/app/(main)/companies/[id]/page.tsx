import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, inputClassName } from "@/components/ui/field";
import { PageHeader } from "@/components/ui/page-header";
import {
  listCompanyApprovers,
  listCompanyFarms,
} from "@/lib/company-catalog";
import { canAccessCompany } from "@/lib/company-scope";
import { getPermissionsForSession } from "@/lib/app-policies";
import { prisma } from "@/lib/prisma";
import { requireSessionAndScope } from "@/lib/require-auth";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CompanyCatalogSection } from "./CompanyCatalogSection";
import { deleteCompany, updateCompany } from "../actions";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function CompanyEditPage({ params }: Props) {
  const { id: raw } = await params;
  const id = Number(raw);
  if (Number.isNaN(id)) notFound();

  const row = await prisma.company.findUnique({ where: { id } });
  if (!row) notFound();

  const { session, scope } = await requireSessionAndScope();
  if (!canAccessCompany(scope, id)) notFound();
  const isAdmin = session.role === "admin";
  const perms = await getPermissionsForSession(session);
  const canEditCompany = isAdmin || perms.canEditCompanies;

  const update = updateCompany.bind(null, id);
  const del = deleteCompany.bind(null, id);

  const farms = await listCompanyFarms(id);
  const approvers = await listCompanyApprovers(id);

  return (
    <div className="space-y-10">
      <PageHeader
        title="Edit company"
        description={row.name}
        actions={
          <Link
            href="/companies"
            className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-brand-950/50 px-4 py-2 text-sm font-medium text-zinc-200 shadow-sm transition-all duration-200 hover:border-brand-400/35 hover:bg-brand-900/50"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Company details</CardTitle>
        </CardHeader>
        <CardContent>
          {canEditCompany ? (
          <form className="grid gap-5 sm:grid-cols-2" action={update}>
            <Field label="Name">
              <input name="name" required defaultValue={row.name} className={inputClassName} />
            </Field>
            <Field label="Phone">
              <input
                name="phone"
                type="tel"
                defaultValue={row.phone}
                className={inputClassName}
              />
            </Field>
            <Field label="Address" className="sm:col-span-2">
              <input
                name="address_line"
                defaultValue={row.address_line}
                className={inputClassName}
              />
            </Field>
            <Field label="Header note" className="sm:col-span-2">
              <input
                name="header_note"
                defaultValue={row.header_note}
                className={inputClassName}
              />
            </Field>
            <Field label="Owner (person lending through the company)" className="sm:col-span-2">
              <input
                name="owner_name"
                defaultValue={row.owner_name}
                className={inputClassName}
                placeholder="Full name — appears on the loan contract"
              />
            </Field>
            <div className="sm:col-span-2">
              <Button type="submit">Save changes</Button>
            </div>
          </form>
          ) : (
            <dl className="grid gap-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-xs font-semibold uppercase text-zinc-500">Name</dt>
                <dd className="mt-1 text-zinc-200">{row.name}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase text-zinc-500">Phone</dt>
                <dd className="mt-1 text-zinc-200">{row.phone || "—"}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs font-semibold uppercase text-zinc-500">Address</dt>
                <dd className="mt-1 text-zinc-200">{row.address_line || "—"}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs font-semibold uppercase text-zinc-500">Owner</dt>
                <dd className="mt-1 text-zinc-200">{row.owner_name || "—"}</dd>
              </div>
            </dl>
          )}
        </CardContent>
      </Card>

      {canEditCompany ? (
      <div>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-500">
          Loan dropdowns
        </h2>
        <CompanyCatalogSection
          companyId={id}
          farms={farms}
          approvers={approvers}
        />
      </div>
      ) : (
        <p className="text-sm text-zinc-500">
          You can view this company but do not have permission to edit details or loan
          dropdowns.
        </p>
      )}

      {isAdmin ? (
      <Card className="border-red-500/30 bg-red-950/25 shadow-none">
        <CardHeader>
          <CardTitle className="text-red-200">Danger zone</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-red-200/85">
            Deleting removes the company and related records per database rules.
          </p>
          <form className="mt-4" action={del}>
            <Button type="submit" variant="danger">
              Delete company
            </Button>
          </form>
        </CardContent>
      </Card>
      ) : null}
    </div>
  );
}
