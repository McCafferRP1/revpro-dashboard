import Link from "next/link";
import { getClientConfig } from "@/lib/funnel/mockData";
import {
  getPreviousWeekBounds,
  getClientMetricsForDateRange,
} from "@/lib/funnel/metrics";
import { ClientReportActions } from "./ClientReportActions";

export const dynamic = "force-dynamic";

export default async function ClientReportPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;
  const config = getClientConfig(clientId);
  if (!config) {
    return (
      <div className="p-6">
        <p className="text-[var(--muted)]">Client not found.</p>
        <Link href="/dashboard" className="text-[var(--accent)] hover:underline mt-2 inline-block">
          ← Portfolio
        </Link>
      </div>
    );
  }

  const { start, end } = getPreviousWeekBounds();
  const week = getClientMetricsForDateRange(config, start, end);

  const weekStartLabel = start.toLocaleDateString("default", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const weekEndLabel = end.toLocaleDateString("default", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const generatedAt = new Date().toLocaleString("default", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <div className="max-w-4xl mx-auto bg-white text-gray-900 print:bg-white print:text-black">
      <ClientReportActions clientId={clientId} />
      <article className="p-8 print:p-0">
        <header className="border-b border-gray-200 pb-6 mb-8">
          <div className="flex items-center justify-between gap-4">
            <img src={`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/revpro-logo.svg`} alt="RevPro" className="h-10 w-auto" width={150} height={40} />
            <div className="text-right text-sm text-gray-500">{generatedAt}</div>
          </div>
          <h1 className="mt-6 text-2xl font-bold text-gray-900">
            Weekly performance report
          </h1>
          <p className="mt-1 text-gray-600 font-medium">{config.clientName}</p>
          <p className="text-sm text-gray-500">
            Week of {weekStartLabel} – {weekEndLabel}
          </p>
        </header>

        <section className="mb-8">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
            Summary
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="rounded-lg border border-gray-200 p-4">
              <div className="text-xs text-gray-500 uppercase">Leads in</div>
              <div className="text-xl font-bold tabular-nums">{week.leadsIn}</div>
            </div>
            <div className="rounded-lg border border-gray-200 p-4">
              <div className="text-xs text-gray-500 uppercase">Discovery scheduled</div>
              <div className="text-xl font-bold tabular-nums">{week.discoveryScheduled}</div>
            </div>
            <div className="rounded-lg border border-gray-200 p-4">
              <div className="text-xs text-gray-500 uppercase">Clarity scheduled / confirmed</div>
              <div className="text-xl font-bold tabular-nums">{week.clarityScheduledConfirmed}</div>
            </div>
            <div className="rounded-lg border border-gray-200 p-4">
              <div className="text-xs text-gray-500 uppercase">Revenue booked</div>
              <div className="text-xl font-bold tabular-nums">${week.closedWonValue.toLocaleString()}</div>
            </div>
            <div className="rounded-lg border border-gray-200 p-4">
              <div className="text-xs text-gray-500 uppercase">Cash collected (at point of sale)</div>
              <div className="text-xl font-bold tabular-nums">${week.closedWonCashCollected.toLocaleString()}</div>
            </div>
          </div>
          <div className="mt-4 flex gap-6">
            <div>
              <span className="text-xs text-gray-500">Closed won (count)</span>
              <span className="ml-2 font-semibold tabular-nums">{week.closedWonCount}</span>
            </div>
            <div>
              <span className="text-xs text-gray-500">Win rate</span>
              <span className="ml-2 font-semibold tabular-nums">{week.winRatePct}%</span>
            </div>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
            Rep performance (week)
          </h2>
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left p-3 font-semibold text-gray-700">Rep</th>
                  <th className="text-right p-3 font-semibold text-gray-700">Discovery</th>
                  <th className="text-right p-3 font-semibold text-gray-700">Clarity</th>
                  <th className="text-right p-3 font-semibold text-gray-700">Revenue booked</th>
                  <th className="text-right p-3 font-semibold text-gray-700">Cash collected</th>
                </tr>
              </thead>
              <tbody>
                {week.repSummaries.map((r) => (
                  <tr key={r.repId} className="border-b border-gray-100 last:border-0">
                    <td className="p-3 font-medium text-gray-900">{r.repName}</td>
                    <td className="p-3 text-right tabular-nums">{r.discoveryCalls}</td>
                    <td className="p-3 text-right tabular-nums">{r.clarityCalls}</td>
                    <td className="p-3 text-right tabular-nums">${r.closedWonValue.toLocaleString()}</td>
                    <td className="p-3 text-right tabular-nums">${r.closedWonCashCollected.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <footer className="pt-6 border-t border-gray-200 text-xs text-gray-500">
          Generated by RevPro · {generatedAt}
        </footer>
      </article>
    </div>
  );
}
