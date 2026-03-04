import { NextRequest, NextResponse } from "next/server";
import { storeCreateBackup } from "@/lib/store";

/**
 * POST /api/backup — Create a full snapshot of the store (settings, users, ghl_keys) into revpro_backups.
 * Call this twice daily from a cron job (e.g. cron-job.org) so you have restorable backups.
 * Protected by BACKUP_SECRET: set in Netlify env, pass as header X-Backup-Secret or Authorization: Bearer <secret>.
 */
export async function POST(request: NextRequest) {
  const secret = process.env.BACKUP_SECRET;
  if (!secret?.trim()) {
    return NextResponse.json(
      { error: "BACKUP_SECRET not configured" },
      { status: 500 }
    );
  }
  const headerSecret =
    request.headers.get("X-Backup-Secret") ??
    request.headers.get("Authorization")?.replace(/^Bearer\s+/i, "");
  if (headerSecret !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const result = await storeCreateBackup();
  if (!result) {
    return NextResponse.json(
      { error: "Backup failed (check DATABASE_URL and store)" },
      { status: 500 }
    );
  }
  return NextResponse.json({
    ok: true,
    backupId: result.id,
    created_at: result.created_at,
  });
}
