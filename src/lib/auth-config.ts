import { getAuthSecretBytes } from "@/lib/env";

export const SESSION_COOKIE = "no_loan_session";

/** HS256 signing key; production requires AUTH_SECRET (see env.ts). */
export function getAuthSecret(): Uint8Array {
  return getAuthSecretBytes();
}
