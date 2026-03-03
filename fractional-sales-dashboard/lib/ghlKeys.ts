/**
 * Secure storage for raw GHL API keys per client.
 * Stored in a separate Netlify Blob store (revpro-ghl-keys), keyed by clientId.
 * Never logged or exposed to the client; used only server-side for GHL API calls.
 */

const STORE_NAME = "revpro-ghl-keys";

export async function getGhlKey(clientId: string): Promise<string | null> {
  try {
    const { getStore } = await import("@netlify/blobs");
    const store = getStore({ name: STORE_NAME, consistency: "strong" });
    const raw = await store.get(clientId);
    if (raw == null) return null;
    const str = typeof raw === "string" ? raw : new TextDecoder().decode(raw as ArrayBuffer);
    return str || null;
  } catch {
    return null;
  }
}

export async function setGhlKey(clientId: string, key: string): Promise<void> {
  if (!clientId || !key?.trim()) return;
  try {
    const { getStore } = await import("@netlify/blobs");
    const store = getStore({ name: STORE_NAME, consistency: "strong" });
    await store.set(clientId, key.trim());
  } catch {
    // no-op when Blobs unavailable (e.g. local dev)
  }
}

export async function deleteGhlKey(clientId: string): Promise<void> {
  try {
    const { getStore } = await import("@netlify/blobs");
    const store = getStore({ name: STORE_NAME, consistency: "strong" });
    await store.delete(clientId);
  } catch {
    // no-op
  }
}
