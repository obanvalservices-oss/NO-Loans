import { DesktopSidebar, MobileNav } from "@/components/layout/app-sidebar";
import { PageTransition } from "@/components/layout/page-transition";
import { getEffectiveNavFlags } from "@/lib/app-policies";
import { getSession } from "@/lib/session";
import { getSystemSettings } from "@/lib/system-settings";
import { redirect } from "next/navigation";

export default async function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession();
  if (!session) redirect("/login");

  const system = await getSystemSettings();
  const nav = await getEffectiveNavFlags(session, system);

  return (
    <div className="flex min-h-screen print:h-auto print:min-h-0 print:max-h-none print:overflow-visible">
      <DesktopSidebar
        email={session.email}
        role={session.role}
        brandingSubtitle={system.brandingSubtitle}
        sidebarHelpText={system.sidebarHelpText}
        showWeeklyReport={nav.showWeeklyReport}
      />
      <div className="flex min-h-screen min-w-0 flex-1 flex-col print:h-auto print:min-h-0 print:max-h-none print:overflow-visible">
        <MobileNav
          email={session.email}
          role={session.role}
          brandingSubtitle={system.brandingSubtitle}
          showWeeklyReport={nav.showWeeklyReport}
        />
        <main className="relative min-h-0 min-w-0 flex-1 px-4 py-8 print:h-auto print:min-h-0 print:max-h-none print:flex-none print:overflow-visible print:px-0 print:py-0 sm:px-6 lg:px-10 lg:py-10">
          <div className="mx-auto min-w-0 max-w-6xl print:mx-0 print:max-w-none print:w-full">
            <PageTransition>{children}</PageTransition>
          </div>
        </main>
      </div>
    </div>
  );
}
