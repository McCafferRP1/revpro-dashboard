/**
 * GHL discovery refresh (pipelines, stages, deal properties).
 * Triggered on portfolio and client funnel load so discovery stays fresh without opening Integrations.
 * Phase A: implement actual GHL API fetch + cache (TTL ~15–30 min, background refetch when > ~5 min) here.
 */

export async function refreshDiscoveryIfNeeded(clientId: string): Promise<void> {
  // Phase A: check cache TTL; if stale or missing, fetch from GHL API and update cache.
  // For now no-op so trigger points are in place; raw key storage + GHL client will be added in Phase A.
  await Promise.resolve();
}
