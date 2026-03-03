"use client";

import { useState } from "react";
import type { Rep } from "@prisma/client";

const STAGES = [
  { value: "lead_in", label: "Lead in" },
  { value: "meeting_booked", label: "Meeting booked" },
  { value: "initial_meeting_done", label: "Initial meeting done" },
  { value: "initial_meeting_qualified", label: "Initial meeting qualified" },
  { value: "second_meeting_booked", label: "Second meeting booked" },
  { value: "closed_won", label: "Closed won" },
  { value: "closed_lost", label: "Closed lost" },
] as const;

export function DealForm({ tenantId, reps }: { tenantId: string; reps: Rep[] }) {
  const [stage, setStage] = useState<string>("lead_in");
  const [repId, setRepId] = useState<string>("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/deals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId, pipelineStage: stage, repId: repId || undefined }),
      });
      if (res.ok) {
        setStage("lead_in");
        setRepId("");
        window.location.reload();
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "Failed to create deal");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap gap-4 items-end p-4 bg-white rounded-lg border border-zinc-200 mb-6">
      <div>
        <label className="block text-xs text-zinc-500 mb-0.5">Stage</label>
        <select
          value={stage}
          onChange={(e) => setStage(e.target.value)}
          className="px-3 py-2 border border-zinc-300 rounded-lg min-w-[180px]"
        >
          {STAGES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs text-zinc-500 mb-0.5">Rep (optional)</label>
        <select
          value={repId}
          onChange={(e) => setRepId(e.target.value)}
          className="px-3 py-2 border border-zinc-300 rounded-lg min-w-[140px]"
        >
          <option value="">—</option>
          {reps.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
      </div>
      <button
        type="submit"
        disabled={loading}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
      >
        Log deal
      </button>
    </form>
  );
}
