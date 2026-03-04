export function SetupRequired() {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center p-6">
      <div className="w-full max-w-lg rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-8 shadow-lg text-center">
        <h1 className="text-xl font-semibold text-[var(--foreground)] mb-3">Setup required</h1>
        <p className="text-sm text-[var(--muted)] mb-6">
          RevPro needs a database to store clients, users, and settings. In your Netlify site, set the{" "}
          <strong>DATABASE_URL</strong> environment variable to your Neon (or other Postgres) connection string, then redeploy.
        </p>
        <ol className="text-left text-sm text-[var(--foreground)] list-decimal list-inside space-y-2 mb-6">
          <li>Open your Neon dashboard and copy the connection string for this project.</li>
          <li>In Netlify: Site settings → Environment variables → Add <code className="bg-[var(--background)] px-1 rounded">DATABASE_URL</code>.</li>
          <li>Paste the connection string as the value, then trigger a new deploy.</li>
        </ol>
        <p className="text-xs text-[var(--muted)]">
          See <strong>BUILD_PLAN.md</strong> in the repo for full setup and backup instructions.
        </p>
        <a
          href={`${basePath}/login`}
          className="mt-6 inline-block text-sm text-[var(--accent)] hover:underline"
        >
          ← Back to login
        </a>
      </div>
    </div>
  );
}
