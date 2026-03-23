import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { SectionTitle } from "@/components/section-title";
import { Card } from "@/components/ui/card";
import { getEntryById } from "@/lib/mock-data";

type EntryPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EntryDetailPage({ params }: EntryPageProps) {
  const { id } = await params;
  const entry = getEntryById(id);

  if (!entry) {
    notFound();
  }

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="나눔 상세"
        title={`${entry.author.name}님의 오늘 나눔`}
        description={`${entry.localDate} · ${entry.passageReference}`}
      />

      <Card className="space-y-5 bg-card-strong">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-lg font-bold">{entry.author.name}</p>
            <p className="mt-1 text-sm text-muted">{entry.createdTimeLabel}</p>
          </div>
          <span className="rounded-full bg-accent-soft px-3 py-1 text-xs font-semibold text-accent">
            snapshot
          </span>
        </div>

        <div className="rounded-3xl border border-line/70 bg-white/80 px-4 py-4">
          <p className="text-sm text-muted">본문 reference</p>
          <p className="mt-2 text-xl font-bold">{entry.passageReference}</p>
        </div>

        <div className="space-y-4 text-[15px] leading-7">
          <div>
            <p className="text-sm font-semibold text-muted">마음에 남은 한 줄</p>
            <p className="mt-2">{entry.memorableLine || "아직 적어둔 한 줄이 없어요."}</p>
          </div>
          <div>
            <p className="text-sm font-semibold text-muted">오늘의 나눔</p>
            <p className="mt-2 whitespace-pre-line">{entry.reflection}</p>
          </div>
          <div>
            <p className="text-sm font-semibold text-muted">적용 · 기도제목</p>
            <p className="mt-2 whitespace-pre-line">
              {entry.application || "오늘은 적용 · 기도제목을 비워두었어요."}
            </p>
          </div>
        </div>
      </Card>

      <Card className="space-y-4">
        <SectionTitle
          title={`답글 ${entry.replies.length}개`}
          description="V1에서는 게시글 아래 1단계 답글만 보입니다."
        />

        <div className="space-y-3">
          {entry.replies.slice(0, 2).map((reply) => (
            <div
              key={reply.id}
              className="rounded-2xl border border-line/70 bg-white/75 px-4 py-4"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="font-semibold">{reply.author.name}</p>
                <span className="text-xs text-muted">{reply.createdTimeLabel}</span>
              </div>
              <p className="mt-3 text-sm leading-6 text-muted">{reply.body}</p>
            </div>
          ))}
        </div>

        <button
          type="button"
          className="inline-flex h-11 items-center justify-center rounded-2xl border border-dashed border-line bg-white/70 px-4 text-sm font-semibold text-muted"
        >
          답글 더 보기
        </button>
      </Card>

      <Card as="form" className="space-y-4">
        <SectionTitle
          title="답글 남기기"
          description="대화를 길게 끌기보다, 짧고 따뜻한 한마디를 남기는 흐름을 상정했습니다."
        />
        <div className="space-y-2">
          <label htmlFor="reply" className="text-sm font-semibold">
            답글
          </label>
          <textarea
            id="reply"
            placeholder="읽으며 떠오른 위로, 감사, 기도를 짧게 남겨보세요"
            className="min-h-28 w-full rounded-3xl border border-line bg-white/85 px-4 py-4 outline-none transition focus:border-accent"
          />
        </div>
        <button
          type="submit"
          className="inline-flex h-12 items-center justify-center rounded-2xl bg-accent px-5 text-sm font-semibold text-white transition hover:opacity-90"
        >
          답글 남기기
        </button>
      </Card>
    </div>
  );
}
