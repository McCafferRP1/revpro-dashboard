"use client";

import { useState } from "react";
import { addUserAction, updateUserAction, removeUserAction } from "./actions";
import type { UserRole } from "@/lib/auth";

export interface UserDisplay {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  isAdministrator: boolean;
}

export function UsersSection({ users }: { users: UserDisplay[] }) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("collaborator");
  const [isAdministrator, setIsAdministrator] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRole, setEditRole] = useState<UserRole>("collaborator");
  const [editAdmin, setEditAdmin] = useState(false);

  async function handleAdd() {
    const e = email.trim();
    const n = name.trim();
    const p = password;
    if (!e || !n || !p) {
      setError("Email, name, and password are required.");
      return;
    }
    if (p.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setError(null);
    try {
      await addUserAction({ email: e, name: n, role, isAdministrator, password: p });
      setEmail("");
      setName("");
      setPassword("");
      setRole("collaborator");
      setIsAdministrator(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add user.");
    }
  }

  function startEdit(u: UserDisplay) {
    setEditingId(u.id);
    setEditRole(u.role);
    setEditAdmin(u.isAdministrator);
  }

  async function handleSaveEdit() {
    if (!editingId) return;
    await updateUserAction(editingId, { role: editRole, isAdministrator: editAdmin });
    setEditingId(null);
  }

  const roleLabel = (r: UserRole) => (r === "account_manager" ? "Account manager" : "Collaborator");

  return (
    <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-5 shadow-lg">
      <h2 className="text-sm font-semibold text-[var(--foreground)] mb-2">Users</h2>
      <p className="text-xs text-[var(--muted)] mb-4">
        Add users with a role and administrator flag. <strong>Account managers</strong> appear in the client account-manager dropdown and portfolio filter. <strong>Collaborators</strong> can navigate and view the same way but are not in the AM dropdown. <strong>Administrator</strong> grants access to company-level Settings and weekly reports.
      </p>
      <ul className="space-y-2 mb-6">
        {users.map((u) => (
          <li
            key={u.id}
            className="flex flex-wrap items-center gap-3 py-2 border-b border-[var(--card-border)] last:border-0"
          >
            {editingId === u.id ? (
              <>
                <span className="font-medium text-[var(--foreground)]">{u.name}</span>
                <span className="text-sm text-[var(--muted)]">{u.email}</span>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value as UserRole)}
                  className="rounded border border-[var(--card-border)] bg-[var(--background)] px-2 py-1 text-sm text-[var(--foreground)]"
                >
                  <option value="account_manager">Account manager</option>
                  <option value="collaborator">Collaborator</option>
                </select>
                <label className="flex items-center gap-1.5 text-sm text-[var(--foreground)]">
                  <input
                    type="checkbox"
                    checked={editAdmin}
                    onChange={(e) => setEditAdmin(e.target.checked)}
                    className="rounded border-[var(--card-border)]"
                  />
                  Administrator
                </label>
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
                <span className="font-medium text-[var(--foreground)]">{u.name}</span>
                <span className="text-sm text-[var(--muted)]">{u.email}</span>
                <span className="text-xs px-2 py-0.5 rounded bg-[var(--background)] text-[var(--muted)]">
                  {roleLabel(u.role)}
                </span>
                {u.isAdministrator && (
                  <span className="text-xs px-2 py-0.5 rounded bg-[var(--accent)]/20 text-[var(--accent)]">
                    Admin
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => startEdit(u)}
                  className="text-xs text-[var(--accent)] hover:underline"
                >
                  Edit
                </button>
                <form action={removeUserAction.bind(null, u.id)} className="inline">
                  <button type="submit" className="text-xs text-[var(--danger)] hover:underline">
                    Remove
                  </button>
                </form>
              </>
            )}
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap items-end gap-3">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded border border-[var(--card-border)] bg-[var(--background)] px-2 py-1.5 text-sm text-[var(--foreground)] w-44"
          placeholder="Email"
        />
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="rounded border border-[var(--card-border)] bg-[var(--background)] px-2 py-1.5 text-sm text-[var(--foreground)] w-36"
          placeholder="Name"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="rounded border border-[var(--card-border)] bg-[var(--background)] px-2 py-1.5 text-sm text-[var(--foreground)] w-32"
          placeholder="Password"
          autoComplete="new-password"
        />
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as UserRole)}
          className="rounded border border-[var(--card-border)] bg-[var(--background)] px-2 py-1.5 text-sm text-[var(--foreground)]"
        >
          <option value="account_manager">Account manager</option>
          <option value="collaborator">Collaborator</option>
        </select>
        <label className="flex items-center gap-1.5 text-sm text-[var(--foreground)]">
          <input
            type="checkbox"
            checked={isAdministrator}
            onChange={(e) => setIsAdministrator(e.target.checked)}
            className="rounded border-[var(--card-border)]"
          />
          Administrator
        </label>
        <button
          type="button"
          onClick={handleAdd}
          className="rounded bg-[var(--accent)] text-white px-3 py-1.5 text-sm font-medium hover:opacity-90"
        >
          Add user
        </button>
      </div>
      {error && <p className="mt-2 text-sm text-[var(--danger)]">{error}</p>}
    </div>
  );
}
