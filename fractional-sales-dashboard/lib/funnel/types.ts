/**
 * Data contract for the fractional sales dashboard.
 * Skeleton uses mock data; same shape when we plug in GHL/API later.
 */

export type OutcomeType = "won" | "lost" | null;

export interface FunnelStageConfig {
  order: number;
  displayName: string;
  outcome?: OutcomeType;
}

export interface ClientFunnelConfig {
  clientId: string;
  clientName: string;
  stages: FunnelStageConfig[];
  /** Subset of stage orders to show in funnel/conversion (e.g. [1, 3, 4, 6, 8, 9]). If omitted, all stages shown. */
  primaryStageOrders?: number[];
  /** Ordered list of KPI metric keys to show in the dashboard (from metric registry). If omitted, all computed KPIs shown. */
  kpiMetricKeys?: string[];
  /** Account manager who owns this client (e.g. for portfolio filter by AM). */
  accountManagerId?: string;
  accountManagerName?: string;
  /** Logo URL for this client's reports (e.g. client logo on PDF/exports). Set in client Settings. */
  reportLogoUrl?: string;
  /** GHL pipeline ID to sync only opportunities from this pipeline (optional). Set in client Settings → GHL. */
  ghlPipelineId?: string;
}

/** Rep assigned to a client with a role for role-based KPIs (setter vs closer). */
export type RepRole = "setter" | "closer";

export interface RepConfig {
  id: string;
  /** Display name shown in the app. */
  name: string;
  clientId: string;
  role: RepRole;
  /** GHL user ID for deal attribution (opportunities assigned to this user in GHL count as this rep's). */
  ghlUserId?: string;
}

export interface Opportunity {
  id: string;
  clientId: string;
  /** Deal owner (closer): gets revenue closed attribution. */
  repId: string | null;
  repName: string | null;
  /** Setter (sourced the deal): gets revenue sourced attribution. */
  setterRepId?: string | null;
  setterRepName?: string | null;
  /** Setter action: sourced (originated deal) vs confirmed (qualified/confirmed for closer). */
  setterAction?: "sourced" | "confirmed" | null;
  stageOrder: number;
  stageName: string;
  /** Stage at which this deal entered the pipeline (e.g. 1 = Discovery Scheduled, 3 = direct Clarity Scheduled). Used so Discovery metrics exclude direct-to-Clarity deals. */
  entryStageOrder: number;
  /** Revenue booked (full deal value). */
  amount: number;
  /** Cash collected at point of sale (optional; mapped from CRM per client). */
  cashCollected?: number;
  dateCreated: Date;
  dateClosed: Date | null;
  dateStageEntered: Date;
  outcome: OutcomeType;
}

export interface MonthlyTarget {
  clientId: string;
  repId: string | null;
  year: number;
  month: number;
  leadsIn: number;
  discoveryCalls?: number;
  clarityCalls?: number;
  closedWonCount: number;
  closedWonValue: number;
  /** Cash collected at point of sale (target). */
  closedWonCashCollected?: number;
}

export interface KpiWithPacing {
  key: string;
  label: string;
  mtd: number;
  target: number;
  pacingPct: number | null;
  subLabel?: string;
}

export interface ConversionRow {
  fromStage: string;
  toStage: string;
  fromCount: number;
  advancedCount: number;
  conversionPct: number;
  droppedCount: number;
  dropPct: number;
}

export interface RepSummary {
  repId: string;
  repName: string;
  role?: RepRole;
  leadsIn: number;
  discoveryCalls: number;
  clarityCalls: number;
  closedWonCount: number;
  closedWonValue: number;
  /** Cash collected at point of sale (MTD). */
  closedWonCashCollected?: number;
  /** Revenue sourced (won deals where this rep is setter). Setter attribution. */
  sourcedWonValue?: number;
  winRatePct: number;
  avgCycleDays: number;
  mtdClosedValue?: number;
  targetClosedValue?: number;
  pacingPct?: number | null;
  targetDiscovery?: number;
  discoveryPacingPct?: number | null;
}

/** One row for rep dashboard: stage transition with rep vs team and avg days. */
export interface StageTransitionRow {
  fromStage: string;
  toStage: string;
  repPct: number;
  teamPct: number;
  diffPct: number;
  avgDays: number;
}

export interface RepWeeklyPoint {
  weekLabel: string;
  repActivity: number;
  teamActivity: number;
  repClosedValue: number;
  teamClosedValue: number;
}
