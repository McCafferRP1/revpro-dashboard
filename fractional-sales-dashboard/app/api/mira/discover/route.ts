import { NextRequest, NextResponse } from "next/server";
import { authorizeMira } from "@/lib/miraAuth";
import { fetchPipelines, searchOpportunities, fetchUsers, type GhlOpportunityRaw } from "@/lib/ghlClient";

function extractFieldPaths(obj: Record<string, unknown>, prefix = ""): string[] {
  const paths: string[] = [];
  for (const [key, value] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key;
    paths.push(path);
    if (value && typeof value === "object" && !Array.isArray(value)) {
      paths.push(...extractFieldPaths(value as Record<string, unknown>, path));
    }
  }
  return paths;
}

export async function POST(request: NextRequest) {
  const authError = authorizeMira(request);
  if (authError) return authError;

  const body = await request.json().catch(() => ({}));
  const apiKey = body?.apiKey;
  if (!apiKey) return NextResponse.json({ error: "apiKey required" }, { status: 400 });

  const [pipelines, sampleOpps, users] = await Promise.all([
    fetchPipelines(apiKey),
    searchOpportunities(apiKey),
    fetchUsers(apiKey),
  ]);

  const availableFieldPaths =
    sampleOpps.length > 0 ? extractFieldPaths(sampleOpps[0] as Record<string, unknown>) : [];

  return NextResponse.json({
    pipelines,
    sampleOpportunities: sampleOpps.slice(0, 20),
    availableFieldPaths,
    ghlUsers: users,
  });
}
