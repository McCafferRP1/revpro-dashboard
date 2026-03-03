"use client";

import { useState } from "react";
import type { ClientFunnelConfig } from "@/lib/funnel/types";
import { saveTargetsAction } from "./actions";

export interface TargetsFormProps {
  clients: ClientFunnelConfig[];
  clientId: string;
  year: number;
  month: number;
  initial: {
    leadsIn: number;
    discoveryCalls: number;
    clarityCalls: number;
    closedWonCount: number;
    closedWonValue: number;
    closedWonCashCollected: number;
  };
  assumptions: {
    leadToDiscoveryPct: number;
    discoveryToClarityPct: number;
    clarityToClosePct: number;
    avgDealSize: number;
  };
}

export function TargetsForm({ clients, clientId, year, month, initial, assumptions: initialAssumptions }: TargetsFormProps) {
  const [form, setForm] = useState({
    ...initial,
    revenueGoal: initial.closedWonValue,
    leadToDiscoveryPct: initialAssumptions.leadToDiscoveryPct,
    discoveryToClarityPct: initialAssumptions.discoveryToClarityPct,
    clarityToClosePct: initialAssumptions.clarityToClosePct,
    avgDealSize: initialAssumptions.avgDealSize,
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  function suggestFromRevenue() {
    const revenue = form.revenueGoal;
    const avg = form.avgDealSize || 4000;
    const closeRate = (form.clarityToClosePct || 30) / 100;
    const discToClarity = (form.discoveryToClarityPct || 40) / 100;
    const leadToDisc = (form.leadToDiscoveryPct || 25) / 100;

    const closedWonCount = Math.round(revenue / avg);
    const closedWonValue = revenue;
    const pitches = closeRate > 0 ? Math.round(closedWonCount / closeRate) : closedWonCount;
    const clarityCalls = Math.round(pitches);
    const discoveryCalls = discToClarity > 0 ? Math.round(clarityCalls / discToClarity) : clarityCalls;
    const leadsIn = leadToDisc > 0 ? Math.round(discoveryCalls / leadToDisc) : discoveryCalls;

    setForm((f) => ({
      ...f,
      leadsIn,
      discoveryCalls,
      clarityCalls,
      closedWonCount,
      closedWonValue,
    }));
    setMessage("Suggested targets filled. Review and save.");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      await saveTargetsAction({
        clientId,
        year,
        month,
        leadsIn: form.leadsIn,
        discoveryCalls: form.discoveryCalls,
        clarityCalls: form.clarityCalls,
        closedWonCount: form.closedWonCount,
        closedWonValue: form.closedWonValue,
        closedWonCashCollected: form.closedWonCashCollected,
      });
      setMessage("Targets saved.");
    } catch (err) {
      setMessage("Failed to save.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-5 space-y-4">
        <h2 className="text-xs font-medium text-[var(--muted)] uppercase tracking-wider">Manual targets</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <label className="block">
            <span className="text-xs text-[var(--muted)]">Leads In</span>
            <input
              type="number"
              min={0}
              className="mt-1 w-full rounded-md border border-[var(--card-border)] bg-[var(--background)] px-3 py-2 text-[var(--foreground)]"
              value={form.leadsIn}
              onChange={(e) => setForm((f) => ({ ...f, leadsIn: parseInt(e.target.value, 10) || 0 }))}
            />
          </label>
          <label className="block">
            <span className="text-xs text-[var(--muted)]">Discovery Scheduled</span>
            <input
              type="number"
              min={0}
              className="mt-1 w-full rounded-md border border-[var(--card-border)] bg-[var(--background)] px-3 py-2 text-[var(--foreground)]"
              value={form.discoveryCalls}
              onChange={(e) => setForm((f) => ({ ...f, discoveryCalls: parseInt(e.target.value, 10) || 0 }))}
            />
          </label>
          <label className="block">
            <span className="text-xs text-[var(--muted)]">Clarity Scheduled / Confirmed</span>
            <input
              type="number"
              min={0}
              className="mt-1 w-full rounded-md border border-[var(--card-border)] bg-[var(--background)] px-3 py-2 text-[var(--foreground)]"
              value={form.clarityCalls}
              onChange={(e) => setForm((f) => ({ ...f, clarityCalls: parseInt(e.target.value, 10) || 0 }))}
            />
          </label>
          <label className="block">
            <span className="text-xs text-[var(--muted)]">Closed Won (count)</span>
            <input
              type="number"
              min={0}
              className="mt-1 w-full rounded-md border border-[var(--card-border)] bg-[var(--background)] px-3 py-2 text-[var(--foreground)]"
              value={form.closedWonCount}
              onChange={(e) => setForm((f) => ({ ...f, closedWonCount: parseInt(e.target.value, 10) || 0 }))}
            />
          </label>
          <label className="block sm:col-span-2">
            <span className="text-xs text-[var(--muted)]">Revenue booked ($)</span>
            <input
              type="number"
              min={0}
              className="mt-1 w-full rounded-md border border-[var(--card-border)] bg-[var(--background)] px-3 py-2 text-[var(--foreground)]"
              value={form.closedWonValue}
              onChange={(e) => setForm((f) => ({ ...f, closedWonValue: parseInt(e.target.value, 10) || 0 }))}
            />
          </label>
          <label className="block sm:col-span-2">
            <span className="text-xs text-[var(--muted)]">Cash collected at point of sale ($)</span>
            <input
              type="number"
              min={0}
              className="mt-1 w-full rounded-md border border-[var(--card-border)] bg-[var(--background)] px-3 py-2 text-[var(--foreground)]"
              value={form.closedWonCashCollected}
              onChange={(e) => setForm((f) => ({ ...f, closedWonCashCollected: parseInt(e.target.value, 10) || 0 }))}
            />
          </label>
        </div>
      </div>

      <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-5 space-y-4">
        <h2 className="text-xs font-medium text-[var(--muted)] uppercase tracking-wider">Assumptions (for Suggest from revenue)</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <label className="block">
            <span className="text-xs text-[var(--muted)]">Lead → Discovery %</span>
            <input
              type="number"
              min={0}
              max={100}
              step={0.1}
              className="mt-1 w-full rounded-md border border-[var(--card-border)] bg-[var(--background)] px-3 py-2 text-[var(--foreground)]"
              value={form.leadToDiscoveryPct}
              onChange={(e) => setForm((f) => ({ ...f, leadToDiscoveryPct: parseFloat(e.target.value) || 0 }))}
            />
          </label>
          <label className="block">
            <span className="text-xs text-[var(--muted)]">Discovery → Clarity %</span>
            <input
              type="number"
              min={0}
              max={100}
              step={0.1}
              className="mt-1 w-full rounded-md border border-[var(--card-border)] bg-[var(--background)] px-3 py-2 text-[var(--foreground)]"
              value={form.discoveryToClarityPct}
              onChange={(e) => setForm((f) => ({ ...f, discoveryToClarityPct: parseFloat(e.target.value) || 0 }))}
            />
          </label>
          <label className="block">
            <span className="text-xs text-[var(--muted)]">Clarity → Close %</span>
            <input
              type="number"
              min={0}
              max={100}
              step={0.1}
              className="mt-1 w-full rounded-md border border-[var(--card-border)] bg-[var(--background)] px-3 py-2 text-[var(--foreground)]"
              value={form.clarityToClosePct}
              onChange={(e) => setForm((f) => ({ ...f, clarityToClosePct: parseFloat(e.target.value) || 0 }))}
            />
          </label>
          <label className="block">
            <span className="text-xs text-[var(--muted)]">Avg deal size ($)</span>
            <input
              type="number"
              min={0}
              className="mt-1 w-full rounded-md border border-[var(--card-border)] bg-[var(--background)] px-3 py-2 text-[var(--foreground)]"
              value={form.avgDealSize}
              onChange={(e) => setForm((f) => ({ ...f, avgDealSize: parseInt(e.target.value, 10) || 0 }))}
            />
          </label>
          <label className="block sm:col-span-2">
            <span className="text-xs text-[var(--muted)]">Revenue goal ($) — for Suggest</span>
            <input
              type="number"
              min={0}
              className="mt-1 w-full rounded-md border border-[var(--card-border)] bg-[var(--background)] px-3 py-2 text-[var(--foreground)]"
              value={form.revenueGoal}
              onChange={(e) => setForm((f) => ({ ...f, revenueGoal: parseInt(e.target.value, 10) || 0 }))}
            />
          </label>
        </div>
        <button
          type="button"
          onClick={suggestFromRevenue}
          className="rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          Suggest from revenue goal
        </button>
      </div>

      {message && <p className="text-sm text-[var(--muted)]">{message}</p>}
      <button
        type="submit"
        disabled={saving}
        className="rounded-md bg-[var(--success)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
      >
        {saving ? "Saving…" : "Save targets"}
      </button>
    </form>
  );
}
