import { getSession, getUsers } from "@/lib/auth";
import { getClientConfig, getRepsForClient, getAccountManagers } from "@/lib/funnel/mockData";
import { getIntegration, getFieldMappings } from "@/lib/funnel/integrations";
import { getDiscoveryCached } from "@/lib/funnel/ghlDiscovery";
import { RepManager } from "./RepManager";
import { AccountManagerSelect } from "./AccountManagerSelect";
import { ClientReportLogo } from "./ClientReportLogo";
import { ClientIntegrationsSection } from "./ClientIntegrationsSection";

export default async function ClientSettingsPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;
  const config = getClientConfig(clientId);
  if (!config) {
    return (
      <div className="p-6">
        <p className="text-[var(--muted)]">Client not found.</p>
      </div>
    );
  }

  const reps = getRepsForClient(clientId);
  const users = await getUsers();
  const accountManagers = getAccountManagers(users);
  const session = await getSession();
  const isAdministrator = session?.isAdministrator ?? false;
  const ghl = getIntegration(clientId, "ghl");
  const ghlMappings = getFieldMappings(clientId, "ghl");
  const initialDiscovery = getDiscoveryCached(clientId);

  return (
    <div className="space-y-6">
      <p className="text-[var(--muted)]">
        Manage account manager, reps, and roles for {config.clientName}. The account manager drives how this client appears on the portfolio (filter by AM). Reps are siloed per client; role (Setter vs Closer) controls which KPIs they see.
      </p>

      <AccountManagerSelect
        clientId={clientId}
        currentId={config.accountManagerId}
        currentName={config.accountManagerName}
        accountManagers={accountManagers}
      />

      <ClientReportLogo clientId={clientId} currentLogoUrl={config.reportLogoUrl} />

      <ClientIntegrationsSection
        clientId={clientId}
        initialGhl={ghl}
        initialGhlPipelineId={config.ghlPipelineId ?? ""}
        initialMappings={ghlMappings}
        initialDiscovery={initialDiscovery}
        isAdministrator={isAdministrator}
      />

      <RepManager clientId={clientId} reps={reps} />
    </div>
  );
}
