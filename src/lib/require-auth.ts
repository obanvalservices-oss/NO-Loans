import type { CompanyScope } from "@/lib/company-scope";
import { redirect } from "next/navigation";
import { getSession, loadCompanyScope } from "@/lib/session";
import type { SessionPayload } from "@/lib/session";

export async function requireSession(): Promise<SessionPayload> {
  const s = await getSession();
  if (!s) redirect("/login");
  return s;
}

export async function requireCompanyScope(): Promise<CompanyScope> {
  const session = await requireSession();
  const userId = Number(session.sub);
  if (!Number.isInteger(userId)) redirect("/login");
  return loadCompanyScope(userId, session.role);
}

export async function requireSessionAndScope(): Promise<{
  session: SessionPayload;
  scope: CompanyScope;
}> {
  const session = await requireSession();
  const userId = Number(session.sub);
  if (!Number.isInteger(userId)) redirect("/login");
  const scope = await loadCompanyScope(userId, session.role);
  return { session, scope };
}

export async function requireAdmin(): Promise<SessionPayload> {
  const s = await requireSession();
  if (s.role !== "admin") redirect("/");
  return s;
}
