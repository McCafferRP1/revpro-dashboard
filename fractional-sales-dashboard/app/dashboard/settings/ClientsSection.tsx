"use client";

import Link from "next/link";
import { useState } from "react";
import { addClientAction, removeClientAction } from "./actions";
import type { ClientFunnelConfig } from "@/lib/funnel/types";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export function ClientsSection({
  clients,
  accountManagers,
}: {
  clients: ClientFunnelConfig[];
  accountManagers: { id: string; name: string }[];
}) {
  const [addName, setAddName] = useState("");
  const [addAMId, setAddAMId] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleAdd() {
    const name = addName.trim();
    if (!name) return;
    setError(null);
    try {
      const { clientId } = await addClientAction({
        clientName: name,
        accountManagerId: addAMId || undefined,
        accountManagerName: addAMId ? accountManagers.find((am) => am.id === addAMId)?.name : undefined,
      });
      setAddName("");
      setAddAMId("");
      window.location.href = `${basePath}/dashboard/clients/${clientId}/settings`;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to add client");
    }
  }

  const removableClients = clients.filter((c) => c.clientId !== "bbp");

  return (
    <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-5 shadow-lg">
      <h2 className="text-sm font-semibold text-[var(--foreground)] mb-2">Clients / accounts</h2>
      <p className="text-xs text-[var(--muted)] mb-4">
        Add a new client to the portfolio. They get the same pipeline stages as the template. You can assign an account manager here or in the client&apos;s Settings. Removing a client deletes their reps and targets (seed client cannot be removed).
      </p>
      <ul className="space-y-2 mb-6">
        {clients.map((c) => (
          <li
            key={c.clientId}
            className="flex flex-wrap items-center gap-3 py-2 border-b border-[var(--card-border)] last:border-0"
          >
            <Link
              href={`/dashboard/clients/${c.clientId}`}
              className="font-medium text-[var(--accent)] hover:underline"
            >
              {c.clientName}
            </Link>
            <span className="text-xs text-[var(--muted)]">{c.clientId}</span>
            {c.clientId !== "bbp" && (
              <form action={removeClientAction.bind(null, c.clientId)} className="inline">
                <button type="submit" className="text-xs text-[var(--danger)] hover:underline">
                  Remove
                </button>
              </form>
            )}
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="text"
          value={addName}
          onChange={(e) => setAddName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          className="rounded border border-[var(--card-border)] bg-[var(--background)] px-2 py-1.5 text-sm text-[var(--foreground)] w-52"
          placeholder="New client name"
        />
        <select
          value={addAMId}
          onChange={(e) => setAddAMId(e.target.value)}
          className="rounded border border-[var(--card-border)] bg-[var(--background)] px-2 py-1.5 text-sm text-[var(--foreground)] min-w-[140px]"
        >
          <option value="">No account manager</option>
          {accountManagers.filter((am) => am.id !== "unassigned").map((am) => (
            <option key={am.id} value={am.id}>{am.name}</option>
          ))}
        </select>
        <button
          type="button"
          onClick={handleAdd}
          className="rounded bg-[var(--accent)] text-white px-3 py-1.5 text-sm font-medium hover:opacity-90"
        >
          Add client
        </button>
      </div>
      {error && <p className="mt-2 text-sm text-[var(--danger)]">{error}</p>}
    </div>
  );
}
