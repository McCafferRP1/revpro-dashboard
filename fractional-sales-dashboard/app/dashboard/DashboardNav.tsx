"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { logoutAction } from "./actions";

export function DashboardNav({
  isAdministrator,
  userName,
}: {
  isAdministrator: boolean;
  userName: string | null;
}) {
  const router = useRouter();

  async function handleLogout() {
    await logoutAction();
    router.push("/login");
    router.refresh();
  }

  const navLinkClass =
    "px-4 py-2 rounded-lg text-sm font-medium text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--card-border)] transition-colors";

  return (
    <nav className="flex items-center gap-1">
      <Link href="/dashboard" className={navLinkClass}>
        Portfolio
      </Link>
      {isAdministrator && (
        <Link href="/dashboard/report" className={navLinkClass}>
          Weekly report
        </Link>
      )}
      {isAdministrator && (
        <Link href="/dashboard/settings" className={navLinkClass}>
          Admin Settings
        </Link>
      )}
      {userName && (
        <span className="ml-2 px-3 py-1.5 text-sm text-[var(--muted)] border-l border-[var(--card-border)]">
          {userName}
        </span>
      )}
      <button
        type="button"
        onClick={handleLogout}
        className="ml-2 px-4 py-2 rounded-lg text-sm font-medium text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--card-border)] border border-transparent hover:border-[var(--card-border)] transition-colors"
      >
        Sign out
      </button>
    </nav>
  );
}
