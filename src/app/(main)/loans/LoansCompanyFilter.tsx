"use client";

import { selectClassName } from "@/components/ui/field";
import { Building2 } from "lucide-react";
import { useRouter } from "next/navigation";

type Company = { id: number; name: string };

export function LoansCompanyFilter({
  companies,
  companyId,
}: {
  companies: Company[];
  companyId: number;
}) {
  const router = useRouter();

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
      <label className="flex items-center gap-2 text-sm text-zinc-400">
        <Building2 className="h-4 w-4 shrink-0 text-brand-400" />
        <span className="font-semibold uppercase tracking-wide">Company</span>
      </label>
      <select
        className={`${selectClassName} max-w-md min-w-[200px]`}
        value={companyId}
        onChange={(e) => {
          const id = e.target.value;
          router.push(`/loans?company=${id}`);
        }}
      >
        {companies.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
    </div>
  );
}
