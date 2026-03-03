"use client";

import { useRouter } from "next/navigation";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export function MonthYearSelector({
  clientId,
  year,
  month,
}: {
  clientId: string;
  year: number;
  month: number;
}) {
  const router = useRouter();
  const now = new Date();
  const currentYear = now.getFullYear();
  const years = [currentYear - 1, currentYear, currentYear + 1, currentYear + 2];

  function handleChange(newYear: number, newMonth: number) {
    router.push(`/dashboard/clients/${clientId}/targets?year=${newYear}&month=${newMonth}`);
  }

  return (
    <div className="flex flex-wrap items-center gap-4 rounded-xl border border-[var(--card-border)] bg-[var(--card)] px-5 py-4 shadow-inner">
      <span className="text-xs font-medium text-[var(--muted)] uppercase tracking-wider">Target month</span>
      <div className="flex items-center gap-2">
        <label className="text-xs text-[var(--muted)]">Year</label>
        <select
          className="rounded-lg border border-[var(--card-border)] bg-[var(--background)] text-sm text-[var(--foreground)] px-3 py-2 min-w-[100px]"
          value={year}
          onChange={(e) => handleChange(parseInt(e.target.value, 10), month)}
        >
          {years.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>
      <div className="flex items-center gap-2">
        <label className="text-xs text-[var(--muted)]">Month</label>
        <select
          className="rounded-lg border border-[var(--card-border)] bg-[var(--background)] text-sm text-[var(--foreground)] px-3 py-2 min-w-[140px]"
          value={month}
          onChange={(e) => handleChange(year, parseInt(e.target.value, 10))}
        >
          {MONTHS.map((name, i) => (
            <option key={i} value={i + 1}>{name}</option>
          ))}
        </select>
      </div>
      <span className="text-sm font-semibold text-[var(--foreground)]">
        {MONTHS[month - 1]} {year}
      </span>
    </div>
  );
}
