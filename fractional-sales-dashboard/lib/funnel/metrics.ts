import type {
  ClientFunnelConfig,
  Opportunity,
  MonthlyTarget,
  KpiWithPacing,
  ConversionRow,
  RepSummary,
  StageTransitionRow,
  RepWeeklyPoint,
} from "./types";
import { getMockOpportunities, getMockLeadsIn, getRepsForClient } from "./mockData";

/** Pacing % = MTD / (target * (daysElapsed / daysInMonth)). 100% = on track. */
export function computePacing(mtd: number, target: number, year: number, month: number): number | null {
  if (target <= 0) return null;
  const now = new Date();
  const isCurrentMonth = now.getFullYear() === year && now.getMonth() + 1 === month;
  if (!isCurrentMonth) return null;
  const daysInMonth = new Date(year, month, 0).getDate();
  const daysElapsed = Math.min(now.getDate(), daysInMonth);
  if (daysElapsed <= 0) return null;
  const expected = target * (daysElapsed / daysInMonth);
  if (expected <= 0) return null;
  return Math.round((mtd / expected) * 100);
}

function getMonthBounds(year: number, month: number) {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0, 23, 59, 59, 999);
  return { start, end };
}

/** Count opportunities created in period (lead-in) or that entered a stage in period. */
function countInPeriod(
  opps: Opportunity[],
  clientId: string,
  year: number,
  month: number,
  kind: "created" | "stageEntered"
): number {
  const { start, end } = getMonthBounds(year, month);
  return opps.filter((o) => {
    if (o.clientId !== clientId) return false;
    const date = kind === "created" ? o.dateCreated : o.dateStageEntered;
    return date >= start && date <= end;
  }).length;
}

function countByStage(opps: Opportunity[], clientId: string, year: number, month: number, stageOrder: number): number {
  const { start, end } = getMonthBounds(year, month);
  return opps.filter(
    (o) =>
      o.clientId === clientId &&
      o.stageOrder === stageOrder &&
      o.dateStageEntered >= start &&
      o.dateStageEntered <= end
  ).length;
}

function closedWonInPeriod(opps: Opportunity[], clientId: string, year: number, month: number): { count: number; value: number; cashCollected: number } {
  const { start, end } = getMonthBounds(year, month);
  const won = opps.filter(
    (o) => o.clientId === clientId && o.outcome === "won" && o.dateClosed && o.dateClosed >= start && o.dateClosed <= end
  );
  return {
    count: won.length,
    value: won.reduce((s, o) => s + o.amount, 0),
    cashCollected: won.reduce((s, o) => s + (o.cashCollected ?? 0), 0),
  };
}

/** Previous calendar week (Mon 00:00:00 – Sun 23:59:59). */
export function getPreviousWeekBounds(): { start: Date; end: Date } {
  const now = new Date();
  const day = now.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const lastMonday = new Date(now);
  lastMonday.setDate(now.getDate() + mondayOffset - 7);
  lastMonday.setHours(0, 0, 0, 0);
  const lastSunday = new Date(lastMonday);
  lastSunday.setDate(lastMonday.getDate() + 6);
  lastSunday.setHours(23, 59, 59, 999);
  return { start: lastMonday, end: lastSunday };
}

export interface ClientWeekMetrics {
  clientId: string;
  start: Date;
  end: Date;
  leadsIn: number;
  discoveryScheduled: number;
  clarityScheduledConfirmed: number;
  closedWonCount: number;
  closedWonValue: number;
  closedWonCashCollected: number;
  winRatePct: number;
  repSummaries: { repId: string; repName: string; closedWonValue: number; closedWonCashCollected: number; discoveryCalls: number; clarityCalls: number }[];
}

