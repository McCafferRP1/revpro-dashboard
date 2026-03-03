import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ConnectionsClient } from "./ConnectionsClient";

export default async function ConnectionsPage({
  searchParams,
}: {
  searchParams: Promise<{ tenantId?: string }>;
}) {
  await requireAdmin();
  const { tenantId } = await searchParams;
  const tenants = await prisma.tenant.findMany({ orderBy: { name: "asc" } });
  const connections = await prisma.connection.findMany({
    where: tenantId ? { tenantId } : {},
    orderBy: { createdAt: "desc" },
    include: { tenant: { select: { id: true, name: true } } },
  });

  return (
    <div>
      <h1 className="text-2xl font-semibold text-zinc-900 mb-6">CRM connections</h1>
      <p className="text-zinc-600 mb-6">
        Associate each connection with a client. One connection per client (GoHighLevel or Close).
      </p>
      <ConnectionsClient
        tenants={tenants}
        connections={connections}
        selectedTenantId={tenantId ?? null}
      />
    </div>
  );
}
