"use client";

import { useState } from "react";
import { addOrUpdateRep, removeRep } from "./actions";
import type { RepConfig, RepRole } from "@/lib/funnel/types";

export function RepManager({ clientId, reps }: { clientId: string; reps: RepConfig[] }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [addName, setAddName] = useState("");
  const [addRole, setAddRole] = useState<RepRole>("setter");
  const [addGhlUserId, setAddGhlUserId] = useState("");
  const [editName, setEditName] = useState("");
  const [editRole, setEditRole] = useState<RepRole>("setter");
  const [editGhlUserId, setEditGhlUserId] = useState("");

  function startEdit(r: RepConfig) {
    setEditingId(r.id);
    setEditName(r.name);
    setEditRole(r.role);
    setEditGhlUserId(r.ghlUserId ?? "");
  }

  async function handleSaveEdit() {
    if (!editingId) return;
    await addOrUpdateRep({
      id: editingId,
      name: editName,
      clientId,
      role: editRole,
      ghlUserId: editGhlUserId.trim() || undefined,
    });
    setEditingId(null);
  }

  async function handleAdd() {
    const name = addName.trim();
    if (!name) return;
    await addOrUpdateRep({
      id: "",
      name,
      clientId,
      role: addRole,
      ghlUserId: addGhlUserId.trim() || undefined,
    });
    setAddName("");
    setAddRole("setter");
    setAddGhlUserId("");
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-5 shadow-lg">
        <h3 className="text-sm font-semibold text-[var(--foreground)] mb-4">Reps for this client</h3>
        <p className="text-xs text-[var(--muted)] mb-4">
          Reps appear in this client&apos;s Overview and Reps views. Set role for KPIs (Setters: meetings set, discovery→clarity; Closers: revenue, win rate). GHL User ID links this rep to a user in GoHighLevel for deal attribution.
        </p>
        <ul className="space-y-2 mb-6">
          <li className="flex flex-wrap items-center gap-4 py-2 border-b border-[var(--card-border)] text-xs font-medium text-[var(--muted)] uppercase tracking-wider">
            <span className="w-32">Display Name</span>
            <span className="w-20">Role</span>
            <span className="w-40">GHL User ID</span>
            <span className="w-24" />
          </li>
          {reps.map((r) => (
            <li
              key={r.id}
              className="flex flex-wrap items-center gap-4 py-2 border-b border-[var(--card-border)] last:border-0"
            >
              {editingId === r.id ? (
                <>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="rounded border border-[var(--card-border)] bg-[var(--background)] px-2 py-1 text-sm text-[var(--foreground)] w-32"
                    placeholder="Display Name"
                  />
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value as RepRole)}
                    className="rounded border border-[var(--card-border)] bg-[var(--background)] px-2 py-1 text-sm text-[var(--foreground)] w-20"
                  >
                    <option value="setter">Setter</option>
                    <option value="closer">Closer</option>
                  </select>
                  <input
                    type="text"
                    value={editGhlUserId}
                    onChange={(e) => setEditGhlUserId(e.target.value)}
                    className="rounded border border-[var(--card-border)] bg-[var(--background)] px-2 py-1 text-sm text-[var(--foreground)] w-40 font-mono text-xs"
                    placeholder="GHL user ID"
                  />
                  <span className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleSaveEdit}
                      className="rounded bg-[var(--accent)] text-white px-3 py-1 text-sm font-medium hover:opacity-90"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="rounded border border-[var(--card-border)] px-3 py-1 text-sm text-[var(--muted)] hover:text-[var(--foreground)]"
                    >
                      Cancel
                    </button>
                  </span>
                </>
              ) : (
                <>
                  <span className="font-medium text-[var(--foreground)] w-32">{r.name}</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-[var(--background)] text-[var(--muted)] capitalize w-20">
                    {r.role}
                  </span>
                  <span className="text-xs font-mono text-[var(--muted)] w-40 truncate" title={r.ghlUserId ?? ""}>
                    {r.ghlUserId ?? "—"}
                  </span>
                  <span className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => startEdit(r)}
                      className="text-xs text-[var(--accent)] hover:underline"
                    >
                      Edit
                    </button>
                    <form action={removeRep.bind(null, clientId, r.id)} className="inline">
                      <button
                        type="submit"
                        className="text-xs text-[var(--danger)] hover:underline"
                      >
                        Remove
                      </button>
                    </form>
                  </span>
                </>
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
            className="rounded border border-[var(--card-border)] bg-[var(--background)] px-2 py-1.5 text-sm text-[var(--foreground)] w-32"
            placeholder="Display Name"
          />
          <select
            value={addRole}
            onChange={(e) => setAddRole(e.target.value as RepRole)}
            className="rounded border border-[var(--card-border)] bg-[var(--background)] px-2 py-1.5 text-sm text-[var(--foreground)] w-20"
          >
            <option value="setter">Setter</option>
            <option value="closer">Closer</option>
          </select>
          <input
            type="text"
            value={addGhlUserId}
            onChange={(e) => setAddGhlUserId(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            className="rounded border border-[var(--card-border)] bg-[var(--background)] px-2 py-1.5 text-sm text-[var(--foreground)] w-40 font-mono text-xs"
            placeholder="GHL User ID"
          />
          <button
            type="button"
            onClick={handleAdd}
            className="rounded bg-[var(--accent)] text-white px-3 py-1.5 text-sm font-medium hover:opacity-90"
          >
            Add rep
          </button>
        </div>
      </div>
    </div>
  );
}
