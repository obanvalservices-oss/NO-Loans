/**
 * Runs once per server process (Node). Use for startup diagnostics.
 * https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { logger } = await import("./lib/logger");
  const { isProduction } = await import("./lib/env");

  const hasDb = Boolean(process.env.DATABASE_URL?.trim());
  logger.info("Server starting", {
    nodeEnv: process.env.NODE_ENV,
    databaseConfigured: hasDb,
  });

  if (isProduction()) {
    logger.info(
      "Production checklist: AUTH_SECRET (32+ chars), DATABASE_URL, ADMIN_SEED_* for first admin if DB is empty",
    );
  }
}
