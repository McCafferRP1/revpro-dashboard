import { auth } from "@/auth";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;

  return (
    <div>
      <h1 className="text-2xl font-semibold text-zinc-900 mb-6">Dashboard</h1>
      <p className="text-zinc-600 mb-6">
        Signed in as {session?.user?.email} ({role})
      </p>
      <div className="grid gap-4 sm:grid-cols-2 max-w-2xl">
        <Link
          href="/dashboard/deals"
          className="p-4 rounded-lg border border-zinc-200 bg-white hover:border-blue-300"
        >
          <h2 className="font-medium text-zinc-900">Log a deal</h2>
          <p className="text-sm text-zinc-500">Manual deal / opportunity entry</p>
        </Link>
        <Link
          href="/dashboard/reports"
          className="p-4 rounded-lg border border-zinc-200 bg-white hover:border-blue-300"
        >
          <h2 className="font-medium text-zinc-900">Monthly progress</h2>
          <p className="text-sm text-zinc-500">Metrics vs targets</p>
        </Link>
        {role === "admin" && (
          <>
            <Link
              href="/dashboard/clients"
              className="p-4 rounded-lg border border-zinc-200 bg-white hover:border-blue-300"
            >
              <h2 className="font-medium text-zinc-900">Clients</h2>
              <p className="text-sm text-zinc-500">Tenants and CRM connections</p>
            </Link>
            <Link
              href="/dashboard/reps"
              className="p-4 rounded-lg border border-zinc-200 bg-white hover:border-blue-300"
            >
              <h2 className="font-medium text-zinc-900">Reps</h2>
              <p className="text-sm text-zinc-500">Sales reps per client</p>
            </Link>
            <Link
              href="/dashboard/connections"
              className="p-4 rounded-lg border border-zinc-200 bg-white hover:border-blue-300"
            >
              <h2 className="font-medium text-zinc-900">Connections</h2>
              <p className="text-sm text-zinc-500">CRM connections per client</p>
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
