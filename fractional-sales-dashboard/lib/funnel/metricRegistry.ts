import type { RepRole } from "./types";

/**
 * App-wide metric registry. Keys are used in per-client kpiMetricKeys to choose which KPIs appear.
 * hasTarget: if true, we show target and pacing on the card.
 * roleRelevant: if set, this metric is shown for rep dashboards only for these roles (setter vs closer).
 */
export interface MetricDef {
  key: string;
  label: string;
  hasTarget: boolean;
  format?: "number" | "currency" | "percent" | "days";
  /** If set, rep dashboard shows this KPI only for these roles; if omitted, shown for all roles. */
  roleRelevant?: RepRole[];
}

export const METRIC_REGISTRY: MetricDef[] = [
  { key: "leadsIn", label: "Leads In", hasTarget: true, format: "number", roleRelevant: ["setter"] },
  { key: "discoveryScheduled", label: "Discovery Scheduled", hasTarget: true, format: "number", roleRelevant: ["setter"] },
  { key: "discoveryCompleteRate", label: "Discovery Complete Rate", hasTarget: false, format: "percent", roleRelevant: ["setter"] },
  { key: "clarityScheduledConfirmed", label: "Clarity Scheduled / Confirmed", hasTarget: true, format: "number", roleRelevant: ["setter"] },
  { key: "clarityCompleteRate", label: "Clarity Complete Rate", hasTarget: false, format: "percent", roleRelevant: ["setter"] },
  { key: "closedWonCount", label: "Closed Won (count)", hasTarget: true, format: "number", roleRelevant: ["closer"] },
  { key: "closedWonValue", label: "Revenue booked", hasTarget: true, format: "currency", roleRelevant: ["closer"] },
  { key: "closedWonCashCollected", label: "Cash collected (at point of sale)", hasTarget: true, format: "currency", roleRelevant: ["closer"] },
  { key: "winRate", label: "Win Rate", hasTarget: false, format: "percent", roleRelevant: ["closer"] },
  { key: "avgDealSize", label: "Avg Deal Size", hasTarget: false, format: "currency", roleRelevant: ["closer"] },
  { key: "avgCycleDays", label: "Avg Cycle (days)", hasTarget: false, format: "days", roleRelevant: ["closer"] },
];

export const METRIC_KEYS_TO_LABEL: Record<string, string> = Object.fromEntries(
  METRIC_REGISTRY.map((m) => [m.key, m.label])
);

export function getMetricDef(key: string): MetricDef | undefined {
  return METRIC_REGISTRY.find((m) => m.key === key);
}

/** Returns metric keys to show on rep dashboard for the given role (setter vs closer). */
export function getMetricKeysForRole(role: RepRole | undefined): string[] {
  if (!role) return METRIC_REGISTRY.map((m) => m.key);
  return METRIC_REGISTRY.filter(
    (m) => !m.roleRelevant || m.roleRelevant.includes(role)
  ).map((m) => m.key);
}

/** Rep dashboard KPI card: metric key and how to display it for rep vs team. */
export interface RepKpiCard {
  key: string;
  label: string;
  repValue: number | string;
  teamAvg: number | string;
  pacingPct: number | null;
  format?: "number" | "currency" | "percent" | "days";
}

/** Build rep KPI cards for the given role (setter vs closer). Uses repSummary and teamMetrics. */
export function buildRepKpiCards(
  role: RepRole | undefined,
  repSummary: {
    discoveryCalls: number;
    clarityCalls: number;
    closedWonCount: number;
    closedWonValue: number;
    closedWonCashCollected?: number;
    winRatePct: number;
    avgCycleDays: number;
    pacingPct?: number | null;
    discoveryPacingPct?: number | null;
  } | null,
  teamMetrics: { repSummaries: { discoveryCalls: number; clarityCalls: number; closedWonCount: number; closedWonValue: number; closedWonCashCollected?: number; winRatePct: number }[] }
): RepKpiCard[] {
  const keys = getMetricKeysForRole(role);
  const n = teamMetrics.repSummaries.length || 1;
  const teamTotal = (k: "discoveryCalls" | "clarityCalls" | "closedWonCount" | "closedWonValue" | "closedWonCashCollected") =>
    teamMetrics.repSummaries.reduce((s, r) => s + (r[k] ?? 0), 0);
  const teamAvgDiscovery = Math.round(teamTotal("discoveryCalls") / n);
  const teamAvgClarity = Math.round(teamTotal("clarityCalls") / n);
  const teamAvgCWCount = Math.round(teamTotal("closedWonCount") / n);
  const teamAvgCWValue = Math.round(teamTotal("closedWonValue") / n);
  const teamAvgCashCollected = Math.round(teamTotal("closedWonCashCollected") / n);
  const teamWinRateAvg = teamMetrics.repSummaries.length
    ? Math.round(teamMetrics.repSummaries.reduce((s, r) => s + r.winRatePct, 0) / teamMetrics.repSummaries.length)
    : 0;

  const valueMap: Record<string, { rep: number | string; team: number | string; pacing: number | null; format?: RepKpiCard["format"] }> = {
    leadsIn: { rep: repSummary?.discoveryCalls ?? 0, team: teamAvgDiscovery, pacing: repSummary?.discoveryPacingPct ?? null, format: "number" },
    discoveryScheduled: { rep: repSummary?.discoveryCalls ?? 0, team: teamAvgDiscovery, pacing: repSummary?.discoveryPacingPct ?? null, format: "number" },
    discoveryCompleteRate: { rep: 0, team: 0, pacing: null, format: "percent" },
    clarityScheduledConfirmed: { rep: repSummary?.clarityCalls ?? 0, team: teamAvgClarity, pacing: null, format: "number" },
    clarityCompleteRate: { rep: 0, team: 0, pacing: null, format: "percent" },
    closedWonCount: { rep: repSummary?.closedWonCount ?? 0, team: teamAvgCWCount, pacing: null, format: "number" },
    closedWonValue: { rep: repSummary?.closedWonValue ?? 0, team: teamAvgCWValue, pacing: repSummary?.pacingPct ?? null, format: "currency" },
    closedWonCashCollected: { rep: repSummary?.closedWonCashCollected ?? 0, team: teamAvgCashCollected, pacing: null, format: "currency" },
    winRate: { rep: repSummary?.winRatePct ?? 0, team: teamWinRateAvg, pacing: null, format: "percent" },
    avgDealSize: { rep: repSummary?.closedWonValue && repSummary?.closedWonCount ? Math.round(repSummary.closedWonValue / repSummary.closedWonCount) : 0, team: teamAvgCWValue, pacing: null, format: "currency" },
    avgCycleDays: { rep: repSummary?.avgCycleDays ?? 0, team: 0, pacing: null, format: "days" },
  };

  return keys.map((key) => {
    const def = getMetricDef(key);
    const v = valueMap[key] ?? { rep: 0, team: 0, pacing: null };
    const fmt = (x: number | string, f?: string) => {
      if (typeof x !== "number") return x;
      if (f === "currency") return `$${x.toLocaleString()}`;
      if (f === "percent") return `${x}%`;
      if (f === "days") return `${x}d`;
      return x.toLocaleString();
    };
    return {
      key,
      label: def?.label ?? key,
      repValue: fmt(v.rep, v.format ?? def?.format),
      teamAvg: fmt(v.team, v.format ?? def?.format),
      pacingPct: v.pacing,
      format: (v.format ?? def?.format) as RepKpiCard["format"],
    };
  });
}
