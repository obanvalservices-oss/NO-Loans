import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { getPermissionsForSession } from "@/lib/app-policies";
import { canAccessCompany } from "@/lib/company-scope";
import { listCompanyOptions } from "@/lib/loan-queries";
import { getDashboardOverview } from "@/lib/loan-service";
import { centsToDisplay } from "@/lib/money";
import { requireCompanyScope, requireSession } from "@/lib/require-auth";
import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  Banknote,
  Building2,
  CalendarClock,
  ChevronDown,
  ClockAlert,
  PiggyBank,
  TrendingDown,
  Users,
} from "lucide-react";
import Link from "next/link";
import { QuickPaymentRegister } from "./QuickPaymentRegister";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ company?: string }>;
};

export default async function DashboardPage({ searchParams }: Props) {
  const session = await requireSession();
  const perms = await getPermissionsForSession(session);
  const scope = await requireCompanyScope();
  const sp = await searchParams;
  const requestedCompanyId = Number(sp.company);
  const selectedCompanyId =
    Number.isInteger(requestedCompanyId) &&
    requestedCompanyId > 0 &&
    canAccessCompany(scope, requestedCompanyId)
      ? requestedCompanyId
      : undefined;
  const companyOptions = await listCompanyOptions(scope);
  const s = await getDashboardOverview(scope, selectedCompanyId);

  const quickActions = [
    {
      href: "/companies",
      title: "Companies",
      icon: Building2,
    },
    {
      href: "/employees",
      title: "Employees",
      icon: Users,
    },
    ...(perms.canManageLoans
      ? [
          {
            href: "/loans/new",
            title: "New loan",
            icon: Banknote,
          },
        ]
      : []),
  ];

  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <PageHeader
          title="Dashboard"
          description="Overview of principal, outstanding balances, and loan activity across your portfolio."
        />
        <section className="rounded-xl border border-white/10 bg-brand-950/30 p-2">
          <p className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
            Quick actions
          </p>
          <div className="flex flex-wrap gap-2">
            {quickActions.map(({ href, title, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-brand-900/40 px-3 py-1.5 text-xs font-medium text-zinc-100 transition hover:border-brand-400/30 hover:bg-brand-900/70"
              >
                <Icon className="h-3.5 w-3.5 text-brand-300" />
                {title}
              </Link>
            ))}
          </div>
        </section>
      </div>

      <Card>
        <CardContent className="p-5">
          <form className="flex flex-wrap items-end gap-3">
            <label className="text-sm text-zinc-400">
              Company filter
              <select
                name="company"
                defaultValue={selectedCompanyId ? String(selectedCompanyId) : ""}
                className="mt-1 block rounded-xl border border-white/15 bg-brand-950/50 px-3 py-2 text-sm text-zinc-100"
              >
                <option value="">All companies</option>
                {companyOptions.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <button className="inline-flex items-center rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-medium text-white">
              Apply
            </button>
            <ButtonLink href="/" variant="ghost">
              Clear
            </ButtonLink>
          </form>
        </CardContent>
      </Card>

      <div className="stat-grid grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={PiggyBank}
          label="Total principal"
          value={centsToDisplay(s.totalPrincipalCents)}
          hint="All loans"
        />
        <StatCard
          icon={TrendingDown}
          label="Remaining balance"
          value={centsToDisplay(s.totalOwedRemainingCents)}
          hint="Installments outstanding"
        />
        <StatCard
          icon={Banknote}
          label="Active loans"
          value={String(s.activeLoans)}
          hint="In repayment"
        />
        <StatCard
          icon={Building2}
          label="Completed loans"
          value={String(s.completedLoans)}
          hint="Fully paid"
        />
      </div>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardContent className="p-5">
            <div className="mb-4 flex items-center gap-2">
              <CalendarClock className="h-4 w-4 text-brand-300" />
              <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">
                Latest 3 loans
              </h3>
            </div>
            {s.latestLoans.length === 0 ? (
              <p className="text-sm text-zinc-500">No loans found.</p>
            ) : (
              <ul className="space-y-3">
                {s.latestLoans.map((l) => (
                  <li key={l.loan_id} className="rounded-xl border border-white/10 bg-brand-950/30 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium text-zinc-100">
                        Loan #{l.loan_id} · {l.employee_name}
                      </p>
                      <Badge variant={l.status === "active" ? "success" : "muted"}>
                        {l.status}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-zinc-500">
                      {l.company_name} · {centsToDisplay(l.principal_cents)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="mb-4 flex items-center gap-2">
              <ClockAlert className="h-4 w-4 text-amber-300" />
              <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">
                Alerts (overdue/skipped)
              </h3>
            </div>
            {s.alerts.length === 0 ? (
              <p className="text-sm text-zinc-500">No alerts right now.</p>
            ) : (
              <ul className="space-y-2">
                {s.alerts.map((a) => (
                  <li
                    key={`${a.status}-${a.installment_id}`}
                    className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-brand-950/30 p-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-zinc-100">
                        Loan #{a.loan_id} · {a.employee_name}
                      </p>
                      <p className="truncate text-xs text-zinc-500">
                        {a.company_name} · due {a.due_date}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <Badge variant={a.status === "overdue" ? "warning" : "muted"}>
                        {a.status}
                      </Badge>
                      <p className="mt-1 text-xs text-zinc-400">
                        {centsToDisplay(a.amount_cents)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-4">
              <Link
                href="/loans"
                className="inline-flex items-center gap-1 text-sm font-medium text-brand-400 hover:text-brand-300"
              >
                Review loans
                <AlertTriangle className="h-4 w-4" />
              </Link>
            </div>
          </CardContent>
        </Card>
      </section>

      <section>
        <details className="group rounded-2xl border border-white/10 bg-brand-900/30">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 marker:hidden">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-300">
                Quick payment register
              </h2>
              <p className="text-xs text-zinc-500">
                Expand to record payments quickly for active loans.
              </p>
            </div>
            <div className="flex items-center gap-2 text-brand-300">
              <span className="text-xs font-semibold uppercase tracking-wide">Expand</span>
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-brand-400/40 bg-brand-500/10">
                <ChevronDown className="h-5 w-5 transition-transform duration-200 group-open:rotate-180" />
              </span>
            </div>
          </summary>
          <div className="px-5 pb-5">
            <QuickPaymentRegister rows={s.quickLoans} />
          </div>
        </details>
      </section>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="flex flex-col gap-3 p-5">
        <div className="flex items-start justify-between gap-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
            {label}
          </span>
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500/25 to-brand-700/20 text-brand-300 ring-1 ring-brand-400/30">
            <Icon className="h-4 w-4" />
          </span>
        </div>
        <p className="text-2xl font-bold tabular-nums tracking-tight text-zinc-50">
          {value}
        </p>
        <p className="text-xs text-zinc-500">{hint}</p>
      </CardContent>
    </Card>
  );
}
