import type { CompanyScope } from "@/lib/company-scope";
import { prisma } from "@/lib/prisma";

export type CatalogEntry = {
  id: number;
  name: string;
};

export async function listCompanyFarms(
  companyId: number,
): Promise<CatalogEntry[]> {
  return prisma.companyFarm.findMany({
    where: { company_id: companyId },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });
}

export async function listCompanyApprovers(
  companyId: number,
): Promise<CatalogEntry[]> {
  return prisma.companyApprover.findMany({
    where: { company_id: companyId },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });
}

/** For loan forms: company_id → list of names (sorted). */
export async function getFarmNamesByCompany(
  scope: CompanyScope,
): Promise<Record<number, string[]>> {
  const rows = await prisma.companyFarm.findMany({
    orderBy: { name: "asc" },
    select: { company_id: true, name: true },
  });
  const map: Record<number, string[]> = {};
  for (const r of rows) {
    if (scope.role === "user" && !scope.companyIds.includes(r.company_id)) {
      continue;
    }
    if (!map[r.company_id]) map[r.company_id] = [];
    map[r.company_id].push(r.name);
  }
  return map;
}

export async function getApproverNamesByCompany(
  scope: CompanyScope,
): Promise<Record<number, string[]>> {
  const rows = await prisma.companyApprover.findMany({
    orderBy: { name: "asc" },
    select: { company_id: true, name: true },
  });
  const map: Record<number, string[]> = {};
  for (const r of rows) {
    if (scope.role === "user" && !scope.companyIds.includes(r.company_id)) {
      continue;
    }
    if (!map[r.company_id]) map[r.company_id] = [];
    map[r.company_id].push(r.name);
  }
  return map;
}
