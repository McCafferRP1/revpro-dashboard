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
