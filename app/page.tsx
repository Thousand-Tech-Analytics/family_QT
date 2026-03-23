"use client";

import Link from "next/link";
import { DevDataSourceIndicator } from "@/components/dev-data-source-indicator";
import { EntryCard } from "@/components/entry-card";
import { PageHeader } from "@/components/page-header";
import { SectionTitle } from "@/components/section-title";
import { Card } from "@/components/ui/card";
import { getFamilyStatusTone, getTodayDateLabel } from "@/lib/format";
import {
  getMockHomePageData,
  getViewerContext,
  loadHomePageData,
  shouldUseAppsScriptRuntime,
} from "@/lib/repositories/family-qt-repository";
import { useRuntimePageData } from "@/lib/repositories/use-runtime-page-data";

export default function HomePage() {
  const viewer = getViewerContext();
  const initialData = getMockHomePageData(viewer.localDate);
  const { data: homePageData, meta } = useRuntimePageData({
    initialData,
    load: () => loadHomePageData(viewer.localDate),
    enabled: shouldUseAppsScriptRuntime(),
    reloadKey: viewer.localDate,
  });
  const todayLabel = getTodayDateLabel(homePageData.viewer.localDate);

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="가족 QT"
        title="오늘도 조용히 함께 묵상해요"
        description="오늘의 본문을 확인하고, 가족의 나눔을 천천히 읽어보세요."
        action={
          homePageData.viewer.isAdmin ? (
            <Link
              href="/admin/passages"
              className="inline-flex h-10 items-center rounded-full border border-line px-4 text-sm font-medium text-muted transition hover:border-accent hover:text-accent"
            >
              관리자 일정
            </Link>
          ) : null
        }
      />

      <Card className="space-y-4 bg-card-strong">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-muted">오늘 날짜</p>
            <h2 className="mt-1 text-2xl font-bold">{todayLabel}</h2>
          </div>
          <span className="rounded-full bg-accent-soft px-3 py-1 text-xs font-semibold text-accent">
            {homePageData.viewer.timezone}
          </span>
        </div>
        <div className="rounded-3xl border border-line/80 bg-white/70 px-4 py-4">
          <p className="text-sm text-muted">오늘의 본문</p>
          <p className="mt-2 text-2xl font-bold">{homePageData.todayPassage.reference}</p>
          <p className="mt-2 text-sm leading-6 text-muted">
            관리자가 입력한 reference만 표시합니다. 본문 원문은 V1에서 불러오지 않습니다.
          </p>
        </div>
      </Card>

      <Card className="space-y-4">
        <SectionTitle
          title="가족 상태"
          description="경쟁 없이, 오늘 어디쯤 와 있는지만 담백하게 살펴봐요."
        />
        <div className="space-y-3">
          {homePageData.familyStatus.map((member) => {
            const tone = getFamilyStatusTone(member.status);

            return (
              <div
                key={member.userId}
                className="flex items-center justify-between rounded-2xl border border-line/70 bg-white/70 px-4 py-3"
              >
                <div>
                  <p className="font-semibold">{member.name}</p>
                  <p className="text-sm text-muted">{member.note}</p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${tone.className}`}
                >
                  {tone.label}
                </span>
              </div>
            );
          })}
        </div>
      </Card>

      <Card className="space-y-4 bg-[linear-gradient(135deg,rgba(143,106,75,0.12),rgba(255,255,255,0.7))]">
        <SectionTitle
          title="오늘의 나눔"
          description="부담 없이 짧게라도 적어두면, 오늘의 마음이 또렷해져요."
        />
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href="/write"
            className="inline-flex h-12 items-center justify-center rounded-2xl bg-accent px-5 text-sm font-semibold text-white transition hover:opacity-90"
          >
            {homePageData.myEntryStatus === "draft" ? "오늘 나눔 이어쓰기" : "오늘 나눔 쓰기"}
          </Link>
          <Link
            href={`/entry?id=${encodeURIComponent(homePageData.myEntryId)}`}
            className="inline-flex h-12 items-center justify-center rounded-2xl border border-line bg-white/80 px-5 text-sm font-semibold text-foreground transition hover:border-accent"
          >
            내 글 보기
          </Link>
        </div>
      </Card>

      <section className="space-y-4">
        <SectionTitle
          title="오늘의 가족 피드"
          description="가족이 남긴 오늘의 나눔을 차분한 카드로 모아봤어요."
        />
        <div className="space-y-4">
          {homePageData.todayFeed.map((entry) => (
            <EntryCard key={entry.id} entry={entry} />
          ))}
        </div>
      </section>

      <DevDataSourceIndicator source={meta.source} error={meta.error} />
    </div>
  );
}
