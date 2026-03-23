"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DevDataSourceIndicator } from "@/components/dev-data-source-indicator";
import { PageHeader } from "@/components/page-header";
import { SectionTitle } from "@/components/section-title";
import { Card } from "@/components/ui/card";
import {
  getInitialWritePageDataForRuntime,
  saveEntry,
  getViewerContext,
  loadWritePageData,
  shouldUseAppsScriptRuntime,
} from "@/lib/repositories/family-qt-repository";
import { useRuntimePageData } from "@/lib/repositories/use-runtime-page-data";

export default function WritePage() {
  const router = useRouter();
  const viewer = getViewerContext();
  const { data: writePageData, meta, reload } = useRuntimePageData({
    initialData: getInitialWritePageDataForRuntime(viewer.localDate),
    load: () => loadWritePageData(viewer.localDate),
    enabled: shouldUseAppsScriptRuntime(),
    reloadKey: viewer.localDate,
  });
  const hasRemoteError = meta.source === "apps-script" && Boolean(meta.error);
  const [entryId, setEntryId] = useState<string | null>(writePageData.entryId);
  const [formValues, setFormValues] = useState({
    memorableLine: writePageData.draft.memorableLine,
    reflection: writePageData.draft.reflection,
    application: writePageData.draft.application,
  });
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitNotice, setSubmitNotice] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isRemoteWriteDisabled = shouldUseAppsScriptRuntime() && hasRemoteError;

  useEffect(() => {
    setEntryId(writePageData.entryId);
    setFormValues({
      memorableLine: writePageData.draft.memorableLine,
      reflection: writePageData.draft.reflection,
      application: writePageData.draft.application,
    });
  }, [writePageData]);

  async function handleSave(status: "draft" | "published") {
    setSubmitError(null);
    setSubmitNotice(null);

    if (status === "published" && !formValues.reflection.trim()) {
      setSubmitError("오늘의 나눔을 적은 뒤 등록해 주세요.");
      return;
    }

    setIsSubmitting(true);

    try {
      const savedEntry = await saveEntry({
        id: entryId ?? undefined,
        authorId: viewer.id,
        localDate: viewer.localDate,
        status,
        passageReferenceSnapshot: writePageData.todayPassage.reference,
        memorableLine: formValues.memorableLine.trim(),
        reflection: formValues.reflection.trim(),
        application: formValues.application.trim(),
      });

      setEntryId(savedEntry.id);

      if (status === "published") {
        router.push(`/entry?id=${encodeURIComponent(savedEntry.id)}`);
        return;
      }

      reload();
      setSubmitNotice("임시저장이 완료되었어요.");
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "저장 중 오류가 발생했어요.");
    } finally {
      setIsSubmitting(false);
    }
  }

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

      {submitError ? (
        <Card className="border-accent/20 bg-[rgba(143,106,75,0.08)] text-sm leading-6 text-muted">
          저장에 실패했어요.
          <br />
          {submitError}
        </Card>
      ) : null}

      {submitNotice ? (
        <Card className="text-sm leading-6 text-muted">{submitNotice}</Card>
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

      <Card
        as="form"
        className="space-y-5"
        onSubmit={(event) => {
          event.preventDefault();
          void handleSave("published");
        }}
      >
        <div className="space-y-2">
          <label htmlFor="memorable-line" className="text-sm font-semibold">
            마음에 남은 한 줄
          </label>
          <input
            id="memorable-line"
            name="memorableLine"
            value={formValues.memorableLine}
            onChange={(event) =>
              setFormValues((current) => ({
                ...current,
                memorableLine: event.target.value,
              }))
            }
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
            value={formValues.reflection}
            onChange={(event) =>
              setFormValues((current) => ({
                ...current,
                reflection: event.target.value,
              }))
            }
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
            value={formValues.application}
            onChange={(event) =>
              setFormValues((current) => ({
                ...current,
                application: event.target.value,
              }))
            }
            placeholder="작은 적용 한 가지나 오늘의 기도제목을 남겨보세요"
            className="min-h-36 w-full rounded-3xl border border-line bg-white/85 px-4 py-4 outline-none transition focus:border-accent"
          />
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => {
              void handleSave("draft");
            }}
            disabled={isSubmitting || isRemoteWriteDisabled}
            className="inline-flex h-12 items-center justify-center rounded-2xl border border-line bg-white px-5 text-sm font-semibold text-foreground transition hover:border-accent"
          >
            {isSubmitting ? "저장 중..." : "임시저장"}
          </button>
          <button
            type="submit"
            disabled={isSubmitting || isRemoteWriteDisabled}
            className="inline-flex h-12 items-center justify-center rounded-2xl bg-accent px-5 text-sm font-semibold text-white transition hover:opacity-90"
          >
            {isSubmitting ? "등록 중..." : "등록하기"}
          </button>
        </div>
      </Card>

      <DevDataSourceIndicator source={meta.source} error={meta.error} writeError={submitError} />
    </div>
  );
}
