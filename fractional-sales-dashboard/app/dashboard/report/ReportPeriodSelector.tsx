"use client";

import { useRouter, useSearchParams } from "next/navigation";

export function ReportPeriodSelector({
  currentYear,
  currentMonth,
  currentWeekEnd,
  useWeek,
}: {
  currentYear: number;
  currentMonth: number;
  currentWeekEnd: string | null;
  useWeek: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function updateParams(updates: Record<string, string>) {
    const next = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([k, v]) => {
      if (v) next.set(k, v);
      else next.delete(k);
    });
    router.push(`/dashboard/report?${next.toString()}`);
  }

  const months = Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    label: new Date(2000, i).toLocaleString("default", { month: "long" }),
  }));
  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i);

  const lastSundays: string[] = [];
  for (let w = 0; w < 12; w++) {
    const d = new Date();
    const day = d.getDay();
    const sun = new Date(d);
    sun.setDate(d.getDate() - day - w * 7);
    lastSundays.push(sun.toISOString().slice(0, 10));
  }

  return (
    <div className="print:hidden flex flex-wrap items-center gap-4 mb-6 p-4 rounded-lg border border-[var(--card-border)] bg-[var(--card)]">
      <span className="text-sm font-medium text-[var(--foreground)]">Period</span>
      <select
        value={useWeek ? "week" : "month"}
        onChange={(e) => {
          if (e.target.value === "week") {
            const lastSun = lastSundays[0];
            updateParams({ weekEnd: lastSun });
          } else {
            updateParams({
              month: String(currentMonth),
              year: String(currentYear),
              weekEnd: "",
            });
          }
        }}
        className="rounded border border-[var(--card-border)] bg-[var(--background)] px-2 py-1.5 text-sm text-[var(--foreground)]"
      >
        <option value="month">Month</option>
        <option value="week">Week ending</option>
      </select>
      {useWeek ? (
        <select
          value={currentWeekEnd ?? lastSundays[0]}
          onChange={(e) => updateParams({ weekEnd: e.target.value })}
          className="rounded border border-[var(--card-border)] bg-[var(--background)] px-2 py-1.5 text-sm text-[var(--foreground)]"
        >
          {lastSundays.map((d) => (
            <option key={d} value={d}>
              {new Date(d + "T12:00:00").toLocaleDateString("default", {
                weekday: "short",
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </option>
          ))}
        </select>
      ) : (
        <>
          <select
            value={currentMonth}
            onChange={(e) =>
              updateParams({ month: e.target.value, year: String(currentYear) })
            }
            className="rounded border border-[var(--card-border)] bg-[var(--background)] px-2 py-1.5 text-sm text-[var(--foreground)]"
          >
            {months.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
          <select
            value={currentYear}
            onChange={(e) =>
              updateParams({ year: e.target.value, month: String(currentMonth) })
            }
            className="rounded border border-[var(--card-border)] bg-[var(--background)] px-2 py-1.5 text-sm text-[var(--foreground)]"
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </>
      )}
    </div>
  );
}
