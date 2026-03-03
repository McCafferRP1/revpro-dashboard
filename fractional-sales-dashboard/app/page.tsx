import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--background)] p-8">
      <h1 className="text-3xl font-bold text-[var(--foreground)] mb-2">Fractional Sales Dashboard</h1>
      <p className="text-[var(--muted)] mb-8 text-center max-w-md">
        Standardized reporting for fractional sales management. Skeleton with mock data (Bye Bye Panic); GHL API to be wired later.
      </p>
      <Link
        href="/dashboard"
        className="rounded-full bg-[var(--accent)] px-6 py-3 text-[#0a0a0a] font-semibold hover:opacity-90 transition-opacity"
      >
        Open dashboard
      </Link>
    </div>
  );
}
