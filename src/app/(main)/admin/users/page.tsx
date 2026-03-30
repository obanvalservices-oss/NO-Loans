import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, inputClassName, selectClassName } from "@/components/ui/field";
import { PageHeader } from "@/components/ui/page-header";
import { getUserPermissions } from "@/lib/user-permissions";
import { prisma } from "@/lib/prisma";
import {
  createUser,
  deleteUser,
  updateUserCompanies,
  updateUserPermissions,
} from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const users = await prisma.user.findMany({
    orderBy: { email: "asc" },
    select: { id: true, email: true, role: true },
  });

  const companies = await prisma.company.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  const accessRows = await prisma.userCompanyAccess.findMany({
    orderBy: [{ user_id: "asc" }, { company_id: "asc" }],
    select: { user_id: true, company_id: true },
  });

  const accessByUser = new Map<number, Set<number>>();
  for (const r of accessRows) {
    if (!accessByUser.has(r.user_id)) accessByUser.set(r.user_id, new Set());
    accessByUser.get(r.user_id)!.add(r.company_id);
  }

  const permissionsForUsers = await Promise.all(
    users.map((u) =>
      u.role === "user" ? getUserPermissions(u.id) : Promise.resolve(null),
    ),
  );

  return (
    <div className="space-y-10">
      <PageHeader
        title="Users & permissions"
        description="Create accounts, assign companies, and choose what each user can do. Admins always have full access."
      />

      <Card>
        <CardHeader>
          <CardTitle>Add user</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-5 sm:grid-cols-2" action={createUser}>
            <Field label="Email">
              <input
                name="email"
                type="email"
                required
                autoComplete="off"
                className={inputClassName}
              />
            </Field>
            <Field label="Password">
              <input
                name="password"
                type="password"
                required
                autoComplete="new-password"
                className={inputClassName}
              />
            </Field>
            <Field label="Role" className="sm:col-span-2">
              <select name="role" className={selectClassName} defaultValue="user">
                <option value="user">User (scoped companies)</option>
                <option value="admin">Admin</option>
              </select>
            </Field>
            <div className="sm:col-span-2">
              <Button type="submit">Create user</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <section className="space-y-6">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">
          Existing users
        </h2>
        {users.map((u, idx) => {
          const allowed = accessByUser.get(u.id) ?? new Set<number>();
          const updateAccess = updateUserCompanies.bind(null, u.id);
          const perms = permissionsForUsers[idx];
          const savePerms = updateUserPermissions.bind(null, u.id);
          const del = deleteUser.bind(null, u.id);
          return (
            <Card key={u.id}>
              <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-4">
                <div>
                  <CardTitle className="text-lg">{u.email}</CardTitle>
                  <p className="mt-1 text-sm capitalize text-zinc-500">{u.role}</p>
                </div>
                {u.role !== "admin" ? (
                  <form action={del}>
                    <Button type="submit" variant="danger">
                      Delete user
                    </Button>
                  </form>
                ) : (
                  <span className="text-xs text-zinc-500">Admin accounts cannot be deleted here.</span>
                )}
              </CardHeader>
              {u.role === "user" && perms ? (
                <CardContent className="space-y-8">
                  <div>
                    <p className="mb-3 text-sm font-medium text-zinc-300">
                      What they can do
                    </p>
                    <form action={savePerms} className="space-y-3">
                      <PermRow
                        name="can_manage_loans"
                        label="Manage loans"
                        hint="Create, edit, pay, delete loans"
                        defaultChecked={perms.canManageLoans}
                      />
                      <PermRow
                        name="can_manage_employees"
                        label="Manage employees"
                        hint="Add and edit employees"
                        defaultChecked={perms.canManageEmployees}
                      />
                      <PermRow
                        name="can_edit_companies"
                        label="Edit companies"
                        hint="Company profile and farms / approvers"
                        defaultChecked={perms.canEditCompanies}
                      />
                      <PermRow
                        name="can_view_weekly_report"
                        label="Weekly report"
                        hint="See payroll deductions report"
                        defaultChecked={perms.canViewWeeklyReport}
                      />
                      <PermRow
                        name="can_print_contracts"
                        label="Print contracts"
                        hint="Open printable loan contracts"
                        defaultChecked={perms.canPrintContracts}
                      />
                      <Button type="submit" variant="secondary" className="mt-2">
                        Save permissions
                      </Button>
                    </form>
                  </div>
                  <div>
                    <p className="mb-3 text-sm font-medium text-zinc-300">
                      What they can see
                    </p>
                    <p className="mb-4 text-sm text-zinc-400">
                      Companies this user may access:
                    </p>
                  <form action={updateAccess} className="space-y-4">
                    <div className="grid gap-3 sm:grid-cols-2">
                      {companies.length === 0 ? (
                        <p className="text-sm text-zinc-500">
                          No companies in the system yet.
                        </p>
                      ) : (
                        companies.map((c) => (
                          <label
                            key={c.id}
                            className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/10 bg-brand-950/40 px-4 py-3 text-sm"
                          >
                            <input
                              type="checkbox"
                              name={`company_${c.id}`}
                              defaultChecked={allowed.has(c.id)}
                              className="h-4 w-4 rounded border-white/20 bg-brand-950"
                            />
                            <span className="text-zinc-200">{c.name}</span>
                          </label>
                        ))
                      )}
                    </div>
                    {companies.length > 0 ? (
                      <Button type="submit">Save access</Button>
                    ) : null}
                  </form>
                  </div>
                </CardContent>
              ) : (
                <CardContent>
                  <p className="text-sm text-zinc-500">
                    Administrators have full access to all companies and settings.
                  </p>
                </CardContent>
              )}
            </Card>
          );
        })}
      </section>
    </div>
  );
}

function PermRow({
  name,
  label,
  hint,
  defaultChecked,
}: {
  name: string;
  label: string;
  hint: string;
  defaultChecked: boolean;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/10 bg-brand-950/40 px-4 py-3">
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        className="mt-0.5 h-4 w-4 rounded border-white/20 bg-brand-950"
      />
      <span>
        <span className="font-medium text-zinc-200">{label}</span>
        <span className="mt-0.5 block text-xs text-zinc-500">{hint}</span>
      </span>
    </label>
  );
}
