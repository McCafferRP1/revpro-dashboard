import Image from "next/image";

export function BrandingSection() {
  return (
    <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-5 shadow-lg">
      <h2 className="text-sm font-semibold text-[var(--foreground)] mb-2">Branding</h2>
      <p className="text-xs text-[var(--muted)] mb-4">
        RevPro is the global name used across the app and on all reports. The logo in the header is loaded from <code className="text-[10px] bg-[var(--background)] px-1 rounded">/revpro-logo.svg</code>. Replace that file in the <code className="text-[10px] bg-[var(--background)] px-1 rounded">public</code> folder with your own (SVG recommended; use a transparent or dark-background version so it looks good on the header).
      </p>
      <div className="flex items-center gap-4">
        <div className="relative w-32 h-9 bg-[var(--background)] rounded border border-[var(--card-border)] flex items-center justify-center overflow-hidden">
          <Image src="/revpro-logo.svg" alt="RevPro" width={100} height={24} className="h-6 w-auto" />
        </div>
        <span className="text-sm font-semibold text-[var(--foreground)]">RevPro</span>
      </div>
    </div>
  );
}
