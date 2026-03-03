import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { RepsForm } from "./RepsForm";
import { TenantSelect } from "./TenantSelect";

export default async function RepsPage({
  searchParams,
}: {
  searchParams: Promise<{ tenantId?: string }>;
}) {
  await requireAdmin();
  const { tenantId } = await searchParams;
  const tenants = await prisma.tenant.findMany({ orderBy: { name: "asc" } });
  const selectedTenantId = tenantId ?? tenants[0]?.id;
  const reps = selectedTenantId
    ? await prisma.rep.findMany({
        where: { tenantId: selectedTenantId },
        orderBy: { name: "asc" },
      })
    : [];

  return (
    <div>
      <h1 className="text-2xl font-semibold text-zinc-900 mb-6">Reps</h1>
      <TenantSelect selectedTenantId={selectedTenantId ?? ""} tenants={tenants} />
      <RepsForm tenantId={selectedTenantId ?? ""} tenantOptions={tenants} />
      <ul className="mt-6 space-y-2">
        {reps.map((r) => (
          <li
            key={r.id}
            className="flex items-center justify-between p-3 bg-white rounded-lg border border-zinc-200"
          >
            <span className="font-medium text-zinc-900">{r.name}</span>
            {r.email && <span className="text-sm text-zinc-500">{r.email}</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}