/** Client metrics for an arbitrary date range (e.g. previous week). */
export function getClientMetricsForDateRange(
  config: ClientFunnelConfig,
  start: Date,
  end: Date
): ClientWeekMetrics {
  const opps = getMockOpportunities().filter((o) => o.clientId === config.clientId);
  const leadOpps = opps.filter((o) => o.dateCreated >= start && o.dateCreated <= end);
  const discoveryScheduled = leadOpps.filter((o) => o.entryStageOrder === 1).length;
  const clarityScheduledConfirmed = opps.filter(
    (o) =>
      (o.stageOrder === 3 || o.stageOrder === 4) &&
      o.dateStageEntered >= start &&
      o.dateStageEntered <= end
  ).length;
  const won = opps.filter(
    (o) =>
      o.outcome === "won" &&
      o.dateClosed &&
      o.dateClosed >= start &&
      o.dateClosed <= end
  );
  const toClarityComplete = opps.filter(
    (o) => o.stageOrder >= 6 && o.dateStageEntered >= start && o.dateStageEntered <= end
  );
  const closedWonCount = won.length;
  const closedWonValue = won.reduce((s, o) => s + o.amount, 0);
  const closedWonCashCollected = won.reduce((s, o) => s + (o.cashCollected ?? 0), 0);
  const winRatePct =
    toClarityComplete.length > 0
      ? Math.round((won.length / toClarityComplete.length) * 1000) / 10
      : 0;
  const clientReps = getRepsForClient(config.clientId);
  const repSummaries = clientReps.map((rep) => {
    const repWon = won.filter((o) => o.repId === rep.id);
    const repDiscovery = leadOpps.filter((o) => o.repId === rep.id && o.entryStageOrder === 1).length;
    const repClarity = opps.filter(
      (o) =>
        o.repId === rep.id &&
        (o.stageOrder === 3 || o.stageOrder === 4) &&
        o.dateStageEntered >= start &&
        o.dateStageEntered <= end
    ).length;
    return {
      repId: rep.id,
      repName: rep.name,
      closedWonValue: repWon.reduce((s, o) => s + o.amount, 0),
      closedWonCashCollected: repWon.reduce((s, o) => s + (o.cashCollected ?? 0), 0),
      discoveryCalls: repDiscovery,
      clarityCalls: repClarity,
    };
  });
  const leadsIn = Math.round(discoveryScheduled * 2.5);
  return {
    clientId: config.clientId,
    start,
    end,
    leadsIn,
    discoveryScheduled,
    clarityScheduledConfirmed,
    closedWonCount,
    closedWonValue,
    closedWonCashCollected,
    winRatePct,
    repSummaries,
  };
}

export interface WeeklyTrendPoint {
  weekLabel: string;
  leadsIn: number;
  discoveryScheduled: number;
  closedWonValue: number;
}

export interface ConversionTableRow {
  stageName: string;
  count: number;
  conversionFromPrevPct: number;
  cumulativePct: number;
}

export interface ClientMetrics {
  clientId: string;
  year: number;
  month: number;
  kpis: KpiWithPacing[];
  conversionRows: ConversionRow[];
  conversionTableRows: ConversionTableRow[];
  repSummaries: RepSummary[];
  stageCounts: { stageName: string; count: number; order: number }[];
  deals: Opportunity[];
  weeklyTrends: WeeklyTrendPoint[];
}

