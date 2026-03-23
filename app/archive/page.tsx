import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { SectionTitle } from "@/components/section-title";
import { Card } from "@/components/ui/card";
import {
  getArchivePageData,
  getViewerContext,
} from "@/lib/repositories/family-qt-repository";

export default async function ArchivePage() {
  const viewer = getViewerContext();
  const archivePageData = await getArchivePageData(viewer.localDate.slice(0, 7));

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="기록 보기"
        title="지나간 나눔을 다시 펼쳐봐요"
        description="V1은 단순한 날짜 그룹 리스트부터 시작합니다."
      />

      <div className="space-y-4">
        {archivePageData.groups.map((group) => (
          <Card key={group.localDate} className="space-y-4">
            <SectionTitle title={group.dateLabel} description={`${group.items.length}개의 나눔`} />
            <div className="space-y-3">
              {group.items.map((entry) => (
                <Link
                  key={entry.id}
                  href={`/entries/${entry.id}`}
                  className="block rounded-2xl border border-line/70 bg-white/75 px-4 py-4 transition hover:border-accent"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{entry.author.name}</p>
                      <p className="mt-1 text-sm text-muted">{entry.passageReference}</p>
                    </div>
                    <span className="text-xs text-muted">{entry.createdTimeLabel}</span>
                  </div>
                  <p className="mt-3 line-clamp-2 text-sm leading-6 text-muted">
                    {entry.reflection}
                  </p>
                </Link>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
