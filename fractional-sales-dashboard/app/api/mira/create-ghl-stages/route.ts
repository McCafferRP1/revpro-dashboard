import { NextRequest, NextResponse } from "next/server";
import { authorizeMira } from "@/lib/miraAuth";
import { createPipelineStage } from "@/lib/ghlClient";

export async function POST(request: NextRequest) {
  const authError = authorizeMira(request);
  if (authError) return authError;

  const body = await request.json().catch(() => ({}));
  const { apiKey, pipelineId, stages } = body;

  if (!apiKey || !pipelineId || !Array.isArray(stages) || stages.length === 0) {
    return NextResponse.json(
      { error: "apiKey, pipelineId, and stages (array) required" },
      { status: 400 }
    );
  }

  const created: { id: string; name: string }[] = [];
  const errors: string[] = [];

  for (const stage of stages) {
    const name = stage?.name;
    if (!name) {
      errors.push("Stage name required");
      continue;
    }
    const result = await createPipelineStage(apiKey, pipelineId, { name });
    if (result) created.push({ id: result.id, name: result.name });
    else errors.push(`Failed to create stage: ${name}`);
  }

  return NextResponse.json({ created, errors });
}
