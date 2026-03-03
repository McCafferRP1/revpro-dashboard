"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { hydrateSettings } from "@/lib/funnel/mockData";
import { getClientIdsWithGhlConfigured } from "@/lib/funnel/integrations";
import { refreshDiscoveryIfNeeded } from "@/lib/funnel/ghlDiscovery";

export async function logoutAction() {
  const store = await cookies();
  const path = process.env.NEXT_PUBLIC_BASE_PATH || "/";
  store.set("revpro_session", "", { path, maxAge: 0 });
  redirect("/login");
}

/** Trigger GHL discovery refresh in background. Call on portfolio or client funnel load. */
export async function triggerDiscoveryRefresh(clientId?: string): Promise<void> {
  await hydrateSettings();
  const ids = clientId
    ? (getClientIdsWithGhlConfigured().includes(clientId) ? [clientId] : [])
    : getClientIdsWithGhlConfigured();
  await Promise.all(ids.map((id) => refreshDiscoveryIfNeeded(id)));
}
