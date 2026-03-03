import { prisma } from "@/lib/prisma";
import type { FunnelStage } from "@prisma/client";

const STAGE_ORDER: FunnelStage[] = [
  "lead_in",
  "meeting_booked",
  "initial_meeting_done",
  "initial_meeting_qualified",
  "second_meeting_booked",
  "closed_won",
  "closed_lost",
];

function stageRank(s: FunnelStage): number {
  const i = STAGE_ORDER.indexOf(s);
  return i === -1 ? 0 : i;
}

export type MetricsResult = {
  leadsIn: number;
  leadsBookedToMeeting: number;
  leadsBookedToMeetingPct: number;
  initialMeetingsQualified: number;
  closeRateQualifiedPct: number;
  secondMeetingsBooked: number;
  closeRateSecondPct: number;
  closedWon: number;
};

export async function computeMetrics(
  tenantId: string,
  year: number,
  month: number
): Promise<MetricsResult> {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0, 23, 59, 59, 999);

  const deals = await prisma.deal.findMany({
    where: {
      tenantId,
      dateCreated: { gte: start, lte: end },
    },
  });

  const leadsIn = deals.length;
  const leadsBookedToMeeting = deals.filter((d) =>
    ["meeting_booked", "initial_meeting_done", "initial_meeting_qualified", "second_meeting_booked", "closed_won", "closed_lost"].includes(d.pipelineStage)
  ).length;
  const leadsBookedToMeetingPct = leadsIn ? (leadsBookedToMeeting / leadsIn) * 100 : 0;

  const initialMeetingsQualified = deals.filter((d) =>
    ["initial_meeting_qualified", "second_meeting_booked", "closed_won", "closed_lost"].includes(d.pipelineStage)
  ).length;

  const closedWonFromQualified = deals.filter(
    (d) =>
      d.pipelineStage === "closed_won" &&
      stageRank(d.pipelineStage) >= stageRank("initial_meeting_qualified")
  ).length;
  const closeRateQualifiedPct = initialMeetingsQualified
    ? (closedWonFromQualified / initialMeetingsQualified) * 100
    : 0;

  const secondMeetingsBooked = deals.filter((d) =>
    ["second_meeting_booked", "closed_won", "closed_lost"].includes(d.pipelineStage)
  ).length;

  const closedWonFromSecond = deals.filter(
    (d) =>
      d.pipelineStage === "closed_won" &&
      stageRank(d.pipelineStage) >= stageRank("second_meeting_booked")
  ).length;
  const closeRateSecondPct = secondMeetingsBooked
    ? (closedWonFromSecond / secondMeetingsBooked) * 100
    : 0;

  const closedWon = deals.filter((d) => d.pipelineStage === "closed_won").length;

  return {
    leadsIn,
    leadsBookedToMeeting,
    leadsBookedToMeetingPct,
    initialMeetingsQualified,
    closeRateQualifiedPct,
    secondMeetingsBooked,
    closeRateSecondPct,
    closedWon,
  };
}
