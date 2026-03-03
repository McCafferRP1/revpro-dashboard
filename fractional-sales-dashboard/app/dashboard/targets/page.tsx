import { redirect } from "next/navigation";
import { getClientConfigs } from "@/lib/funnel/mockData";

export default async function TargetsPage({
  searchParams,
}: {
  searchParams: Promise<{ clientId?: string }>;
}) {
  const params = await searchParams;
  const clientId = params.clientId ?? getClientConfigs()[0]?.clientId ?? "bbp";
  redirect(`/dashboard/clients/${clientId}/targets`);
}
