"use server";

import { revalidatePath } from "next/cache";
import { getPermissionsForSession } from "@/lib/app-policies";
import { ensureLoanAccess } from "@/lib/auth-guards";
import { payInstallment, skipInstallment } from "@/lib/loan-service";
import { parseMoneyToCents } from "@/lib/money";
import { requireCompanyScope } from "@/lib/require-auth";
import { getSession } from "@/lib/session";

async function ensureCanManageLoans(): Promise<{ error: string } | null> {
  const session = await getSession();
  if (!session) return { error: "Not signed in" };
  const perms = await getPermissionsForSession(session);
  if (session.role !== "admin" && !perms.canManageLoans) {
    return { error: "You do not have permission to manage loans" };
  }
  return null;
}

export async function quickPayInstallmentAction(
  _prev: { error?: string } | undefined,
  formData: FormData,
) {
  const denied = await ensureCanManageLoans();
  if (denied) return denied;

  const loanId = Number(formData.get("loanId"));
  const installmentId = Number(formData.get("installmentId"));
  const amountRaw = String(formData.get("amount") ?? "");
  const paymentDate = String(formData.get("payment_date") ?? "");
  const amountCents = parseMoneyToCents(amountRaw);

  if (!loanId || !installmentId) return { error: "Invalid request" };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(paymentDate)) {
    return { error: "Invalid payment date" };
  }
  if (amountCents === null || amountCents <= 0) {
    return { error: "Enter a valid payment amount" };
  }

  const scope = await requireCompanyScope();
  await ensureLoanAccess(scope, loanId);

  const result = await payInstallment(loanId, installmentId, amountCents);
  if (!result.ok) return { error: result.error };

  revalidatePath("/");
  revalidatePath("/loans");
  revalidatePath("/reports/weekly");
  return {};
}

export async function quickSkipInstallmentAction(
  _prev: { error?: string } | undefined,
  formData: FormData,
) {
  const denied = await ensureCanManageLoans();
  if (denied) return denied;

  const loanId = Number(formData.get("loanId"));
  const installmentId = Number(formData.get("installmentId"));
  if (!loanId || !installmentId) return { error: "Invalid request" };

  const scope = await requireCompanyScope();
  await ensureLoanAccess(scope, loanId);

  const result = await skipInstallment(loanId, installmentId);
  if (!result.ok) return { error: result.error };

  revalidatePath("/");
  revalidatePath("/loans");
  revalidatePath("/reports/weekly");
  return {};
}

