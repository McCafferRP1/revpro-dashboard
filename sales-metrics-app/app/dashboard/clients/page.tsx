import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ClientsForm } from "./ClientsForm";

export default async function ClientsPage() {
  await requireAdmin();
  const tenants = await prisma.tenant.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { reps: true, deals: true } } },
  });

  return (
    <div>
      <h1 className="text-2xl font-semibold text-zinc-900 mb-6">Clients</h1>
      <ClientsForm />
      <ul className="mt-6 space-y-3">
        {tenants.map((t) => (
          <li
            key={t.id}
            className="flex items-center justify-between p-4 bg-white rounded-lg border border-zinc-200"
          >
            <div>
              <span className="font-medium text-zinc-900">{t.name}</span>
              <span className="ml-3 text-sm text-zinc-500">
                {t._count.reps} reps · {t._count.deals} deals
              </span>
            </div>
            <div className="flex gap-4">
              <Link href={`/dashboard/connections?tenantId=${t.id}`} className="text-sm text-blue-600 hover:underline">
                Connections
              </Link>
              <Link href={`/dashboard/reps?tenantId=${t.id}`} className="text-sm text-blue-600 hover:underline">
                Reps
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
