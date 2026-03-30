/**
 * SQLite file location (Node only — not imported from Edge middleware).
 * LOANS_DATABASE_PATH: absolute path or path relative to process.cwd().
 * LOANS_DATA_DIRECTORY: folder for loans.db when LOANS_DATABASE_PATH is unset (default: ./data).
 */

import path from "path";

export function resolveLoansDatabasePath(): string {
  const explicit = process.env.LOANS_DATABASE_PATH?.trim();
  if (explicit) {
    return path.isAbsolute(explicit)
      ? explicit
      : path.join(process.cwd(), explicit);
  }
  const dirEnv = process.env.LOANS_DATA_DIRECTORY?.trim();
  const dataDir = dirEnv
    ? path.isAbsolute(dirEnv)
      ? dirEnv
      : path.join(process.cwd(), dirEnv)
    : path.join(process.cwd(), "data");
  return path.join(dataDir, "loans.db");
}
