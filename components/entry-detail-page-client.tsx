"use client";

import Link from "next/link";
import type { FormEvent } from "react";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { DevDataSourceIndicator } from "@/components/dev-data-source-indicator";
import { PageHeader } from "@/components/page-header";
import { SectionTitle } from "@/components/section-title";
import { Card } from "@/components/ui/card";
import {
  addReply,
  getViewerContext,
  loadEntryDetailPageData,
  shouldUseAppsScriptRuntime,
} from "@/lib/repositories/family-qt-repository";
import { useRuntimePageData } from "@/lib/repositories/use-runtime-page-data";

export function EntryDetailPageClient() {
  const searchParams = useSearchParams();
  const entryId = searchParams.get("id");
  const viewer = getViewerContext();
  const { data: entry, meta, isLoading, reload } = useRuntimePageData({
    initialData: null,
    load: () =>
      entryId
        ? loadEntryDetailPageData(entryId)
        : Promise.resolve({ data: null, meta: { source: "apps-script", error: null } }),
    enabled: shouldUseAppsScriptRuntime() && Boolean(entryId),
    reloadKey: entryId ?? "missing-entry-id",
  });
  const hasRemoteError = meta.source === "apps-script" && Boolean(meta.error);
  const [replyBody, setReplyBody] = useState("");
  const [replyError, setReplyError] = useState<string | null>(null);
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);

  if (isLoading) {
    return (
      <div className="space-y-5">
        <Card className="space-y-4 text-center">
          <p className="text-sm text-muted">나눔을 불러오는 중입니다.</p>
          <h1 className="text-2xl font-bold">잠시만 기다려 주세요</h1>
        </Card>
        <DevDataSourceIndicator source={meta.source} error={meta.error} writeError={replyError} />
      </div>
    );
  }

  if (!entryId || !entry) {
    return (
      <div className="space-y-5">
        <Card className="space-y-4 text-center">
          <p className="text-sm text-muted">
            {hasRemoteError ? "Apps Script 데이터를 읽지 못했어요." : "찾을 수 없는 나눔입니다."}
          </p>
          <h1 className="text-2xl font-bold">
            {hasRemoteError ? "요청한 글을 불러오지 못했어요" : "요청한 글이 아직 준비되지 않았어요"}
          </h1>
          <p className="text-sm leading-6 text-muted">
            {hasRemoteError
              ? meta.error
              : "링크가 잘못되었거나, Apps Script에서 아직 데이터를 읽지 못했을 수 있습니다."}
          </p>
          <Link
            href="/"
            className="inline-flex h-12 items-center justify-center rounded-2xl bg-accent px-5 text-sm font-semibold text-white"
          >
            홈으로 돌아가기
          </Link>
        </Card>
        <DevDataSourceIndicator source={meta.source} error={meta.error} writeError={replyError} />
      </div>
    );
  }

  const currentEntry = entry;

  async function handleReplySubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setReplyError(null);

    if (!replyBody.trim()) {
      setReplyError("답글을 적은 뒤 등록해 주세요.");
      return;
    }

    setIsSubmittingReply(true);

    try {
      await addReply({
        entryId: currentEntry.id,
        authorId: viewer.id,
        body: replyBody.trim(),
      });
      setReplyBody("");
      reload();
    } catch (error) {
      setReplyError(error instanceof Error ? error.message : "답글 저장 중 오류가 발생했어요.");
    } finally {
      setIsSubmittingReply(false);
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="나눔 상세"
        title={`${currentEntry.author.name}님의 오늘 나눔`}
        description={`${currentEntry.localDate} · ${currentEntry.passageReference}`}
      />

      <Card className="space-y-5 bg-card-strong">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-lg font-bold">{currentEntry.author.name}</p>
            <p className="mt-1 text-sm text-muted">{currentEntry.createdTimeLabel}</p>
          </div>
          <span className="rounded-full bg-accent-soft px-3 py-1 text-xs font-semibold text-accent">
            snapshot
          </span>
        </div>

        <div className="rounded-3xl border border-line/70 bg-white/80 px-4 py-4">
          <p className="text-sm text-muted">본문 reference</p>
          <p className="mt-2 text-xl font-bold">{currentEntry.passageReference}</p>
        </div>

        <div className="space-y-4 text-[15px] leading-7">
          <div>
            <p className="text-sm font-semibold text-muted">마음에 남은 한 줄</p>
            <p className="mt-2">{currentEntry.memorableLine || "아직 적어둔 한 줄이 없어요."}</p>
          </div>
          <div>
            <p className="text-sm font-semibold text-muted">오늘의 나눔</p>
            <p className="mt-2 whitespace-pre-line">{currentEntry.reflection}</p>
          </div>
          <div>
            <p className="text-sm font-semibold text-muted">적용 · 기도제목</p>
            <p className="mt-2 whitespace-pre-line">
              {currentEntry.application || "오늘은 적용 · 기도제목을 비워두었어요."}
            </p>
          </div>
        </div>
      </Card>

      <Card className="space-y-4">
        <SectionTitle
          title={`답글 ${currentEntry.replies.length}개`}
          description="V1에서는 게시글 아래 1단계 답글만 보입니다."
        />

        <div className="space-y-3">
          {currentEntry.replies.slice(0, 2).map((reply) => (
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

      {replyError ? (
        <Card className="border-accent/20 bg-[rgba(143,106,75,0.08)] text-sm leading-6 text-muted">
          답글 저장에 실패했어요.
          <br />
          {replyError}
        </Card>
      ) : null}

      <Card as="form" className="space-y-4" onSubmit={(event) => void handleReplySubmit(event)}>
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
            value={replyBody}
            onChange={(event) => setReplyBody(event.target.value)}
            placeholder="읽으며 떠오른 위로, 감사, 기도를 짧게 남겨보세요"
            className="min-h-28 w-full rounded-3xl border border-line bg-white/85 px-4 py-4 outline-none transition focus:border-accent"
          />
        </div>
        <button
          type="submit"
          disabled={isSubmittingReply}
          className="inline-flex h-12 items-center justify-center rounded-2xl bg-accent px-5 text-sm font-semibold text-white transition hover:opacity-90"
        >
          {isSubmittingReply ? "답글 저장 중..." : "답글 남기기"}
        </button>
      </Card>

      <DevDataSourceIndicator source={meta.source} error={meta.error} writeError={replyError} />
    </div>
  );
}
