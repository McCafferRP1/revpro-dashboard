import { NextRequest, NextResponse } from "next/server";
import { authorizeMira } from "@/lib/miraAuth";
import { hydrateSettings, getClientConfig, getRepsForClient } from "@/lib/funnel/mockData";
import { getIntegration, getFieldMappings } from "@/lib/funnel/integrations";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const authError = authorizeMira(request);
  if (authError) return authError;

  const { clientId } = await params;
  if (!clientId) return NextResponse.json({ error: "clientId required" }, { status: 400 });

  await hydrateSettings();

  const config = getClientConfig(clientId);
  if (!config) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  const ghl = getIntegration(clientId, "ghl");
  const mappings = getFieldMappings(clientId, "ghl");
  const reps = getRepsForClient(clientId);

  return NextResponse.json({
    clientId: config.clientId,
    clientName: config.clientName,
    ghlKeyConfigured: ghl.configured,
    fieldMappingsCount: mappings.filter((m) => m.theirField?.trim()).length,
    stagesCount: config.stages.length,
    repsCount: reps.length,
    stages: config.stages.map((s) => ({
      order: s.order,
      displayName: s.displayName,
      outcome: s.outcome,
    })),
  });
}
