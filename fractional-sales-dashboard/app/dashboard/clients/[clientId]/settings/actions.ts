"use server";

import { revalidatePath } from "next/cache";
import { upsertRep, deleteRep as deleteRepStore, setClientAccountManager, setClientReportLogo } from "@/lib/funnel/mockData";
import { setIntegrationKey, clearIntegrationKey, setFieldMapping, type IntegrationId } from "@/lib/funnel/integrations";
import type { RepConfig } from "@/lib/funnel/types";

function slug(name: string): string {
  return name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

export async function addOrUpdateRep(rep: RepConfig) {
  const toSave = rep.id
    ? rep
    : { ...rep, id: `${rep.clientId}-${slug(rep.name)}-${Math.random().toString(36).slice(2, 9)}` };
  upsertRep(toSave);
  revalidatePath(`/dashboard/clients/${toSave.clientId}`);
  revalidatePath(`/dashboard/clients/${toSave.clientId}/reps`);
  revalidatePath(`/dashboard/clients/${toSave.clientId}/funnel`);
  revalidatePath(`/dashboard/clients/${toSave.clientId}/settings`);
  revalidatePath("/dashboard");
}

export async function removeRep(clientId: string, repId: string) {
  deleteRepStore(clientId, repId);
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
  setClientAccountManager(clientId, accountManagerId, accountManagerName);
  revalidatePath(`/dashboard/clients/${clientId}`);
  revalidatePath(`/dashboard/clients/${clientId}/settings`);
  revalidatePath("/dashboard");
}

export async function setReportLogo(clientId: string, reportLogoUrl: string) {
  setClientReportLogo(clientId, reportLogoUrl.trim() || "");
  revalidatePath(`/dashboard/clients/${clientId}`);
  revalidatePath(`/dashboard/clients/${clientId}/settings`);
}

export async function saveIntegrationKey(clientId: string, id: IntegrationId, key: string) {
  setIntegrationKey(clientId, id, key);
  revalidatePath(`/dashboard/clients/${clientId}`);
  revalidatePath(`/dashboard/clients/${clientId}/settings`);
}

export async function clearIntegrationKeyAction(clientId: string, id: IntegrationId) {
  clearIntegrationKey(clientId, id);
  revalidatePath(`/dashboard/clients/${clientId}`);
  revalidatePath(`/dashboard/clients/${clientId}/settings`);
}

export async function saveFieldMapping(clientId: string, id: IntegrationId, ourField: string, theirField: string) {
  setFieldMapping(clientId, id, ourField, theirField);
  revalidatePath(`/dashboard/clients/${clientId}`);
  revalidatePath(`/dashboard/clients/${clientId}/settings`);
}
