"use client";

import { useEffect, useState } from "react";

type Deal = {
  id: string;
  pipelineStage: string;
  source: string;
  createdAt: string;
  rep: { id: string; name: string } | null;
};

export function DealsList({ tenantId }: { tenantId: string }) {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/deals?tenantId=${tenantId}`)
      .then((r) => r.json())
      .then((data) => setDeals(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  }, [tenantId]);

  if (loading) return <p className="text-zinc-500">Loading…</p>;
  if (deals.length === 0) return <p className="text-zinc-500">No deals yet. Log one above.</p>;

  const stageLabel = (s: string) =>
    s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <ul className="space-y-2">
      {deals.slice(0, 50).map((d) => (
        <li
          key={d.id}
          className="flex items-center justify-between p-3 bg-white rounded-lg border border-zinc-200 text-sm"
        >
          <span className="font-medium text-zinc-900">{stageLabel(d.pipelineStage)}</span>
          <span className="text-zinc-500">
            {d.rep?.name ?? "—"} · {new Date(d.createdAt).toLocaleDateString()}
          </span>
        </li>
      ))}
      {deals.length > 50 && (
        <li className="text-zinc-500 text-sm">… and {deals.length - 50} more</li>
      )}
    </ul>
  );
}
