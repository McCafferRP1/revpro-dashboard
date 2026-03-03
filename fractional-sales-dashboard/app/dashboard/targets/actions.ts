"use server";

import { revalidatePath } from "next/cache";
import { upsertMockTarget } from "@/lib/funnel/mockData";

export async function saveTargetsAction(params: {
  clientId: string;
  year: number;
  month: number;
  leadsIn: number;
  discoveryCalls: number;
  clarityCalls: number;
  closedWonCount: number;
  closedWonValue: number;
  closedWonCashCollected?: number;
}) {
  upsertMockTarget({
    clientId: params.clientId,
    repId: null,
    year: params.year,
    month: params.month,
    leadsIn: params.leadsIn,
    discoveryCalls: params.discoveryCalls,
    clarityCalls: params.clarityCalls,
    closedWonCount: params.closedWonCount,
    closedWonValue: params.closedWonValue,
    closedWonCashCollected: params.closedWonCashCollected,
  });
  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/clients/${params.clientId}/funnel`);
  revalidatePath(`/dashboard/clients/${params.clientId}/targets`);
  revalidatePath(`/dashboard/clients/${params.clientId}/reps`);
  revalidatePath("/dashboard/rep/[repId]", "page");
}
