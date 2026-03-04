import type { ClientFunnelConfig, FunnelStageConfig, Opportunity, MonthlyTarget, RepConfig, RepRole } from "./types";
import { bbpFunnelConfig, bbpReps } from "./bbpConfig";
import { clearClientIntegrations } from "./integrations";
import { loadSettings, saveSettings } from "@/lib/settingsBlob";
import { getIntegrationsSnapshot, setIntegrationsFromSnapshot } from "@/lib/funnel/integrations";

/** Base client configs (seed). Additional clients added via global Settings are in additionalClientsStore. */
const clientConfigsBase: ClientFunnelConfig[] = [bbpFunnelConfig];

/** Clients added via global Settings (new accounts). */
const additionalClientsStore: ClientFunnelConfig[] = [];

/** All client configs: base + any added in global Settings. */
export function getClientConfigs(): ClientFunnelConfig[] {
  return [...clientConfigsBase, ...additionalClientsStore];
}

/** Per-client rep store: id, name, clientId, role (setter vs closer). Seeded from bbpReps. */
const repStore: RepConfig[] = (() => {
  const seed: RepConfig[] = bbpReps.map((r, i) => ({
    id: r.id,
    name: r.name,
    clientId: "bbp",
    role: (i % 2 === 0 ? "setter" : "closer") as RepRole,
  }));
  return [...seed];
})();

export function getRepsForClient(clientId: string): RepConfig[] {
  return repStore.filter((r) => r.clientId === clientId);
}

export function getRepById(repId: string): RepConfig | null {
  return repStore.find((r) => r.id === repId) ?? null;
}

export function upsertRep(rep: RepConfig): void {
  const idx = repStore.findIndex((r) => r.clientId === rep.clientId && r.id === rep.id);
  if (idx >= 0) repStore[idx] = { ...rep };
  else repStore.push({ ...rep });
}

export function deleteRep(clientId: string, repId: string): void {
  const idx = repStore.findIndex((r) => r.clientId === clientId && r.id === repId);
  if (idx >= 0) repStore.splice(idx, 1);
}

/** Mock opportunities for BBP — pipeline stages 1–7 only (current + last month). */
function buildMockOpportunities(): Opportunity[] {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth() + 1; // 1-12
  const lastMonth = m === 1 ? 12 : m - 1;
  const lastYear = m === 1 ? y - 1 : y;

  const reps = bbpReps;
  const stages = bbpFunnelConfig.stages;

  const opps: Opportunity[] = [];
  let id = 1;

  const day = Math.min(now.getDate(), 28);
  for (let i = 0; i < 220; i++) {
    const isDirectClarity = i % 4 === 0; // ~25% booked directly to Clarity (never had Discovery)
    const rawOrder = i < 40 ? 1 : i < 50 ? 2 : i < 90 ? 3 : i < 110 ? 4 : i < 120 ? 5 : i < 155 ? 6 : i < 180 ? 7 : i < 200 ? 8 : 9;
    const stageOrder = isDirectClarity && rawOrder <= 2 ? 3 : rawOrder; // direct-Clarity deals start at stage 3+
    const stage = stages.find((s) => s.order === stageOrder)!;
    const entryStageOrder = isDirectClarity ? 3 : 1; // 1 = Discovery first, 3 = Clarity first
    const rep = reps[i % reps.length];
    const setterRep = i % 10 < 7 ? rep : reps[(i + 1) % reps.length]; // ~70% same rep as setter, 30% different
    const dateCreated = new Date(y, m - 1, (i % day) + 1);
    const isWon = stage.outcome === "won";
    const dateClosed = isWon ? new Date(y, m - 1, (i % day) + 5) : null;
    const amount = isWon ? (i % 3 === 0 ? 5000 : 2000) : 0;
    opps.push({
      id: `opp-${id++}`,
      clientId: "bbp",
      repId: rep.id,
      repName: rep.name,
      setterRepId: setterRep.id,
      setterRepName: setterRep.name,
      stageOrder: stage.order,
      stageName: stage.displayName,
      entryStageOrder,
      amount,
      cashCollected: isWon && amount > 0 ? Math.round(amount * (0.4 + (i % 5) * 0.1)) : undefined,
      dateCreated,
      dateClosed,
      dateStageEntered: new Date(y, m - 1, Math.max(1, (i % day) - 2)),
      outcome: stage.outcome ?? null,
    });
  }

  for (let i = 0; i < 120; i++) {
    const isDirectClarity = i % 4 === 1; // ~25% direct to Clarity last month too
    const rawOrder = i < 25 ? 1 : i < 32 ? 2 : i < 62 ? 3 : i < 75 ? 4 : i < 82 ? 5 : i < 95 ? 6 : i < 102 ? 7 : i < 110 ? 8 : 9;
    const stageOrder = isDirectClarity && rawOrder <= 2 ? 3 : rawOrder;
    const stage = stages.find((s) => s.order === stageOrder)!;
    const entryStageOrder = isDirectClarity ? 3 : 1;
    const rep = reps[i % reps.length];
    const setterRep = i % 10 < 7 ? rep : reps[(i + 1) % reps.length];
    const d = (i % 28) + 1;
    const dateCreated = new Date(lastYear, lastMonth - 1, d);
    const isWon = stage.outcome === "won";
    const amount = isWon ? (i % 2 === 0 ? 5000 : 2000) : 0;
    opps.push({
      id: `opp-${id++}`,
      clientId: "bbp",
      repId: rep.id,
      repName: rep.name,
      setterRepId: setterRep.id,
      setterRepName: setterRep.name,
      stageOrder: stage.order,
      stageName: stage.displayName,
      entryStageOrder,
      amount,
      cashCollected: isWon && amount > 0 ? Math.round(amount * 0.5) : undefined,
      dateCreated,
      dateClosed: isWon ? new Date(lastYear, lastMonth - 1, d + 3) : null,
      dateStageEntered: new Date(lastYear, lastMonth - 1, d),
      outcome: stage.outcome ?? null,
    });
  }

  return opps;
}

