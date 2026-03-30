"use client";

import { Button } from "@/components/ui/button";
import { inputClassName } from "@/components/ui/field";
import type { InstallmentRow } from "@/lib/db";
import { centsToDisplay } from "@/lib/money";
import { useActionState } from "react";
import { payInstallmentFormAction, skipInstallmentFormAction } from "../actions";

export function PayInstallmentForm({
  loanId,
  inst,
}: {
  loanId: number;
  inst: InstallmentRow;
}) {
  const remaining = inst.amount_due_cents - inst.amount_paid_cents;
  const defaultAmount = (remaining / 100).toFixed(2);
  const [state, action] = useActionState(payInstallmentFormAction, undefined);
  const err = (state as { error?: string } | undefined)?.error;

  if (inst.status === "skipped" || inst.status === "paid") {
    return null;
  }

  return (
    <form action={action} className="flex flex-wrap items-end gap-2">
      {err ? (
        <span className="w-full text-xs font-medium text-red-600">{err}</span>
      ) : null}
      <input type="hidden" name="loanId" value={loanId} />
      <input type="hidden" name="installmentId" value={inst.id} />
      <label className="flex flex-col gap-1 text-xs font-medium text-zinc-500">
        Amount (USD)
        <input
          name="amount"
          defaultValue={defaultAmount}
          inputMode="decimal"
          className={`${inputClassName} !mt-0 w-28 py-2`}
        />
      </label>
      <Button type="submit" className="px-3 py-2 text-xs">
        Record payment
      </Button>
      <span className="text-xs text-zinc-500">
        {centsToDisplay(remaining)} left
      </span>
    </form>
  );
}

export function SkipInstallmentForm({
  loanId,
  inst,
}: {
  loanId: number;
  inst: InstallmentRow;
}) {
  const [state, action] = useActionState(skipInstallmentFormAction, undefined);
  const err = (state as { error?: string } | undefined)?.error;

  if (inst.status !== "pending" || inst.amount_paid_cents > 0) {
    return null;
  }

  return (
    <form action={action} className="inline">
      {err ? (
        <span className="mr-2 text-xs font-medium text-red-600">{err}</span>
      ) : null}
      <input type="hidden" name="loanId" value={loanId} />
      <input type="hidden" name="installmentId" value={inst.id} />
      <Button
        type="submit"
        variant="secondary"
        className="px-3 py-2 text-xs"
        title="Defer this week to the end of the schedule"
      >
        Skip week
      </Button>
    </form>
  );
}
