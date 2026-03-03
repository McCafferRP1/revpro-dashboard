"use client";

import { useState } from "react";
import { addOrUpdateRep, removeRep } from "./actions";
import type { RepConfig, RepRole } from "@/lib/funnel/types";

export function RepManager({ clientId, reps }: { clientId: string; reps: RepConfig[] }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [addName, setAddName] = useState("");
  const [addRole, setAddRole] = useState<RepRole>("setter");
  const [editName, setEditName] = useState("");
  const [editRole, setEditRole] = useState<RepRole>("setter");

  function startEdit(r: RepConfig) {
    setEditingId(r.id);
    setEditName(r.name);
    setEditRole(r.role);
  }

  async function handleSaveEdit() {
    if (!editingId) return;
    await addOrUpdateRep({
      id: editingId,
      name: editName,
      clientId,
      role: editRole,
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
    });
    setAddName("");
    setAddRole("setter");
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-5 shadow-lg">
        <h3 className="text-sm font-semibold text-[var(--foreground)] mb-4">Reps for this client</h3>
        <p className="text-xs text-[var(--muted)] mb-4">
          Only these reps appear in this client&apos;s Overview and Reps views. Set role to control which KPIs they see (Setters: meetings set, discovery→clarity rates; Closers: revenue closed, win rate, cycle).
        </p>
        <ul className="space-y-2 mb-6">
          {reps.map((r) => (
            <li
              key={r.id}
              className="flex flex-wrap items-center gap-3 py-2 border-b border-[var(--card-border)] last:border-0"
            >
              {editingId === r.id ? (
                <>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="rounded border border-[var(--card-border)] bg-[var(--background)] px-2 py-1 text-sm text-[var(--foreground)] w-40"
                    placeholder="Name"
                  />
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value as RepRole)}
                    className="rounded border border-[var(--card-border)] bg-[var(--background)] px-2 py-1 text-sm text-[var(--foreground)]"
                  >
                    <option value="setter">Setter</option>
                    <option value="closer">Closer</option>
                  </select>
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
                </>
              ) : (
                <>
                  <span className="font-medium text-[var(--foreground)]">{r.name}</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-[var(--background)] text-[var(--muted)] capitalize">
                    {r.role}
                  </span>
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
            className="rounded border border-[var(--card-border)] bg-[var(--background)] px-2 py-1.5 text-sm text-[var(--foreground)] w-44"
            placeholder="New rep name"
          />
          <select
            value={addRole}
            onChange={(e) => setAddRole(e.target.value as RepRole)}
            className="rounded border border-[var(--card-border)] bg-[var(--background)] px-2 py-1.5 text-sm text-[var(--foreground)]"
          >
            <option value="setter">Setter</option>
            <option value="closer">Closer</option>
          </select>
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
