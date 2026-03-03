import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getTenantIdOrThrow } from "@/lib/auth";
import { DealForm } from "./DealForm";
import { DealsList } from "./DealsList";

export default async function DealsPage({
  searchParams,
}: {
  searchParams: Promise<{ tenantId?: string }>;
}) {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  const tenantIdParam = (await searchParams).tenantId ?? null;
  const tenantId = await getTenantIdOrThrow(role === "admin" ? tenantIdParam : null);
  const tenants = role === "admin" ? await prisma.tenant.findMany({ orderBy: { name: "asc" } }) : [];
  const reps = await prisma.rep.findMany({
    where: { tenantId },
    orderBy: { name: "asc" },
  });
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });

  return (
    <div>
      <h1 className="text-2xl font-semibold text-zinc-900 mb-6">Deals</h1>
      {role === "admin" && tenants.length > 1 && (
        <div className="mb-4">
          <DealTenantSelect tenants={tenants} selectedTenantId={tenantId} />
        </div>
      )}
      <p className="text-zinc-600 mb-4">
        Client: <strong>{tenant?.name}</strong>
      </p>
      <DealForm tenantId={tenantId} reps={reps} />
      <DealsList tenantId={tenantId} />
    </div>
  );
}
