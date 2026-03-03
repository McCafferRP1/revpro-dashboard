import Link from "next/link";
import { getSession } from "@/lib/auth";
import { DashboardNav } from "./DashboardNav";

export default async function DashboardLayout({
  children,
}: { children: React.ReactNode }) {
  const session = await getSession();
  const isAdministrator = session?.isAdministrator ?? false;

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <header className="bg-[var(--card)] border-b border-[var(--card-border)] px-6 py-4 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-3 font-semibold text-[var(--foreground)]">
          <img src={`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/revpro-logo.svg`} alt="RevPro" className="h-8 w-auto" width={120} height={32} />
        </Link>
        <DashboardNav isAdministrator={isAdministrator} userName={session?.name ?? null} />
      </header>
      <main className="p-6">{children}</main>
    </div>
  );
}
