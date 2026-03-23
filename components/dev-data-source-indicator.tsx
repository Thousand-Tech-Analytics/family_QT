"use client";

import { hasAppsScriptPublicUrl } from "@/lib/repositories/apps-script-source";
import type { ReadMeta } from "@/lib/repositories/types";

type DevDataSourceIndicatorProps = ReadMeta & {
  writeError?: string | null;
};

export function DevDataSourceIndicator({
  source,
  error,
  writeError,
}: DevDataSourceIndicatorProps) {
  const hasUrl = hasAppsScriptPublicUrl();

  return (
    <div className="fixed bottom-24 right-4 z-30 max-w-[260px] rounded-2xl border border-line bg-[rgba(255,251,245,0.94)] px-3 py-3 text-[11px] font-semibold text-muted shadow-[0_10px_24px_rgba(78,57,39,0.12)] backdrop-blur">
      <p>hosting: github-pages</p>
      <p>apps script url present: {hasUrl ? "yes" : "no"}</p>
      <p>data source: {source}</p>
      <p>remote fetch failed: {error ? "yes" : "no"}</p>
      <p>remote write failed: {writeError ? "yes" : "no"}</p>
    </div>
  );
}
