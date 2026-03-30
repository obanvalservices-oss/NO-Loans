"use client";

import { LogoutForm } from "@/components/auth/logout-form";
import { cn } from "@/lib/cn";
import {
  Banknote,
  Building2,
  FileSpreadsheet,
  LayoutDashboard,
  Shield,
  Users,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

const coreLinks = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/companies", label: "Companies", icon: Building2 },
  { href: "/employees", label: "Employees", icon: Users },
  { href: "/loans", label: "Loans", icon: Banknote },
] as const;

const weeklyLink = {
  href: "/reports/weekly",
  label: "Weekly report",
  icon: FileSpreadsheet,
} as const;

const adminLink = {
  href: "/admin",
  label: "Admin",
  icon: Shield,
} as const;

function linkIsActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  if (href === "/admin") {
    return pathname === "/admin" || pathname.startsWith("/admin/");
  }
  if (href === "/reports/weekly") {
    return pathname === href || pathname.startsWith("/reports");
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavLinks({
  showAdmin,
  showWeeklyReport,
}: {
  showAdmin: boolean;
  showWeeklyReport: boolean;
}) {
  const pathname = usePathname();
  const links = [
    ...coreLinks,
    ...(showWeeklyReport ? [weeklyLink] : []),
    ...(showAdmin ? [adminLink] : []),
  ];

  return (
    <nav className="flex flex-col gap-1">
      {links.map(({ href, label, icon: Icon }) => {
        const active = linkIsActive(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
              active
                ? "bg-brand-500/15 text-white shadow-sm shadow-black/20 ring-1 ring-brand-400/25"
                : "text-zinc-400 hover:bg-white/5 hover:text-zinc-100",
            )}
          >
            <Icon
              className={cn(
                "h-5 w-5 shrink-0 transition-transform duration-200 group-hover:scale-110",
                active
                  ? "text-brand-300"
                  : "text-zinc-500 group-hover:text-brand-400",
              )}
              aria-hidden
            />
            {label}
            {active ? (
              <span className="ml-auto h-1.5 w-1.5 rounded-full bg-brand-400 shadow-[0_0_10px_rgba(125,226,209,0.85)]" />
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}

export function DesktopSidebar({
  email,
  role,
  brandingSubtitle,
  sidebarHelpText,
  showWeeklyReport,
}: {
  email: string;
  role: "admin" | "user";
  brandingSubtitle: string;
  sidebarHelpText: string;
  showWeeklyReport: boolean;
}) {
  const showAdmin = role === "admin";

  return (
    <aside className="no-print relative hidden w-64 shrink-0 flex-col border-r border-brand-800/50 bg-gradient-to-b from-brand-950 via-[#0d1a16] to-brand-900 lg:flex">
      <div className="flex h-full flex-col px-4 py-8">
        <Link
          href="/"
          className="mb-10 flex items-center gap-3 px-1 transition-opacity hover:opacity-90"
        >
          <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-2xl ring-2 ring-brand-500/35 ring-offset-2 ring-offset-brand-950 shadow-[0_0_24px_rgba(82,183,136,0.35)]">
            <Image
              src="/icon.png"
              alt="NO Loan"
              width={44}
              height={44}
              className="object-cover"
              priority
            />
          </span>
          <div>
            <p className="text-sm font-bold tracking-tight text-zinc-50">NO Loan</p>
            <p className="text-[11px] font-medium uppercase tracking-widest text-brand-400/80">
              {brandingSubtitle}
            </p>
          </div>
        </Link>
        <NavLinks showAdmin={showAdmin} showWeeklyReport={showWeeklyReport} />
        <div className="mt-auto space-y-3">
          <div className="rounded-xl border border-brand-700/40 bg-brand-950/60 p-3">
            <p className="truncate text-xs font-medium text-zinc-300" title={email}>
              {email}
            </p>
            <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-brand-400/90">
              {role}
            </p>
          </div>
          <LogoutForm />
          <div className="rounded-xl border border-brand-700/40 bg-brand-950/60 p-4">
            <p className="text-xs leading-relaxed text-zinc-500">{sidebarHelpText}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

export function MobileNav({
  email,
  role,
  brandingSubtitle,
  showWeeklyReport,
}: {
  email: string;
  role: "admin" | "user";
  brandingSubtitle: string;
  showWeeklyReport: boolean;
}) {
  return (
    <header className="no-print sticky top-0 z-30 border-b border-brand-800/60 bg-brand-950/95 backdrop-blur-md lg:hidden">
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <Link
          href="/"
          className="flex min-w-0 items-center gap-2.5 font-semibold text-zinc-50"
        >
          <span className="relative h-9 w-9 shrink-0 overflow-hidden rounded-xl ring-1 ring-brand-500/40 shadow-md shadow-brand-900/50">
            <Image
              src="/icon.png"
              alt="NO Loan"
              width={36}
              height={36}
              className="object-cover"
              priority
            />
          </span>
          <span className="flex min-w-0 flex-col leading-tight">
            <span>NO Loan</span>
            <span className="truncate text-[10px] font-medium uppercase tracking-wider text-brand-400/80">
              {brandingSubtitle}
            </span>
          </span>
        </Link>
        <div className="flex min-w-0 flex-col items-end gap-1">
          <span className="max-w-[140px] truncate text-[11px] text-zinc-400" title={email}>
            {email}
          </span>
          <LogoutForm
            formClassName="inline"
            buttonClassName="inline-flex items-center gap-1 rounded-md border border-white/10 px-2 py-1 text-[10px] font-medium text-zinc-400 transition-colors hover:border-brand-500/40 hover:text-brand-300"
          />
        </div>
      </div>
      <div className="scrollbar-none flex gap-1 overflow-x-auto border-t border-brand-800/50 px-3 pb-3 pt-1">
        <MobileNavInner
          showAdmin={role === "admin"}
          showWeeklyReport={showWeeklyReport}
        />
      </div>
    </header>
  );
}

function MobileNavInner({
  showAdmin,
  showWeeklyReport,
}: {
  showAdmin: boolean;
  showWeeklyReport: boolean;
}) {
  const pathname = usePathname();
  const links = [
    ...coreLinks,
    ...(showWeeklyReport ? [weeklyLink] : []),
    ...(showAdmin ? [adminLink] : []),
  ];
  return (
    <>
      {links.map(({ href, label, icon: Icon }) => {
        const active = linkIsActive(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex shrink-0 items-center gap-2 rounded-full px-3.5 py-2 text-xs font-medium transition-all duration-200",
              active
                ? "bg-brand-600 text-white shadow-md shadow-brand-600/30"
                : "bg-brand-900/80 text-zinc-400 ring-1 ring-white/5 hover:bg-brand-800 hover:text-zinc-200",
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </Link>
        );
      })}
    </>
  );
}
