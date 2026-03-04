/**
 * GoHighLevel API client (server-side only).
 * Base URL: https://services.leadconnectorhq.com
 * Auth: Bearer token; Version: 2021-07-28
 */

const GHL_BASE = "https://services.leadconnectorhq.com";
const GHL_VERSION = "2021-07-28";

export interface GhlPipelineStage {
  id: string;
  name: string;
  order?: number;
}

export interface GhlPipeline {
  id: string;
  name: string;
  stages?: GhlPipelineStage[];
}

export interface GhlPipelinesResponse {
  pipelines?: GhlPipeline[];
}

function headers(token: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    Accept: "application/json",
    Version: GHL_VERSION,
  };
}

/** Fetch pipelines (with stages) from GHL. Returns empty array on auth failure or error. */
export async function fetchPipelines(token: string): Promise<GhlPipeline[]> {
  try {
    const res = await fetch(`${GHL_BASE}/opportunities/pipelines`, {
      method: "GET",
      headers: headers(token),
      cache: "no-store",
    });
    if (!res.ok) return [];
    const data = (await res.json()) as GhlPipelinesResponse;
    const list = data?.pipelines ?? [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

/** Raw opportunity/deal from GHL (field names may vary; we map via user's field mappings). */
export interface GhlOpportunityRaw {
  id?: string;
  name?: string;
  pipelineId?: string;
  pipelineStageId?: string;
  status?: string;
  monetaryValue?: number;
  assignedTo?: string;
  dateAdded?: string;
  dateUpdated?: string;
  [key: string]: unknown;
}

export interface GhlSearchOpportunitiesResponse {
  opportunities?: GhlOpportunityRaw[];
}

/** Search opportunities (deals). POST with optional filters. pipelineId limits results to that pipeline. */
export async function searchOpportunities(
  token: string,
  options?: { pipelineId?: string }
): Promise<GhlOpportunityRaw[]> {
  try {
    const body: Record<string, string> = {};
    if (options?.pipelineId?.trim()) body.pipeline_id = options.pipelineId.trim();
    const res = await fetch(`${GHL_BASE}/opportunities/search`, {
      method: "POST",
      headers: headers(token),
      body: JSON.stringify(body),
      cache: "no-store",
    });
    if (!res.ok) return [];
    const data = (await res.json()) as GhlSearchOpportunitiesResponse & { data?: { opportunities?: GhlOpportunityRaw[] } };
    const list = data?.opportunities ?? data?.data?.opportunities ?? [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export interface GhlUser {
  id: string;
  name: string;
  email?: string;
  role?: string;
}

/** Fetch users from GHL location. */
export async function fetchUsers(token: string): Promise<GhlUser[]> {
  try {
    const res = await fetch(`${GHL_BASE}/users/`, {
      method: "GET",
      headers: headers(token),
      cache: "no-store",
    });
    if (!res.ok) return [];
    const data = (await res.json()) as { users?: GhlUser[] };
    const list = data?.users ?? [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

/** Raw contact from GHL (e.g. GET /contacts/:contactId). Custom fields may be at top level or under customFields. */
export interface GhlContactRaw {
  id?: string;
  [key: string]: unknown;
}

/** Fetch a single contact by ID. Returns null on 404/auth failure. Used to merge contact custom fields into opportunity data. */
export async function fetchContact(token: string, contactId: string): Promise<GhlContactRaw | null> {
  if (!contactId?.trim()) return null;
  try {
    const res = await fetch(`${GHL_BASE}/contacts/${encodeURIComponent(contactId.trim())}`, {
      method: "GET",
      headers: headers(token),
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = (await res.json()) as GhlContactRaw;
    return data ?? null;
  } catch {
    return null;
  }
}

/** Create a stage in a GHL pipeline. */
export async function createPipelineStage(
  token: string,
  pipelineId: string,
  stage: { name: string }
): Promise<GhlPipelineStage | null> {
  try {
    const res = await fetch(
      `${GHL_BASE}/opportunities/pipelines/${pipelineId}/stages`,
      {
        method: "POST",
        headers: headers(token),
        body: JSON.stringify({ name: stage.name }),
        cache: "no-store",
      }
    );
    if (!res.ok) return null;
    const data = (await res.json()) as GhlPipelineStage;
    return data?.id ? data : null;
  } catch {
    return null;
  }
}
