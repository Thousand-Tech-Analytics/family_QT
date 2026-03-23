"use client";

import { DevDataSourceIndicator } from "@/components/dev-data-source-indicator";
import { PageHeader } from "@/components/page-header";
import { SectionTitle } from "@/components/section-title";
import { Card } from "@/components/ui/card";
import {
  getInitialWritePageDataForRuntime,
  getViewerContext,
  loadWritePageData,
  shouldUseAppsScriptRuntime,
} from "@/lib/repositories/family-qt-repository";
import { useRuntimePageData } from "@/lib/repositories/use-runtime-page-data";

export default function WritePage() {
  const viewer = getViewerContext();
  const { data: writePageData, meta } = useRuntimePageData({
    initialData: getInitialWritePageDataForRuntime(viewer.localDate),
    load: () => loadWritePageData(viewer.localDate),
    enabled: shouldUseAppsScriptRuntime(),
    reloadKey: viewer.localDate,
  });
  const hasRemoteError = meta.source === "apps-script" && Boolean(meta.error);

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="오늘의 기록"
        title="오늘 마음에 남은 것을 적어보세요"
        description="오늘의 본문을 바탕으로 차분히 나눔을 적어보세요."
      />

      {hasRemoteError ? (
        <Card className="border-accent/20 bg-[rgba(143,106,75,0.08)] text-sm leading-6 text-muted">
          오늘의 본문을 Apps Script에서 읽지 못했어요.
          <br />
          {meta.error}
        </Card>
      ) : null}

      <Card className="space-y-4 bg-card-strong">
        <SectionTitle
          title="오늘의 본문"
          description="게시할 때는 이 reference가 snapshot으로 저장될 준비를 갖춘 구조입니다."
        />
        <div className="rounded-3xl border border-line/70 bg-white/80 px-4 py-4">
          <p className="text-sm text-muted">읽기 전용 reference</p>
          <p className="mt-2 text-2xl font-bold">{writePageData.todayPassage.reference}</p>
          <p className="mt-2 text-sm text-muted">
            local date: {writePageData.viewer.localDate}
          </p>
        </div>
      </Card>

      <Card as="form" className="space-y-5">
        <div className="space-y-2">
          <label htmlFor="memorable-line" className="text-sm font-semibold">
            마음에 남은 한 줄
          </label>
          <input
            id="memorable-line"
            name="memorableLine"
            defaultValue={writePageData.draft.memorableLine}
            placeholder="짧게 붙잡고 싶은 문장을 적어보세요"
            className="h-12 w-full rounded-2xl border border-line bg-white/85 px-4 outline-none transition focus:border-accent"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="reflection" className="text-sm font-semibold">
            오늘의 나눔
          </label>
          <textarea
            id="reflection"
            name="reflection"
            defaultValue={writePageData.draft.reflection}
            placeholder="오늘 본문을 통해 어떤 마음이 들었는지 천천히 적어보세요"
            className="min-h-44 w-full rounded-3xl border border-line bg-white/85 px-4 py-4 outline-none transition focus:border-accent"
            required
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="application" className="text-sm font-semibold">
            적용 · 기도제목
          </label>
          <textarea
            id="application"
            name="application"
            defaultValue={writePageData.draft.application}
            placeholder="작은 적용 한 가지나 오늘의 기도제목을 남겨보세요"
            className="min-h-36 w-full rounded-3xl border border-line bg-white/85 px-4 py-4 outline-none transition focus:border-accent"
          />
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            className="inline-flex h-12 items-center justify-center rounded-2xl border border-line bg-white px-5 text-sm font-semibold text-foreground transition hover:border-accent"
          >
            임시저장
          </button>
          <button
            type="submit"
            className="inline-flex h-12 items-center justify-center rounded-2xl bg-accent px-5 text-sm font-semibold text-white transition hover:opacity-90"
          >
            등록하기
          </button>
        </div>
      </Card>

      <DevDataSourceIndicator source={meta.source} error={meta.error} />
    </div>
  );
}
