"use client";

import { Field, inputClassName, selectClassName } from "@/components/ui/field";
import { useMemo } from "react";

type Props = {
  companyId: number | "";
  farmNames: string[];
  approverNames: string[];
  defaultFarm?: string;
  defaultApprovedBy?: string;
};

/** Farm + approver: dropdowns when the company has catalog entries; otherwise free text. */
export function FarmApproverFields({
  companyId,
  farmNames,
  approverNames,
  defaultFarm,
  defaultApprovedBy,
}: Props) {
  const farmList = useMemo(() => {
    if (!defaultFarm?.trim()) return farmNames;
    const s = new Set(farmNames);
    if (s.has(defaultFarm)) return farmNames;
    return [defaultFarm, ...farmNames];
  }, [farmNames, defaultFarm]);

  const approverList = useMemo(() => {
    if (!defaultApprovedBy?.trim()) return approverNames;
    const s = new Set(approverNames);
    if (s.has(defaultApprovedBy)) return approverNames;
    return [defaultApprovedBy, ...approverNames];
  }, [approverNames, defaultApprovedBy]);

  if (companyId === "") {
    return null;
  }

  return (
    <>
      <Field label="Farm / workplace" className="sm:col-span-2">
        {farmList.length > 0 ? (
          <select
            name="farm"
            required
            className={selectClassName}
            defaultValue={defaultFarm ?? ""}
          >
            <option value="">Select…</option>
            {farmList.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        ) : (
          <>
            <input
              name="farm"
              required
              defaultValue={defaultFarm}
              className={inputClassName}
              placeholder="e.g. Kaolin ROCCO — or add farms on the company page"
            />
            <p className="mt-2 text-xs text-zinc-500">
              No farms listed for this company yet. Add them under{" "}
              <strong>Companies → this company</strong> to use a dropdown next time.
            </p>
          </>
        )}
      </Field>
      <Field label="Approved by" className="sm:col-span-2">
        {approverList.length > 0 ? (
          <select
            name="approved_by"
            required
            className={selectClassName}
            defaultValue={defaultApprovedBy ?? ""}
          >
            <option value="">Select…</option>
            {approverList.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        ) : (
          <>
            <input
              name="approved_by"
              required
              defaultValue={defaultApprovedBy}
              className={inputClassName}
              placeholder="Full name — or add approvers on the company page"
            />
            <p className="mt-2 text-xs text-zinc-500">
              No approvers listed yet. Add them under{" "}
              <strong>Companies → this company</strong> to use a dropdown next time.
            </p>
          </>
        )}
      </Field>
    </>
  );
}
