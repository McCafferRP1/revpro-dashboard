import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { SignOutButton } from "./SignOutButton";

export default async function DashboardLayout({
  children,
}: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const role = (session.user as { role?: string }).role;

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="bg-white border-b border-zinc-200 px-6 py-4 flex items-center justify-between">
        <Link href="/dashboard" className="font-semibold text-zinc-900">
          Sales Metrics
        </Link>
        <nav className="flex gap-6">
          <Link href="/dashboard" className="text-zinc-600 hover:text-zinc-900">
            Dashboard
          </Link>
          {role === "admin" && (
            <>
              <Link href="/dashboard/clients" className="text-zinc-600 hover:text-zinc-900">
                Clients
              </Link>
              <Link href="/dashboard/reps" className="text-zinc-600 hover:text-zinc-900">
                Reps
              </Link>
              <Link href="/dashboard/connections" className="text-zinc-600 hover:text-zinc-900">
                Connections
              </Link>
            </>
          )}
          <Link href="/dashboard/deals" className="text-zinc-600 hover:text-zinc-900">
            Deals
          </Link>
          <Link href="/dashboard/reports" className="text-zinc-600 hover:text-zinc-900">
            Reports
          </Link>
          <SignOutButton />
        </nav>
      </header>
      <main className="p-6">{children}</main>
    </div>
  );
}
