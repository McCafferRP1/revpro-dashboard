import Link from "next/link";
import { getClientConfig, hydrateSettings } from "@/lib/funnel/mockData";
import { notFound } from "next/navigation";
import { ClientTabs } from "./ClientTabs";

export default async function ClientLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;
  await hydrateSettings();
  const config = getClientConfig(clientId);
  if (!config) notFound();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4">
        <Link href="/dashboard" className="text-sm text-[var(--muted)] hover:text-[var(--foreground)]">
          ← Portfolio
        </Link>
        <span className="text-[var(--muted)]">/</span>
        <h1 className="text-xl font-semibold text-[var(--foreground)]">{config.clientName}</h1>
        <ClientTabs clientId={clientId} />
      </div>
      {children}
    </div>
  );
}
