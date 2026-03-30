"use client";

import { Button } from "@/components/ui/button";
import { useTransition } from "react";
import { deleteLoanAction } from "../actions";

export function DeleteLoanButton({ loanId }: { loanId: number }) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="danger"
      disabled={pending}
      onClick={() => {
        if (
          !confirm(
            "Delete this loan and all installments? This cannot be undone.",
          )
        ) {
          return;
        }
        startTransition(() => {
          deleteLoanAction(loanId);
        });
      }}
    >
      {pending ? "Deleting…" : "Delete loan"}
    </Button>
  );
}
