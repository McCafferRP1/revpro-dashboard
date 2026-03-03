import { redirect } from "next/navigation";
import { getSession, getUsers } from "@/lib/auth";
import {
  getClientConfigs,
  getClientConfig,
  getMockTargets,
  getAccountManagers,
} from "@/lib/funnel/mockData";
import {
  getClientMetrics,
  getClientMetricsForDateRange,
  getPreviousWeekBounds,
} from "@/lib/funnel/metrics";
import { ReportActions } from "./ReportActions";
import { ReportPeriodSelector } from "./ReportPeriodSelector";

export const dynamic = "force-dynamic";

function formatPacing(pct: number | null): string {
  if (pct == null) return "—";
  return `${pct}%`;
}

function formatPacingClass(pct: number | null): string {
  if (pct == null) return "";
  if (pct >= 100) return "text-green-600";
  if (pct >= 80) return "text-amber-600";
  return "text-red-600";
}

export default async function WeeklyReportPage({
  searchParams,
}: {
  searchParams: Promise<{ accountManagerId?: string; year?: string; month?: string; weekEnd?: string }>;
}) {
  const session = await getSession();
  if (!session?.isAdministrator) redirect("/dashboard");
  const users = getUsers();

  const params = await searchParams;
  const accountManagerId = params.accountManagerId ?? "all";
  const now = new Date();
  const useWeek = !!params.weekEnd;
  const weekEnd = params.weekEnd;
  const y = params.year ? parseInt(params.year, 10) : now.getFullYear();
  const m = params.month ? parseInt(params.month, 10) : now.getMonth() + 1;
  const year = Number.isNaN(y) ? now.getFullYear() : y;
  const month = Number.isNaN(m) || m < 1 || m > 12 ? now.getMonth() + 1 : m;
  const lastM = month === 1 ? 12 : month - 1;
  const lastY = month === 1 ? year - 1 : year;

  const targets = getMockTargets();
  const allConfigs = getClientConfigs();
  const filteredConfigs =
    accountManagerId === "all"
      ? allConfigs
      : allConfigs.filter(
          (c) => (getClientConfig(c.clientId)?.accountManagerId ?? "unassigned") === accountManagerId
        );

  const clientData = useWeek && weekEnd
    ? (() => {
        const [yW, mW, dW] = weekEnd.split("-").map(Number);
        const end = new Date(yW, mW - 1, dW, 23, 59, 59, 999);
        const start = new Date(end);
        start.setDate(start.getDate() - 6);
        start.setHours(0, 0, 0, 0);
        return filteredConfigs.map((config) => {
          const merged = getClientConfig(config.clientId);
          const week = getClientMetricsForDateRange(config, start, end);
          return {
            config,
            accountManagerId: merged?.accountManagerId ?? "unassigned",
            accountManagerName: merged?.accountManagerName ?? "—",
            closedValue: week.closedWonValue,
            momPct: 0,
            pacing: null,
            winRate: week.winRatePct,
            leadsMtd: week.leadsIn,
            leadsTarget: 0,
            discoveryMtd: week.discoveryScheduled,
            discoveryTarget: 0,
            clarityMtd: week.clarityScheduledConfirmed,
            cwTarget: 0,
            repSummaries: week.repSummaries.map((r) => ({
              repId: r.repId,
              repName: r.repName,
              leadsIn: 0,
              discoveryCalls: r.discoveryCalls ?? 0,
              clarityCalls: r.clarityCalls ?? 0,
              closedWonCount: 0,
              closedWonValue: r.closedWonValue,
              winRatePct: 0,
              avgCycleDays: 0,
              pacingPct: null,
              targetClosedValue: 0,
            })),
          };
        });
      })()
    : filteredConfigs.map((config) => {
    const metrics = getClientMetrics(config, year, month, targets);
    const lastMetrics = getClientMetrics(config, lastY, lastM, targets);
    const merged = getClientConfig(config.clientId);
    const closedNow =
      metrics.kpis.find((k) => k.key === "closedWonValue")?.mtd ??
      metrics.kpis.find((k) => k.label === "Closed Won (value)")?.mtd ??
      0;
    const closedLast =
      lastMetrics.kpis.find((k) => k.key === "closedWonValue")?.mtd ??
      lastMetrics.kpis.find((k) => k.label === "Closed Won (value)")?.mtd ??
      0;
    const momPct = closedLast ? Math.round(((closedNow - closedLast) / closedLast) * 100) : 0;
    const cwKpi =
      metrics.kpis.find((k) => k.key === "closedWonValue") ??
      metrics.kpis.find((k) => k.label === "Closed Won (value)");
    const pacing = cwKpi?.pacingPct ?? null;
    const winRate =
      metrics.kpis.find((k) => k.key === "winRate")?.mtd ??
      metrics.kpis.find((k) => k.label === "Win Rate")?.mtd ??
      0;
    const leadsKpi = metrics.kpis.find((k) => k.key === "leadsIn") ?? metrics.kpis.find((k) => k.label === "Leads In");
    const discoveryKpi =
      metrics.kpis.find((k) => k.key === "discoveryScheduled") ??
      metrics.kpis.find((k) => k.label === "Discovery Scheduled");
    const clarityKpi =
      metrics.kpis.find((k) => k.key === "clarityScheduledConfirmed") ??
      metrics.kpis.find((k) => k.label === "Clarity Scheduled / Confirmed");
    const targetCW = cwKpi?.target ?? 0;
    return {
      config,
      accountManagerId: merged?.accountManagerId ?? "unassigned",
      accountManagerName: merged?.accountManagerName ?? "—",
      closedValue: closedNow,
      momPct,
      pacing,
      winRate,
      leadsMtd: leadsKpi?.mtd ?? 0,
      leadsTarget: leadsKpi?.target ?? 0,
      discoveryMtd: discoveryKpi?.mtd ?? 0,
      discoveryTarget: discoveryKpi?.target ?? 0,
      clarityMtd: clarityKpi?.mtd ?? 0,
      cwTarget: targetCW,
      repSummaries: metrics.repSummaries,
    };
  });

  const totalClosed = clientData.reduce((s, d) => s + d.closedValue, 0);
  const totalTarget = clientData.reduce((s, d) => s + d.cwTarget, 0);
  const lastMonthClosed = clientData.reduce((s, d) => {
    const last = getClientMetrics(d.config, lastY, lastM, targets);
    const v =
      last.kpis.find((k) => k.key === "closedWonValue")?.mtd ??
      last.kpis.find((k) => k.label === "Closed Won (value)")?.mtd ??
      0;
    return s + v;
  }, 0);
  const portfolioMoM = lastMonthClosed ? Math.round(((totalClosed - lastMonthClosed) / lastMonthClosed) * 100) : 0;
  const portfolioPacing =
    totalTarget > 0 && month === now.getMonth() + 1 && year === now.getFullYear()
      ? Math.round(
          (totalClosed /
            (totalTarget *
              (Math.min(now.getDate(), new Date(year, month, 0).getDate()) /
                new Date(year, month, 0).getDate()))) *
            100
        )
      : null;

  const allReps: {
    repId: string;
    repName: string;
    clientName: string;
    mtdCW: number;
    target: number;
    pacingPct: number | null;
  }[] = [];
  clientData.forEach(({ config, repSummaries }) => {
    repSummaries.forEach((r) => {
      allReps.push({
        repId: r.repId,
        repName: r.repName,
        clientName: config.clientName,
        mtdCW: r.closedWonValue ?? 0,
        target: r.targetClosedValue ?? 0,
        pacingPct: r.pacingPct ?? null,
      });
    });
  });
  const topReps = [...allReps].sort((a, b) => (b.pacingPct ?? 0) - (a.pacingPct ?? 0)).slice(0, 5);

  const periodLabel = useWeek && weekEnd
    ? (() => {
        const [yW, mW, dW] = weekEnd.split("-").map(Number);
        const end = new Date(yW, mW - 1, dW);
        const start = new Date(end);
        start.setDate(start.getDate() - 6);
        return `${start.toLocaleDateString("default", { month: "short", day: "numeric" })} – ${end.toLocaleDateString("default", { month: "short", day: "numeric", year: "numeric" })}`;
      })()
    : new Date(year, month - 1).toLocaleString("default", { month: "long", year: "numeric" });
  const generatedAt = new Date().toLocaleString("default", {
    dateStyle: "medium",
    timeStyle: "short",
  });
  const accountManagers = getAccountManagers(users);
  const amLabel =
    accountManagerId === "all" ? "All account managers" : accountManagers.find((am) => am.id === accountManagerId)?.name ?? accountManagerId;

  interface ReportClientRow {
    config: (typeof filteredConfigs)[number];
    accountManagerId: string;
    accountManagerName: string;
    closedValue: number;
    momPct: number;
    pacing: number | null;
    winRate: number;
    leadsMtd: number;
    leadsTarget: number;
    discoveryMtd: number;
    discoveryTarget: number;
    clarityMtd: number;
    cwTarget: number;
    repSummaries: { repId: string; repName: string; closedWonValue?: number; pacingPct?: number | null; targetClosedValue?: number }[];
  }
  const byAM = new Map<string, ReportClientRow[]>();
  clientData.forEach((row) => {
    const amId = (row as ReportClientRow).accountManagerId ?? "unassigned";
    if (!byAM.has(amId)) byAM.set(amId, []);
    byAM.get(amId)!.push(row as ReportClientRow);
  });
  const amOrder = Array.from(byAM.keys()).sort((a, b) => {
    const nameA = clientData.find((r) => (r as { accountManagerId?: string }).accountManagerId === a)?.accountManagerName ?? "";
    const nameB = clientData.find((r) => (r as { accountManagerId?: string }).accountManagerId === b)?.accountManagerName ?? "";
    return nameA.localeCompare(nameB);
  });

  return (
    <div className="max-w-4xl mx-auto bg-white text-gray-900 print:bg-white print:text-black">
      <ReportActions />
      <ReportPeriodSelector
        currentYear={year}
        currentMonth={month}
        currentWeekEnd={weekEnd ?? null}
        useWeek={useWeek}
      />
      <article className="p-8 print:p-0">
        {/* Header */}
        <header className="border-b border-gray-200 pb-6 mb-8">
          <div className="flex items-center justify-between gap-4">
            <img src="/revpro-logo.svg" alt="RevPro" className="h-10 w-auto" width={150} height={40} />
            <div className="text-right text-sm text-gray-500">{generatedAt}</div>
          </div>
          <h1 className="mt-6 text-2xl font-bold text-gray-900">
            Weekly Leadership &amp; Metrics Update
          </h1>
          <p className="mt-1 text-gray-600">
            {periodLabel} · {amLabel}
          </p>
        </header>

        {/* Executive summary */}
        <section className="mb-8">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
            Executive summary
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="rounded-lg border border-gray-200 p-4">
              <div className="text-xs text-gray-500 uppercase">Closed Won (MTD)</div>
              <div className="text-xl font-bold tabular-nums">${totalClosed.toLocaleString()}</div>
            </div>
            <div className="rounded-lg border border-gray-200 p-4">
              <div className="text-xs text-gray-500 uppercase">Target (MTD)</div>
              <div className="text-xl font-bold tabular-nums text-gray-600">${totalTarget.toLocaleString()}</div>
            </div>
            <div className="rounded-lg border border-gray-200 p-4">
              <div className="text-xs text-gray-500 uppercase">Portfolio pacing</div>
              <div className={`text-xl font-bold tabular-nums ${formatPacingClass(portfolioPacing)}`}>
                {formatPacing(portfolioPacing)}
              </div>
            </div>
            <div className="rounded-lg border border-gray-200 p-4">
              <div className="text-xs text-gray-500 uppercase">MoM change</div>
              <div
                className={`text-xl font-bold tabular-nums ${
                  portfolioMoM >= 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {portfolioMoM >= 0 ? "+" : ""}{portfolioMoM}%
              </div>
            </div>
          </div>
        </section>

        {/* Client snapshot — by account manager */}
        <section className="mb-8">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
            Client snapshot (by account manager)
          </h2>
          <div className="space-y-6">
            {amOrder.map((amId) => {
              const rows = byAM.get(amId)!;
              const amName = rows[0]?.accountManagerName ?? amId;
              const amTotalClosed = rows.reduce((s, d) => s + d.closedValue, 0);
              const amTotalTarget = rows.reduce((s, d) => s + d.cwTarget, 0);
              return (
                <div key={amId}>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">
                    {amName}
                  </h3>
                  <div className="overflow-x-auto border border-gray-200 rounded-lg">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                          <th className="text-left p-3 font-semibold text-gray-700">Client</th>
                          <th className="text-right p-3 font-semibold text-gray-700">Leads</th>
                          <th className="text-right p-3 font-semibold text-gray-700">Discovery</th>
                          <th className="text-right p-3 font-semibold text-gray-700">Clarity</th>
                          <th className="text-right p-3 font-semibold text-gray-700">Closed Won $</th>
                          <th className="text-right p-3 font-semibold text-gray-700">Pacing</th>
                          <th className="text-right p-3 font-semibold text-gray-700">Win rate</th>
                          <th className="text-right p-3 font-semibold text-gray-700">MoM</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((d) => (
                          <tr key={d.config.clientId} className="border-b border-gray-100 last:border-0">
                            <td className="p-3 font-medium text-gray-900">{d.config.clientName}</td>
                            <td className="p-3 text-right tabular-nums">{d.leadsMtd}</td>
                            <td className="p-3 text-right tabular-nums">{d.discoveryMtd}</td>
                            <td className="p-3 text-right tabular-nums">{d.clarityMtd}</td>
                            <td className="p-3 text-right tabular-nums font-medium">
                              ${d.closedValue.toLocaleString()}
                            </td>
                            <td className={`p-3 text-right tabular-nums font-medium ${formatPacingClass(d.pacing)}`}>
                              {formatPacing(d.pacing)}
                            </td>
                            <td className="p-3 text-right tabular-nums">{d.winRate}%</td>
                            <td
                              className={`p-3 text-right tabular-nums ${
                                d.momPct >= 0 ? "text-green-600" : "text-red-600"
                              }`}
                            >
                              {d.momPct >= 0 ? "+" : ""}{d.momPct}%
                            </td>
                          </tr>
                        ))}
                        <tr className="bg-gray-50 border-t-2 border-gray-200 font-medium">
                          <td className="p-3 text-gray-700">Total</td>
                          <td className="p-3 text-right tabular-nums" colSpan={3} />
                          <td className="p-3 text-right tabular-nums">${amTotalClosed.toLocaleString()}</td>
                          <td className="p-3 text-right tabular-nums" colSpan={3} />
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Rep performance */}
        <section className="mb-8">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
            Top rep performance (by pacing)
          </h2>
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left p-3 font-semibold text-gray-700">Rep</th>
                  <th className="text-left p-3 font-semibold text-gray-700">Client</th>
                  <th className="text-right p-3 font-semibold text-gray-700">Closed Won MTD</th>
                  <th className="text-right p-3 font-semibold text-gray-700">Pacing</th>
                </tr>
              </thead>
              <tbody>
                {topReps.map((r) => (
                  <tr key={r.repId} className="border-b border-gray-100 last:border-0">
                    <td className="p-3 font-medium text-gray-900">{r.repName}</td>
                    <td className="p-3 text-gray-600">{r.clientName}</td>
                    <td className="p-3 text-right tabular-nums">${r.mtdCW.toLocaleString()}</td>
                    <td className={`p-3 text-right tabular-nums font-medium ${formatPacingClass(r.pacingPct)}`}>
                      {formatPacing(r.pacingPct)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Footer */}
        <footer className="pt-6 border-t border-gray-200 text-xs text-gray-500">
          Generated by RevPro · {generatedAt}
        </footer>
      </article>
    </div>
  );
}
