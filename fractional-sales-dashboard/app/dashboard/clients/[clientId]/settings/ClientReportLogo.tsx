"use client";

import { useState } from "react";
import { setReportLogo } from "./actions";

export function ClientReportLogo({
  clientId,
  currentLogoUrl,
}: {
  clientId: string;
  currentLogoUrl: string | undefined;
}) {
  const [url, setUrl] = useState(currentLogoUrl ?? "");
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    await setReportLogo(clientId, url);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-5 shadow-lg">
      <h3 className="text-sm font-semibold text-[var(--foreground)] mb-2">Logo for reports</h3>
      <p className="text-xs text-[var(--muted)] mb-4">
        Optional. Add a URL to this client&apos;s logo (e.g. from your CDN or a direct link). It will appear on reports and exports for this client. Use a transparent or light logo for best results on reports.
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="rounded-lg border border-[var(--card-border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] w-80 max-w-full"
          placeholder="https://example.com/client-logo.svg"
        />
        <button
          type="button"
          onClick={handleSave}
          className="rounded bg-[var(--accent)] text-white px-3 py-2 text-sm font-medium hover:opacity-90"
        >
          {saved ? "Saved" : "Save"}
        </button>
      </div>
      {currentLogoUrl && (
        <p className="text-xs text-[var(--muted)] mt-2">
          Current: <span className="truncate inline-block max-w-[280px] align-bottom" title={currentLogoUrl}>{currentLogoUrl}</span>
        </p>
      )}
    </div>
  );
}
