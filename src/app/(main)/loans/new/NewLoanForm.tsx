"use client";

import { Button } from "@/components/ui/button";
import { Field, inputClassName, selectClassName } from "@/components/ui/field";
import { cn } from "@/lib/cn";
import { UserPlus, Users } from "lucide-react";
import { useActionState, useMemo, useState } from "react";
import { FarmApproverFields } from "@/components/loan-fields/FarmApproverFields";
import { createLoanAction } from "../actions";

type Company = { id: number; name: string };
type Employee = { id: number; full_name: string; company_id: number };

export function NewLoanForm({
  companies,
  employees,
  nextFridayLabel,
  initialCompanyId,
  farmNamesByCompany,
  approverNamesByCompany,
  defaultInterestRatePercent,
}: {
  companies: Company[];
  employees: Employee[];
  nextFridayLabel: string;
  /** Pre-select company when coming from the loans list (same company context). */
  initialCompanyId?: number;
  farmNamesByCompany: Record<number, string[]>;
  approverNamesByCompany: Record<number, string[]>;
  defaultInterestRatePercent: number;
}) {
  const [companyId, setCompanyId] = useState<number | "">(
    initialCompanyId != null &&
      companies.some((c) => c.id === initialCompanyId)
      ? initialCompanyId
      : "",
  );
  const [useNewEmployee, setUseNewEmployee] = useState(false);
  const [state, formAction] = useActionState(createLoanAction, undefined);

  const filteredEmployees = useMemo(() => {
    if (companyId === "") return employees;
    return employees.filter((e) => e.company_id === companyId);
  }, [employees, companyId]);

  const hasCompany = companyId !== "";
  const farmNames =
    typeof companyId === "number"
      ? farmNamesByCompany[companyId] ?? []
      : [];
  const approverNames =
    typeof companyId === "number"
      ? approverNamesByCompany[companyId] ?? []
      : [];

  return (
    <form action={formAction} className="grid gap-5 sm:grid-cols-2">
      <input
        type="hidden"
        name="employee_mode"
        value={useNewEmployee ? "new" : "existing"}
      />

      {state?.error ? (
        <p
          className="sm:col-span-2 rounded-xl border border-red-500/35 bg-red-950/50 px-4 py-3 text-sm text-red-200 shadow-sm"
          role="alert"
        >
          {state.error}
        </p>
      ) : null}

      <Field label="Company" className="sm:col-span-2">
        <select
          name="company_id"
          required
          value={companyId === "" ? "" : String(companyId)}
          onChange={(e) => {
            const v = e.target.value;
            setCompanyId(v === "" ? "" : Number(v));
          }}
          className={selectClassName}
        >
          <option value="">Select…</option>
          {companies.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </Field>

      <div className="sm:col-span-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
          Borrower
        </span>
        <div className="mt-2 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={!hasCompany}
            onClick={() => setUseNewEmployee(false)}
            className={cn(
              "inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all duration-200",
              !hasCompany && "cursor-not-allowed opacity-50",
              !useNewEmployee && hasCompany
                ? "border-brand-500 bg-brand-500/15 text-brand-100 shadow-sm ring-1 ring-brand-400/30"
                : "border-white/10 bg-brand-950/40 text-zinc-300 hover:border-brand-500/30",
            )}
          >
            <Users className="h-4 w-4" />
            Existing employee
          </button>
          <button
            type="button"
            disabled={!hasCompany}
            onClick={() => setUseNewEmployee(true)}
            className={cn(
              "inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all duration-200",
              !hasCompany && "cursor-not-allowed opacity-50",
              useNewEmployee && hasCompany
                ? "border-brand-500 bg-brand-500/15 text-brand-100 shadow-sm ring-1 ring-brand-400/30"
                : "border-white/10 bg-brand-950/40 text-zinc-300 hover:border-brand-500/30",
            )}
          >
            <UserPlus className="h-4 w-4" />
            New employee
          </button>
        </div>
        {!hasCompany ? (
          <p className="mt-2 text-xs text-zinc-500">Select a company first.</p>
        ) : null}
      </div>

      {hasCompany && !useNewEmployee ? (
        <Field label="Employee" className="sm:col-span-2">
          <select name="employee_id" required className={selectClassName}>
            <option value="">Select…</option>
            {filteredEmployees.map((e) => (
              <option key={e.id} value={e.id}>
                {e.full_name}
              </option>
            ))}
          </select>
          {filteredEmployees.length === 0 ? (
            <p className="mt-2 text-xs text-amber-200/90">
              No employees for this company yet. Use{" "}
              <strong>New employee</strong> above to add one.
            </p>
          ) : null}
        </Field>
      ) : null}

      {hasCompany && useNewEmployee ? (
        <>
          <Field label="Full name" className="sm:col-span-2">
            <input
              name="new_employee_full_name"
              required
              autoComplete="name"
              className={inputClassName}
              placeholder="As it should appear on the loan"
            />
          </Field>
          <Field label="Email (optional)">
            <input
              name="new_employee_email"
              type="email"
              autoComplete="email"
              className={inputClassName}
            />
          </Field>
          <Field label="Phone (optional)">
            <input
              name="new_employee_phone"
              type="tel"
              autoComplete="tel"
              className={inputClassName}
            />
          </Field>
          <Field label="ID / reference (optional)" className="sm:col-span-2">
            <input name="new_employee_id_number" className={inputClassName} />
          </Field>
        </>
      ) : null}

      <Field label="Principal (USD)">
        <input
          name="principal"
          required
          inputMode="decimal"
          placeholder="e.g. 5000"
          className={inputClassName}
        />
      </Field>
      <Field label="Annual interest rate (%)">
        <input
          name="annual_interest_rate_percent"
          type="number"
          step="0.01"
          min="0"
          defaultValue={String(defaultInterestRatePercent)}
          className={inputClassName}
        />
      </Field>
      <Field label="Term (weeks)">
        <input
          name="term_weeks"
          type="number"
          min="1"
          defaultValue="12"
          required
          className={inputClassName}
        />
      </Field>
      <Field label="First payment">
        <select
          name="start_date"
          className={selectClassName}
          defaultValue="next_friday"
        >
          <option value="next_friday">Next Friday ({nextFridayLabel})</option>
          <option value="custom">Custom start date</option>
        </select>
      </Field>
      <Field label="Custom start (if selected)" className="sm:col-span-2">
        <input name="custom_start_date" type="date" className={inputClassName} />
      </Field>
      <FarmApproverFields
        key={typeof companyId === "number" ? String(companyId) : "none"}
        companyId={companyId}
        farmNames={farmNames}
        approverNames={approverNames}
      />
      <Field label="Notes (optional)" className="sm:col-span-2">
        <textarea
          name="notes"
          rows={3}
          className={`${inputClassName} min-h-[88px] resize-y`}
        />
      </Field>
      <div className="sm:col-span-2">
        <Button type="submit">Create loan & schedule</Button>
      </div>
    </form>
  );
}
