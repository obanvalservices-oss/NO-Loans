import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import {
  LayoutGrid,
  Palette,
  Shield,
  Users,
} from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default function AdminOverviewPage() {
  return (
    <div className="space-y-10">
      <PageHeader
        title="Admin panel"
        description="Manage users, company access, permissions, and how the app behaves for your organization."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <AdminCard
          href="/admin/users"
          icon={Users}
          title="Users & permissions"
          description="Create accounts, assign companies, and control who can manage loans, employees, and reports."
        />
        <AdminCard
          href="/admin/features"
          icon={Palette}
          title="Features & branding"
          description="Toggle modules, set default loan hints, and customize sidebar text."
        />
        <Card className="border-brand-500/20 bg-brand-950/30">
          <CardContent className="flex gap-4 p-6">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-500/15 text-brand-300 ring-1 ring-brand-400/25">
              <LayoutGrid className="h-6 w-6" />
            </span>
            <div>
              <p className="font-semibold text-zinc-100">Tip</p>
              <p className="mt-1 text-sm leading-relaxed text-zinc-500">
                Users only see companies you assign. Admins always see everything.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function AdminCard({
  href,
  icon: Icon,
  title,
  description,
}: {
  href: string;
  icon: typeof Shield;
  title: string;
  description: string;
}) {
  return (
    <Link href={href} className="group block">
      <Card className="h-full overflow-hidden transition-all duration-300 hover:-translate-y-0.5 hover:border-brand-400/35 hover:shadow-lg hover:shadow-brand-500/10">
        <CardContent className="flex gap-4 p-6">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-500/15 text-brand-300 ring-1 ring-brand-400/25 transition-transform duration-300 group-hover:scale-105">
            <Icon className="h-6 w-6" />
          </span>
          <div>
            <p className="font-semibold text-zinc-50">{title}</p>
            <p className="mt-1 text-sm leading-relaxed text-zinc-500">
              {description}
            </p>
            <p className="mt-3 text-sm font-medium text-brand-400 group-hover:text-brand-300">
              Open →
            </p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
