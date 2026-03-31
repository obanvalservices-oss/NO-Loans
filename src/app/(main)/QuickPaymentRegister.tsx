"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { inputClassName } from "@/components/ui/field";
import type { DashboardQuickLoan } from "@/lib/loan-service";
import { centsToDisplay } from "@/lib/money";
import {
  quickPayInstallmentAction,
  quickSkipInstallmentAction,
} from "./dashboard-actions";

export function QuickPaymentRegister({ rows }: { rows: DashboardQuickLoan[] }) {
  if (rows.length === 0) {
    return (
      <p className="rounded-xl border border-white/10 bg-brand-950/30 p-4 text-sm text-zinc-400">
        No active loans available for quick payment.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {rows.map((row) => (
        <QuickLoanRow key={row.loan_id} row={row} />
      ))}
    </div>
  );
}

function QuickLoanRow({ row }: { row: DashboardQuickLoan }) {
  const defaultAmount = (row.current_remaining_cents / 100).toFixed(2);
  const todayISO = new Date().toISOString().slice(0, 10);
  const [payState, payAction] = useActionState(quickPayInstallmentAction, undefined);
  const [skipState, skipAction] = useActionState(
    quickSkipInstallmentAction,
    undefined,
  );
  const payError = (payState as { error?: string } | undefined)?.error;
  const skipError = (skipState as { error?: string } | undefined)?.error;
  const disabled = !row.current_installment_id;

  return (
    <div className="rounded-xl border border-white/10 bg-brand-950/35 p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-semibold text-zinc-100">
            Loan #{row.loan_id} · {row.employee_name}
          </p>
          <p className="text-xs text-zinc-500">
            {row.company_name} · Weekly: {centsToDisplay(row.weekly_payment_cents)} · Due:{" "}
            {row.current_due_date ?? "No pending installment"}
          </p>
        </div>
        <p className="text-sm font-medium text-zinc-200">
          Remaining: {centsToDisplay(row.current_remaining_cents)}
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-2">
        <form action={payAction} className="flex flex-wrap items-end gap-2">
          <input type="hidden" name="loanId" value={row.loan_id} />
          <input
            type="hidden"
            name="installmentId"
            value={row.current_installment_id ?? ""}
          />
          <label className="text-xs text-zinc-500">
            Amount
            <input
              name="amount"
              defaultValue={defaultAmount}
              inputMode="decimal"
              className={`${inputClassName} !mt-1 w-28 py-2`}
              disabled={disabled}
            />
          </label>
          <label className="text-xs text-zinc-500">
            Payment date
            <input
              type="date"
              name="payment_date"
              defaultValue={todayISO}
              className={`${inputClassName} !mt-1 w-40 py-2`}
              disabled={disabled}
            />
          </label>
          <Button type="submit" className="px-3 py-2 text-xs" disabled={disabled}>
            Record payment
          </Button>
          {payError ? <p className="text-xs text-red-400">{payError}</p> : null}
        </form>

        <form action={skipAction}>
          <input type="hidden" name="loanId" value={row.loan_id} />
          <input
            type="hidden"
            name="installmentId"
            value={row.current_installment_id ?? ""}
          />
          <Button
            type="submit"
            variant="secondary"
            className="px-3 py-2 text-xs"
            disabled={disabled}
            title="Defer current week to end of schedule"
          >
            Skip week
          </Button>
        </form>
        {skipError ? <p className="text-xs text-red-400">{skipError}</p> : null}
      </div>
    </div>
  );
}

