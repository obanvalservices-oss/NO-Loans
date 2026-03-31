-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('admin', 'user');

-- CreateTable
CREATE TABLE "companies" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "address_line" TEXT NOT NULL DEFAULT '',
    "phone" TEXT NOT NULL DEFAULT '',
    "header_note" TEXT NOT NULL DEFAULT '',
    "owner_name" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employees" (
    "id" SERIAL NOT NULL,
    "company_id" INTEGER NOT NULL,
    "full_name" TEXT NOT NULL,
    "email" TEXT NOT NULL DEFAULT '',
    "phone" TEXT NOT NULL DEFAULT '',
    "id_number" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "employees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loans" (
    "id" SERIAL NOT NULL,
    "company_id" INTEGER NOT NULL,
    "employee_id" INTEGER NOT NULL,
    "principal_cents" INTEGER NOT NULL,
    "annual_interest_rate_percent" DOUBLE PRECISION NOT NULL,
    "term_weeks" INTEGER NOT NULL,
    "start_date" TEXT NOT NULL,
    "total_owed_cents" INTEGER NOT NULL,
    "weekly_payment_cents" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT NOT NULL DEFAULT '',
    "farm" TEXT NOT NULL DEFAULT '',
    "approved_by" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "loans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "installments" (
    "id" SERIAL NOT NULL,
    "loan_id" INTEGER NOT NULL,
    "sequence" INTEGER NOT NULL,
    "due_date" TEXT NOT NULL,
    "amount_due_cents" INTEGER NOT NULL,
    "amount_paid_cents" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'pending',

    CONSTRAINT "installments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_farms" (
    "id" SERIAL NOT NULL,
    "company_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "company_farms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_approvers" (
    "id" SERIAL NOT NULL,
    "company_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "company_approvers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_company_access" (
    "user_id" INTEGER NOT NULL,
    "company_id" INTEGER NOT NULL,

    CONSTRAINT "user_company_access_pkey" PRIMARY KEY ("user_id","company_id")
);

-- CreateTable
CREATE TABLE "system_settings" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "user_permissions" (
    "user_id" INTEGER NOT NULL,
    "can_manage_loans" BOOLEAN NOT NULL DEFAULT true,
    "can_manage_employees" BOOLEAN NOT NULL DEFAULT true,
    "can_edit_companies" BOOLEAN NOT NULL DEFAULT true,
    "can_view_weekly_report" BOOLEAN NOT NULL DEFAULT true,
    "can_print_contracts" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "user_permissions_pkey" PRIMARY KEY ("user_id")
);

-- CreateIndex
CREATE INDEX "loans_employee_id_idx" ON "loans"("employee_id");

-- CreateIndex
CREATE INDEX "installments_loan_id_idx" ON "installments"("loan_id");

-- CreateIndex
CREATE INDEX "company_farms_company_id_idx" ON "company_farms"("company_id");

-- CreateIndex
CREATE UNIQUE INDEX "company_farms_company_id_name_key" ON "company_farms"("company_id", "name");

-- CreateIndex
CREATE INDEX "company_approvers_company_id_idx" ON "company_approvers"("company_id");

-- CreateIndex
CREATE UNIQUE INDEX "company_approvers_company_id_name_key" ON "company_approvers"("company_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "user_company_access_user_id_idx" ON "user_company_access"("user_id");

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loans" ADD CONSTRAINT "loans_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loans" ADD CONSTRAINT "loans_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "installments" ADD CONSTRAINT "installments_loan_id_fkey" FOREIGN KEY ("loan_id") REFERENCES "loans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_farms" ADD CONSTRAINT "company_farms_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_approvers" ADD CONSTRAINT "company_approvers_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_company_access" ADD CONSTRAINT "user_company_access_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_company_access" ADD CONSTRAINT "user_company_access_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_permissions" ADD CONSTRAINT "user_permissions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
