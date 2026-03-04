import { NextRequest, NextResponse } from "next/server";
import { authorizeMira } from "@/lib/miraAuth";
import { hydrateSettings } from "@/lib/funnel/mockData";
import { refreshDiscovery } from "@/lib/funnel/ghlDiscovery";
import { getOpportunitiesFromGhl } from "@/lib/funnel/ghlSync";

export async function POST(request: NextRequest) {
  const authError = authorizeMira(request);
  if (authError) return authError;

  const body = await request.json().catch(() => ({}));
  const clientId = body?.clientId;
  if (!clientId) return NextResponse.json({ error: "clientId required" }, { status: 400 });

  await hydrateSettings();
  await refreshDiscovery(clientId);
  const { opps, error } = await getOpportunitiesFromGhl(clientId);

  if (error) {
    return NextResponse.json({
      success: false,
      error,
      opportunityCount: 0,
      stageDistribution: {},
      sample: [],
      warnings: ["Sync failed: " + error],
    });
  }

  const stageDistribution: Record<string, number> = {};
  for (const o of opps) {
    stageDistribution[o.stageName] = (stageDistribution[o.stageName] ?? 0) + 1;
  }

  const warnings: string[] = [];
  const unknownStage = opps.filter((o) => o.stageOrder === 1 && o.stageName === "Unknown").length;
  if (unknownStage > 0) warnings.push(`${unknownStage} opportunities have unknown stage (check mapping)`);
  const zeroValue = opps.filter((o) => o.amount === 0 && o.outcome === "won").length;
  if (zeroValue > 0) warnings.push(`${zeroValue} won deals have zero monetary value`);

  const sample = opps.slice(0, 10).map((o) => ({
    id: o.id,
    stageName: o.stageName,
    stageOrder: o.stageOrder,
    amount: o.amount,
    repName: o.repName,
    dateCreated: o.dateCreated instanceof Date ? o.dateCreated.toISOString().slice(0, 10) : String(o.dateCreated),
  }));

  return NextResponse.json({
    success: true,
    opportunityCount: opps.length,
    stageDistribution,
    sample,
    warnings,
  });
}
