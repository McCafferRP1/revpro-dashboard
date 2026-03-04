"use client";

import type { ClientFunnelConfig } from "@/lib/funnel/types";
import Link from "next/link";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export function FunnelFilters({
  clientId,
  clients,
  year,
  month,
  monthLabel,
  currentYear,
  currentMonth,
  lastMonthYear,
  lastMonthMonth,
  lastMonthLabel,
  useClientRoutes,
}: {
  clientId: string;
  clients: ClientFunnelConfig[];
  year: number;
  month: number;
  monthLabel: string;
  currentYear?: number;
  currentMonth?: number;
  lastMonthYear?: number;
  lastMonthMonth?: number;
  lastMonthLabel?: string;
  /** When true, changing client goes to /dashboard/clients/[clientId]/funnel */
  useClientRoutes?: boolean;
}) {
  const now = new Date();
  const currY = currentYear ?? now.getFullYear();
  const currM = currentMonth ?? now.getMonth() + 1;
  const isViewingThisMonth = year === currY && month === currM;
  // Next.js Link auto-prefixes basePath; use path without basePath to avoid /app/app/... 404
  const funnelPath = useClientRoutes ? `/dashboard/clients/${clientId}/funnel` : `/dashboard/funnel`;

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
              window.location.href = `${basePath}/dashboard/clients/${newId}/funnel?year=${year}&month=${month}`;
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
        <div className="flex gap-1">
          <Link
            href={`${funnelPath}?year=${currY}&month=${currM}`}
            className={`px-3 py-2 text-sm rounded-lg ${isViewingThisMonth ? "bg-[var(--accent)] text-white font-medium" : "bg-[var(--background)] text-[var(--foreground)]"}`}
          >
            This month
          </Link>
          {lastMonthYear != null && lastMonthMonth != null && (
            <Link
              href={`${funnelPath}?year=${lastMonthYear}&month=${lastMonthMonth}`}
              className={`px-3 py-2 text-sm rounded-lg ${!isViewingThisMonth && year === lastMonthYear && month === lastMonthMonth ? "bg-[var(--accent)] text-white font-medium" : "bg-[var(--background)] text-[var(--foreground)]"}`}
            >
              {lastMonthLabel ?? "Last month"}
            </Link>
          )}
        </div>
        <span className="text-sm text-[var(--muted)]">{monthLabel}</span>
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
