import Link from "next/link";
import { getUsers } from "@/lib/auth";
import { getClientConfigs, getClientConfig, getMockTargets, getAccountManagers } from "@/lib/funnel/mockData";
import { getClientMetrics } from "@/lib/funnel/metrics";
import { PortfolioAccountManagerFilter } from "./PortfolioAccountManagerFilter";

function CircularPacing({ pct, size = 40 }: { pct: number | null; size?: number }) {
  if (pct == null) return <span className="text-xs text-[var(--muted)]">—</span>;
  const color = pct >= 100 ? "var(--success)" : pct >= 80 ? "var(--warning)" : "var(--danger)";
  const r = (size - 6) / 2;
  const circumference = 2 * Math.PI * r;
  const dash = (Math.min(100, Math.max(0, pct)) / 100) * circumference;
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--card-border)" strokeWidth="4" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="4"
          strokeDasharray={`${dash} ${circumference - dash}`}
          strokeLinecap="round"
        />
      </svg>
      <span className="absolute text-[9px] font-bold tabular-nums" style={{ color }}>{pct}%</span>
    </div>
  );
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ accountManagerId?: string }>;
}) {
  const params = await searchParams;
  const accountManagerId = params.accountManagerId ?? "all";

  const targets = getMockTargets();
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth() + 1;
  const lastM = m === 1 ? 12 : m - 1;
  const lastY = m === 1 ? y - 1 : y;

  const allConfigs = getClientConfigs();
  const filteredConfigs =
    accountManagerId === "all"
      ? allConfigs
      : allConfigs.filter((c) => (getClientConfig(c.clientId)?.accountManagerId ?? "unassigned") === accountManagerId);

  const clientData = filteredConfigs.map((config) => {
    const metrics = getClientMetrics(config, y, m, targets);
    const lastMetrics = getClientMetrics(config, lastY, lastM, targets);
    const closedNow = metrics.kpis.find((k) => k.key === "closedWonValue")?.mtd ?? metrics.kpis.find((k) => k.label === "Closed Won (value)")?.mtd ?? 0;
    const closedLast = lastMetrics.kpis.find((k) => k.key === "closedWonValue")?.mtd ?? lastMetrics.kpis.find((k) => k.label === "Closed Won (value)")?.mtd ?? 0;
    const momPct = closedLast ? Math.round(((closedNow - closedLast) / closedLast) * 100) : 0;
    const cwKpi = metrics.kpis.find((k) => k.key === "closedWonValue") ?? metrics.kpis.find((k) => k.label === "Closed Won (value)");
    const pacing = cwKpi?.pacingPct ?? null;
    const winRate = metrics.kpis.find((k) => k.key === "winRate")?.mtd ?? metrics.kpis.find((k) => k.label === "Win Rate")?.mtd ?? 0;
    const avgCycle = metrics.kpis.find((k) => k.key === "avgCycleDays")?.mtd ?? metrics.kpis.find((k) => k.label === "Avg Cycle (days)")?.mtd ?? 0;
    const leadsKpi = metrics.kpis.find((k) => k.key === "leadsIn") ?? metrics.kpis.find((k) => k.label === "Leads In");
    const discoveryKpi = metrics.kpis.find((k) => k.key === "discoveryScheduled") ?? metrics.kpis.find((k) => k.label === "Discovery Scheduled");
    const clarityKpi = metrics.kpis.find((k) => k.key === "clarityScheduledConfirmed") ?? metrics.kpis.find((k) => k.label === "Clarity Scheduled / Confirmed");
    const targetCW = cwKpi?.target ?? 0;
    return {
      config,
      metrics,
      closedValue: closedNow,
      momPct,
      pacing,
      winRate,
      avgCycle,
      leadsMtd: leadsKpi?.mtd ?? 0,
      leadsTarget: leadsKpi?.target ?? 0,
      leadsPacing: leadsKpi?.pacingPct ?? null,
      discoveryMtd: discoveryKpi?.mtd ?? 0,
      discoveryTarget: discoveryKpi?.target ?? 0,
      discoveryPacing: discoveryKpi?.pacingPct ?? null,
      clarityMtd: clarityKpi?.mtd ?? 0,
      cwTarget: targetCW,
      weeklyTrends: metrics.weeklyTrends,
    };
  });

  const allReps: { repId: string; repName: string; clientId: string; clientName: string; mtdCW: number; target: number; pacingPct: number | null }[] = [];
  clientData.forEach(({ config, metrics }) => {
    metrics.repSummaries.forEach((r) => {
      allReps.push({
        repId: r.repId,
        repName: r.repName,
        clientId: config.clientId,
        clientName: config.clientName,
        mtdCW: r.closedWonValue ?? 0,
        target: r.targetClosedValue ?? 0,
        pacingPct: r.pacingPct ?? null,
      });
    });
  });
  const sortedByPacing = [...allReps].sort((a, b) => (b.pacingPct ?? 0) - (a.pacingPct ?? 0));
  const topReps = sortedByPacing.slice(0, 5);
  const bottomReps = sortedByPacing.slice(-5).reverse();

  const maxCWChart = Math.max(1, ...clientData.flatMap((d) => d.weeklyTrends.map((t) => t.closedWonValue)));
  const users = await getUsers();
  const accountManagers = getAccountManagers(users);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-[var(--foreground)]">Portfolio overview</h1>
        <div className="flex items-center gap-4">
          <PortfolioAccountManagerFilter accountManagerId={accountManagerId} accountManagers={accountManagers} />
          <span className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider px-3 py-1.5 rounded-lg bg-[var(--card)] border border-[var(--card-border)]">
            View: By Client
          </span>
        </div>
      </div>

      {clientData.length === 0 ? (
        <p className="text-[var(--muted)]">No clients for this account manager.</p>
      ) : (
        <>
          <section>
            <h2 className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider mb-4">Client health</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              {clientData.map(({ config, closedValue, pacing, winRate, avgCycle, cwTarget }) => {
                const health = pacing == null ? "zinc" : pacing >= 100 ? "green" : pacing >= 80 ? "amber" : "red";
                const borderColor =
                  health === "green"
                    ? "border-[var(--success)]/50"
                    : health === "amber"
                      ? "border-[var(--warning)]/50"
                      : health === "red"
                        ? "border-[var(--danger)]/50"
                        : "border-[var(--card-border)]";
                return (
                  <Link
                    key={config.clientId}
                    href={`/dashboard/clients/${config.clientId}`}
                    className={`rounded-xl border-2 bg-[var(--card)] p-4 transition-colors hover:border-[var(--accent)] flex flex-col items-center shadow-lg ${borderColor}`}
                  >
                    <div className="font-semibold text-[var(--foreground)] text-center">{config.clientName}</div>
                    <div className="mt-2"><CircularPacing pct={pacing} size={48} /></div>
                    <div className="mt-2 text-lg font-bold text-[var(--foreground)] tabular-nums">${closedValue.toLocaleString()}</div>
                    <div className="text-xs text-[var(--muted)]">Target ${cwTarget.toLocaleString()}</div>
                    <div className="mt-1 text-xs text-[var(--foreground)]">Win rate {winRate}% · Cycle {avgCycle}d</div>
                  </Link>
                );
              })}
            </div>
          </section>

          <section>
            <h2 className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider mb-4">Client comparison</h2>
            <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card)] overflow-x-auto shadow-lg">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--card-border)] bg-[var(--background)]">
                    <th className="text-left p-3 font-medium text-[var(--muted)]">Client</th>
                    <th className="text-right p-3 font-medium text-[var(--muted)]">Leads In MTD</th>
                    <th className="text-right p-3 font-medium text-[var(--muted)]">Target</th>
                    <th className="text-right p-3 font-medium text-[var(--muted)]">Pacing %</th>
                    <th className="text-right p-3 font-medium text-[var(--muted)]">Meetings Held MTD</th>
                    <th className="text-right p-3 font-medium text-[var(--muted)]">Target</th>
                    <th className="text-right p-3 font-medium text-[var(--muted)]">Pacing %</th>
                    <th className="text-right p-3 font-medium text-[var(--muted)]">Pitches</th>
                    <th className="text-right p-3 font-medium text-[var(--muted)]">Closed Won MTD</th>
                    <th className="text-right p-3 font-medium text-[var(--muted)]">Target</th>
                    <th className="text-right p-3 font-medium text-[var(--muted)]">Pacing %</th>
                    <th className="text-right p-3 font-medium text-[var(--muted)]">Win rate</th>
                    <th className="text-right p-3 font-medium text-[var(--muted)]">Avg cycle</th>
                    <th className="text-right p-3 font-medium text-[var(--muted)]">MoM</th>
                  </tr>
                </thead>
                <tbody>
                  {clientData.map(({ config, metrics, momPct, leadsMtd, leadsTarget, leadsPacing, discoveryMtd, discoveryTarget, discoveryPacing, closedValue, cwTarget, pacing, winRate, avgCycle }) => {
                    const pitches = metrics.kpis.find((k) => k.key === "closedWonCount")?.mtd ?? 0;
                    return (
                      <tr key={config.clientId} className="border-b border-[var(--card-border)] last:border-0">
                        <td className="p-3">
                          <Link href={`/dashboard/clients/${config.clientId}`} className="text-[var(--accent)] hover:underline font-medium">
                            {config.clientName}
                          </Link>
                        </td>
                        <td className="p-3 text-right tabular-nums">{leadsMtd}</td>
                        <td className="p-3 text-right text-[var(--muted)] tabular-nums">{leadsTarget}</td>
                        <td className="p-3 text-right tabular-nums">{leadsPacing != null ? `${leadsPacing}%` : "—"}</td>
                        <td className="p-3 text-right tabular-nums">{discoveryMtd}</td>
                        <td className="p-3 text-right text-[var(--muted)] tabular-nums">{discoveryTarget}</td>
                        <td className="p-3 text-right tabular-nums">{discoveryPacing != null ? `${discoveryPacing}%` : "—"}</td>
                        <td className="p-3 text-right tabular-nums">{pitches}</td>
                        <td className="p-3 text-right tabular-nums">${closedValue.toLocaleString()}</td>
                        <td className="p-3 text-right text-[var(--muted)] tabular-nums">${cwTarget.toLocaleString()}</td>
                        <td className="p-3 text-right tabular-nums">{pacing != null ? `${pacing}%` : "—"}</td>
                        <td className="p-3 text-right text-[var(--accent)] tabular-nums">{winRate}%</td>
                        <td className="p-3 text-right text-[var(--muted)] tabular-nums">{avgCycle}d</td>
                        <td className="p-3 text-right">
                          <span style={{ color: momPct >= 0 ? "var(--success)" : "var(--danger)" }}>
                            {momPct >= 0 ? "+" : ""}{momPct}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          <section className="rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-5 shadow-lg">
            <h2 className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider mb-4">Closed Won value over time (top clients)</h2>
            <div className="h-48 w-full">
              <svg viewBox="0 0 400 120" className="w-full h-full" preserveAspectRatio="none">
                {clientData.slice(0, 6).map(({ config, weeklyTrends }, clientIdx) => {
                  const points = weeklyTrends.slice(-8).map((t, i) => ({
                    x: 20 + (i / Math.max(1, 7)) * 360,
                    y: 100 - (t.closedWonValue / maxCWChart) * 80,
                  }));
                  const hue = 200 + clientIdx * 40;
                  return (
                    <g key={config.clientId}>
                      <polyline
                        fill="none"
                        stroke={`hsl(${hue}, 60%, 55%)`}
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        points={points.map((p) => `${p.x},${p.y}`).join(" ")}
                      />
                      {points.map((p, i) => (
                        <circle key={i} cx={p.x} cy={p.y} r="3" fill={`hsl(${hue}, 60%, 55%)`} />
                      ))}
                    </g>
                  );
                })}
              </svg>
            </div>
            <div className="flex gap-4 mt-2 text-[10px] text-[var(--muted)]">
              {clientData.slice(0, 6).map(({ config }, i) => (
                <span key={config.clientId} className="flex items-center gap-1">
                  <span className="w-2 h-0.5 rounded" style={{ backgroundColor: `hsl(${200 + i * 40}, 60%, 55%)` }} /> {config.clientName}
                </span>
              ))}
            </div>
            <div className="text-[10px] text-[var(--muted)] mt-1">W1 → W8 (recent weeks)</div>
          </section>

          <section className="grid md:grid-cols-2 gap-6">
            <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card)] overflow-hidden shadow-lg">
              <h2 className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider p-4 pb-2">Top reps</h2>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--card-border)] bg-[var(--background)]">
                    <th className="text-left p-2 font-medium text-[var(--muted)]">Rep</th>
                    <th className="text-left p-2 font-medium text-[var(--muted)]">Client</th>
                    <th className="text-right p-2 font-medium text-[var(--muted)]">MTD CW</th>
                    <th className="text-right p-2 font-medium text-[var(--muted)]">Target</th>
                    <th className="text-right p-2 font-medium text-[var(--muted)]">Pacing %</th>
                  </tr>
                </thead>
                <tbody>
                  {topReps.map((r) => (
                    <tr key={`${r.clientId}-${r.repId}`} className="border-b border-[var(--card-border)] last:border-0">
                      <td className="p-2">
                        <Link href={`/dashboard/rep/${r.repId}?clientId=${r.clientId}`} className="text-[var(--accent)] hover:underline font-medium">
                          {r.repName}
                        </Link>
                      </td>
                      <td className="p-2 text-[var(--muted)]">{r.clientName}</td>
                      <td className="p-2 text-right tabular-nums">${r.mtdCW.toLocaleString()}</td>
                      <td className="p-2 text-right text-[var(--muted)] tabular-nums">{r.target}</td>
                      <td className="p-2 text-right font-semibold tabular-nums" style={{ color: (r.pacingPct ?? 0) >= 100 ? "var(--success)" : (r.pacingPct ?? 0) >= 80 ? "var(--warning)" : "var(--danger)" }}>
                        {r.pacingPct != null ? `${r.pacingPct}%` : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card)] overflow-hidden shadow-lg">
              <h2 className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider p-4 pb-2">Bottom reps</h2>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--card-border)] bg-[var(--background)]">
                    <th className="text-left p-2 font-medium text-[var(--muted)]">Rep</th>
                    <th className="text-left p-2 font-medium text-[var(--muted)]">Client</th>
                    <th className="text-right p-2 font-medium text-[var(--muted)]">MTD CW</th>
                    <th className="text-right p-2 font-medium text-[var(--muted)]">Target</th>
                    <th className="text-right p-2 font-medium text-[var(--muted)]">Pacing %</th>
                  </tr>
                </thead>
                <tbody>
                  {bottomReps.map((r) => (
                    <tr key={`${r.clientId}-${r.repId}`} className="border-b border-[var(--card-border)] last:border-0">
                      <td className="p-2">
                        <Link href={`/dashboard/rep/${r.repId}?clientId=${r.clientId}`} className="text-[var(--accent)] hover:underline font-medium">
                          {r.repName}
                        </Link>
                      </td>
                      <td className="p-2 text-[var(--muted)]">{r.clientName}</td>
                      <td className="p-2 text-right tabular-nums">${r.mtdCW.toLocaleString()}</td>
                      <td className="p-2 text-right text-[var(--muted)] tabular-nums">{r.target}</td>
                      <td className="p-2 text-right font-semibold tabular-nums" style={{ color: (r.pacingPct ?? 0) >= 100 ? "var(--success)" : (r.pacingPct ?? 0) >= 80 ? "var(--warning)" : "var(--danger)" }}>
                        {r.pacingPct != null ? `${r.pacingPct}%` : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
