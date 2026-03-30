"use server";

import { revalidatePath } from "next/cache";
import { getPermissionsForSession } from "@/lib/app-policies";
import { ensureCompanyAccess } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requireCompanyScope } from "@/lib/require-auth";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";

async function assertCanEditCompanyRecord(companyId: number): Promise<void> {
  const scope = await requireCompanyScope();
  ensureCompanyAccess(scope, companyId);
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "admin") {
    const perms = await getPermissionsForSession(session);
    if (!perms.canEditCompanies) redirect("/companies");
  }
}

export async function createCompany(formData: FormData): Promise<void> {
  await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  const address_line = String(formData.get("address_line") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const header_note = String(formData.get("header_note") ?? "").trim();
  const owner_name = String(formData.get("owner_name") ?? "").trim();
  if (!name) return;
  await prisma.company.create({
    data: {
      name,
      address_line,
      phone,
      header_note,
      owner_name,
    },
  });
  revalidatePath("/companies");
}

export async function updateCompany(id: number, formData: FormData): Promise<void> {
  const scope = await requireCompanyScope();
  ensureCompanyAccess(scope, id);
  const name = String(formData.get("name") ?? "").trim();
  const address_line = String(formData.get("address_line") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const header_note = String(formData.get("header_note") ?? "").trim();
  const owner_name = String(formData.get("owner_name") ?? "").trim();
  if (!name) return;
  await prisma.company.update({
    where: { id },
    data: { name, address_line, phone, header_note, owner_name },
  });
  revalidatePath("/companies");
  revalidatePath(`/companies/${id}`);
}

export async function deleteCompany(id: number): Promise<void> {
  await requireAdmin();
  await prisma.company.delete({ where: { id } });
  revalidatePath("/companies");
}

export async function addCompanyFarm(
  companyId: number,
  formData: FormData,
): Promise<void> {
  await assertCanEditCompanyRecord(companyId);
  const name = String(formData.get("name") ?? "").trim();
  if (!name || !companyId) return;
  try {
    await prisma.companyFarm.create({
      data: { company_id: companyId, name },
    });
  } catch {
    /* UNIQUE */
  }
  revalidatePath(`/companies/${companyId}`);
  revalidatePath("/loans");
  revalidatePath("/loans/new");
  revalidatePath("/loans", "layout");
}

export async function removeCompanyFarm(
  companyId: number,
  farmId: number,
): Promise<void> {
  await assertCanEditCompanyRecord(companyId);
  if (!farmId) return;
  await prisma.companyFarm.deleteMany({
    where: { id: farmId, company_id: companyId },
  });
  revalidatePath(`/companies/${companyId}`);
  revalidatePath("/loans");
  revalidatePath("/loans/new");
  revalidatePath("/loans", "layout");
}

export async function addCompanyApprover(
  companyId: number,
  formData: FormData,
): Promise<void> {
  await assertCanEditCompanyRecord(companyId);
  const name = String(formData.get("name") ?? "").trim();
  if (!name || !companyId) return;
  try {
    await prisma.companyApprover.create({
      data: { company_id: companyId, name },
    });
  } catch {
    /* UNIQUE */
  }
  revalidatePath(`/companies/${companyId}`);
  revalidatePath("/loans");
  revalidatePath("/loans/new");
  revalidatePath("/loans", "layout");
}

export async function removeCompanyApprover(
  companyId: number,
  approverId: number,
): Promise<void> {
  await assertCanEditCompanyRecord(companyId);
  if (!approverId) return;
  await prisma.companyApprover.deleteMany({
    where: { id: approverId, company_id: companyId },
  });
  revalidatePath(`/companies/${companyId}`);
  revalidatePath("/loans");
  revalidatePath("/loans/new");
  revalidatePath("/loans", "layout");
}
