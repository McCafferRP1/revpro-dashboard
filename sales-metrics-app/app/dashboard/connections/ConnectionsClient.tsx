"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Tenant = { id: string; name: string };
type Connection = {
  id: string;
  type: string;
  tenantId: string;
  lastSyncedAt: string | null;
  lastError: string | null;
  tenant: { id: string; name: string };
};

export function ConnectionsClient({
  tenants,
  connections,
  selectedTenantId,
}: {
  tenants: Tenant[];
  connections: Connection[];
  selectedTenantId: string | null;
}) {
  const router = useRouter();
  const [tenantId, setTenantId] = useState(selectedTenantId ?? tenants[0]?.id ?? "");
  const [type, setType] = useState<"gohighlevel" | "close">("gohighlevel");
  const [apiKey, setApiKey] = useState("");
  const [locationId, setLocationId] = useState("");
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState<string | null>(null);
  const selectedForList = selectedTenantId ?? tenants[0]?.id ?? "";

  function handleTenantChange(value: string) {
    setTenantId(value);
    router.push(value ? `/dashboard/connections?tenantId=${value}` : "/dashboard/connections");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!tenantId || !apiKey.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/connections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId,
          type,
          apiKey: apiKey.trim(),
          ...(type === "gohighlevel" && locationId.trim() ? { locationId: locationId.trim() } : {}),
        }),
      });
      if (res.ok) {
        setApiKey("");
        setLocationId("");
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "Failed to create connection");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleSync(connectionId: string, connTenantId: string) {
    setSyncing(connectionId);
    try {
      const res = await fetch(`/api/sync?tenantId=${connTenantId}`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) alert(data.error || "Sync failed");
      router.refresh();
    } finally {
      setSyncing(null);
    }
  }

  return (
    <>
      <div className="mb-6">
        <label className="block text-sm font-medium text-zinc-700 mb-1">Filter by client</label>
        <select
          value={selectedForList}
          onChange={(e) => handleTenantChange(e.target.value)}
          className="px-3 py-2 border border-zinc-300 rounded-lg w-64"
        >
          <option value="">All clients</option>
          {tenants.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </div>

      <div className="p-4 bg-white rounded-lg border border-zinc-200 mb-6">
        <h2 className="font-medium text-zinc-900 mb-4">Add connection</h2>
        <form onSubmit={handleSubmit} className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-xs text-zinc-500 mb-0.5">Client (required)</label>
            <select
              value={tenantId}
              onChange={(e) => setTenantId(e.target.value)}
              className="px-3 py-2 border border-zinc-300 rounded-lg min-w-[180px]"
              required
            >
              <option value="">Select client</option>
              {tenants.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-zinc-500 mb-0.5">CRM type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as "gohighlevel" | "close")}
              className="px-3 py-2 border border-zinc-300 rounded-lg min-w-[140px]"
            >
              <option value="gohighlevel">GoHighLevel</option>
              <option value="close">Close</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-zinc-500 mb-0.5">API key</label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="API key or token"
              className="px-3 py-2 border border-zinc-300 rounded-lg min-w-[200px]"
              required
            />
          </div>
          {type === "gohighlevel" && (
            <div>
              <label className="block text-xs text-zinc-500 mb-0.5">Location ID (optional)</label>
              <input
                type="text"
                value={locationId}
                onChange={(e) => setLocationId(e.target.value)}
                placeholder="GHL location ID"
                className="px-3 py-2 border border-zinc-300 rounded-lg min-w-[140px]"
              />
            </div>
          )}
          <button
            type="submit"
            disabled={loading || !tenantId}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            Add connection
          </button>
        </form>
      </div>

      <div>
        <h2 className="font-medium text-zinc-900 mb-3">Connections</h2>
        {connections.length === 0 ? (
          <p className="text-zinc-500">No connections yet. Add one above.</p>
        ) : (
          <ul className="space-y-2">
            {connections.map((c) => (
              <li
                key={c.id}
                className="flex items-center justify-between p-4 bg-white rounded-lg border border-zinc-200"
              >
                <div>
                  <span className="font-medium text-zinc-900">{c.tenant.name}</span>
                  <span className="ml-2 text-sm text-zinc-500">
                    {c.type === "gohighlevel" ? "GoHighLevel" : "Close"}
                  </span>
                  {c.lastSyncedAt && (
                    <span className="block text-xs text-zinc-400">
                      Last synced: {new Date(c.lastSyncedAt).toLocaleString()}
                    </span>
                  )}
                  {c.lastError && (
                    <span className="block text-xs text-red-600">{c.lastError}</span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => handleSync(c.id, c.tenantId)}
                  disabled={syncing === c.id}
                  className="px-3 py-1.5 text-sm bg-zinc-100 text-zinc-700 rounded hover:bg-zinc-200 disabled:opacity-50"
                >
                  {syncing === c.id ? "Syncing…" : "Sync now"}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
