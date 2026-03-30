/**
 * Lightweight structured logging. Uses console; swap for pino/datadog in hosted setups.
 * LOG_LEVEL: silent | error | warn | info | debug (default: info in production, debug in dev)
 */

const LEVELS = { silent: 0, error: 1, warn: 2, info: 3, debug: 4 } as const;
type LevelName = keyof typeof LEVELS;

function currentLevel(): number {
  const raw = (process.env.LOG_LEVEL ?? "").toLowerCase() as LevelName;
  if (raw in LEVELS) return LEVELS[raw];
  return process.env.NODE_ENV === "production" ? LEVELS.info : LEVELS.debug;
}

function should(level: keyof typeof LEVELS): boolean {
  if (level === "silent") return false;
  return LEVELS[level] <= currentLevel();
}

function ts(): string {
  return new Date().toISOString();
}

export const logger = {
  error(message: string, meta?: Record<string, unknown>): void {
    if (!should("error")) return;
    const line = meta
      ? `${ts()} [ERROR] ${message} ${safeMeta(meta)}`
      : `${ts()} [ERROR] ${message}`;
    console.error(line);
  },

  warn(message: string, meta?: Record<string, unknown>): void {
    if (!should("warn")) return;
    const line = meta
      ? `${ts()} [WARN] ${message} ${safeMeta(meta)}`
      : `${ts()} [WARN] ${message}`;
    console.warn(line);
  },

  info(message: string, meta?: Record<string, unknown>): void {
    if (!should("info")) return;
    const line = meta
      ? `${ts()} [INFO] ${message} ${safeMeta(meta)}`
      : `${ts()} [INFO] ${message}`;
    console.info(line);
  },

  debug(message: string, meta?: Record<string, unknown>): void {
    if (!should("debug")) return;
    const line = meta
      ? `${ts()} [DEBUG] ${message} ${safeMeta(meta)}`
      : `${ts()} [DEBUG] ${message}`;
    console.debug(line);
  },
};

function safeMeta(meta: Record<string, unknown>): string {
  try {
    const redacted = { ...meta };
    for (const k of Object.keys(redacted)) {
      if (/password|secret|token|hash/i.test(k)) {
        redacted[k] = "[redacted]";
      }
    }
    return JSON.stringify(redacted);
  } catch {
    return "{}";
  }
}

/** Log unknown errors without leaking internals to the client. */
export function logServerException(context: string, err: unknown): void {
  const message = err instanceof Error ? err.message : String(err);
  const stack = err instanceof Error ? err.stack : undefined;
  logger.error(`[${context}] ${message}`, stack ? { stack } : undefined);
}