export function getClientMetrics(
  config: ClientFunnelConfig,
  year: number,
  month: number,
  targets: MonthlyTarget[]
): ClientMetrics {
  const opps = getMockOpportunities().filter((o) => o.clientId === config.clientId);
  const { start, end } = getMonthBounds(year, month);

  const clientTarget = targets.find(
    (t) => t.clientId === config.clientId && !t.repId && t.year === year && t.month === month
  );
  const targetLeads = clientTarget?.leadsIn ?? 0;
  const targetDiscovery = clientTarget?.discoveryCalls ?? 0;
  const targetClarity = clientTarget?.clarityCalls ?? 0;
  const targetClosedCount = clientTarget?.closedWonCount ?? 0;
  const targetClosedValue = clientTarget?.closedWonValue ?? 0;
  const targetClosedCashCollected = clientTarget?.closedWonCashCollected ?? 0;

  // Lead In = new contacts in period (from Contacts API in production; mock here)
  const mtdLeads = getMockLeadsIn(config.clientId, year, month);
  // Discovery Scheduled MTD = deals that entered pipeline in period with stage 1 (excludes direct-to-Clarity)
  const mtdDiscovery = opps.filter(
    (o) => o.entryStageOrder === 1 && o.dateCreated >= start && o.dateCreated <= end
  ).length;
  const mtdClarity = countByStage(opps, config.clientId, year, month, 3) + countByStage(opps, config.clientId, year, month, 4);
  const { count: mtdClosedCount, value: mtdClosedValue, cashCollected: mtdClosedCashCollected } = closedWonInPeriod(opps, config.clientId, year, month);

  // Discovery Complete Rate: only deals that started in Discovery (entryStageOrder === 1). Of those that left Discovery (→ 2 or → 3+), what % went to Clarity? Excludes direct-to-Clarity deals.
  const discoveryStartedInPeriod = opps.filter(
    (o) => o.entryStageOrder === 1 && o.dateCreated >= start && o.dateCreated <= end
  );
  const discoveryHadOutcome = discoveryStartedInPeriod.filter((o) => o.stageOrder === 2 || o.stageOrder >= 3);
  const discoveryWentToClarity = discoveryHadOutcome.filter((o) => o.stageOrder >= 3);
  const discoveryCompleteRatePct =
    discoveryHadOutcome.length > 0
      ? Math.round((discoveryWentToClarity.length / discoveryHadOutcome.length) * 1000) / 10
      : 0;
  // Clarity complete rate = (→ Clarity Complete) / (→ Clarity Complete + → Clarity Not Complete)
  const toClarityComplete = countByStage(opps, config.clientId, year, month, 6);
  const clarityNotComplete = countByStage(opps, config.clientId, year, month, 5);
  const clarityCompleteRatePct =
    toClarityComplete + clarityNotComplete > 0
      ? Math.round((toClarityComplete / (toClarityComplete + clarityNotComplete)) * 1000) / 10
      : 0;

  const wonTotal = opps.filter((o) => o.outcome === "won");
  const toClarityCompleteDenom = opps.filter((o) => o.stageOrder >= 6); // reached Clarity Call Complete or beyond (win rate denominator)
  const winRatePct = toClarityCompleteDenom.length ? Math.round((wonTotal.length / toClarityCompleteDenom.length) * 1000) / 10 : 0;
  const avgDealSize = wonTotal.length ? Math.round(wonTotal.reduce((s, o) => s + o.amount, 0) / wonTotal.length) : 0;
  const cycleDays = wonTotal.length
    ? Math.round(
        wonTotal.reduce((s, o) => s + (o.dateClosed && o.dateCreated ? (o.dateClosed.getTime() - o.dateCreated.getTime()) / (1000 * 60 * 60 * 24) : 0), 0) / wonTotal.length
      )
    : 0;

  const allKpis: KpiWithPacing[] = [
    { key: "leadsIn", label: "Leads In", mtd: mtdLeads, target: targetLeads, pacingPct: computePacing(mtdLeads, targetLeads, year, month) },
    { key: "discoveryScheduled", label: "Discovery Scheduled", mtd: mtdDiscovery, target: targetDiscovery, pacingPct: computePacing(mtdDiscovery, targetDiscovery, year, month) },
    { key: "discoveryCompleteRate", label: "Discovery Complete Rate", mtd: discoveryCompleteRatePct, target: 0, pacingPct: null, subLabel: `${discoveryCompleteRatePct}%` },
    { key: "clarityScheduledConfirmed", label: "Clarity Scheduled / Confirmed", mtd: mtdClarity, target: targetClarity, pacingPct: computePacing(mtdClarity, targetClarity, year, month) },
    { key: "clarityCompleteRate", label: "Clarity Complete Rate", mtd: clarityCompleteRatePct, target: 0, pacingPct: null, subLabel: `${clarityCompleteRatePct}%` },
    { key: "closedWonCount", label: "Closed Won (count)", mtd: mtdClosedCount, target: targetClosedCount, pacingPct: computePacing(mtdClosedCount, targetClosedCount, year, month) },
    { key: "closedWonValue", label: "Revenue booked", mtd: mtdClosedValue, target: targetClosedValue, pacingPct: computePacing(mtdClosedValue, targetClosedValue, year, month), subLabel: `$${mtdClosedValue.toLocaleString()}` },
    { key: "closedWonCashCollected", label: "Cash collected (at point of sale)", mtd: mtdClosedCashCollected, target: targetClosedCashCollected, pacingPct: computePacing(mtdClosedCashCollected, targetClosedCashCollected, year, month), subLabel: `$${mtdClosedCashCollected.toLocaleString()}` },
    { key: "winRate", label: "Win Rate", mtd: winRatePct, target: 0, pacingPct: null, subLabel: `${winRatePct}%` },
    { key: "avgDealSize", label: "Avg Deal Size", mtd: avgDealSize, target: 0, pacingPct: null, subLabel: `$${avgDealSize.toLocaleString()}` },
    { key: "avgCycleDays", label: "Avg Cycle (days)", mtd: cycleDays, target: 0, pacingPct: null, subLabel: `${cycleDays}d` },
  ];
  const kpiKeys = config.kpiMetricKeys?.length ? config.kpiMetricKeys : allKpis.map((k) => k.key);
  const kpis = kpiKeys.map((key) => allKpis.find((k) => k.key === key)).filter(Boolean) as KpiWithPacing[];

  const primaryOrders = config.primaryStageOrders ?? config.stages.map((s) => s.order);
  const stagesToShow = config.stages.filter((s) => primaryOrders.includes(s.order));

  const stageCounts = stagesToShow.map((s) => ({
    order: s.order,
    stageName: s.displayName,
    count: opps.filter((o) => o.stageOrder === s.order && o.dateStageEntered >= start && o.dateStageEntered <= end).length,
  }));

  const conversionRows: ConversionRow[] = [];
  for (let i = 0; i < stagesToShow.length - 1; i++) {
    const from = stagesToShow[i];
    const to = stagesToShow[i + 1];
    const fromCount = opps.filter((o) => o.stageOrder === from.order && o.dateStageEntered >= start && o.dateStageEntered <= end).length;
    const advancedCount = opps.filter((o) => o.stageOrder >= to.order && o.dateStageEntered >= start && o.dateStageEntered <= end).length;
    const droppedCount = fromCount - advancedCount;
    conversionRows.push({
      fromStage: from.displayName,
      toStage: to.displayName,
      fromCount,
      advancedCount,
      conversionPct: fromCount ? Math.round((advancedCount / fromCount) * 1000) / 10 : 0,
      droppedCount,
      dropPct: fromCount ? Math.round((droppedCount / fromCount) * 1000) / 10 : 0,
    });
  }

  const firstStageCount = stageCounts[0]?.count ?? 1;
  const conversionTableRows: ConversionTableRow[] = stageCounts.map((s, i) => ({
    stageName: s.stageName,
    count: s.count,
    conversionFromPrevPct: i === 0 ? 100 : conversionRows[i - 1]?.conversionPct ?? 0,
    cumulativePct: firstStageCount ? Math.round((s.count / firstStageCount) * 1000) / 10 : 0,
  }));

  const clientReps = getRepsForClient(config.clientId);
  const repCount = clientReps.length || 1;
  const repTargetClosedValue = Math.round((targetClosedValue ?? 0) / repCount);
  const repTargetDiscovery = Math.round((targetDiscovery ?? 0) / repCount);

  const repSummaries: RepSummary[] = clientReps.map((rep) => {
    const repOppsInPeriod = opps.filter((o) => o.repId === rep.id && o.dateStageEntered >= start && o.dateStageEntered <= end);
    const repWonInPeriod = opps.filter(
      (o) => o.repId === rep.id && o.outcome === "won" && o.dateClosed && o.dateClosed >= start && o.dateClosed <= end
    );
    const repClarityInPeriod = repOppsInPeriod.filter((o) => o.stageOrder >= 6);
    const repClosedValue = repWonInPeriod.reduce((s, o) => s + o.amount, 0);
    const repCashCollected = repWonInPeriod.reduce((s, o) => s + (o.cashCollected ?? 0), 0);
    const repDiscovery = opps.filter((o) => o.repId === rep.id && o.entryStageOrder === 1 && o.dateCreated >= start && o.dateCreated <= end).length;
    return {
      repId: rep.id,
      repName: rep.name,
      role: rep.role,
      leadsIn: repOppsInPeriod.length,
      discoveryCalls: repDiscovery,
      clarityCalls: repOppsInPeriod.filter((o) => o.stageOrder === 3 || o.stageOrder === 4).length,
      closedWonCount: repWonInPeriod.length,
      closedWonValue: repClosedValue,
      closedWonCashCollected: repCashCollected,
      winRatePct: repClarityInPeriod.length ? Math.round((repWonInPeriod.length / repClarityInPeriod.length) * 1000) / 10 : 0,
      avgCycleDays: 0,
      targetClosedValue: repTargetClosedValue,
      targetDiscovery: repTargetDiscovery,
      mtdClosedValue: repClosedValue,
      pacingPct: repTargetClosedValue > 0 ? computePacing(repClosedValue, repTargetClosedValue, year, month) : null,
      discoveryPacingPct: repTargetDiscovery > 0 ? computePacing(repDiscovery, repTargetDiscovery, year, month) : null,
    };
  });

  const deals = opps.filter((o) => o.dateStageEntered >= start && o.dateStageEntered <= end).slice(0, 50);

  // Weekly trends (last 8 weeks) for simple chart
  const weeklyTrends: WeeklyTrendPoint[] = [];
  const now = new Date();
  for (let w = 7; w >= 0; w--) {
    const weekEnd = new Date(now);
    weekEnd.setDate(weekEnd.getDate() - w * 7);
    const weekStart = new Date(weekEnd);
    weekStart.setDate(weekStart.getDate() - 6);
    weekStart.setHours(0, 0, 0, 0);
    weekEnd.setHours(23, 59, 59, 999);
    const discoveryScheduled = opps.filter(
      (o) => o.entryStageOrder === 1 && o.dateCreated >= weekStart && o.dateCreated <= weekEnd
    ).length;
    const closedWonValue = opps.filter(
      (o) => o.outcome === "won" && o.dateClosed && o.dateClosed >= weekStart && o.dateClosed <= weekEnd
    ).reduce((s, o) => s + o.amount, 0);
    const leadsIn = Math.round(discoveryScheduled * 2.2 + (weekStart.getDate() % 5) * 3);
    weeklyTrends.push({
      weekLabel: `W${8 - w}`,
      leadsIn,
      discoveryScheduled,
      closedWonValue,
    });
  }

  return { clientId: config.clientId, year, month, kpis, conversionRows, conversionTableRows, repSummaries, stageCounts, deals, weeklyTrends };
}

