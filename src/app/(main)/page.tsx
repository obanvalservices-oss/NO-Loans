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
  ArrowRight,
  Banknote,
  Building2,
  CalendarClock,
  ClockAlert,
  PlusCircle,
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
      desc: "Edit headers & contract branding",
      icon: Building2,
    },
    {
      href: "/employees",
      title: "Employees",
      desc: "Borrower profiles",
      icon: Users,
    },
    ...(perms.canManageLoans
      ? [
          {
            href: "/loans/new",
            title: "New loan",
            desc: "Create schedule & terms",
            icon: Banknote,
          },
        ]
      : []),
  ];

  return (
    <div className="space-y-10">
      <PageHeader
        title="Dashboard"
        description="Overview of principal, outstanding balances, and loan activity across your portfolio."
      />

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

      <section>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-500">
          Quick actions
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {perms.canManageLoans ? (
            <Link href="/loans/new" className="group block">
              <Card className="h-full overflow-hidden transition-all duration-300 hover:-translate-y-0.5 hover:border-brand-400/35 hover:shadow-lg hover:shadow-brand-500/10">
                <CardContent className="flex flex-col gap-3 p-5">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/15 text-brand-300 ring-1 ring-brand-400/25">
                    <PlusCircle className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="font-semibold text-zinc-50">New loan</p>
                    <p className="mt-0.5 text-sm text-zinc-500">Quick create</p>
                  </div>
                  <span className="mt-auto inline-flex items-center gap-1 text-sm font-medium text-brand-400">
                    Open <ArrowRight className="h-4 w-4" />
                  </span>
                </CardContent>
              </Card>
            </Link>
          ) : null}
          {quickActions.map(({ href, title, desc, icon: Icon }) => (
            <Link key={href} href={href} className="group block">
              <Card className="h-full overflow-hidden transition-all duration-300 hover:-translate-y-0.5 hover:border-brand-400/35 hover:shadow-lg hover:shadow-brand-500/10">
                <CardContent className="flex flex-col gap-3 p-5">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/15 text-brand-300 ring-1 ring-brand-400/25 transition-transform duration-300 group-hover:scale-110 group-hover:bg-brand-500/25">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="font-semibold text-zinc-50">{title}</p>
                    <p className="mt-0.5 text-sm text-zinc-500">{desc}</p>
                  </div>
                  <span className="mt-auto inline-flex items-center gap-1 text-sm font-medium text-brand-400 transition-colors group-hover:text-brand-300">
                    Open
                    <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
                  </span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-500">
          Quick payment register
        </h2>
        <QuickPaymentRegister rows={s.quickLoans} />
      </section>

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
