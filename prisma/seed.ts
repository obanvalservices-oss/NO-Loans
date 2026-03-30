import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/prisma";
import { logger, logServerException } from "../src/lib/logger";

async function main() {
  const anyUser = await prisma.user.findFirst({ select: { id: true } });
  if (anyUser) return;

  const isProd = process.env.NODE_ENV === "production";
  const email = (
    process.env.ADMIN_SEED_EMAIL?.trim() ||
    (isProd ? "" : "admin@local.com")
  ).toLowerCase();
  const password =
    process.env.ADMIN_SEED_PASSWORD ?? (isProd ? "" : "123456");

  if (!email || !password) {
    if (isProd) {
      logger.warn(
        "Empty database: set ADMIN_SEED_EMAIL and ADMIN_SEED_PASSWORD to create the first admin, or create a user manually.",
      );
    }
    return;
  }

  const hash = bcrypt.hashSync(password, 10);
  try {
    await prisma.user.create({
      data: {
        email,
        password_hash: hash,
        role: "admin",
      },
    });
    logger.info("Seeded initial admin user", { email });
  } catch (e) {
    logServerException("seed.admin", e);
  }

  const defaults: [string, string][] = [
    ["branding_subtitle", "Management"],
    [
      "sidebar_help_text",
      "Loans, schedules, payroll reports & printable contracts.",
    ],
    ["feature_weekly_report", "1"],
    ["feature_contract_print", "1"],
    ["default_interest_rate_percent", "12"],
  ];
  for (const [key, value] of defaults) {
    await prisma.systemSetting.upsert({
      where: { key },
      create: { key, value },
      update: {},
    });
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    logServerException("seed", e);
    await prisma.$disconnect();
    process.exit(1);
  });
