/**
 * Persist settings (clients, overrides, reps, targets) in Netlify Blobs
 * so they survive across serverless instances. Falls back to no-op when not on Netlify.
 */

import { getStore } from "@netlify/blobs";
import type { ClientFunnelConfig, MonthlyTarget, RepConfig } from "@/lib/funnel/types";
import type { IntegrationsSnapshot } from "@/lib/funnel/integrations";

const BLOB_STORE = "revpro-settings";
const BLOB_KEY = "data";

export interface SettingsSnapshot {
  additionalClients: ClientFunnelConfig[];
  clientOverrides: Record<string, { accountManagerId?: string; accountManagerName?: string; reportLogoUrl?: string }>;
  reps: RepConfig[];
  targets: MonthlyTarget[];
  integrations?: IntegrationsSnapshot["integrations"];
  fieldMappings?: IntegrationsSnapshot["fieldMappings"];
}

export async function loadSettings(): Promise<SettingsSnapshot | null> {
  try {
    const store = getStore({ name: BLOB_STORE, consistency: "strong" });
    const raw = await store.get(BLOB_KEY);
    if (!raw) return null;
    const str = typeof raw === "string" ? raw : new TextDecoder().decode(raw as ArrayBuffer);
    return JSON.parse(str) as SettingsSnapshot;
  } catch {
    return null;
  }
}

export async function saveSettings(snapshot: SettingsSnapshot): Promise<void> {
  try {
    const store = getStore({ name: BLOB_STORE, consistency: "strong" });
    await store.set(BLOB_KEY, JSON.stringify(snapshot));
  } catch {
    // no-op when Blobs unavailable (e.g. local dev)
  }
}
