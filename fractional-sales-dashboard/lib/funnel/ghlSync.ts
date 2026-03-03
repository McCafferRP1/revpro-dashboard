/**
 * Sync opportunities from GHL into RevPro Opportunity shape.
 * Uses saved field mappings and discovery cache (pipelines/stages).
 */

import type { Opportunity } from "./types";
import { getGhlKey } from "@/lib/ghlKeys";
import { searchOpportunities, type GhlOpportunityRaw } from "@/lib/ghlClient";
import { getFieldMappings } from "./integrations";
import { getDiscoveryCached, refreshDiscoveryIfNeeded } from "./ghlDiscovery";
import { getRepsForClient, getMockOpportunities } from "./mockData";

const OPP_CACHE_TTL_MS = 2 * 60 * 1000; // 2 min
const oppCache: Record<string, { opps: Opportunity[]; fetchedAt: number }> = {};

/** Get a value from an object by dot path (e.g. "customFields.revenue"). */
function getByPath(obj: Record<string, unknown>, path: string): unknown {
  const parts = path.trim().split(".");
  let current: unknown = obj;
  for (const p of parts) {
    if (current == null || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[p];
  }
  return current;
}

function parseDate(v: unknown): Date | null {
  if (v == null) return null;
  if (v instanceof Date) return v;
  const d = new Date(String(v));
  return isNaN(d.getTime()) ? null : d;
}

function parseNumber(v: unknown): number {
  if (typeof v === "number" && !Number.isNaN(v)) return v;
  if (typeof v === "string") return parseFloat(v) || 0;
  return 0;
}

/** Map GHL raw opportunity to RevPro Opportunity using mappings and discovery. */
function mapGhlToOpportunity(
  raw: GhlOpportunityRaw,
  clientId: string,
  mappings: Record<string, string>,
  stageIdToOrder: Map<string, number>,
  stageIdToName: Map<string, string>,
  reps: { id: string; name: string; ghlUserId?: string }[]
): Opportunity {
  const get = (ourField: string): unknown => {
    const theirField = mappings[ourField];
    if (!theirField) return undefined;
    return getByPath(raw as Record<string, unknown>, theirField);
  };

  const pipelineStageId = String(get("pipelineStageId") ?? raw.pipelineStageId ?? "").trim();
  const stageOrder = stageIdToOrder.get(pipelineStageId) ?? 1;
  const stageName = stageIdToName.get(pipelineStageId) ?? "Unknown";
  const assignedToId = String(raw.assignedTo ?? "").trim();
  const setterGhlUserId = String(get("setterGhlUserId") ?? "").trim();

  const rep = reps.find((r) => r.ghlUserId && r.ghlUserId === assignedToId);
  const setterRep = reps.find((r) => r.ghlUserId && r.ghlUserId === setterGhlUserId);

  const dateCreated = parseDate(get("contactDate") ?? get("contactId") ?? raw.dateAdded) ?? new Date(0);
  const dateClosed = parseDate(get("dealClosedDate"));
  const outcomeRaw = String(get("dealOutcome") ?? raw.status ?? "").toLowerCase();
  const outcome = outcomeRaw.includes("won") ? "won" : outcomeRaw.includes("lost") ? "lost" : null;
  const amount = parseNumber(get("revenueBooked") ?? get("dealValue") ?? raw.monetaryValue);
  const cashCollected = parseNumber(get("cashCollected"));

  return {
    id: String(raw.id ?? Math.random().toString(36).slice(2)),
    clientId,
    repId: rep?.id ?? null,
    repName: rep?.name ?? null,
    setterRepId: setterRep?.id ?? undefined,
    setterRepName: setterRep?.name ?? undefined,
    stageOrder,
    stageName,
    entryStageOrder: stageOrder,
    amount,
    cashCollected: cashCollected || undefined,
    dateCreated,
    dateClosed,
    dateStageEntered: dateCreated,
    outcome,
  };
}

/** Build stage lookup from discovery pipelines. */
function buildStageMaps(pipelines: { id: string; stages?: { id: string; name: string; order?: number }[] }[]): {
  stageIdToOrder: Map<string, number>;
  stageIdToName: Map<string, string>;
} {
  const stageIdToOrder = new Map<string, number>();
  const stageIdToName = new Map<string, string>();
  for (const p of pipelines) {
    if (!p.stages?.length) continue;
    p.stages.forEach((s, idx) => {
      const order = s.order ?? idx + 1;
      stageIdToOrder.set(s.id, order);
      stageIdToName.set(s.id, s.name ?? `Stage ${order}`);
    });
  }
  return { stageIdToOrder, stageIdToName };
}

/** Fetch opportunities from GHL for this client and map to Opportunity[]. Returns [] on no key or error. */
export async function getOpportunitiesFromGhl(clientId: string): Promise<Opportunity[]> {
  const key = await getGhlKey(clientId);
  if (!key) return [];

  const mappingsList = getFieldMappings(clientId, "ghl");
  const mappings: Record<string, string> = Object.fromEntries(
    mappingsList.filter((m) => m.theirField).map((m) => [m.ourField, m.theirField])
  );
  if (Object.keys(mappings).length === 0) return [];

  await refreshDiscoveryIfNeeded(clientId);
  const discovery = getDiscoveryCached(clientId);
  const pipelines = discovery?.pipelines ?? [];
  const { stageIdToOrder, stageIdToName } = buildStageMaps(pipelines);

  const reps = getRepsForClient(clientId);

  const rawList = await searchOpportunities(key);
  return rawList.map((raw) =>
    mapGhlToOpportunity(raw, clientId, mappings, stageIdToOrder, stageIdToName, reps)
  );
}

/** Get opportunities for a client: from GHL (if configured and fetch succeeds) or mock. Cached briefly. */
export async function getOpportunitiesForClient(clientId: string): Promise<Opportunity[]> {
  const now = Date.now();
  const cached = oppCache[clientId];
  if (cached && now - cached.fetchedAt < OPP_CACHE_TTL_MS) return cached.opps;

  const ghlOpps = await getOpportunitiesFromGhl(clientId);
  const opps = ghlOpps.length > 0 ? ghlOpps : getMockOpportunities().filter((o) => o.clientId === clientId);
  oppCache[clientId] = { opps, fetchedAt: now };
  return opps;
}
