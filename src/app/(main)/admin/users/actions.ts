"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-auth";

export async function createUser(formData: FormData): Promise<void> {
  await requireAdmin();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const roleRaw = String(formData.get("role") ?? "user");
  if (!email || !password) return;
  const role = roleRaw === "admin" ? "admin" : "user";
  const hash = bcrypt.hashSync(password, 10);
  try {
    await prisma.user.create({
      data: {
        email,
        password_hash: hash,
        role,
      },
    });
  } catch {
    /* UNIQUE email */
  }
  revalidatePath("/admin/users");
  revalidatePath("/admin");
}

export async function updateUserCompanies(
  userId: number,
  formData: FormData,
): Promise<void> {
  await requireAdmin();
  const allCompanies = await prisma.company.findMany({
    select: { id: true },
  });
  const selected = new Set<number>();
  for (const c of allCompanies) {
    const v = formData.get(`company_${c.id}`);
    if (v === "on") selected.add(c.id);
  }
  await prisma.$transaction([
    prisma.userCompanyAccess.deleteMany({ where: { user_id: userId } }),
    prisma.userCompanyAccess.createMany({
      data: [...selected].map((company_id) => ({ user_id: userId, company_id })),
    }),
  ]);
  revalidatePath("/admin/users");
}

function bit(formData: FormData, name: string): boolean {
  return formData.get(name) === "on";
}

export async function updateUserPermissions(
  userId: number,
  formData: FormData,
): Promise<void> {
  await requireAdmin();
  await prisma.userPermission.upsert({
    where: { user_id: userId },
    create: {
      user_id: userId,
      can_manage_loans: bit(formData, "can_manage_loans"),
      can_manage_employees: bit(formData, "can_manage_employees"),
      can_edit_companies: bit(formData, "can_edit_companies"),
      can_view_weekly_report: bit(formData, "can_view_weekly_report"),
      can_print_contracts: bit(formData, "can_print_contracts"),
    },
    update: {
      can_manage_loans: bit(formData, "can_manage_loans"),
      can_manage_employees: bit(formData, "can_manage_employees"),
      can_edit_companies: bit(formData, "can_edit_companies"),
      can_view_weekly_report: bit(formData, "can_view_weekly_report"),
      can_print_contracts: bit(formData, "can_print_contracts"),
    },
  });
  revalidatePath("/admin/users");
  revalidatePath("/", "layout");
}

export async function deleteUser(userId: number): Promise<void> {
  const session = await requireAdmin();
  if (Number(session.sub) === userId) return;
  const row = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (!row || row.role === "admin") return;
  await prisma.user.delete({ where: { id: userId } });
  revalidatePath("/admin/users");
}
