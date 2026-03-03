"use client";

import { useRouter } from "next/navigation";
import type { Tenant } from "@prisma/client";

export function TenantSelect({
  selectedTenantId,
  tenants,
}: {
  selectedTenantId: string;
  tenants: Tenant[];
}) {
  const router = useRouter();
  return (
    <div className="mb-6">
      <label className="block text-sm font-medium text-zinc-700 mb-1">Client</label>
      <select
        value={selectedTenantId}
        className="px-3 py-2 border border-zinc-300 rounded-lg w-64"
        onChange={(e) => router.push(`/dashboard/reps?tenantId=${e.target.value}`)}
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
