"use client";

import type { ClientFunnelConfig } from "@/lib/funnel/types";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export function RepFilters({
  clientId,
  clients,
  repId,
  reps,
  year,
  month,
  monthLabel,
  mode,
}: {
  clientId: string;
  clients: ClientFunnelConfig[];
  repId: string;
  reps: { id: string; name: string }[];
  year: number;
  month: number;
  monthLabel: string;
  /** global = /dashboard/rep/[repId]?clientId=...; clientTab = /dashboard/clients/[clientId]/reps?repId=... */
  mode?: "global" | "clientTab";
}) {
  const navMode = mode ?? "global";
  return (
    <div className="flex flex-wrap items-center gap-6 rounded-xl border border-[var(--card-border)] bg-[var(--card)] px-5 py-4 shadow-lg">
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-[var(--muted)]">Client</span>
        <select
          className="rounded-lg border border-[var(--card-border)] bg-[var(--background)] text-sm text-[var(--foreground)] px-3 py-2 min-w-[140px]"
          value={clientId}
          onChange={(e) => {
            const newClientId = e.target.value;
            if (navMode === "clientTab") {
              const params = new URLSearchParams({ repId, year: String(year), month: String(month) });
              window.location.href = `${basePath}/dashboard/clients/${newClientId}/reps?${params.toString()}`;
              return;
            }
            const url = new URL(window.location.href);
            url.pathname = `${basePath}/dashboard/rep/${repId}`;
            url.searchParams.set("clientId", newClientId);
            window.location.href = url.pathname + url.search;
          }}
        >
          {clients.map((c) => (
            <option key={c.clientId} value={c.clientId}>{c.clientName}</option>
          ))}
        </select>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-[var(--muted)]">Rep Name</span>
        <select
          className="rounded-lg border border-[var(--card-border)] bg-[var(--background)] text-sm text-[var(--foreground)] px-3 py-2 min-w-[140px]"
          value={repId}
          onChange={(e) => {
            const newRepId = e.target.value;
            if (navMode === "clientTab") {
              const params = new URLSearchParams({ repId: newRepId, year: String(year), month: String(month) });
              window.location.href = `${basePath}/dashboard/clients/${clientId}/reps?${params.toString()}`;
              return;
            }
            window.location.href = `${basePath}/dashboard/rep/${newRepId}?clientId=${clientId}`;
          }}
        >
          {reps.map((r) => (
            <option key={r.id} value={r.id}>{r.name}</option>
          ))}
        </select>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-[var(--muted)]">Date range</span>
        <span className="text-sm font-semibold text-[var(--foreground)] px-3 py-2 rounded-lg bg-[var(--background)]">{monthLabel}</span>
      </div>
    </div>
  );
}
