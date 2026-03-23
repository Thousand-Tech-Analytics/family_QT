"use client";

import type { ReadMeta } from "@/lib/repositories/types";

type DevDataSourceIndicatorProps = ReadMeta;

export function DevDataSourceIndicator({
  source,
  error,
}: DevDataSourceIndicatorProps) {
  if (process.env.NODE_ENV === "production") {
    return null;
  }

  return (
    <div className="fixed bottom-24 right-4 z-30 rounded-full border border-line bg-[rgba(255,251,245,0.92)] px-3 py-2 text-[11px] font-semibold text-muted shadow-[0_10px_24px_rgba(78,57,39,0.12)] backdrop-blur">
      <span>data: {source}</span>
      {error ? <span className="ml-2 text-[10px] text-accent">error</span> : null}
    </div>
  );
}