export interface RepDashboardData {
  repSummary: RepSummary | null;
  repStageCounts: { stageName: string; count: number; order: number }[];
  teamStageCounts: { stageName: string; count: number; order: number }[];
  stageTransitions: StageTransitionRow[];
  repWeekly: RepWeeklyPoint[];
  flaggedDeals: Opportunity[];
  teamMetrics: ClientMetrics;
}

/** Rep dashboard: rep vs team funnels, transitions, weekly activity/results, flagged deals. */
export function getRepDashboardData(
  config: ClientFunnelConfig,
  repId: string,
  year: number,
  month: number,
  targets: MonthlyTarget[]
): RepDashboardData {
  const teamMetrics = getClientMetrics(config, year, month, targets);
  const { conversionRows, stageCounts, repSummaries, weeklyTrends } = teamMetrics;
  const opps = getMockOpportunities().filter((o) => o.clientId === config.clientId);
  const { start, end } = getMonthBounds(year, month);
  const repOpps = opps.filter((o) => o.repId === repId);

  const repSummary = repSummaries.find((r) => r.repId === repId) ?? null;

  const primaryOrders = config.primaryStageOrders ?? config.stages.map((s) => s.order);
  const stagesToShow = config.stages.filter((s) => primaryOrders.includes(s.order));

  const repStageCounts = stagesToShow.map((s) => ({
    order: s.order,
    stageName: s.displayName,
    count: repOpps.filter((o) => o.stageOrder === s.order && o.dateStageEntered >= start && o.dateStageEntered <= end).length,
  }));

  const teamStageCounts = stageCounts;

  const stageTransitions: StageTransitionRow[] = [];
  for (let i = 0; i < stagesToShow.length - 1; i++) {
    const from = stagesToShow[i];
    const to = stagesToShow[i + 1];
    const repFrom = repOpps.filter((o) => o.stageOrder === from.order && o.dateStageEntered >= start && o.dateStageEntered <= end).length;
    const repAdvanced = repOpps.filter((o) => o.stageOrder >= to.order && o.dateStageEntered >= start && o.dateStageEntered <= end).length;
    const repPct = repFrom ? Math.round((repAdvanced / repFrom) * 1000) / 10 : 0;
    const teamRow = conversionRows[i];
    const teamPct = teamRow?.conversionPct ?? 0;
    stageTransitions.push({
      fromStage: from.displayName,
      toStage: to.displayName,
      repPct,
      teamPct,
      diffPct: Math.round((repPct - teamPct) * 10) / 10,
      avgDays: 5 + (i % 4),
    });
  }

  const now = new Date();
  const repWeekly: RepWeeklyPoint[] = [];
  for (let w = 7; w >= 0; w--) {
    const weekEnd = new Date(now);
    weekEnd.setDate(weekEnd.getDate() - w * 7);
    const weekStart = new Date(weekEnd);
    weekStart.setDate(weekStart.getDate() - 6);
    weekStart.setHours(0, 0, 0, 0);
    weekEnd.setHours(23, 59, 59, 999);
    const repActivity = repOpps.filter(
      (o) => (o.entryStageOrder === 1 && o.dateCreated >= weekStart && o.dateCreated <= weekEnd) ||
        (o.stageOrder >= 3 && o.stageOrder <= 4 && o.dateStageEntered >= weekStart && o.dateStageEntered <= weekEnd)
    ).length;
    const teamActivity = opps.filter(
      (o) => (o.entryStageOrder === 1 && o.dateCreated >= weekStart && o.dateCreated <= weekEnd) ||
        (o.stageOrder >= 3 && o.stageOrder <= 4 && o.dateStageEntered >= weekStart && o.dateStageEntered <= weekEnd)
    ).length;
    const repClosedValue = repOpps.filter(
      (o) => o.outcome === "won" && o.dateClosed && o.dateClosed >= weekStart && o.dateClosed <= weekEnd
    ).reduce((s, o) => s + o.amount, 0);
    const teamClosedValue = weeklyTrends[7 - w]?.closedWonValue ?? 0;
    repWeekly.push({
      weekLabel: `W${8 - w}`,
      repActivity,
      teamActivity,
      repClosedValue,
      teamClosedValue,
    });
  }

  const staleCutoff = new Date(now);
  staleCutoff.setDate(staleCutoff.getDate() - 10);
  const flaggedDeals = repOpps.filter(
    (o) => (o.stageOrder === 4 || o.stageOrder === 6) && o.dateStageEntered < staleCutoff && !o.dateClosed
  ).slice(0, 10);

  return {
    repSummary,
    repStageCounts,
    teamStageCounts,
    stageTransitions,
    repWeekly,
    flaggedDeals,
    teamMetrics,
  };
}
