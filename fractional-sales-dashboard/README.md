# Fractional Sales Dashboard

Standalone app for fractional sales management: standardized reporting across clients with per-client funnel config, MTD/target/pacing, and portfolio view. **Skeleton only** — mock data for Bye Bye Panic (BBP); Go High Level API to be wired later.

## Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), then **Open dashboard**.

## What’s in the skeleton

- **Client funnel** (`/dashboard/funnel`) — BBP’s stages (Lead Capture → … → First Call Close / Follow-up / Closed Lost). KPI tiles with MTD, monthly target, pacing %. Funnel counts, conversion table, per-rep table, deal list.
- **Rep view** (`/dashboard/rep/[repId]`) — Single rep KPIs and vs team (Clay, Whitney, Robyn, Ali).
- **Portfolio** (`/dashboard/portfolio`) — Client health tiles, comparison table, MoM %. No cross-client stage comparison.

## Data

- **Config:** `lib/funnel/bbpConfig.ts` — BBP funnel stages and reps.
- **Mock data:** `lib/funnel/mockData.ts` — Opportunities and monthly targets.
- **Metrics:** `lib/funnel/metrics.ts` — Pacing, conversion, KPIs (same formulas for real data later).

## Next steps

1. Add GHL integration: fetch opportunities/pipelines, map stages via per-client mapping.
2. Replace mock data with API or DB; keep the same types and metric logic.
3. Add more clients with their own funnel config and CRM mapping.
