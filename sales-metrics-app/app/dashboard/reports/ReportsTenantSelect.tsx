"use client";

import { useRouter } from "next/navigation";

export function ReportsTenantSelect({
  tenants,
  selectedTenantId,
  year,
  month,
}: {
  tenants: { id: string; name: string }[];
  selectedTenantId: string;
  year: number;
  month: number;
}) {
  const router = useRouter();
  if (tenants.length <= 1) return null;
  return (
    <div className="mb-4 flex gap-4 items-center">
      <span className="text-sm text-zinc-600">Client:</span>
      <select
        value={selectedTenantId}
        className="px-3 py-2 border border-zinc-300 rounded-lg"
        onChange={(e) =>
          router.push(`/dashboard/reports?tenantId=${e.target.value}&year=${year}&month=${month}`)
        }
      >
        {tenants.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name}
          </option>
        ))}
      </select>
    </div>
  );
}
