"use client";

import Link from "next/link";

export function ReportActions() {
  return (
    <div className="print:hidden flex flex-wrap items-center justify-between gap-4 mb-6">
      <Link href="/dashboard" className="text-sm text-[var(--muted)] hover:text-[var(--foreground)]">
        ← Portfolio
      </Link>
      <button
        type="button"
        onClick={() => window.print()}
        className="rounded-lg bg-[var(--accent)] text-white px-4 py-2 text-sm font-medium hover:opacity-90"
      >
        Print / Save as PDF
      </button>
    </div>
  );
}
