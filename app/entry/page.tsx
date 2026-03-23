import { Suspense } from "react";
import { EntryDetailPageClient } from "@/components/entry-detail-page-client";

export default function EntryDetailPage() {
  return (
    <Suspense fallback={null}>
      <EntryDetailPageClient />
    </Suspense>
  );
}
