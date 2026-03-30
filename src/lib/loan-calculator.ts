/**
 * Simple interest: total = principal * (1 + annualRate * years),
 * where years = termWeeks / 52.
 * Weekly payment splits total evenly across termWeeks.
 */
export function computeLoanTotals(
  principalCents: number,
  annualInterestRatePercent: number,
  termWeeks: number,
): { totalOwedCents: number; weeklyPaymentCents: number } {
  if (termWeeks <= 0) {
    throw new Error("Term must be at least 1 week");
  }
  const years = termWeeks / 52;
  const rate = annualInterestRatePercent / 100;
  const totalOwedCents = Math.round(principalCents * (1 + rate * years));
  const weeklyPaymentCents = Math.floor(totalOwedCents / termWeeks);
  return { totalOwedCents, weeklyPaymentCents };
}

/** Distribute total across weeks; last week absorbs rounding remainder. */
export function splitWeeklyAmounts(
  totalOwedCents: number,
  termWeeks: number,
): number[] {
  if (termWeeks <= 0) throw new Error("Term must be at least 1 week");
  const base = Math.floor(totalOwedCents / termWeeks);
  const remainder = totalOwedCents - base * termWeeks;
  const amounts: number[] = [];
  for (let i = 0; i < termWeeks; i++) {
    amounts.push(base + (i === termWeeks - 1 ? remainder : 0));
  }
  return amounts;
}
