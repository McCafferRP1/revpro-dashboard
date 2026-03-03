import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession, getUsers } from "@/lib/auth";
import { getClientConfigs, getAccountManagers } from "@/lib/funnel/mockData";
import { ClientsSection } from "./ClientsSection";
import { BrandingSection } from "./BrandingSection";
import { UsersSection } from "./UsersSection";

export const dynamic = "force-dynamic";

export default async function GlobalSettingsPage() {
  const session = await getSession();
  if (!session?.isAdministrator) redirect("/dashboard");

  const clients = getClientConfigs();
  const users = await getUsers();
  const accountManagers = getAccountManagers(users);

  return (
    <div className="space-y-8 max-w-2xl">
      <div className="flex items-center gap-4">
        <Link href="/dashboard" className="text-sm text-[var(--muted)] hover:text-[var(--foreground)]">
          ← Portfolio
        </Link>
        <h1 className="text-xl font-semibold text-[var(--foreground)]">Admin Settings</h1>
      </div>
      <p className="text-sm text-[var(--muted)]">
        Global settings for RevPro: users (role + administrator), branding, and clients. API keys and field mapping are set per client in each client&apos;s Settings tab.
      </p>

      <UsersSection users={users} />
      <BrandingSection />
      <ClientsSection clients={clients} accountManagers={accountManagers} />
    </div>
  );
}
