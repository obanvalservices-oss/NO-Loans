import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { getPermissionsForSession } from "@/lib/app-policies";
import { getDashboardStats } from "@/lib/loan-service";
import { centsToDisplay } from "@/lib/money";
import { requireCompanyScope, requireSession } from "@/lib/require-auth";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  Banknote,
  Building2,
  PiggyBank,
  TrendingDown,
  Users,
} from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await requireSession();
  const perms = await getPermissionsForSession(session);
  const scope = await requireCompanyScope();
  const s = await getDashboardStats(scope);

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
        <div className="grid gap-3 sm:grid-cols-3">
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
