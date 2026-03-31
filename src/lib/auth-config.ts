import { getAuthSecretBytes } from "@/lib/env";

export const SESSION_COOKIE_BASE = "no_loan_session";
export const SESSION_COOKIE = SESSION_COOKIE_BASE;

function parseBool(value: string | undefined): boolean | undefined {
  if (!value) return undefined;
  const v = value.trim().toLowerCase();
  if (v === "1" || v === "true" || v === "yes" || v === "on") return true;
  if (v === "0" || v === "false" || v === "no" || v === "off") return false;
  return undefined;
}

export function isSecureCookieEnabled(): boolean {
  const envOverride = parseBool(process.env.AUTH_COOKIE_SECURE);
  if (typeof envOverride === "boolean") return envOverride;
  return process.env.NODE_ENV === "production";
}

export function getSessionCookieName(): string {
  return isSecureCookieEnabled()
    ? `__Secure-${SESSION_COOKIE_BASE}`
    : SESSION_COOKIE_BASE;
}

/** HS256 signing key; production requires AUTH_SECRET (see env.ts). */
export function getAuthSecret(): Uint8Array {
  return getAuthSecretBytes();
}
