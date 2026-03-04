/**
 * Secure storage for raw GHL API keys per client.
 * Uses the shared store (key "ghl_keys": { [clientId]: key }). Not dependent on Netlify Blobs.
 * Never logged or exposed to the client; used only server-side for GHL API calls.
 */

import { storeGet, storeSet } from "@/lib/store";

type GhlKeysMap = Record<string, string>;

async function getKeysMap(): Promise<GhlKeysMap> {
  const raw = await storeGet("ghl_keys");
  if (!raw) return {};
  try {
    return JSON.parse(raw) as GhlKeysMap;
  } catch {
    return {};
  }
}

async function setKeysMap(map: GhlKeysMap): Promise<void> {
  await storeSet("ghl_keys", JSON.stringify(map));
}

export async function getGhlKey(clientId: string): Promise<string | null> {
  const map = await getKeysMap();
  const key = map[clientId];
  return key?.trim() || null;
}

export async function setGhlKey(clientId: string, key: string): Promise<void> {
  if (!clientId || !key?.trim()) return;
  const map = await getKeysMap();
  map[clientId] = key.trim();
  await setKeysMap(map);
}

export async function deleteGhlKey(clientId: string): Promise<void> {
  const map = await getKeysMap();
  delete map[clientId];
  await setKeysMap(map);
}
