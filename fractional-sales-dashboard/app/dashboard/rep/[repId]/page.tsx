import Link from "next/link";
import { getClientConfig, getMockTargets, getClientConfigs, getRepById, getRepsForClient } from "@/lib/funnel/mockData";
import { getRepDashboardData } from "@/lib/funnel/metrics";
import { getOpportunitiesForClient } from "@/lib/funnel/ghlSync";
import { buildRepKpiCards } from "@/lib/funnel/metricRegistry";
import { RepFilters } from "./RepFilters";

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

export default async function RepPage({
  params,
  searchParams,
}: {
  params: Promise<{ repId: string }>;
  searchParams: Promise<{ clientId?: string }>;
}) {
  const { repId } = await params;
  const { clientId: qClient } = await searchParams;
  const rep = getRepById(repId);
  if (!rep) {
    return (
      <div className="p-6">
        <p className="text-[var(--muted)]">Rep not found.</p>
        <Link href="/dashboard" className="text-[var(--accent)] hover:underline mt-2 inline-block">
          Back to portfolio
        </Link>
      </div>
    );
  }
  const clientId = qClient ?? rep.clientId;
  const config = getClientConfig(clientId);
  if (!config) {
    return (
      <div className="p-6">
        <p className="text-[var(--muted)]">Client not found.</p>
      </div>
    );
  }

  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth() + 1;
  const targets = getMockTargets();
  const oppsResult = await getOpportunitiesForClient(clientId);
  const opps = oppsResult.opps;
  const data = getRepDashboardData(config, repId, y, m, targets, opps);
  const { repSummary, repStageCounts, teamStageCounts, stageTransitions, repWeekly, flaggedDeals, teamMetrics } = data;
  const monthLabel = new Date(y, m - 1).toLocaleString("default", { month: "long", year: "numeric" });
  const repsForFilters = getRepsForClient(config.clientId).map((r) => ({ id: r.id, name: r.name }));

  const monthStart = new Date(y, m - 1, 1);
  const monthEnd = new Date(y, m, 0, 23, 59, 59, 999);
  const setterOppsInMonth = opps.filter((o) => o.setterRepId === repId && o.dateStageEntered >= monthStart && o.dateStageEntered <= monthEnd);
  const setterSourced = setterOppsInMonth.filter((o) => o.setterAction === "sourced" || !o.setterAction);
  const setterConfirmed = setterOppsInMonth.filter((o) => o.setterAction === "confirmed");
  const setterSourcedWon = setterSourced.filter((o) => o.outcome === "won");
  const setterConfirmedWon = setterConfirmed.filter((o) => o.outcome === "won");
  const setterSourcedRevenue = setterSourcedWon.reduce((s, o) => s + o.amount, 0);
  const setterConfirmedRevenue = setterConfirmedWon.reduce((s, o) => s + o.amount, 0);

  const maxRepStage = Math.max(1, ...repStageCounts.map((s) => s.count));
  const maxTeamStage = Math.max(1, ...teamStageCounts.map((s) => s.count));
  const maxActivity = Math.max(1, ...repWeekly.map((w) => Math.max(w.repActivity, w.teamActivity)));
  const maxResult = Math.max(1, ...repWeekly.map((w) => Math.max(w.repClosedValue, w.teamClosedValue)));
  const repKpiCards = buildRepKpiCards(rep.role, repSummary ?? null, teamMetrics);

  return (
    <div className="space-y-6">
      <RepFilters
        clientId={clientId}
        clients={getClientConfigs()}
        repId={repId}
        reps={repsForFilters}
        year={y}
        month={m}
        monthLabel={monthLabel}
      />

      {rep.role === "setter" && (
        <section className="rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-5 shadow-lg">
          <h2 className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider mb-4">Sourced vs Confirmed</h2>
          <div className="grid grid-cols-2 gap-6">
            <div className="rounded-lg border border-[var(--card-border)] bg-[var(--background)] p-4">
              <div className="text-xs font-medium text-[var(--muted)] uppercase">Deals Sourced</div>
              <div className="mt-2 text-2xl font-bold tabular-nums">{setterSourced.length}</div>
              <div className="text-xs text-[var(--muted)]">Won: {setterSourcedWon.length} · ${setterSourcedRevenue.toLocaleString()}</div>
            </div>
            <div className="rounded-lg border border-[var(--card-border)] bg-[var(--background)] p-4">
              <div className="text-xs font-medium text-[var(--muted)] uppercase">Deals Confirmed</div>
              <div className="mt-2 text-2xl font-bold tabular-nums">{setterConfirmed.length}</div>
              <div className="text-xs text-[var(--muted)]">Won: {setterConfirmedWon.length} · ${setterConfirmedRevenue.toLocaleString()}</div>
            </div>
          </div>
          <p className="mt-2 text-[10px] text-[var(--muted)]">Sourced = setter originated the deal. Confirmed = setter qualified/confirmed for closer.</p>
        </section>
      )}

      {/* Role-based KPI cards: setters see meeting/Discovery/Clarity metrics; closers see closed won, win rate, cycle */}
      <section className="rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-5 shadow-lg">
        <h2 className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider mb-4">
          KPIs — {rep.name} {rep.role ? `(${rep.role})` : ""}
        </h2>
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

      {/* Side-by-side Rep funnel vs Team funnel — mockup styling */}
      <section className="grid md:grid-cols-2 gap-6">
        <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-5 shadow-lg">
          <h2 className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider mb-4">Rep funnel</h2>
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
          <h2 className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider mb-4">Team funnel</h2>
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
        <h2 className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider mb-4">Stage transitions (Rep % vs Team %)</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[var(--muted)] border-b border-[var(--card-border)]">
                <th className="pb-2 pr-4">Stage transition</th>
                <th className="pb-2 pr-4 text-right">Rep %</th>
                <th className="pb-2 pr-4 text-right">Team %</th>
                <th className="pb-2 pr-4 text-right">Diff</th>
                <th className="pb-2 text-right">Avg days</th>
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

      {/* Weekly activity (bar) + Weekly results (line) */}
      <section className="grid lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-5">
          <h2 className="text-xs font-medium text-[var(--muted)] uppercase tracking-wider mb-4">Weekly activity</h2>
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
          <h2 className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider mb-4">Weekly results (Rep vs Team)</h2>
          <div className="flex items-end gap-1 h-32">
            {repWeekly.map((w) => (
              <div key={w.weekLabel} className="flex-1 flex flex-col items-center">
                <div className="w-full flex justify-center gap-1" style={{ height: 80 }}>
                  <div
                    className="w-2 rounded-t bg-[var(--accent)] self-end"
                    style={{ height: `${(w.repClosedValue / maxResult) * 100}%`, minHeight: 2 }}
                  />
                  <div
                    className="w-2 rounded-t bg-[var(--muted)] self-end"
                    style={{ height: `${(w.teamClosedValue / maxResult) * 100}%`, minHeight: 2 }}
                  />
                </div>
                <span className="text-[10px] text-[var(--muted)] mt-1">{w.weekLabel}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-4 mt-2 text-[10px] text-[var(--muted)]">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-[var(--accent)]" /> Rep CW $</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-[var(--muted)]" /> Team CW $</span>
          </div>
        </div>
      </section>

      {/* Flagged deals — mockup: warning icon, Flag Reason (e.g. Stalled > 14 Days) */}
      <section className="rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-5 shadow-lg">
        <h2 className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider mb-4 flex items-center gap-2">
          <span className="text-[var(--danger)]" title="Attention">⚠</span> Flagged deals
        </h2>
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
    </div>
  );
}
