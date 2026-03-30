import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, inputClassName } from "@/components/ui/field";
import { PageHeader } from "@/components/ui/page-header";
import { DataTableShell, Table, Td, Th } from "@/components/ui/data-table";
import { listCompaniesDetailed } from "@/lib/loan-queries";
import { requireSessionAndScope } from "@/lib/require-auth";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { createCompany } from "./actions";

export const dynamic = "force-dynamic";

export default async function CompaniesPage() {
  const { session, scope } = await requireSessionAndScope();
  const companies = await listCompaniesDetailed(scope);
  const isAdmin = session.role === "admin";

  return (
    <div className="space-y-10">
      <PageHeader
        title="Companies"
        description="Organizations on record. Details appear in the header of printed loan contracts."
      />

      {isAdmin ? (
      <Card>
        <CardHeader>
          <CardTitle>Add company</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-5 sm:grid-cols-2" action={createCompany}>
            <Field label="Name">
              <input name="name" required className={inputClassName} />
            </Field>
            <Field label="Phone">
              <input name="phone" type="tel" className={inputClassName} />
            </Field>
            <Field label="Address" className="sm:col-span-2">
              <input name="address_line" className={inputClassName} />
            </Field>
            <Field label="Header note (optional)" className="sm:col-span-2">
              <input
                name="header_note"
                className={inputClassName}
                placeholder="e.g. Registration / tagline"
              />
            </Field>
            <Field label="Owner (person lending through the company)" className="sm:col-span-2">
              <input
                name="owner_name"
                className={inputClassName}
                placeholder="Full name — appears on the loan contract"
              />
            </Field>
            <div className="sm:col-span-2">
              <Button type="submit">Save company</Button>
            </div>
          </form>
        </CardContent>
      </Card>
      ) : null}

      <section>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-500">
          {isAdmin ? "All companies" : "Your companies"}
        </h2>
        <DataTableShell>
          <Table>
            <thead>
              <tr>
                <Th>Name</Th>
                <Th>Owner</Th>
                <Th>Phone</Th>
                <Th>Address</Th>
                <Th className="w-28 text-right" />
              </tr>
            </thead>
            <tbody>
              {companies.length === 0 ? (
                <tr className="group">
                  <Td colSpan={5} className="py-12 text-center text-zinc-500">
                    No companies yet. Add one above.
                  </Td>
                </tr>
              ) : (
                companies.map((c) => (
                  <tr key={c.id} className="group">
                    <Td className="font-medium text-zinc-50">{c.name}</Td>
                    <Td className="max-w-[140px] truncate text-zinc-300">
                      {c.owner_name || "—"}
                    </Td>
                    <Td>{c.phone || "—"}</Td>
                    <Td className="max-w-xs truncate">{c.address_line || "—"}</Td>
                    <Td className="text-right">
                      <Link
                        href={`/companies/${c.id}`}
                        className="inline-flex items-center gap-1 text-sm font-medium text-brand-400 transition-colors hover:text-brand-300"
                      >
                        Edit
                        <ChevronRight className="h-4 w-4 opacity-70 transition-transform duration-200 group-hover:translate-x-0.5" />
                      </Link>
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
