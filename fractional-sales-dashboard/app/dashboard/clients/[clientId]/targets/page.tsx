import { getClientConfig, getMockTargets, getClientConfigs } from "@/lib/funnel/mockData";
import { TargetsForm } from "@/app/dashboard/targets/TargetsForm";
import { MonthYearSelector } from "./MonthYearSelector";

export default async function ClientTargetsPage({
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

  const config = getClientConfig(clientId);
  if (!config) {
    return (
      <div className="p-6">
        <p className="text-[var(--muted)]">Client not found.</p>
      </div>
    );
  }

  const targets = getMockTargets();
  const existing = targets.find((t) => t.clientId === clientId && !t.repId && t.year === y && t.month === m);
  const initial = existing
    ? {
        leadsIn: existing.leadsIn,
        discoveryCalls: existing.discoveryCalls ?? 0,
        clarityCalls: existing.clarityCalls ?? 0,
        closedWonCount: existing.closedWonCount,
        closedWonValue: existing.closedWonValue,
        closedWonCashCollected: existing.closedWonCashCollected ?? 0,
      }
    : { leadsIn: 0, discoveryCalls: 0, clarityCalls: 0, closedWonCount: 0, closedWonValue: 0, closedWonCashCollected: 0 };

  const assumptions = {
    leadToDiscoveryPct: 25,
    discoveryToClarityPct: 40,
    clarityToClosePct: 30,
    avgDealSize: 4000,
  };

  return (
    <div className="space-y-6">
      <p className="text-[var(--muted)]">
        Set targets for {config.clientName} by month. Select the month below, enter or adjust the numbers, then save. Those targets drive pacing and quota for that month on the funnel and rep dashboards. When a new month rolls around, set targets for that month (e.g. from growth goals agreed in the account manager–client meeting).
      </p>

      <MonthYearSelector clientId={clientId} year={y} month={m} />

      <TargetsForm
        clients={getClientConfigs()}
        clientId={clientId}
        year={y}
        month={m}
        initial={initial}
        assumptions={assumptions}
      />
    </div>
  );
}
