import Link from "next/link";
import { getClientConfigs, getClientConfig, getMockTargets, getRepsForClient } from "@/lib/funnel/mockData";
import { getClientMetrics, getRepDashboardData } from "@/lib/funnel/metrics";
import { getOpportunitiesForClient } from "@/lib/funnel/ghlSync";
import { buildRepKpiCards } from "@/lib/funnel/metricRegistry";
import { RepFilters } from "@/app/dashboard/rep/[repId]/RepFilters";

function CircularPacing({ pct, size = 44 }: { pct: number | null; size?: number }) {
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
      <span className="absolute text-[10px] font-bold tabular-nums" style={{ color }}>{pct}%</span>
    </div>
  );
}

export default async function ClientRepsPage({
  params,
  searchParams,
}: {
  params: Promise<{ clientId: string }>;
  searchParams: Promise<{ repId?: string; year?: string; month?: string }>;
}) {
  const { clientId } = await params;
  const search = await searchParams;
  const config = getClientConfig(clientId);
  if (!config) {
    return (
      <div className="p-6">
        <p className="text-[var(--muted)]">Client not found.</p>
      </div>
    );
  }

  const now = new Date();
  const year = search.year ? parseInt(search.year, 10) : now.getFullYear();
  const month = search.month ? parseInt(search.month, 10) : now.getMonth() + 1;
  const y = Number.isNaN(year) ? now.getFullYear() : year;
  const m = Number.isNaN(month) || month < 1 || month > 12 ? now.getMonth() + 1 : month;

  const targets = getMockTargets();
  const oppsResult = await getOpportunitiesForClient(clientId);
  const opps = oppsResult.opps;

  const baseMetrics = getClientMetrics(config, y, m, targets, opps);
  const clientReps = getRepsForClient(config.clientId);
  const reps = clientReps.map((r) => ({ id: r.id, name: r.name }));
  const selectedRepId = search.repId ?? reps[0]?.id;

  if (!selectedRepId) {
    return <p className="text-[var(--muted)]">No reps found for this client.</p>;
  }

  const data = getRepDashboardData(config, selectedRepId, y, m, targets, opps);
  const { repSummary, repStageCounts, teamStageCounts, stageTransitions, repWeekly, flaggedDeals, teamMetrics } = data;

  const monthLabel = new Date(y, m - 1).toLocaleString("default", { month: "long", year: "numeric" });

  const teamWinRateAvg =
    teamMetrics.repSummaries.length > 0
      ? Math.round(teamMetrics.repSummaries.reduce((s, r) => s + r.winRatePct, 0) / teamMetrics.repSummaries.length)
      : 0;
  const teamTotal = (key: "discoveryCalls" | "clarityCalls" | "closedWonCount" | "closedWonValue") => {
    return teamMetrics.repSummaries.reduce((s, r) => s + (r[key] ?? 0), 0);
  };
  const nReps = teamMetrics.repSummaries.length || 1;
  const teamAvgDiscovery = Math.round(teamTotal("discoveryCalls") / nReps);
  const teamAvgClarity = Math.round(teamTotal("clarityCalls") / nReps);
  const teamAvgCWCount = Math.round(teamTotal("closedWonCount") / nReps);
  const teamAvgCWValue = Math.round(teamTotal("closedWonValue") / nReps);

  const maxRepStage = Math.max(1, ...repStageCounts.map((s) => s.count));
  const maxTeamStage = Math.max(1, ...teamStageCounts.map((s) => s.count));
  const maxActivity = Math.max(1, ...repWeekly.map((w) => Math.max(w.repActivity, w.teamActivity)));
  const maxResult = Math.max(1, ...repWeekly.map((w) => Math.max(w.repClosedValue, w.teamClosedValue)));

  const repName = reps.find((r) => r.id === selectedRepId)?.name ?? "Rep";
  const selectedRepRole = baseMetrics.repSummaries.find((r) => r.repId === selectedRepId)?.role;
  const repKpiCards = buildRepKpiCards(selectedRepRole, repSummary ?? null, teamMetrics);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-[var(--foreground)] tracking-wide">INDIVIDUAL REP SALES DASHBOARD</h2>
      </div>

      <RepFilters
        clientId={clientId}
        clients={getClientConfigs()}
        repId={selectedRepId}
        reps={reps}
        year={y}
        month={m}
        monthLabel={monthLabel}
        mode="clientTab"
      />

      {/* KPIs row — role-based: setter vs closer see different metrics */}
      <section className="rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-5 shadow-lg">
        <h3 className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider mb-4">
          KPIs — {repName} {selectedRepRole ? `(${selectedRepRole})` : ""}
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-9 gap-4">
          {repKpiCards.map((card) => (
            <div key={card.key} className="rounded-lg border border-[var(--card-border)] bg-[var(--background)] p-4 flex flex-col items-center shadow-inner">
              <div className="text-[10px] text-[var(--muted)] uppercase">{card.label}</div>
              <div className="text-lg font-bold tabular-nums">{card.repValue}</div>
              <div className="text-[10px] text-[var(--muted)] mt-0.5">vs Team avg {card.teamAvg}</div>
              {card.pacingPct != null && (
                <div className="mt-2"><CircularPacing pct={card.pacingPct} size={42} /></div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Rep funnel vs Team funnel */}
      <section className="grid md:grid-cols-2 gap-6">
        <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-5 shadow-lg">
          <h3 className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider mb-4">Rep funnel</h3>
          <div className="space-y-2">
            {repStageCounts.map((s, i) => {
              const hue = 210 - (i / Math.max(1, repStageCounts.length - 1)) * 60;
              return (
                <div key={s.order} className="flex items-center gap-2">
                  <span className="w-28 text-xs text-[var(--muted)] truncate">{s.stageName}</span>
                  <div className="flex-1 h-7 rounded bg-[var(--card-border)] overflow-hidden">
                    <div
                      className="h-full rounded transition-all"
                      style={{ width: `${(s.count / maxRepStage) * 100}%`, background: `hsl(${hue}, 55%, 42%)` }}
                    />
                  </div>
                  <span className="text-xs font-semibold tabular-nums w-8">{s.count}</span>
                </div>
              );
            })}
          </div>
        </div>
        <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-5 shadow-lg">
          <h3 className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider mb-4">Team funnel</h3>
          <div className="space-y-2">
            {teamStageCounts.map((s, i) => {
              const hue = 200 - (i / Math.max(1, teamStageCounts.length - 1)) * 50;
              return (
                <div key={s.order} className="flex items-center gap-2">
                  <span className="w-28 text-xs text-[var(--muted)] truncate">{s.stageName}</span>
                  <div className="flex-1 h-7 rounded bg-[var(--card-border)] overflow-hidden">
                    <div
                      className="h-full rounded transition-all opacity-90"
                      style={{ width: `${(s.count / maxTeamStage) * 100}%`, background: `hsl(${hue}, 50%, 48%)` }}
                    />
                  </div>
                  <span className="text-xs font-semibold tabular-nums w-8">{s.count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Stage transition table */}
      <section className="rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-5 shadow-lg">
        <h3 className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider mb-4">Stage transition table</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[var(--muted)] border-b border-[var(--card-border)]">
                <th className="pb-2 pr-4">Stage Transition</th>
                <th className="pb-2 pr-4 text-right">Rep %</th>
                <th className="pb-2 pr-4 text-right">Team %</th>
                <th className="pb-2 pr-4 text-right">Diff</th>
                <th className="pb-2 text-right">Avg Days</th>
              </tr>
            </thead>
            <tbody>
              {stageTransitions.map((row, i) => (
                <tr key={i} className="border-b border-[var(--card-border)]/50">
                  <td className="py-2 pr-4 text-[var(--foreground)]">{row.fromStage} → {row.toStage}</td>
                  <td className="py-2 pr-4 text-right tabular-nums">{row.repPct}%</td>
                  <td className="py-2 pr-4 text-right tabular-nums">{row.teamPct}%</td>
                  <td className={`py-2 pr-4 text-right tabular-nums ${row.diffPct >= 0 ? "text-[var(--success)]" : "text-[var(--danger)]"}`}>{row.diffPct >= 0 ? "+" : ""}{row.diffPct}%</td>
                  <td className="py-2 text-right tabular-nums text-[var(--muted)]">{row.avgDays}d</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Weekly activity + Weekly results */}
      <section className="grid lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-5 shadow-lg">
          <h3 className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider mb-4">Weekly activity (bar chart)</h3>
          <div className="flex items-end gap-1 h-32">
            {repWeekly.map((w) => (
              <div key={w.weekLabel} className="flex-1 flex flex-col items-center gap-0.5">
                <div className="w-full flex gap-0.5 justify-center" style={{ height: 80 }}>
                  <div
                    className="w-3 rounded-t bg-[var(--accent)] self-end"
                    style={{ height: `${(w.repActivity / maxActivity) * 100}%`, minHeight: 2 }}
                    title={`Rep: ${w.repActivity}`}
                  />
                  <div
                    className="w-3 rounded-t bg-[var(--card-border)] self-end"
                    style={{ height: `${(w.teamActivity / maxActivity) * 100}%`, minHeight: 2 }}
                    title={`Team: ${w.teamActivity}`}
                  />
                </div>
                <span className="text-[10px] text-[var(--muted)]">{w.weekLabel}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-4 mt-2 text-[10px] text-[var(--muted)]">
            <span className="flex items-center gap-1"><span className="w-3 h-2 rounded bg-[var(--accent)]" /> Rep</span>
            <span className="flex items-center gap-1"><span className="w-3 h-2 rounded bg-[var(--card-border)]" /> Team</span>
          </div>
        </div>
        <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-5 shadow-lg">
          <h3 className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider mb-4">Weekly results (line chart)</h3>
          {(() => {
            const w = 320;
            const h = 140;
            const pts = repWeekly;
            const maxY = Math.max(1, maxResult);
            const repPoints = pts
              .map((t, i) => `${20 + (i / Math.max(1, pts.length - 1)) * (w - 40)},${h - 20 - (t.repClosedValue / maxY) * (h - 40)}`)
              .join(" ");
            const teamPoints = pts
              .map((t, i) => `${20 + (i / Math.max(1, pts.length - 1)) * (w - 40)},${h - 20 - (t.teamClosedValue / maxY) * (h - 40)}`)
              .join(" ");
            return (
              <>
                <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-36" preserveAspectRatio="xMidYMid meet">
                  <polyline fill="none" stroke="var(--muted)" strokeWidth="2" strokeDasharray="4 4" points={teamPoints} />
                  <polyline fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" points={repPoints} />
                </svg>
                <div className="flex gap-4 mt-2 text-[10px] text-[var(--muted)]">
                  <span className="flex items-center gap-1"><span className="w-3 h-0.5 rounded bg-[var(--accent)]" /> Rep</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-0.5 rounded bg-[var(--muted)]" /> Team</span>
                </div>
              </>
            );
          })()}
        </div>
      </section>

      {/* Flagged deals */}
      <section className="rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-5 shadow-lg">
        <h3 className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider mb-4 flex items-center gap-2">
          <span className="text-[var(--danger)]" title="Attention">⚠</span> Flagged deals table
        </h3>
        {flaggedDeals.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">No flagged deals.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[var(--muted)] border-b border-[var(--card-border)]">
                  <th className="pb-3 pr-4 font-medium">Deal Name</th>
                  <th className="pb-3 pr-4 font-medium">Stage</th>
                  <th className="pb-3 pr-4 font-medium">Amount</th>
                  <th className="pb-3 pr-4 font-medium">Flag Reason</th>
                  <th className="pb-3 font-medium">Last Activity</th>
                </tr>
              </thead>
              <tbody>
                {flaggedDeals.map((d) => (
                  <tr key={d.id} className="border-b border-[var(--card-border)]/50 hover:bg-[var(--background)]/30">
                    <td className="py-3 pr-4 text-[var(--foreground)] font-medium">{d.id}</td>
                    <td className="py-3 pr-4 text-[var(--muted)]">{d.stageName}</td>
                    <td className="py-3 pr-4 text-[var(--foreground)]">—</td>
                    <td className="py-3 pr-4 text-[var(--danger)] font-medium">Stalled &gt; 14 days</td>
                    <td className="py-3 text-[var(--muted)]">{d.dateStageEntered.toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Leaderboard (quick switch) */}
      <section className="rounded-xl border border-[var(--card-border)] bg-[var(--card)] overflow-hidden shadow-lg">
        <h3 className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider p-4 pb-2">Team leaderboard</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--card-border)] bg-[var(--background)]">
              <th className="text-left p-3 font-medium text-[var(--muted)]">Rep Name</th>
              <th className="text-right p-3 font-medium text-[var(--muted)]">CW MTD</th>
              <th className="text-right p-3 font-medium text-[var(--muted)]">Revenue sourced</th>
              <th className="text-right p-3 font-medium text-[var(--muted)]">Pacing %</th>
            </tr>
          </thead>
          <tbody>
            {teamMetrics.repSummaries.map((r) => (
              <tr key={r.repId} className="border-b border-[var(--card-border)] last:border-0 hover:bg-[var(--card)]/50">
                <td className="p-3">
                  <Link
                    href={`/dashboard/clients/${clientId}/reps?repId=${encodeURIComponent(r.repId)}&year=${y}&month=${m}`}
                    className={`font-medium hover:underline ${
                      r.repId === selectedRepId ? "text-[var(--foreground)]" : "text-[var(--accent)]"
                    }`}
                  >
                    {r.repName}
                  </Link>
                </td>
                <td className="p-3 text-right tabular-nums">${r.closedWonValue.toLocaleString()}</td>
                <td className="p-3 text-right tabular-nums text-[var(--muted)]">${(r.sourcedWonValue ?? 0).toLocaleString()}</td>
                <td
                  className="p-3 text-right tabular-nums"
                  style={{
                    color:
                      r.pacingPct == null
                        ? "var(--muted)"
                        : r.pacingPct >= 100
                          ? "var(--success)"
                          : r.pacingPct >= 80
                            ? "var(--warning)"
                            : "var(--danger)",
                  }}
                >
                  {r.pacingPct != null ? `${r.pacingPct}%` : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
