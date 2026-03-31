/**
 * Auth / runtime environment (safe to import from Edge — no Node path/fs).
 * Database paths live in `db-path.ts`.
 */

const MIN_AUTH_SECRET_LEN = 32;

export function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}

export function assertProductionAuthSecret(): void {
  if (!isProduction()) return;
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < MIN_AUTH_SECRET_LEN) {
    throw new Error(
      `AUTH_SECRET must be set in production to a random value of at least ${MIN_AUTH_SECRET_LEN} characters.`,
    );
  }
}

export function getAuthSecretBytes(): Uint8Array {
  assertProductionAuthSecret();
  const raw =
    process.env.AUTH_SECRET ??
    "no-loans-dev-only-change-AUTH_SECRET-in-production";
  return new TextEncoder().encode(raw);
}

/**
 * Canonical external URL for auth/callbacks behind proxies.
 * Prefer NEXTAUTH_URL for platform compatibility; APP_URL is an alias.
 */
export function getAppUrl(): string | undefined {
  const raw =
    process.env.NEXTAUTH_URL ??
    process.env.APP_URL ??
    process.env.RAILWAY_PUBLIC_DOMAIN;
  if (!raw) return undefined;
  if (raw.startsWith("http://") || raw.startsWith("https://")) return raw;
  // Railway often provides domain without protocol.
  return `https://${raw}`;
}
