import Link from "next/link";
import type { MockEntry } from "@/lib/mock-data";
import { Card } from "@/components/ui/card";

type EntryCardProps = {
  entry: MockEntry;
};

export function EntryCard({ entry }: EntryCardProps) {
  return (
    <Link href={`/entries/${entry.id}`} className="block">
      <Card className="space-y-4 transition hover:-translate-y-0.5 hover:border-accent/60">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-semibold">{entry.author.name}</p>
            <p className="mt-1 text-sm text-muted">{entry.passageReference}</p>
          </div>
          <span className="text-xs text-muted">{entry.createdTimeLabel}</span>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-semibold text-muted">마음에 남은 한 줄</p>
          <p className="text-base leading-7">
            {entry.memorableLine || "오늘은 본문 전체를 조용히 붙들고 있었어요."}
          </p>
        </div>

        <p className="line-clamp-3 text-sm leading-6 text-muted">{entry.reflection}</p>

        <div className="flex items-center justify-between text-sm text-muted">
          <span>{entry.localDate}</span>
          <span>답글 {entry.replies.length}</span>
        </div>
      </Card>
    </Link>
  );
}
