"use client";

import { useRouter } from "next/navigation";

export function PortfolioAccountManagerFilter({
  accountManagerId,
  accountManagers,
}: {
  accountManagerId: string;
  accountManagers: { id: string; name: string }[];
}) {
  const router = useRouter();
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-medium text-[var(--muted)]">Account manager</span>
      <select
        className="rounded-lg border border-[var(--card-border)] bg-[var(--background)] text-sm text-[var(--foreground)] px-3 py-2 min-w-[160px]"
        value={accountManagerId}
        onChange={(e) => {
          const v = e.target.value;
          router.push(v === "all" ? "/dashboard" : `/dashboard?accountManagerId=${encodeURIComponent(v)}`);
        }}
      >
        <option value="all">All (RevPro)</option>
        {accountManagers.map((am) => (
          <option key={am.id} value={am.id}>{am.name}</option>
        ))}
      </select>
    </div>
  );
}
