"use client";

import { setAccountManager } from "./actions";

export function AccountManagerSelect({
  clientId,
  currentId,
  currentName,
  accountManagers,
}: {
  clientId: string;
  currentId: string | undefined;
  currentName: string | undefined;
  accountManagers: { id: string; name: string }[];
}) {
  const value = currentId ?? "unassigned";
  const seen = new Set<string>(["unassigned"]);
  const options = [{ id: "unassigned", name: "Unassigned" }];
  for (const am of accountManagers) {
    if (!seen.has(am.id)) {
      seen.add(am.id);
      options.push(am);
    }
  }

  async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const id = e.target.value;
    const name = options.find((o) => o.id === id)?.name ?? "Unassigned";
    await setAccountManager(clientId, id, name);
  }

  return (
    <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-5 shadow-lg">
      <h3 className="text-sm font-semibold text-[var(--foreground)] mb-2">Account manager</h3>
      <p className="text-xs text-[var(--muted)] mb-4">
        This client will appear under this account manager on the portfolio. Use the portfolio filter to see only your clients.
      </p>
      <select
        className="rounded-lg border border-[var(--card-border)] bg-[var(--background)] text-sm text-[var(--foreground)] px-3 py-2 min-w-[200px]"
        value={value}
        onChange={handleChange}
        aria-label="Account manager"
      >
        {options.map((am) => (
          <option key={am.id} value={am.id}>
            {am.name}
          </option>
        ))}
      </select>
    </div>
  );
}
