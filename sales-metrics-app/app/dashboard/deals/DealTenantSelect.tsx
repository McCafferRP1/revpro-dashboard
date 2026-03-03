"use client";

import { useRouter } from "next/navigation";

export function DealTenantSelect({
  tenants,
  selectedTenantId,
}: {
  tenants: { id: string; name: string }[];
  selectedTenantId: string;
}) {
  const router = useRouter();
  return (
    <select
      value={selectedTenantId}
      className="px-3 py-2 border border-zinc-300 rounded-lg w-64"
      onChange={(e) => router.push(`/dashboard/deals?tenantId=${e.target.value}`)}
    >
      {tenants.map((t) => (
        <option key={t.id} value={t.id}>
          {t.name}
        </option>
      ))}
    </select>
  );
}
