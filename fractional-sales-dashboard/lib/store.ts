/**
 * Single persistence layer for all app-entered data (settings, users, GHL keys).
 * Production (Netlify): DATABASE_URL required. If missing, layout shows setup page; store does not use in-memory.
 * Development: DATABASE_URL optional; fallback to local file .revpro-data.json.
 */

import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";

const FILE_PATH = path.join(process.cwd(), ".revpro-data.json");

export type StoreKey = "settings" | "users" | "ghl_keys";

export function isNetlify(): boolean {
  return process.env.NETLIFY === "true";
}

/** True if the app can persist data (DB in production, DB or file in dev). */
export function storeRequiresDatabase(): boolean {
  return isNetlify() && !process.env.DATABASE_URL?.trim();
}

async function loadFile(): Promise<Record<string, string>> {
  try {
    const raw = await readFile(FILE_PATH, "utf-8");
    return JSON.parse(raw) as Record<string, string>;
  } catch {
    return {};
  }
}

async function saveFile(data: Record<string, string>): Promise<void> {
  await writeFile(FILE_PATH, JSON.stringify(data, null, 2), "utf-8");
}

async function ensureDir(): Promise<void> {
  const dir = path.dirname(FILE_PATH);
  try {
    await mkdir(dir, { recursive: true });
  } catch {
    // dir may already exist
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/** Get a value by key. Returns null if missing or on error. Retries once on failure (helps with Neon cold start). */
export async function storeGet(key: StoreKey): Promise<string | null> {
  const url = process.env.DATABASE_URL;
  if (url?.trim()) {
    const attempt = async (): Promise<string | null> => {
      const { Pool } = await import("pg");
      const pool = new Pool({ connectionString: url });
      try {
        const res = await pool.query(
          "SELECT value FROM revpro_kv WHERE key = $1",
          [key]
        );
        const row = res.rows[0];
        if (row?.value == null) return null;
        return typeof row.value === "string" ? row.value : JSON.stringify(row.value);
      } finally {
        await pool.end();
      }
    };
    try {
      return await attempt();
    } catch {
      try {
        await delay(1800);
        return await attempt();
      } catch {
        return null;
      }
    }
  }
  if (storeRequiresDatabase()) {
    return null;
  }
  const data = await loadFile();
  return data[key] ?? null;
}

/** Set a value by key. Throws on failure (except Netlify in-memory fallback). */
export async function storeSet(key: StoreKey, value: string): Promise<void> {
  const url = process.env.DATABASE_URL;
  if (url?.trim()) {
    try {
      const { Pool } = await import("pg");
      const pool = new Pool({ connectionString: url });
      try {
        await pool.query(
          `INSERT INTO revpro_kv (key, value) VALUES ($1, $2::jsonb)
           ON CONFLICT (key) DO UPDATE SET value = $2::jsonb`,
          [key, value] as [string, string]
        );
        return;
      } finally {
        await pool.end();
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Database write failed";
      throw new Error(`Store could not save (${msg}). Check DATABASE_URL.`);
    }
  }
  if (storeRequiresDatabase()) {
    throw new Error(
      "DATABASE_URL is required in production. Set it in Netlify Environment Variables and redeploy."
    );
  }
  await ensureDir();
  const data = await loadFile();
  data[key] = value;
  try {
    await saveFile(data);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "File write failed";
    throw new Error(`Store could not save (${msg}).`);
  }
}

/** Ensure the Postgres tables exist. Call once at app start or first use when using DATABASE_URL. */
export async function storeInit(): Promise<void> {
  const url = process.env.DATABASE_URL;
  if (!url?.trim()) return;
  try {
    const { Pool } = await import("pg");
    const pool = new Pool({ connectionString: url });
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS revpro_kv (
          key TEXT PRIMARY KEY,
          value JSONB NOT NULL
        )
      `);
      await pool.query(`
        CREATE TABLE IF NOT EXISTS revpro_backups (
          id SERIAL PRIMARY KEY,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          snapshot JSONB NOT NULL
        )
      `);
    } finally {
      await pool.end();
    }
  } catch {
    // tables may already exist or DB not reachable
  }
}

/** Create a backup snapshot (all store keys) and insert into revpro_backups. Call from cron twice daily. */
export async function storeCreateBackup(): Promise<{ id: number; created_at: string } | null> {
  const url = process.env.DATABASE_URL;
  if (!url?.trim()) return null;
  try {
    const snapshot: Record<string, unknown> = {};
    for (const key of ["settings", "users", "ghl_keys"] as StoreKey[]) {
      const raw = await storeGet(key);
      snapshot[key] = raw ? JSON.parse(raw) : null;
    }
    const { Pool } = await import("pg");
    const pool = new Pool({ connectionString: url });
    try {
      const res = await pool.query(
        "INSERT INTO revpro_backups (snapshot) VALUES ($1::jsonb) RETURNING id, created_at",
        [JSON.stringify(snapshot)]
      );
      const row = res.rows[0];
      return row ? { id: row.id, created_at: String(row.created_at) } : null;
    } finally {
      await pool.end();
    }
  } catch {
    return null;
  }
}
