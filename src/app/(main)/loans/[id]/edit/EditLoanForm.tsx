"use client";

import { FarmApproverFields } from "@/components/loan-fields/FarmApproverFields";
import { Button } from "@/components/ui/button";
import { Field, inputClassName, selectClassName } from "@/components/ui/field";
import { centsToDisplay } from "@/lib/money";
import { useActionState, useMemo, useState } from "react";
import { updateLoanAction } from "../../actions";

type Company = { id: number; name: string };
type Employee = { id: number; full_name: string; company_id: number };

type Props = {
  loanId: number;
  initialCompanyId: number;
  initialEmployeeId: number;
  principalCents: number;
  annualInterestRatePercent: number;
  termWeeks: number;
  startDateISO: string;
  farm: string;
  approvedBy: string;
  notes: string;
  companies: Company[];
  employees: Employee[];
  scheduleLocked: boolean;
  nextFridayLabel: string;
  farmNamesByCompany: Record<number, string[]>;
  approverNamesByCompany: Record<number, string[]>;
};

export function EditLoanForm({
  loanId,
  initialCompanyId,
  initialEmployeeId,
  principalCents,
  annualInterestRatePercent,
  termWeeks,
  startDateISO,
  farm,
  approvedBy,
  notes,
  companies,
  employees,
  scheduleLocked,
  nextFridayLabel,
  farmNamesByCompany,
  approverNamesByCompany,
}: Props) {
  const [companyId, setCompanyId] = useState<number>(initialCompanyId);
  const [employeeId, setEmployeeId] = useState<number>(initialEmployeeId);
  const [state, formAction] = useActionState(updateLoanAction, undefined);

  const filteredEmployees = useMemo(() => {
    return employees.filter((e) => e.company_id === companyId);
  }, [employees, companyId]);

  function handleCompanyChange(nextCompanyId: number) {
    setCompanyId(nextCompanyId);
    const next = employees.filter((e) => e.company_id === nextCompanyId);
    setEmployeeId((prev) => {
      if (next.some((e) => e.id === prev)) return prev;
      return next[0]?.id ?? prev;
    });
  }

  const principalInputDefault = (principalCents / 100).toFixed(2);

  const farmNames = farmNamesByCompany[companyId] ?? [];
  const approverNames = approverNamesByCompany[companyId] ?? [];

  return (
    <form action={formAction} className="grid gap-5 sm:grid-cols-2">
      <input type="hidden" name="loan_id" value={loanId} />

      {state?.error ? (
        <p
          className="sm:col-span-2 rounded-xl border border-red-500/35 bg-red-950/50 px-4 py-3 text-sm text-red-200 shadow-sm"
          role="alert"
        >
          {state.error}
        </p>
      ) : null}

      {scheduleLocked ? (
        <div className="sm:col-span-2 rounded-xl border border-amber-500/30 bg-amber-950/30 px-4 py-3 text-sm text-amber-100/90">
          <strong className="text-amber-50">Payment schedule is locked.</strong>{" "}
          Principal, interest, term, and first due date cannot be changed after any
          payment or schedule activity (skip, partial, etc.). You can still update
          company, borrower, farm, approver, and notes.
        </div>
      ) : null}

      <Field label="Company" className="sm:col-span-2">
        <select
          name="company_id"
          required
          value={companyId}
          onChange={(e) => handleCompanyChange(Number(e.target.value))}
          className={selectClassName}
        >
          {companies.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Employee" className="sm:col-span-2">
        <select
          name="employee_id"
          required
          value={employeeId}
          onChange={(e) => setEmployeeId(Number(e.target.value))}
          className={selectClassName}
        >
          {filteredEmployees.map((e) => (
            <option key={e.id} value={e.id}>
              {e.full_name}
            </option>
          ))}
        </select>
        {filteredEmployees.length === 0 ? (
          <p className="mt-2 text-xs text-amber-200/90">
            No employees for this company. Add or move an employee first.
          </p>
        ) : null}
      </Field>

      {scheduleLocked ? (
        <div className="sm:col-span-2 rounded-xl border border-white/10 bg-brand-950/40 px-4 py-4 text-sm text-zinc-300">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Loan terms (read-only)
          </p>
          <dl className="mt-3 grid gap-2 sm:grid-cols-2">
            <div>
              <dt className="text-xs text-zinc-500">Principal</dt>
              <dd className="font-medium text-zinc-50">
                {centsToDisplay(principalCents)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-zinc-500">Annual interest</dt>
              <dd className="font-medium text-zinc-50">
                {annualInterestRatePercent}%
              </dd>
            </div>
            <div>
              <dt className="text-xs text-zinc-500">Term</dt>
              <dd className="font-medium text-zinc-50">{termWeeks} weeks</dd>
            </div>
            <div>
              <dt className="text-xs text-zinc-500">First due (start)</dt>
              <dd className="font-medium text-zinc-50">{startDateISO}</dd>
            </div>
          </dl>
        </div>
      ) : (
        <>
          <Field label="Principal (USD)">
            <input
              name="principal"
              required
              inputMode="decimal"
              defaultValue={principalInputDefault}
              className={inputClassName}
            />
          </Field>
          <Field label="Annual interest rate (%)">
            <input
              name="annual_interest_rate_percent"
              type="number"
              step="0.01"
              min="0"
              defaultValue={annualInterestRatePercent}
              className={inputClassName}
            />
          </Field>
          <Field label="Term (weeks)">
            <input
              name="term_weeks"
              type="number"
              min="1"
              required
              defaultValue={termWeeks}
              className={inputClassName}
            />
          </Field>
          <Field label="First payment">
            <select
              name="start_date"
              className={selectClassName}
              defaultValue="custom"
            >
              <option value="next_friday">Next Friday ({nextFridayLabel})</option>
              <option value="custom">Custom start date</option>
            </select>
          </Field>
          <Field label="Custom start (if selected)" className="sm:col-span-2">
            <input
              name="custom_start_date"
              type="date"
              defaultValue={startDateISO}
              className={inputClassName}
            />
          </Field>
        </>
      )}

      <FarmApproverFields
        key={String(companyId)}
        companyId={companyId}
        farmNames={farmNames}
        approverNames={approverNames}
        defaultFarm={farm}
        defaultApprovedBy={approvedBy}
      />
      <Field label="Notes (optional)" className="sm:col-span-2">
        <textarea
          name="notes"
          rows={3}
          defaultValue={notes}
          className={`${inputClassName} min-h-[88px] resize-y`}
        />
      </Field>
      <div className="sm:col-span-2">
        <Button type="submit">Save changes</Button>
      </div>
    </form>
  );
}
