/**
 * Integrations and API keys per client (mock store).
 * Each client has their own API key(s) and field mappings.
 * In production: store keys in a secrets manager keyed by clientId; never log or expose full keys.
 */

export type IntegrationId = "ghl" | "crm";

export interface IntegrationConfig {
  /** Whether an API key has been set (we don't store the raw key in mock). */
  configured: boolean;
  /** Masked key for display only (e.g. "ghl_••••••••xyz"). */
  maskedKey?: string;
}

export interface FieldMappingEntry {
  /** Our internal field name (e.g. contactId, contactDate, pipelineStageId). */
  ourField: string;
  /** Their API field name or path (e.g. "id", "dateAdded", "pipelineStage.id"). */
  theirField: string;
  label?: string;
}

/** Per-client integration config: clientId -> integrationId -> config */
const clientIntegrationsStore: Record<string, Record<IntegrationId, IntegrationConfig>> = {};

/** Per-client field mappings: clientId -> integrationId -> entries */
const clientFieldMappingsStore: Record<string, Record<IntegrationId, FieldMappingEntry[]>> = {};

/** Default our-field labels for mapping UI. Receiving parameters: map your CRM field names to these RevPro fields. */
export const REVPRO_FIELDS: { key: string; label: string }[] = [
  { key: "contactId", label: "Contact ID" },
  { key: "contactDate", label: "Contact created date" },
  { key: "contactEmail", label: "Contact email" },
  { key: "contactName", label: "Contact name" },
  { key: "pipelineId", label: "Pipeline ID" },
  { key: "pipelineStageId", label: "Pipeline stage ID" },
  { key: "pipelineStageName", label: "Pipeline stage name" },
  { key: "dealValue", label: "Deal value (legacy)" },
  { key: "revenueBooked", label: "Revenue booked" },
  { key: "cashCollected", label: "Cash collected (at point of sale)" },
  { key: "dealClosedDate", label: "Deal closed date" },
  { key: "dealOutcome", label: "Deal outcome (won/lost)" },
  { key: "setterGhlUserId", label: "Setter / sourced-by (GHL user ID)" },
];

function getClientIntegrations(clientId: string): Record<IntegrationId, IntegrationConfig> {
  if (!clientIntegrationsStore[clientId]) {
    clientIntegrationsStore[clientId] = { ghl: { configured: false }, crm: { configured: false } };
  }
  return clientIntegrationsStore[clientId];
}

function getClientMappings(clientId: string): Record<IntegrationId, FieldMappingEntry[]> {
  if (!clientFieldMappingsStore[clientId]) {
    clientFieldMappingsStore[clientId] = { ghl: [], crm: [] };
  }
  return clientFieldMappingsStore[clientId];
}

export function getIntegration(clientId: string, id: IntegrationId): IntegrationConfig {
  const c = getClientIntegrations(clientId)[id];
  return c ? { ...c } : { configured: false };
}

export function setIntegrationKey(clientId: string, id: IntegrationId, key: string): void {
  if (!key || key.length < 8) return;
  const masked = key.slice(0, 4) + "••••••••" + key.slice(-4);
  getClientIntegrations(clientId)[id] = { configured: true, maskedKey: masked };
}

export function clearIntegrationKey(clientId: string, id: IntegrationId): void {
  getClientIntegrations(clientId)[id] = { configured: false, maskedKey: undefined };
  getClientMappings(clientId)[id] = [];
}

/** Remove all integration data for a client (e.g. when client is deleted). */
export function clearClientIntegrations(clientId: string): void {
  delete clientIntegrationsStore[clientId];
  delete clientFieldMappingsStore[clientId];
}

export function getFieldMappings(clientId: string, id: IntegrationId): FieldMappingEntry[] {
  return [...(getClientMappings(clientId)[id] ?? [])];
}

export function setFieldMappings(clientId: string, id: IntegrationId, entries: FieldMappingEntry[]): void {
  getClientMappings(clientId)[id] = entries.filter((e) => e.ourField && e.theirField);
}

export function setFieldMapping(clientId: string, id: IntegrationId, ourField: string, theirField: string): void {
  const list = getClientMappings(clientId)[id] ?? [];
  const idx = list.findIndex((e) => e.ourField === ourField);
  const entry = { ourField, theirField, label: REVPRO_FIELDS.find((f) => f.key === ourField)?.label };
  if (idx >= 0) list[idx] = entry;
  else list.push(entry);
  getClientMappings(clientId)[id] = list;
}

/** Snapshot for persisting to Blob (configured + masked key only; raw key is never stored). */
export interface IntegrationsSnapshot {
  integrations: Record<string, Record<IntegrationId, IntegrationConfig>>;
  fieldMappings: Record<string, Record<IntegrationId, FieldMappingEntry[]>>;
}

export function getIntegrationsSnapshot(): IntegrationsSnapshot {
  return {
    integrations: JSON.parse(JSON.stringify(clientIntegrationsStore)),
    fieldMappings: JSON.parse(JSON.stringify(clientFieldMappingsStore)),
  };
}

export function setIntegrationsFromSnapshot(snapshot: IntegrationsSnapshot): void {
  for (const clientId of Object.keys(clientIntegrationsStore)) delete clientIntegrationsStore[clientId];
  for (const clientId of Object.keys(clientFieldMappingsStore)) delete clientFieldMappingsStore[clientId];
  if (snapshot.integrations) Object.assign(clientIntegrationsStore, snapshot.integrations);
  if (snapshot.fieldMappings) Object.assign(clientFieldMappingsStore, snapshot.fieldMappings);
}

/** Client IDs that have a GHL API key configured (for discovery refresh triggers). */
export function getClientIdsWithGhlConfigured(): string[] {
  const { integrations } = getIntegrationsSnapshot();
  return Object.keys(integrations).filter((clientId) => integrations[clientId]?.ghl?.configured === true);
}
