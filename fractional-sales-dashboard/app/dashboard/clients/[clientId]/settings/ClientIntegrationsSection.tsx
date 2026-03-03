"use client";

import { useState } from "react";
import { REVPRO_FIELDS, type IntegrationId } from "@/lib/funnel/integrations";
import { saveIntegrationKey, clearIntegrationKeyAction, saveAllFieldMappings, refreshDiscoveryAction } from "./actions";
import type { DiscoverySnapshot } from "@/lib/funnel/ghlDiscovery";

const INTEGRATION_LABELS: Record<IntegrationId, string> = {
  ghl: "GoHighLevel (GHL)",
  crm: "CRM",
};

export function ClientIntegrationsSection({
  clientId,
  initialGhl,
  initialMappings,
  initialDiscovery,
}: {
  clientId: string;
  initialGhl: { configured: boolean; maskedKey?: string };
  initialMappings: { ourField: string; theirField: string }[];
  initialDiscovery?: DiscoverySnapshot | null;
}) {
  const [ghlKey, setGhlKey] = useState("");
  const [mappings, setMappings] = useState<Record<string, string>>(
    Object.fromEntries(initialMappings.map((m) => [m.ourField, m.theirField]))
  );
  const [saving, setSaving] = useState(false);
  const [savingMappings, setSavingMappings] = useState(false);
  const [discovery, setDiscovery] = useState<DiscoverySnapshot | null>(initialDiscovery ?? null);
  const [refreshingDiscovery, setRefreshingDiscovery] = useState(false);

  async function handleSaveKey() {
    if (!ghlKey.trim()) return;
    setSaving(true);
    await saveIntegrationKey(clientId, "ghl", ghlKey.trim());
    setGhlKey("");
    setSaving(false);
  }

  async function handleSaveMappings() {
    setSavingMappings(true);
    const entries = Object.entries(mappings).map(([ourField, theirField]) => ({ ourField, theirField: theirField.trim() }));
    await saveAllFieldMappings(clientId, "ghl", entries);
    setSavingMappings(false);
  }

  async function handleRefreshDiscovery() {
    if (!initialGhl.configured) return;
    setRefreshingDiscovery(true);
    const result = await refreshDiscoveryAction(clientId);
    setDiscovery(result);
    setRefreshingDiscovery(false);
  }

  return (
    <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-5 shadow-lg space-y-6">
      <h3 className="text-sm font-semibold text-[var(--foreground)]">API &amp; integration</h3>
      <p className="text-xs text-[var(--muted)]">
        This client&apos;s API key and field mapping. Each client has their own key so pipeline data maps to the correct account. Keys are stored securely and never shown in full after saving.
      </p>

      {initialGhl.configured && (
        <div className="rounded-lg border border-[var(--card-border)] bg-[var(--background)] px-3 py-2 text-xs">
          <span className="font-medium text-[var(--foreground)]">Integration status:</span>
          <span className="text-[var(--muted)]"> Key saved. </span>
          <span className="text-[var(--success)]">Pipelines &amp; stages:</span>
          <span className="text-[var(--muted)]"> active (Refresh below to load from GHL). </span>
          <span className="text-[var(--muted)]">Funnel/deal data:</span>
          <span className="text-[var(--success)]"> synced from GHL</span>
          <span className="text-[var(--muted)]"> when key and mappings are set; otherwise sample data.</span>
        </div>
      )}

      <div className="space-y-3">
        <h4 className="text-xs font-medium text-[var(--foreground)]">{INTEGRATION_LABELS.ghl}</h4>
        {initialGhl.configured ? (
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm text-[var(--muted)] font-mono">{initialGhl.maskedKey ?? "••••••••"}</span>
            <form action={clearIntegrationKeyAction.bind(null, clientId, "ghl")}>
              <button type="submit" className="text-xs text-[var(--danger)] hover:underline">
                Remove key
              </button>
            </form>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="password"
              value={ghlKey}
              onChange={(e) => setGhlKey(e.target.value)}
              className="rounded-lg border border-[var(--card-border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] w-64 font-mono"
              placeholder="API key (e.g. ghl_...)"
              autoComplete="off"
            />
            <button
              type="button"
              onClick={handleSaveKey}
              disabled={saving || !ghlKey.trim()}
              className="rounded bg-[var(--accent)] text-white px-3 py-2 text-sm font-medium hover:opacity-90 disabled:opacity-50"
            >
              Save key
            </button>
          </div>
        )}
      </div>

      {initialGhl.configured && (
        <>
          <div className="space-y-3 pt-4 border-t border-[var(--card-border)]">
            <h4 className="text-xs font-medium text-[var(--foreground)]">Available pipelines &amp; stages</h4>
            <p className="text-xs text-[var(--muted)]">
              Pipelines and stages from GoHighLevel for this location. Refreshed automatically when you load the portfolio or this client&apos;s funnel; use Refresh to fetch now.
            </p>
            <button
              type="button"
              onClick={handleRefreshDiscovery}
              disabled={refreshingDiscovery}
              className="rounded bg-[var(--background)] border border-[var(--card-border)] text-[var(--foreground)] px-3 py-2 text-sm font-medium hover:opacity-90 disabled:opacity-50"
            >
              {refreshingDiscovery ? "Refreshing…" : "Refresh"}
            </button>
            {discovery?.pipelines && discovery.pipelines.length > 0 ? (
              <div className="rounded-lg border border-[var(--card-border)] bg-[var(--background)] p-3 text-xs space-y-3 max-h-48 overflow-y-auto">
                {discovery.pipelines.map((p) => (
                  <div key={p.id}>
                    <div className="font-semibold text-[var(--foreground)]">{p.name}</div>
                    {p.stages?.length ? (
                      <ul className="mt-1 ml-3 text-[var(--muted)] list-disc">
                        {p.stages.map((s) => (
                          <li key={s.id}>{s.name}</li>
                        ))}
                      </ul>
                    ) : (
                      <span className="text-[var(--muted)]">No stages</span>
                    )}
                  </div>
                ))}
              </div>
            ) : discovery ? (
              <p className="text-xs text-[var(--muted)]">No pipelines returned. Check API key and location access.</p>
            ) : null}
          </div>
          <div className="space-y-3 pt-4 border-t border-[var(--card-border)]">
            <h4 className="text-xs font-medium text-[var(--foreground)]">Field mapping (receiving parameters)</h4>
          <p className="text-xs text-[var(--muted)]">
            Map your CRM&apos;s field names to the RevPro fields below. <strong>Revenue booked</strong> and <strong>Cash collected</strong> are required for closed-won attribution. Click Save mappings to store your changes.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--card-border)] text-left">
                  <th className="py-2 pr-4 text-[var(--muted)] font-medium">RevPro field</th>
                  <th className="py-2 text-[var(--muted)] font-medium">Your API field name</th>
                </tr>
              </thead>
              <tbody>
                {REVPRO_FIELDS.map(({ key, label }) => (
                  <tr key={key} className="border-b border-[var(--card-border)] last:border-0">
                    <td className="py-2 pr-4 text-[var(--foreground)]">{label}</td>
                    <td className="py-2">
                      <input
                        type="text"
                        value={mappings[key] ?? ""}
                        onChange={(e) => setMappings((prev) => ({ ...prev, [key]: e.target.value }))}
                        className="w-full max-w-xs rounded border border-[var(--card-border)] bg-[var(--background)] px-2 py-1 text-[var(--foreground)] font-mono text-xs"
                        placeholder={key}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="pt-2">
            <button
              type="button"
              onClick={handleSaveMappings}
              disabled={savingMappings}
              className="rounded bg-[var(--accent)] text-white px-3 py-2 text-sm font-medium hover:opacity-90 disabled:opacity-50"
            >
              {savingMappings ? "Saving…" : "Save mappings"}
            </button>
          </div>
          </div>
        </>
      )}
    </div>
  );
}
