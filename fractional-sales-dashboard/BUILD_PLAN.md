# RevPro — Production Build Plan

> Single-instance B2B app for your team: multiple account managers, multiple clients. Data is persistent, backed up, and protected. Built to be reliable at scale.

---

## 1. Goals (confirmed)

- **Production app** — critical for your business, not a test environment.
- **Scale** — multiple account managers, multiple clients; auth is for your team only (no public signup).
- **Persistence** — all app data (clients, users, reps, settings, GHL keys) lives in a database. Nothing relies on Netlify Blobs or in-memory in production.
- **Backups** — you must be able to restore if something goes wrong. No re-entering clients/reps.
- **B2B SaaS reliability** — same quality bar as a product you’d sell, minus multi-tenant onboarding.

---

## 2. Architecture

| Layer | Choice | Notes |
|-------|--------|------|
| **Database** | **Neon Postgres** | You have a free-tier account. All app data (settings, users, GHL keys) stored in Postgres via `DATABASE_URL`. |
| **App hosting** | **Netlify** | Scales fine for a team dashboard. Vercel is equivalent for Next.js; no need to switch unless you prefer it. |
| **Auth** | **Current (session cookie + users in DB)** | Team-only; users added via admin Settings. No signup flow. |
| **Persistence** | **Database required in production** | On Netlify, `DATABASE_URL` must be set. If missing, app shows a setup page instead of running with in-memory data. |

---

## 3. Database (Neon)

- **Connection:** Set `DATABASE_URL` in Netlify (and in local `.env` for dev). Get the connection string from your Neon project (Connection string / connection details).
- **Tables (created by the app):**
  - `revpro_kv` — live data: keys `settings`, `users`, `ghl_keys`.
  - `revpro_backups` — timestamped snapshots of the full store for restore.
- **Neon free tier:** 1-day point-in-time recovery + 1 snapshot. App-level backups (below) add an extra, restorable copy.

---

## 4. Backups (restorable; no re-entering clients/reps)

**Recommendation:**

1. **Neon’s own backups** — Rely on Neon for recovery (1-day PITR on free tier). For longer retention or more snapshots, consider Neon’s paid plan.
2. **App-level backups** — The app writes a full snapshot of the store (settings, users, ghl_keys) into `revpro_backups` on a schedule so you have a restorable copy independent of Neon.
   - **Schedule:** **Twice per day** (e.g. 6:00 and 18:00 UTC) is a good default. More often (e.g. every 6 hours) is fine; “on every save” would work but creates many rows and isn’t necessary for your risk level.
   - **How:** A small backup API route runs a “dump” of all store keys into one JSON blob and inserts a row into `revpro_backups`. An external cron (e.g. cron-job.org, or Netlify scheduled function) calls that route twice daily. No app code runs backup on every button click — keeps the app simple and backup predictable.
   - **Restore:** Manual process (or future admin tool): pick a backup row by time, overwrite live `revpro_kv` from that snapshot. Documented in this repo.

So: **Neon = primary durability + PITR; app-level backups = twice-daily restorable snapshots so you’re 10000% covered.**

---

## 5. Production vs development

| Environment | Store behavior | Backup |
|-------------|-----------------|--------|
| **Production (Netlify)** | **Database only.** If `DATABASE_URL` is missing, the app shows a single “Setup required” page (set `DATABASE_URL` in Netlify env and redeploy). No in-memory fallback so no silent data loss. | Twice-daily cron hits backup API. |
| **Local dev** | If `DATABASE_URL` is set, use Neon. If not, use local file `.revpro-data.json` so you can run without a DB. | Optional: run backup API manually if you want a snapshot. |

---

## 6. What gets built / updated

1. **Require database in production**
   - On Netlify, if `DATABASE_URL` is not set, show a setup page instead of the dashboard. Remove in-memory fallback in production.

2. **Backup table + API**
   - `storeInit()` creates `revpro_backups` (e.g. `id`, `created_at`, `snapshot` JSONB).
   - `POST /api/backup` (protected by `BACKUP_SECRET` or admin session): reads current store (settings, users, ghl_keys), writes one row to `revpro_backups`. Document that a cron job calls this twice per day.

3. **Restore**
   - Document: how to list backups (query `revpro_backups`), how to restore (overwrite `revpro_kv` from a chosen snapshot). Optional later: small admin “Restore from backup” UI.

4. **Docs**
   - README or SETUP.md: Neon project creation, copy `DATABASE_URL` into Netlify, redeploy. Set `BACKUP_SECRET` for the backup endpoint. Configure cron (URL + schedule).

5. **Env vars (production)**
   - `DATABASE_URL` — **required** on Netlify (Neon connection string).
   - `SESSION_SECRET`, `NEXT_PUBLIC_BASE_PATH`, `MIRA_API_SECRET` — as today.
   - `BACKUP_SECRET` — **recommended.** Used to protect `POST /api/backup`. Set to a long random string; your cron job sends it so only you can create backups.

6. **Backup cron (twice daily)**
   - Use a free cron service (e.g. [cron-job.org](https://cron-job.org)) to call your app twice per day.
   - **URL:** `https://your-revpro-site.netlify.app/api/backup` (or `https://www.revpro.io/app/api/backup` if proxied).
   - **Method:** POST.
   - **Header:** `X-Backup-Secret: <your BACKUP_SECRET value>`.
   - **Schedule:** e.g. 6:00 and 18:00 UTC.
   - Each run inserts one row into `revpro_backups` with a full snapshot. Keep a few days’ worth; you can prune old rows in Neon (e.g. delete backups older than 7 days) or leave them.

7. **Restore from a backup**
   - In Neon (or any Postgres client), open the `revpro_backups` table.
   - Find the row you want (by `created_at`).
   - Copy the `snapshot` JSON. It has keys `settings`, `users`, `ghl_keys`.
   - Overwrite the live data: for each key, run something like:
     - `UPDATE revpro_kv SET value = '<snapshot.settings>'::jsonb WHERE key = 'settings';`
     - (and same for `users`, `ghl_keys`), using the corresponding slice of the snapshot.
   - Or: delete rows from `revpro_kv` and insert the three keys from the snapshot. Then redeploy or restart the app so it reloads from the DB.

---

## 8. Netlify vs Vercel

- **Netlify:** Works well, scalable for a team app. You’re already there; no need to change.
- **Vercel:** Same league for Next.js (same company as Next). Slightly tighter Next.js integration; migration is straightforward if you ever want to move.
- **Recommendation:** Stay on Netlify. If you outgrow it or want to consolidate hosting later, you can move the app; the database (Neon) stays the same.

---

## 9. Summary

- **Database:** Neon Postgres, `DATABASE_URL` required in production.
- **Hosting:** Netlify; scalable for your use case.
- **Backups:** Neon PITR + twice-daily app-level snapshots to `revpro_backups` via cron; restorable so you don’t re-enter clients/reps.
- **Auth:** Current team-only auth; users in DB; no signup.
- **Store:** Production = database only; setup page if `DATABASE_URL` missing. Dev = file or DB.

**Implemented:** Setup page when DATABASE_URL missing; backup table + POST /api/backup; restore steps in section 7. “require DATABASE_URL in production + setup page,” then “backup table + API + docs.”
