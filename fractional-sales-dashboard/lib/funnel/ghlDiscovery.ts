/**
 * GHL discovery refresh (pipelines, stages).
 * Triggered on portfolio and client funnel load; cache TTL 15 min.
 */

import { getGhlKey } from "@/lib/ghlKeys";
import { fetchPipelines, type GhlPipeline } from "@/lib/ghlClient";

const CACHE_TTL_MS = 15 * 60 * 1000; // 15 min

const cache: Record<string, { pipelines: GhlPipeline[]; fetchedAt: number }> = {};

export type DiscoverySnapshot = {
  pipelines: GhlPipeline[];
  fetchedAt: number;
} | null;

export function getDiscoveryCached(clientId: string): DiscoverySnapshot {
  const entry = cache[clientId];
  if (!entry) return null;
  return { pipelines: entry.pipelines, fetchedAt: entry.fetchedAt };
}

export async function refreshDiscoveryIfNeeded(clientId: string): Promise<void> {
  const key = await getGhlKey(clientId);
  if (!key) return;

  const entry = cache[clientId];
  const now = Date.now();
  if (entry && now - entry.fetchedAt < CACHE_TTL_MS) {
    return; // cache still fresh
  }

  const pipelines = await fetchPipelines(key);
  cache[clientId] = { pipelines, fetchedAt: now };
}

/** Call from UI or server to force refresh and return latest discovery (e.g. "Refresh" button). */
export async function refreshDiscovery(clientId: string): Promise<DiscoverySnapshot> {
  const key = await getGhlKey(clientId);
  if (!key) return null;
  const pipelines = await fetchPipelines(key);
  const fetchedAt = Date.now();
  cache[clientId] = { pipelines, fetchedAt };
  return { pipelines, fetchedAt };
}

/** Clear discovery cache for a client (e.g. when admin removes API key). */
export function clearDiscoveryCache(clientId: string): void {
  delete cache[clientId];
}
