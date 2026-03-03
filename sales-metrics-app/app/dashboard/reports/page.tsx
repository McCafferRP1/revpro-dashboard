import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getTenantIdOrThrow } from "@/lib/auth";
import { computeMetrics } from "@/lib/metrics";
import { ReportsTenantSelect } from "./ReportsTenantSelect";

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ tenantId?: string; year?: string; month?: string }>;
}) {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  const params = await searchParams;
  const tenantId = await getTenantIdOrThrow(role === "admin" ? params.tenantId : null);
  const now = new Date();
  const year = params.year ? parseInt(params.year, 10) : now.getFullYear();
  const month = params.month ? parseInt(params.month, 10) : now.getMonth() + 1;
  const y = Number.isNaN(year) ? now.getFullYear() : year;
  const m = Number.isNaN(month) || month < 1 || month > 12 ? now.getMonth() + 1 : month;

  const tenants = role === "admin" ? await prisma.tenant.findMany({ orderBy: { name: "asc" } }) : [];
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  const metrics = await computeMetrics(tenantId, y, m);
  const target = await prisma.target.findFirst({
    where: { tenantId, repId: null, year: y, month: m },
  });

  const rows = [
    { label: "Leads in", value: metrics.leadsIn, target: target?.leadsIn },
    {
      label: "Leads booked to meeting",
      value: metrics.leadsBookedToMeeting,
      target: target?.meetingsBooked,
      sub: `${metrics.leadsBookedToMeetingPct.toFixed(1)}%`,
    },
    {
      label: "Initial meetings qualified",
      value: metrics.initialMeetingsQualified,
      target: target?.qualifiedMeetings,
    },
    { label: "Close rate (qualified)", value: null, target: null, sub: `${metrics.closeRateQualifiedPct.toFixed(1)}%` },
    { label: "Second meetings booked", value: metrics.secondMeetingsBooked, target: null },
    { label: "Close rate (second)", value: null, target: null, sub: `${metrics.closeRateSecondPct.toFixed(1)}%` },
    { label: "Closed won", value: metrics.closedWon, target: target?.closedWon },
  ];

  return (
    <div>
      <h1 className="text-2xl font-semibold text-zinc-900 mb-6">Monthly progress</h1>
      {role === "admin" && (
        <ReportsTenantSelect
          tenants={tenants}
          selectedTenantId={tenantId}
          year={y}
          month={m}
        />
      )}
      <p className="text-zinc-600 mb-6">
        <strong>{tenant?.name}</strong> ·{" "}
        {new Date(y, m - 1).toLocaleString("default", { month: "long", year: "numeric" })}
      </p>
      <div className="overflow-x-auto">
        <table className="w-full max-w-2xl border-collapse bg-white rounded-lg border border-zinc-200">
          <thead>
            <tr className="border-b border-zinc-200">
              <th className="text-left p-3 font-medium text-zinc-900">Metric</th>
              <th className="text-right p-3 font-medium text-zinc-900">Actual</th>
              <th className="text-right p-3 font-medium text-zinc-900">Target</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.label} className="border-b border-zinc-100">
                <td className="p-3 text-zinc-900">
                  {r.label}
                  {r.sub != null && <span className="block text-xs text-zinc-500">{r.sub}</span>}
                </td>
                <td className="p-3 text-right font-medium">{r.value != null ? r.value : "—"}</td>
                <td className="p-3 text-right text-zinc-600">{r.target != null ? r.target : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
