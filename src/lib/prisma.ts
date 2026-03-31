import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createClient(): PrismaClient {
  const rawUrl = process.env.DATABASE_URL?.trim();
  if (!rawUrl) {
    throw new Error(
      "DATABASE_URL is not set. Add it to `.env` or `.env.local` (PostgreSQL connection string).",
    );
  }

  // Keep query params required by managed DB providers (e.g. pgbouncer),
  // but drop `sslmode` because node-postgres + explicit `ssl` config can conflict.
  let connectionString = rawUrl;
  try {
    const parsed = new URL(rawUrl);
    parsed.searchParams.delete("sslmode");
    connectionString = parsed.toString();
  } catch {
    connectionString = rawUrl;
  }

  const adapter = new PrismaPg({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });
  return new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? ["error", "warn"]
        : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
