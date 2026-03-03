import type { ClientFunnelConfig } from "./types";

/**
 * Bye Bye Panic pipeline stages.
 * - Discovery: Scheduled → Not Complete (catch-all: no-show, not qualified, etc.) or → Clarity Scheduled.
 * - Clarity: Scheduled → Confirmed (setter confirmed) → then Not Complete or Complete. Win rate = Closed Won / Clarity Call Complete.
 */
/** Primary stages to show in funnel/conversion (success path + outcomes; skip Not Complete for cleaner viz). */
const BBP_PRIMARY_STAGES = [1, 3, 4, 6, 7, 8, 9];

export const bbpFunnelConfig: ClientFunnelConfig = {
  clientId: "bbp",
  clientName: "Bye Bye Panic",
  accountManagerId: "matt",
  accountManagerName: "Matt",
  stages: [
    { order: 1, displayName: "Discovery Call Scheduled" },
    { order: 2, displayName: "Discovery Call Not Complete" },
    { order: 3, displayName: "Clarity Call Scheduled" },
    { order: 4, displayName: "Clarity Call Confirmed" },
    { order: 5, displayName: "Clarity Call Not Complete" },
    { order: 6, displayName: "Clarity Call Complete" },
    { order: 7, displayName: "Follow-up Scheduled" },
    { order: 8, displayName: "Closed Won", outcome: "won" },
    { order: 9, displayName: "Closed Lost", outcome: "lost" },
  ],
  primaryStageOrders: BBP_PRIMARY_STAGES,
  kpiMetricKeys: [
    "leadsIn",
    "discoveryScheduled",
    "discoveryCompleteRate",
    "clarityScheduledConfirmed",
    "clarityCompleteRate",
    "closedWonCount",
    "closedWonValue",
    "closedWonCashCollected",
    "winRate",
    "avgDealSize",
    "avgCycleDays",
  ],
};

export const bbpReps = [
  { id: "bbp-clay", name: "Clay" },
  { id: "bbp-whitney", name: "Whitney" },
  { id: "bbp-robyn", name: "Robyn" },
  { id: "bbp-ali", name: "Ali" },
];
