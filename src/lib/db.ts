/**
 * Shared row shapes used by UI and services (aligned with Prisma / PostgreSQL).
 */

export type CompanyRow = {
  id: number;
  name: string;
  address_line: string;
  phone: string;
  header_note: string;
  owner_name: string;
};

export type EmployeeRow = {
  id: number;
  company_id: number;
  full_name: string;
  email: string;
  phone: string;
  id_number: string;
};

export type LoanRow = {
  id: number;
  company_id: number;
  employee_id: number;
  principal_cents: number;
  annual_interest_rate_percent: number;
  term_weeks: number;
  start_date: string;
  total_owed_cents: number;
  weekly_payment_cents: number;
  status: string;
  created_at: string;
  notes: string;
  farm: string;
  approved_by: string;
};

export type InstallmentRow = {
  id: number;
  loan_id: number;
  sequence: number;
  due_date: string;
  amount_due_cents: number;
  amount_paid_cents: number;
  status: string;
};
