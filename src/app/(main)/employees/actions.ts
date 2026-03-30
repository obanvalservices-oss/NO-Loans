"use server";

import { revalidatePath } from "next/cache";
import { getPermissionsForSession } from "@/lib/app-policies";
import { ensureCompanyAccess } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { requireCompanyScope } from "@/lib/require-auth";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";

async function assertManageEmployees(): Promise<void> {
  const session = await getSession();
  if (!session) redirect("/login");
  const perms = await getPermissionsForSession(session);
  if (session.role !== "admin" && !perms.canManageEmployees) {
    redirect("/employees");
  }
}

export async function createEmployee(formData: FormData): Promise<void> {
  await assertManageEmployees();
  const scope = await requireCompanyScope();
  const company_id = Number(formData.get("company_id"));
  const full_name = String(formData.get("full_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const id_number = String(formData.get("id_number") ?? "").trim();
  if (!full_name) return;
  if (!company_id || Number.isNaN(company_id)) return;
  ensureCompanyAccess(scope, company_id);
  await prisma.employee.create({
    data: {
      company_id,
      full_name,
      email,
      phone,
      id_number,
    },
  });
  revalidatePath("/employees");
}

export async function updateEmployee(id: number, formData: FormData): Promise<void> {
  const scope = await requireCompanyScope();
  const company_id = Number(formData.get("company_id"));
  const full_name = String(formData.get("full_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const id_number = String(formData.get("id_number") ?? "").trim();
  if (!full_name) return;
  if (!company_id || Number.isNaN(company_id)) return;
  const prev = await prisma.employee.findUnique({
    where: { id },
    select: { company_id: true },
  });
  if (!prev) return;
  ensureCompanyAccess(scope, prev.company_id);
  ensureCompanyAccess(scope, company_id);
  await prisma.employee.update({
    where: { id },
    data: {
      company_id,
      full_name,
      email,
      phone,
      id_number,
    },
  });
  revalidatePath("/employees");
}

export async function deleteEmployee(id: number): Promise<void> {
  await assertManageEmployees();
  const scope = await requireCompanyScope();
  const prev = await prisma.employee.findUnique({
    where: { id },
    select: { company_id: true },
  });
  if (!prev) return;
  ensureCompanyAccess(scope, prev.company_id);
  await prisma.employee.delete({ where: { id } });
  revalidatePath("/employees");
}
