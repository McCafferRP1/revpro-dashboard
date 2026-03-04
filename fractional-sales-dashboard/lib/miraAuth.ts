import { NextRequest, NextResponse } from "next/server";

const MIRA_SECRET = process.env.MIRA_API_SECRET;

export function authorizeMira(req: NextRequest): NextResponse | null {
  if (!MIRA_SECRET) {
    return NextResponse.json({ error: "MIRA_API_SECRET not configured" }, { status: 500 });
  }
  const key = req.headers.get("X-Mira-Key");
  if (key !== MIRA_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}
