"use client";

import { useRouter } from "next/navigation";
import type { ClientFunnelConfig } from "@/lib/funnel/types";

export function TargetsPageSelector({
  clientId,
  clients,
  year,
  month,
  monthLabel,
}: {
  clientId: string;
  clients: ClientFunnelConfig[];
  year: number;
  month: number;
  monthLabel: string;
}) {
  const router = useRouter();
  return (
    <div className="flex flex-wrap items-center gap-4 rounded-xl border border-[var(--card-border)] bg-[var(--card)] px-4 py-3">
      <span className="text-xs font-medium text-[var(--muted)] uppercase tracking-wider">Selection</span>
      <div className="flex items-center gap-2">
        <span className="text-xs text-[var(--muted)]">Client:</span>
        <select
          className="rounded-md border border-[var(--card-border)] bg-[var(--background)] text-sm text-[var(--foreground)] px-2 py-1"
          value={clientId}
          onChange={(e) => {
            const params = new URLSearchParams({ clientId: e.target.value, year: String(year), month: String(month) });
            router.push(`/dashboard/targets?${params}`);
          }}
        >
          {clients.map((c) => (
            <option key={c.clientId} value={c.clientId}>{c.clientName}</option>
          ))}
        </select>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs text-[var(--muted)]">Month:</span>
        <span className="text-sm font-medium text-[var(--foreground)]">{monthLabel}</span>
      </div>
    </div>
  );
}