/**
 * Lead In = new contacts in period (not a pipeline stage).
 * In production: GHL Search Contacts API filtered by dateCreated in period.
 */
export function getMockLeadsIn(clientId: string, year: number, month: number): number {
  if (clientId !== "bbp") return 0;
  const now = new Date();
  const isCurrent = now.getFullYear() === year && now.getMonth() + 1 === month;
  const day = isCurrent ? Math.min(now.getDate(), 28) : 28;
  const daysInMonth = new Date(year, month, 0).getDate();
  const base = isCurrent ? Math.round(200 * (day / daysInMonth)) : 180;
  return base + ((year * 12 + month) % 30);
}

let cachedOpportunities: Opportunity[] | null = null;

export function getMockOpportunities(): Opportunity[] {
  if (!cachedOpportunities) cachedOpportunities = buildMockOpportunities();
  return cachedOpportunities;
}

const initialTargets: MonthlyTarget[] = (() => {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth() + 1;
  const lastMonth = m === 1 ? 12 : m - 1;
  const lastYear = m === 1 ? y - 1 : y;
  return [
    { clientId: "bbp", repId: null, year: y, month: m, leadsIn: 200, discoveryCalls: 80, clarityCalls: 50, closedWonCount: 18, closedWonValue: 72000, closedWonCashCollected: 36000 },
    { clientId: "bbp", repId: null, year: lastYear, month: lastMonth, leadsIn: 180, discoveryCalls: 70, clarityCalls: 45, closedWonCount: 14, closedWonValue: 56000, closedWonCashCollected: 28000 },
  ];
})();

let mockTargetsStore: MonthlyTarget[] = [...initialTargets];

/** Mock monthly targets — client-level. Can be updated via upsertMockTarget (e.g. from Targets page). */
export function getMockTargets(): MonthlyTarget[] {
  return [...mockTargetsStore];
}

/** Upsert a monthly target (client + year + month). Used by Targets page to persist; in-memory only. */
export function upsertMockTarget(t: MonthlyTarget): void {
  const idx = mockTargetsStore.findIndex(
    (x) => x.clientId === t.clientId && x.repId === t.repId && x.year === t.year && x.month === t.month
  );
  const next = { ...t };
  if (idx >= 0) mockTargetsStore[idx] = next;
  else mockTargetsStore.push(next);
}

/** Per-client overrides (e.g. account manager, report logo, GHL pipeline filter). Merged into base config by getClientConfig. */
const clientOverridesStore: Record<
  string,
  { accountManagerId?: string; accountManagerName?: string; reportLogoUrl?: string; ghlPipelineId?: string }
> = {};

export function getClientConfig(clientId: string): ClientFunnelConfig | null {
  const base = getClientConfigs().find((c) => c.clientId === clientId) ?? null;
  if (!base) return null;
  const overrides = clientOverridesStore[clientId];
  if (!overrides) return base;
  return { ...base, ...overrides };
}

/** Set account manager for a client. Used by client Settings; drives portfolio filter. */
export function setClientAccountManager(
  clientId: string,
  accountManagerId: string,
  accountManagerName: string
): void {
  clientOverridesStore[clientId] = { ...clientOverridesStore[clientId], accountManagerId, accountManagerName };
}

/** Clear a user/AM from all client assignments (e.g. when user is removed). */
export function clearAccountManagerFromClients(accountManagerId: string): void {
  for (const clientId of Object.keys(clientOverridesStore)) {
    if (clientOverridesStore[clientId].accountManagerId === accountManagerId) {
      clientOverridesStore[clientId] = { ...clientOverridesStore[clientId], accountManagerId: "unassigned", accountManagerName: "Unassigned" };
    }
  }
}

/** Set report logo URL for a client (shown on client-specific reports/exports). */
export function setClientReportLogo(clientId: string, reportLogoUrl: string): void {
  clientOverridesStore[clientId] = { ...clientOverridesStore[clientId], reportLogoUrl: reportLogoUrl || undefined };
}

