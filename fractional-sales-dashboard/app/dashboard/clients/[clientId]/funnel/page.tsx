import { getClientConfig, getMockTargets, getClientConfigs } from "@/lib/funnel/mockData";
import { getClientMetrics } from "@/lib/funnel/metrics";
import { getOpportunitiesForClient } from "@/lib/funnel/ghlSync";
import Link from "next/link";
import { FunnelFilters } from "@/app/dashboard/funnel/FunnelFilters";
import { DiscoveryRefreshTrigger } from "@/app/dashboard/DiscoveryRefreshTrigger";

export default async function ClientFunnelPage({
  params,
  searchParams,
}: {
  params: Promise<{ clientId: string }>;
  searchParams: Promise<{ year?: string; month?: string }>;
}) {
  const { clientId } = await params;
  const search = await searchParams;
  const now = new Date();
  const year = search.year ? parseInt(search.year, 10) : now.getFullYear();
  const month = search.month ? parseInt(search.month, 10) : now.getMonth() + 1;
  const y = Number.isNaN(year) ? now.getFullYear() : year;
  const m = Number.isNaN(month) || month < 1 || month > 12 ? now.getMonth() + 1 : month;
  const lastM = m === 1 ? 12 : m - 1;
  const lastY = m === 1 ? y - 1 : y;
  const lastMonthLabel = new Date(lastY, lastM - 1).toLocaleString("default", { month: "long", year: "numeric" });

  const config = getClientConfig(clientId);
  const targets = getMockTargets();
  if (!config) {
    return (
      <div className="p-6">
        <p className="text-[var(--muted)]">Client not found.</p>
      </div>
    );
  }

  const oppsResult = await getOpportunitiesForClient(clientId);
  const opps = oppsResult.opps;
  const metrics = getClientMetrics(config, y, m, targets, opps);
  const monthLabel = new Date(y, m - 1).toLocaleString("default", { month: "long", year: "numeric" });
  const maxStageCount = Math.max(1, ...metrics.stageCounts.map((s) => s.count));
  const maxCW = Math.max(1, ...metrics.weeklyTrends.map((t) => t.closedWonValue));
  const maxLeads = Math.max(1, ...metrics.weeklyTrends.map((t) => Math.max(t.leadsIn, t.discoveryScheduled)));

  const isCurrentMonth = now.getFullYear() === y && now.getMonth() + 1 === m;
  const daysInMonth = new Date(y, m, 0).getDate();
  const daysElapsed = isCurrentMonth ? Math.min(now.getDate(), daysInMonth) : Math.min(15, daysInMonth);
  const expectedByTodayPct = daysInMonth > 0 ? (daysElapsed / daysInMonth) * 100 : 50;

  const showConnectGhl = oppsResult.source === "error" && oppsResult.error === "no_key";
  const showConfigureMappings = oppsResult.source === "error" && oppsResult.error === "no_mappings";
  const showSyncError = oppsResult.source === "error" && oppsResult.error === "api_error";

  return (
    <div className="space-y-6">
      <DiscoveryRefreshTrigger clientId={clientId} />
      {showConnectGhl && (
        <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-6 text-center shadow-lg">
          <p className="text-lg font-medium text-[var(--foreground)]">Connect Go High Level</p>
          <p className="mt-2 text-sm text-[var(--muted)]">Connect your GHL account in Settings to see live pipeline data.</p>
          <Link href={`/dashboard/clients/${clientId}/settings`} className="mt-4 inline-block rounded bg-[var(--accent)] text-white px-4 py-2 text-sm font-medium hover:opacity-90">Go to Settings →</Link>
        </div>
      )}
      {showConfigureMappings && (
        <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-6 text-center shadow-lg">
          <p className="text-lg font-medium text-[var(--foreground)]">Field Mappings Required</p>
          <p className="mt-2 text-sm text-[var(--muted)]">GHL is connected but field mappings aren&apos;t configured yet.</p>
          <Link href={`/dashboard/clients/${clientId}/settings`} className="mt-4 inline-block rounded bg-[var(--accent)] text-white px-4 py-2 text-sm font-medium hover:opacity-90">Configure Mappings →</Link>
        </div>
      )}
      {showSyncError && (
        <div className="rounded-xl border border-[var(--danger)]/50 bg-[var(--card)] p-6 text-center shadow-lg">
          <p className="text-lg font-medium text-[var(--foreground)]">Unable to sync with Go High Level</p>
          <p className="mt-2 text-sm text-[var(--muted)]">Check your API key and field mappings in Settings.</p>
          <Link href={`/dashboard/clients/${clientId}/settings`} className="mt-4 inline-block rounded bg-[var(--accent)] text-white px-4 py-2 text-sm font-medium hover:opacity-90">Go to Settings →</Link>
        </div>
      )}
      <FunnelFilters
        clientId={clientId}
        clients={getClientConfigs()}
        year={y}
        month={m}
        monthLabel={monthLabel}
        currentYear={now.getFullYear()}
        currentMonth={now.getMonth() + 1}
        lastMonthYear={lastY}
        lastMonthMonth={lastM}
        lastMonthLabel={lastMonthLabel}
        useClientRoutes
      />

      {/* KPI row — mockup: large value, target, pacing with arrow, dual-marker progress bar */}
      <section className="rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-5 shadow-lg">
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-9 gap-4">
          {metrics.kpis.map((k) => {
            const pacingColor =
              k.pacingPct == null ? "var(--muted)" : k.pacingPct >= 100 ? "var(--success)" : k.pacingPct >= 80 ? "var(--warning)" : "var(--danger)";
            const arrow = k.pacingPct == null ? "" : k.pacingPct >= 100 ? "↑" : k.pacingPct >= 80 ? "→" : "↓";
            const actualBarPct = k.target > 0 ? Math.min(100, (k.mtd / k.target) * 100) : 0;
            return (
              <div key={k.key} className="rounded-lg border border-[var(--card-border)] bg-[var(--background)] p-4 shadow-inner">
                <div className="text-[10px] font-semibold text-[var(--muted)] uppercase tracking-wider truncate">{k.label}</div>
                <div className="mt-2 text-2xl font-bold text-[var(--foreground)] tabular-nums">
                  {k.subLabel ?? k.mtd.toLocaleString()}
                </div>
                {k.target > 0 && (
                  <div className="text-xs text-[var(--muted)] mt-0.5">Target: {k.target.toLocaleString()}</div>
                )}
                {k.pacingPct != null && (
                  <div className="mt-2 flex items-center gap-1">
                    <span className="text-sm font-semibold" style={{ color: pacingColor }}>
                      Pacing: {k.pacingPct}%
                    </span>
                    <span className="text-base font-bold" style={{ color: pacingColor }}>{arrow}</span>
                  </div>
                )}
                {k.target > 0 && (
                  <div className="mt-3 h-2 rounded-full bg-[var(--card-border)] overflow-visible relative">
                    <div
                      className="h-full rounded-full absolute inset-y-0 left-0 transition-all"
                      style={{
                        width: `${actualBarPct}%`,
                        backgroundColor: pacingColor,
                      }}
                    />
                    <div
                      className="absolute top-0 bottom-0 w-0.5 -translate-x-px"
                      style={{
                        left: `${Math.min(100, expectedByTodayPct)}%`,
                        background: `repeating-linear-gradient(to bottom, var(--warning) 0, var(--warning) 2px, transparent 2px, transparent 4px)`,
                      }}
                      title="Expected by today"
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div className="flex gap-6 mt-4 pt-4 border-t border-[var(--card-border)] text-[10px] text-[var(--muted)]">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-1.5 rounded bg-[var(--success)]" /> MTD actual position
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-1.5 rounded border-2 border-dashed border-[var(--warning)]" /> Expected by-today
          </span>
        </div>
      </section>

      {/* Middle: Funnel (left) + Conversion table (right) */}
      <section className="grid lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-5 shadow-lg">
          <h2 className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider mb-4">Sales pipeline funnel</h2>
          <div className="space-y-2">
            {metrics.stageCounts.map((s, i) => {
              const isClosedWon = s.stageName.toLowerCase().includes("closed won");
              const hue = 210 - (i / Math.max(1, metrics.stageCounts.length - 1)) * 80;
              const sat = 65;
              const light = 38 + (i * 6);
              return (
                <div key={s.order}>
                  <div className="flex items-center gap-3">
                    <div
                      className="h-10 rounded-md flex items-center justify-end pr-2 min-w-[3rem] transition-all shadow-md"
                      style={{
                        width: `${Math.max(22, (s.count / maxStageCount) * 100)}%`,
                        background: `linear-gradient(135deg, hsl(${hue}, ${sat}%, ${light}%), hsl(${hue + 40}, ${sat}%, ${light - 4}%))`,
                      }}
                    >
                      <span className="text-xs font-bold text-white tabular-nums drop-shadow">{s.count}</span>
                      {isClosedWon && <span className="ml-1 text-white opacity-90" title="Closed Won">✦</span>}
                    </div>
                    <span className="text-sm font-medium text-[var(--foreground)] truncate flex-1">{s.stageName}</span>
                  </div>
                  {i < metrics.conversionRows.length && (
                    <div className="flex items-center gap-2 pl-2 py-1 text-xs text-[var(--muted)]">
                      <span className="text-[var(--accent)]">↓</span>
                      <span className="font-semibold text-[var(--accent)]">{metrics.conversionRows[i].conversionPct}% conversion</span>
                      <span>from {metrics.conversionRows[i].fromStage}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card)] overflow-hidden shadow-lg">
          <h2 className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider p-4 pb-2">Conversion table</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-t border-[var(--card-border)] bg-[var(--background)]">
                <th className="text-left p-3 font-medium text-[var(--muted)]">Stage</th>
                <th className="text-right p-3 font-medium text-[var(--muted)]">Count</th>
                <th className="text-right p-3 font-medium text-[var(--muted)]">Conversion rate (prev. stage)</th>
                <th className="text-right p-3 font-medium text-[var(--muted)]">Cumulative conv. %</th>
              </tr>
            </thead>
            <tbody>
              {metrics.conversionTableRows.map((r, i) => (
                <tr key={i} className="border-t border-[var(--card-border)] hover:bg-[var(--card)]/50">
                  <td className="p-3 text-[var(--foreground)] font-medium">{r.stageName}</td>
                  <td className="p-3 text-right font-semibold tabular-nums">{r.count}</td>
                  <td className="p-3 text-right text-[var(--accent)] tabular-nums font-medium">{r.conversionFromPrevPct}%</td>
                  <td className="p-3 text-right text-[var(--foreground)] tabular-nums">{r.cumulativePct}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Bottom: Line charts + Per-rep table */}
      <section className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-5 shadow-lg">
            <h2 className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider mb-4">Weekly closed won value trend ({monthLabel})</h2>
            {(() => {
              const w = 320; const h = 140;
              const pts = metrics.weeklyTrends.slice(-4);
              const targetCW = targets.find((t) => t.clientId === config.clientId && !t.repId)?.closedWonValue ?? 0;
              const weeklyTarget = targetCW / 4;
              const maxY = Math.max(maxCW, weeklyTarget * 1.2, 1);
              const points = pts.map((t, i) => `${20 + (i / (pts.length - 1 || 1)) * (w - 40)},${h - 20 - (t.closedWonValue / maxY) * (h - 40)}`).join(" ");
              const targetY = h - 20 - (weeklyTarget / maxY) * (h - 40);
              return (
                <>
                  <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-36" preserveAspectRatio="xMidYMid meet">
                    <line x1={20} y1={targetY} x2={w - 20} y2={targetY} stroke="var(--muted)" strokeWidth="1" strokeDasharray="4 4" />
                    <polyline fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" points={points} />
                    {pts.map((t, i) => {
                      const x = 20 + (i / (pts.length - 1 || 1)) * (w - 40);
                      const y = h - 20 - (t.closedWonValue / maxY) * (h - 40);
                      return <circle key={i} cx={x} cy={y} r={4} fill="var(--accent)" />;
                    })}
                  </svg>
                  <div className="flex justify-between text-[10px] text-[var(--muted)] mt-1">
                    <span>Week 1 → Week {pts.length}</span>
                    <span>$0 to ${(maxY / 1000).toFixed(0)}k · Target dashed</span>
                  </div>
                </>
              );
            })()}
          </div>
          <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-5 shadow-lg">
            <h2 className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider mb-4">Weekly leads in & discovery scheduled</h2>
            {(() => {
              const w = 320; const h = 140;
              const pts = metrics.weeklyTrends.slice(-4);
              const pointsLeads = pts.map((t, i) => `${20 + (i / (pts.length - 1 || 1)) * (w - 40)},${h - 20 - (t.leadsIn / maxLeads) * (h - 40)}`).join(" ");
              const pointsDisc = pts.map((t, i) => `${20 + (i / (pts.length - 1 || 1)) * (w - 40)},${h - 20 - (t.discoveryScheduled / maxLeads) * (h - 40)}`).join(" ");
              return (
                <>
                  <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-36" preserveAspectRatio="xMidYMid meet">
                    <polyline fill="none" stroke="var(--funnel-start)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" points={pointsLeads} />
                    <polyline fill="none" stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" points={pointsDisc} />
                    {pts.map((t, i) => {
                      const x = 20 + (i / (pts.length - 1 || 1)) * (w - 40);
                      return (
                        <g key={i}>
                          <circle cx={x} cy={h - 20 - (t.leadsIn / maxLeads) * (h - 40)} r={3} fill="var(--funnel-start)" />
                          <circle cx={x} cy={h - 20 - (t.discoveryScheduled / maxLeads) * (h - 40)} r={3} fill="#f97316" />
                        </g>
                      );
                    })}
                  </svg>
                  <div className="flex gap-4 mt-2 text-[10px] text-[var(--muted)]">
                    <span className="flex items-center gap-1"><span className="w-2 h-0.5 rounded bg-[var(--funnel-start)]" /> Leads In</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-0.5 rounded bg-[#f97316]" /> Discovery scheduled</span>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
        <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card)] overflow-hidden shadow-lg">
          <h2 className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider p-4 pb-2">Per representative</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--card-border)] bg-[var(--background)]">
                <th className="text-left p-3 font-medium text-[var(--muted)]">Rep Name</th>
                <th className="text-right p-3 font-medium text-[var(--muted)]">CW MTD</th>
                <th className="text-right p-3 font-medium text-[var(--muted)]">Target</th>
                <th className="text-right p-3 font-medium text-[var(--muted)]">Pacing %</th>
                <th className="text-right p-3 font-medium text-[var(--muted)]">Revenue sourced</th>
                <th className="text-right p-3 font-medium text-[var(--muted)]">Discovery MTD</th>
                <th className="text-right p-3 font-medium text-[var(--muted)]">Target</th>
                <th className="text-right p-3 font-medium text-[var(--muted)]">Pacing %</th>
              </tr>
            </thead>
            <tbody>
              {metrics.repSummaries.map((r) => {
                const cwPacingColor = r.pacingPct == null ? "var(--muted)" : (r.pacingPct >= 100 ? "var(--success)" : r.pacingPct >= 80 ? "var(--warning)" : "var(--danger)");
                const discPacingColor = r.discoveryPacingPct == null ? "var(--muted)" : (r.discoveryPacingPct >= 100 ? "var(--success)" : r.discoveryPacingPct >= 80 ? "var(--warning)" : "var(--danger)");
                const cwArrow = r.pacingPct == null ? "" : r.pacingPct >= 100 ? "↑" : r.pacingPct >= 80 ? "→" : "↓";
                const discArrow = r.discoveryPacingPct == null ? "" : r.discoveryPacingPct >= 100 ? "↑" : r.discoveryPacingPct >= 80 ? "→" : "↓";
                return (
                  <tr key={r.repId} className="border-b border-[var(--card-border)] last:border-0 hover:bg-[var(--card)]/50">
                    <td className="p-3">
                      <Link href={`/dashboard/rep/${r.repId}?clientId=${clientId}`} className="text-[var(--accent)] hover:underline font-medium">
                        {r.repName}
                      </Link>
                    </td>
                    <td className="p-3 text-right tabular-nums font-medium">${r.closedWonValue.toLocaleString()}</td>
                    <td className="p-3 text-right text-[var(--muted)] tabular-nums">{r.targetClosedValue ?? "—"}</td>
                    <td className="p-3 text-right font-semibold tabular-nums" style={{ color: cwPacingColor }}>
                      {cwArrow} {r.pacingPct != null ? `${r.pacingPct}%` : "—"}
                    </td>
                    <td className="p-3 text-right tabular-nums text-[var(--muted)]">${(r.sourcedWonValue ?? 0).toLocaleString()}</td>
                    <td className="p-3 text-right tabular-nums">{r.discoveryCalls}</td>
                    <td className="p-3 text-right text-[var(--muted)] tabular-nums">{r.targetDiscovery ?? "—"}</td>
                    <td className="p-3 text-right font-semibold tabular-nums" style={{ color: discPacingColor }}>
                      {discArrow} {r.discoveryPacingPct != null ? `${r.discoveryPacingPct}%` : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
