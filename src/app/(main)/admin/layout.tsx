import { AdminSubNav } from "@/components/admin/admin-sub-nav";
import { requireAdmin } from "@/lib/require-auth";

export default async function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  await requireAdmin();
  return (
    <div className="space-y-8">
      <AdminSubNav />
      {children}
    </div>
  );
}
