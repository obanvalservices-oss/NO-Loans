import { Button } from "@/components/ui/button";
import { Field, inputClassName } from "@/components/ui/field";
import type { CatalogEntry } from "@/lib/company-catalog";
import { Trash2 } from "lucide-react";
import {
  addCompanyApprover,
  addCompanyFarm,
  removeCompanyApprover,
  removeCompanyFarm,
} from "../actions";

type Props = {
  companyId: number;
  farms: CatalogEntry[];
  approvers: CatalogEntry[];
};

export function CompanyCatalogSection({
  companyId,
  farms,
  approvers,
}: Props) {
  const addFarm = addCompanyFarm.bind(null, companyId);
  const addApprover = addCompanyApprover.bind(null, companyId);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="rounded-xl border border-white/10 bg-brand-900/35 p-5 shadow-lg shadow-black/20">
        <h3 className="text-sm font-semibold text-zinc-100">Farms / workplaces</h3>
        <p className="mt-1 text-xs text-zinc-500">
          Used as options when creating or editing a loan for this company.
        </p>
        <form action={addFarm} className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
          <Field label="Add farm" className="min-w-0 flex-1">
            <input
              name="name"
              required
              autoComplete="off"
              className={inputClassName}
              placeholder="e.g. North field, Site B"
            />
          </Field>
          <Button type="submit" className="shrink-0">
            Add
          </Button>
        </form>
        {farms.length === 0 ? (
          <p className="mt-4 text-sm text-zinc-500">No farms added yet.</p>
        ) : (
          <ul className="mt-4 divide-y divide-white/10 rounded-lg border border-white/10 bg-brand-950/40">
            {farms.map((f) => (
              <li
                key={f.id}
                className="flex items-center justify-between gap-2 px-3 py-2.5 text-sm text-zinc-200"
              >
                <span className="min-w-0 truncate">{f.name}</span>
                <form action={removeCompanyFarm.bind(null, companyId, f.id)}>
                  <Button
                    type="submit"
                    variant="ghost"
                    className="h-8 shrink-0 gap-1 px-2 text-xs text-zinc-500 hover:text-red-300"
                    aria-label={`Remove ${f.name}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-xl border border-white/10 bg-brand-900/35 p-5 shadow-lg shadow-black/20">
        <h3 className="text-sm font-semibold text-zinc-100">Approvers</h3>
        <p className="mt-1 text-xs text-zinc-500">
          People who can approve loans — shown in the “Approved by” field.
        </p>
        <form
          action={addApprover}
          className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end"
        >
          <Field label="Add approver" className="min-w-0 flex-1">
            <input
              name="name"
              required
              autoComplete="off"
              className={inputClassName}
              placeholder="Full name"
            />
          </Field>
          <Button type="submit" className="shrink-0">
            Add
          </Button>
        </form>
        {approvers.length === 0 ? (
          <p className="mt-4 text-sm text-zinc-500">No approvers added yet.</p>
        ) : (
          <ul className="mt-4 divide-y divide-white/10 rounded-lg border border-white/10 bg-brand-950/40">
            {approvers.map((a) => (
              <li
                key={a.id}
                className="flex items-center justify-between gap-2 px-3 py-2.5 text-sm text-zinc-200"
              >
                <span className="min-w-0 truncate">{a.name}</span>
                <form action={removeCompanyApprover.bind(null, companyId, a.id)}>
                  <Button
                    type="submit"
                    variant="ghost"
                    className="h-8 shrink-0 gap-1 px-2 text-xs text-zinc-500 hover:text-red-300"
                    aria-label={`Remove ${a.name}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
