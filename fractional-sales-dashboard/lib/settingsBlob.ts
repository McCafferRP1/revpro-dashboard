/**
 * Persist settings (clients, overrides, reps, targets, integrations, field mappings).
 * Uses the shared store (file or Postgres via DATABASE_URL). Not dependent on Netlify Blobs.
 * Data is loaded on every request via hydrateSettings() so it is always current.
 */

import { storeGet, storeSet } from "@/lib/store";
import type { ClientFunnelConfig, MonthlyTarget, RepConfig } from "@/lib/funnel/types";
import type { IntegrationsSnapshot } from "@/lib/funnel/integrations";

export interface SettingsSnapshot {
  additionalClients: ClientFunnelConfig[];
  clientOverrides: Record<string, { accountManagerId?: string; accountManagerName?: string; reportLogoUrl?: string; ghlPipelineId?: string }>;
  reps: RepConfig[];
  targets: MonthlyTarget[];
  integrations?: IntegrationsSnapshot["integrations"];
  fieldMappings?: IntegrationsSnapshot["fieldMappings"];
}

export async function loadSettings(): Promise<SettingsSnapshot | null> {
  const raw = await storeGet("settings");
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SettingsSnapshot;
  } catch {
    return null;
  }
}

/** Persist settings. Throws on failure so callers can show an error. */
export async function saveSettings(snapshot: SettingsSnapshot): Promise<void> {
  await storeSet("settings", JSON.stringify(snapshot));
}
