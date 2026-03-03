"use server";

import { revalidatePath } from "next/cache";
import { upsertRep, deleteRep as deleteRepStore, setClientAccountManager, setClientReportLogo, hydrateSettings, persistSettings } from "@/lib/funnel/mockData";
import { setIntegrationKey, clearIntegrationKey, setFieldMapping, setFieldMappings, type IntegrationId } from "@/lib/funnel/integrations";
import type { RepConfig } from "@/lib/funnel/types";

function slug(name: string): string {
  return name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

export async function addOrUpdateRep(rep: RepConfig) {
  await hydrateSettings();
  const toSave = rep.id
    ? rep
    : { ...rep, id: `${rep.clientId}-${slug(rep.name)}-${Math.random().toString(36).slice(2, 9)}` };
  upsertRep(toSave);
  await persistSettings();
  revalidatePath(`/dashboard/clients/${toSave.clientId}`);
  revalidatePath(`/dashboard/clients/${toSave.clientId}/reps`);
  revalidatePath(`/dashboard/clients/${toSave.clientId}/funnel`);
  revalidatePath(`/dashboard/clients/${toSave.clientId}/settings`);
  revalidatePath("/dashboard");
}

export async function removeRep(clientId: string, repId: string) {
  await hydrateSettings();
  deleteRepStore(clientId, repId);
  await persistSettings();
  revalidatePath(`/dashboard/clients/${clientId}`);
  revalidatePath(`/dashboard/clients/${clientId}/reps`);
  revalidatePath(`/dashboard/clients/${clientId}/funnel`);
  revalidatePath(`/dashboard/clients/${clientId}/settings`);
  revalidatePath("/dashboard");
}

export async function setAccountManager(
  clientId: string,
  accountManagerId: string,
  accountManagerName: string
) {
  await hydrateSettings();
  setClientAccountManager(clientId, accountManagerId, accountManagerName);
  await persistSettings();
  revalidatePath(`/dashboard/clients/${clientId}`);
  revalidatePath(`/dashboard/clients/${clientId}/settings`);
  revalidatePath("/dashboard");
}

export async function setReportLogo(clientId: string, reportLogoUrl: string) {
  await hydrateSettings();
  setClientReportLogo(clientId, reportLogoUrl.trim() || "");
  await persistSettings();
  revalidatePath(`/dashboard/clients/${clientId}`);
  revalidatePath(`/dashboard/clients/${clientId}/settings`);
}

export async function saveIntegrationKey(clientId: string, id: IntegrationId, key: string) {
  await hydrateSettings();
  setIntegrationKey(clientId, id, key);
  await persistSettings();
  revalidatePath(`/dashboard/clients/${clientId}`);
  revalidatePath(`/dashboard/clients/${clientId}/settings`);
}

export async function clearIntegrationKeyAction(clientId: string, id: IntegrationId) {
  await hydrateSettings();
  clearIntegrationKey(clientId, id);
  await persistSettings();
  revalidatePath(`/dashboard/clients/${clientId}`);
  revalidatePath(`/dashboard/clients/${clientId}/settings`);
}

export async function saveFieldMapping(clientId: string, id: IntegrationId, ourField: string, theirField: string) {
  await hydrateSettings();
  setFieldMapping(clientId, id, ourField, theirField);
  await persistSettings();
  revalidatePath(`/dashboard/clients/${clientId}`);
  revalidatePath(`/dashboard/clients/${clientId}/settings`);
}

export async function saveAllFieldMappings(
  clientId: string,
  id: IntegrationId,
  entries: { ourField: string; theirField: string }[]
) {
  await hydrateSettings();
  setFieldMappings(clientId, id, entries.filter((e) => e.ourField && e.theirField.trim()));
  await persistSettings();
  revalidatePath(`/dashboard/clients/${clientId}`);
  revalidatePath(`/dashboard/clients/${clientId}/settings`);
}
