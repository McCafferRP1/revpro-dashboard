"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function ClientTabs({ clientId }: { clientId: string }) {
  const pathname = usePathname();
  const base = `/dashboard/clients/${clientId}`;
  const tabs = [
    { href: `${base}/funnel`, label: "Overview" },
    { href: `${base}/reps`, label: "Reps" },
    { href: `${base}/targets`, label: "Targets" },
    { href: `${base}/report`, label: "Report" },
    { href: `${base}/settings`, label: "Client Settings" },
  ];
  return (
    <nav className="flex gap-1" aria-label="Client views">
      {tabs.map((t) => {
        const active = pathname === t.href || (t.href !== `${base}/funnel` && pathname.startsWith(t.href));
        return (
          <Link
            key={t.href}
            href={t.href}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              active
                ? "bg-[var(--card)] text-[var(--foreground)] border border-[var(--card-border)]"
                : "text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--card)]"
            }`}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
