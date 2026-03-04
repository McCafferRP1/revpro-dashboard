import { NextRequest, NextResponse } from "next/server";
import { authorizeMira } from "@/lib/miraAuth";
import { setGhlKey } from "@/lib/ghlKeys";
import { setIntegrationKey, setFieldMappings } from "@/lib/funnel/integrations";
import { addClient, upsertRep, hydrateSettings, persistSettings } from "@/lib/funnel/mockData";

function slug(name: string): string {
  return name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "").slice(0, 24) || "rep";
}

export async function POST(request: NextRequest) {
  const authError = authorizeMira(request);
  if (authError) return authError;

  const body = await request.json().catch(() => ({}));
  const {
    clientName,
    apiKey,
    stages,
    primaryStageOrders,
    kpiMetricKeys,
    fieldMappings,
    reps,
    accountManagerId,
    accountManagerName,
  } = body;

  if (!clientName || !apiKey) {
    return NextResponse.json({ error: "clientName and apiKey required" }, { status: 400 });
  }

  await hydrateSettings();

  const config = addClient({
    clientName,
    stages,
    primaryStageOrders,
    kpiMetricKeys,
    accountManagerId,
    accountManagerName,
  });

  await setGhlKey(config.clientId, apiKey);
  setIntegrationKey(config.clientId, "ghl", apiKey);

  if (Array.isArray(fieldMappings) && fieldMappings.length > 0) {
    setFieldMappings(
      config.clientId,
      "ghl",
      fieldMappings.filter((m: { ourField?: string; theirField?: string }) => m.ourField && m.theirField)
    );
  }

  if (Array.isArray(reps) && reps.length > 0) {
    for (const rep of reps) {
      const id = `${config.clientId}-${slug(rep.name)}-${Math.random().toString(36).slice(2, 9)}`;
      upsertRep({
        id,
        name: rep.name,
        clientId: config.clientId,
        role: rep.role === "setter" ? "setter" : "closer",
        ghlUserId: rep.ghlUserId,
      });
    }
  }

  await persistSettings();

  return NextResponse.json({
    success: true,
    clientId: config.clientId,
    dashboardUrl: `/app/dashboard/clients/${config.clientId}/funnel`,
    stagesConfigured: config.stages.length,
    fieldMappingsConfigured: Array.isArray(fieldMappings) ? fieldMappings.length : 0,
    repsConfigured: Array.isArray(reps) ? reps.length : 0,
  });
}
