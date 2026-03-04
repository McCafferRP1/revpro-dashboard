/**
 * Single persistence layer for all app-entered data (settings, users, GHL keys).
 * Not dependent on Netlify Blobs. Uses:
 * - DATABASE_URL set → Postgres (table revpro_kv). Works on Netlify and anywhere.
 * - DATABASE_URL not set → local JSON file (.revpro-data.json). Works in dev; on serverless
 *   the file is ephemeral, so set DATABASE_URL in production.
 */

import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";

const FILE_PATH = path.join(process.cwd(), ".revpro-data.json");

export type StoreKey = "settings" | "users" | "ghl_keys";

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

/** Get a value by key. Returns null if missing or on error. */
export async function storeGet(key: StoreKey): Promise<string | null> {
  const url = process.env.DATABASE_URL;
  if (url?.trim()) {
    try {
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
    } catch {
      return null;
    }
  }
  const data = await loadFile();
  return data[key] ?? null;
}

/** Set a value by key. Throws on failure. */
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

/** Ensure the Postgres table exists. Call once at app start or first use when using DATABASE_URL. */
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
    } finally {
      await pool.end();
    }
  } catch {
    // table may already exist or DB not reachable
  }
}
