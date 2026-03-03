"use client";

import type { ClientFunnelConfig } from "@/lib/funnel/types";

export function FunnelFilters({
  clientId,
  clients,
  year,
  month,
  monthLabel,
  useClientRoutes,
}: {
  clientId: string;
  clients: ClientFunnelConfig[];
  year: number;
  month: number;
  monthLabel: string;
  /** When true, changing client goes to /dashboard/clients/[clientId]/funnel */
  useClientRoutes?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-6 rounded-xl border border-[var(--card-border)] bg-[var(--card)] px-5 py-4 shadow-lg">
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-[var(--muted)]">Client</span>
        <select
          className="rounded-lg border border-[var(--card-border)] bg-[var(--background)] text-sm text-[var(--foreground)] px-3 py-2 min-w-[140px]"
          value={clientId}
          onChange={(e) => {
            const newId = e.target.value;
            if (useClientRoutes) {
              window.location.href = `/dashboard/clients/${newId}/funnel`;
            } else {
              const url = new URL(window.location.href);
              url.searchParams.set("clientId", newId);
              window.location.href = url.pathname + url.search;
            }
          }}
        >
          {clients.map((c) => (
            <option key={c.clientId} value={c.clientId}>{c.clientName}</option>
          ))}
        </select>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-[var(--muted)]">Date range</span>
        <span className="text-sm font-semibold text-[var(--foreground)] px-3 py-2 rounded-lg bg-[var(--background)]">{monthLabel}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-[var(--muted)]">Pipeline type</span>
        <span className="text-sm text-[var(--foreground)] px-3 py-2 rounded-lg bg-[var(--background)]">All</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-[var(--muted)]">Rep</span>
        <span className="text-sm text-[var(--foreground)] px-3 py-2 rounded-lg bg-[var(--background)]">All Representatives</span>
      </div>
    </div>
  );
}