/** Set GHL pipeline ID filter for a client (only opportunities from this pipeline are synced). */
export function setClientGhlPipelineId(clientId: string, ghlPipelineId: string): void {
  const trimmed = ghlPipelineId?.trim() || "";
  clientOverridesStore[clientId] = { ...clientOverridesStore[clientId], ghlPipelineId: trimmed || undefined };
}

/** Unique account managers for dropdown/filter: assigned from client configs plus users with role account_manager. */
export function getAccountManagers(users: { id: string; name: string; role: string }[]): { id: string; name: string }[] {
  const seen = new Set<string>();
  const out: { id: string; name: string }[] = [];
  for (const c of getClientConfigs()) {
    const config = getClientConfig(c.clientId);
    if (!config) continue;
    const id = config.accountManagerId ?? "unassigned";
    const name = config.accountManagerName ?? "Unassigned";
    if (!seen.has(id)) {
      seen.add(id);
      out.push({ id, name });
    }
  }
  for (const u of users) {
    if (u.role === "account_manager" && !seen.has(u.id)) {
      seen.add(u.id);
      out.push({ id: u.id, name: u.name });
    }
  }
  return out.sort((a, b) => a.name.localeCompare(b.name));
}

// --- Clients / accounts (global Settings) ---

function slugForClient(name: string): string {
  return name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "").slice(0, 24) || "client";
}

/** Add a new client/account. Uses BBP funnel template when stages/primaryStageOrders/kpiMetricKeys not provided. */
export function addClient(params: {
  clientName: string;
  clientId?: string;
  stages?: FunnelStageConfig[];
  primaryStageOrders?: number[];
  kpiMetricKeys?: string[];
  accountManagerId?: string;
  accountManagerName?: string;
}): ClientFunnelConfig {
  const clientId = params.clientId ?? `${slugForClient(params.clientName)}-${Date.now().toString(36)}`;
  if (getClientConfigs().some((c) => c.clientId === clientId)) {
    throw new Error(`Client id "${clientId}" already exists`);
  }
  const config: ClientFunnelConfig = {
    clientId,
    clientName: params.clientName,
    stages: params.stages ?? bbpFunnelConfig.stages,
    primaryStageOrders: params.primaryStageOrders ?? bbpFunnelConfig.primaryStageOrders,
    kpiMetricKeys: params.kpiMetricKeys ?? bbpFunnelConfig.kpiMetricKeys,
    accountManagerId: params.accountManagerId,
    accountManagerName: params.accountManagerName,
  };
  additionalClientsStore.push(config);
  if (params.accountManagerId && params.accountManagerName) {
    clientOverridesStore[clientId] = {
      accountManagerId: params.accountManagerId,
      accountManagerName: params.accountManagerName,
    };
  }
  return config;
}

/** Remove a client/account. Only allowed for clients added via Settings (not the seed BBP). */
export function removeClient(clientId: string): boolean {
  if (clientConfigsBase.some((c) => c.clientId === clientId)) return false;
  const idx = additionalClientsStore.findIndex((c) => c.clientId === clientId);
  if (idx < 0) return false;
  additionalClientsStore.splice(idx, 1);
  delete clientOverridesStore[clientId];
  for (let i = repStore.length - 1; i >= 0; i--) {
    if (repStore[i].clientId === clientId) repStore.splice(i, 1);
  }
  mockTargetsStore = mockTargetsStore.filter((t) => t.clientId !== clientId);
  clearClientIntegrations(clientId);
  return true;
}

/** Load settings from store (file or DB) into in-memory stores. Call at start of request so data is current. */
export async function hydrateSettings(): Promise<void> {
  const data = await loadSettings();
  if (!data) return;
  additionalClientsStore.length = 0;
  additionalClientsStore.push(...(data.additionalClients ?? []));
  for (const k of Object.keys(clientOverridesStore)) delete clientOverridesStore[k];
  if (data.clientOverrides) Object.assign(clientOverridesStore, data.clientOverrides);
  if (data.reps?.length) {
    repStore.length = 0;
    repStore.push(...data.reps);
  }
  if (data.targets?.length) {
    mockTargetsStore.length = 0;
    mockTargetsStore.push(...data.targets);
  }
  if (data.integrations != null || data.fieldMappings != null) {
    setIntegrationsFromSnapshot({
      integrations: data.integrations ?? {},
      fieldMappings: data.fieldMappings ?? {},
    });
  }
}

/** Persist current in-memory settings to store (file or DB). Throws if save fails. */
export async function persistSettings(): Promise<void> {
  const { integrations, fieldMappings } = getIntegrationsSnapshot();
  await saveSettings({
    additionalClients: [...additionalClientsStore],
    clientOverrides: { ...clientOverridesStore },
    reps: [...repStore],
    targets: [...mockTargetsStore],
    integrations,
    fieldMappings,
  });
}
