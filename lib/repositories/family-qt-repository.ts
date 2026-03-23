import {
  fetchRemoteEntriesByDate,
  fetchRemoteEntryById,
  fetchRemoteMonthSummary,
  fetchRemotePassageByDate,
  fetchRemoteReplies,
  hasAppsScriptPublicUrl,
  shouldUseAppsScriptRuntime,
  type RemoteEntryRecord,
  type RemoteMonthSummaryRecord,
  type RemotePassageRecord,
  type RemoteReplyRecord,
} from "@/lib/repositories/apps-script-source";
import {
  formatArchiveDateLabel,
  formatTimeLabel,
  sortByCreatedAtDesc,
  sortLocalDatesDesc,
} from "@/lib/format";
import {
  entryRecords,
  familyMembers,
  passageScheduleRecords,
  replyRecords,
  viewerContext,
  viewerDraft,
} from "@/lib/repositories/mock-source";
import type {
  AddReplyPayload,
  AdminPassagePageData,
  ArchivePageData,
  DataSourceKind,
  EntryDetail,
  EntryFeedItem,
  EntryRecord,
  FamilyMember,
  FamilyStatusItem,
  HomePageData,
  MonthSummary,
  PageLoadResult,
  PassageScheduleRecord,
  ReadMeta,
  ReplyItem,
  SaveEntryPayload,
  ViewerContext,
  WritePageData,
} from "@/lib/repositories/types";

function createMeta(source: DataSourceKind, error: string | null = null): ReadMeta {
  return {
    source,
    error,
  };
}

function mergeMeta(...metaList: ReadMeta[]): ReadMeta {
  const error = metaList.find((meta) => meta.error)?.error ?? null;
  const source = metaList.every((meta) => meta.source === "apps-script") ? "apps-script" : "mock";

  return {
    source,
    error,
  };
}

function getFamilyMemberById(id: string) {
  const member = familyMembers.find((item) => item.id === id);

  if (!member) {
    throw new Error(`Unknown family member: ${id}`);
  }

  return member;
}

function findMockPassage(localDate: string): PassageScheduleRecord {
  return (
    passageScheduleRecords.find((item) => item.localDate === localDate) ?? {
      localDate,
      reference: "아직 본문이 준비되지 않았어요.",
    }
  );
}

function getMockReplyCount(entryId: string) {
  return replyRecords.filter((reply) => reply.entryId === entryId).length;
}

function toPassageRecord(record: RemotePassageRecord): PassageScheduleRecord {
  return {
    localDate: record.local_date,
    reference: record.reference,
  };
}

function toMockEntryFeedItem(entry: EntryRecord): EntryFeedItem {
  const author = getFamilyMemberById(entry.authorId);

  return {
    id: entry.id,
    author,
    localDate: entry.localDate,
    createdAtUtc: entry.createdAtUtc,
    createdTimeLabel: formatTimeLabel(entry.createdAtUtc, author.timezone),
    passageReference: entry.passageReferenceSnapshot,
    memorableLine: entry.memorableLine,
    reflection: entry.reflection,
    application: entry.application,
    replyCount: getMockReplyCount(entry.id),
  };
}

function toRemoteEntryFeedItem(entry: RemoteEntryRecord): EntryFeedItem {
  const author = getFamilyMemberById(entry.member_id);

  return {
    id: entry.entry_id,
    author,
    localDate: entry.local_date,
    createdAtUtc: entry.created_at,
    createdTimeLabel: formatTimeLabel(entry.created_at, author.timezone),
    passageReference: entry.passage_reference_snapshot,
    memorableLine: entry.memorable_line ?? "",
    reflection: entry.reflection,
    application: entry.application_or_prayer ?? "",
    replyCount: entry.replyCount ?? 0,
  };
}

function toReplyItem(record: RemoteReplyRecord | (typeof replyRecords)[number]): ReplyItem {
  const authorId = "authorId" in record ? record.authorId : record.member_id;
  const replyId = "id" in record ? record.id : record.reply_id;
  const createdAtUtc = "createdAtUtc" in record ? record.createdAtUtc : record.created_at;
  const author = getFamilyMemberById(authorId);

  return {
    id: replyId,
    author,
    body: record.body,
    createdAtUtc,
    createdTimeLabel: formatTimeLabel(createdAtUtc, author.timezone),
  };
}

function getUnavailablePassage(localDate: string): PassageScheduleRecord {
  return {
    localDate,
    reference: "본문을 불러오지 못했어요.",
  };
}

function shouldAllowMockFallback() {
  return process.env.NODE_ENV !== "production" || !hasAppsScriptPublicUrl();
}

function getMockTodayPassage(localDate: string): PassageScheduleRecord {
  return findMockPassage(localDate);
}

function getMockEntriesByDate(localDate: string): EntryFeedItem[] {
  return entryRecords
    .filter((entry) => entry.localDate === localDate && entry.status === "published")
    .sort(sortByCreatedAtDesc)
    .map(toMockEntryFeedItem);
}

function getMockMonthSummary(month: string): MonthSummary {
  const localDates = Array.from(
    new Set(
      entryRecords
        .filter((entry) => entry.localDate.startsWith(month) && entry.status === "published")
        .map((entry) => entry.localDate),
    ),
  ).sort(sortLocalDatesDesc);

  return {
    month,
    items: localDates.map((localDate) => ({
      localDate,
      dateLabel: formatArchiveDateLabel(localDate),
      entryCount: getMockEntriesByDate(localDate).length,
    })),
  };
}

function getMockReplies(entryId: string): ReplyItem[] {
  return replyRecords
    .filter((reply) => reply.entryId === entryId)
    .sort((left, right) => left.createdAtUtc.localeCompare(right.createdAtUtc))
    .map(toReplyItem);
}

function getMockEntryById(entryId: string): EntryDetail | null {
  const record = entryRecords.find((entry) => entry.id === entryId && entry.status === "published");

  if (!record) {
    return null;
  }

  return {
    ...toMockEntryFeedItem(record),
    replies: getMockReplies(entryId),
  };
}

function buildFamilyStatus(todayFeed: EntryFeedItem[], localDate: string): FamilyStatusItem[] {
  return familyMembers.map((member) => {
    if (member.id === viewerContext.id && viewerDraft.localDate === localDate) {
      return {
        userId: member.id,
        name: member.name,
        status: "draft",
        note: "임시저장한 글이 있어 이어서 쓸 수 있어요.",
      };
    }

    const hasPublishedEntry = todayFeed.some((entry) => entry.author.id === member.id);

    if (hasPublishedEntry) {
      return {
        userId: member.id,
        name: member.name,
        status: "done",
        note: "오늘 나눔을 조용히 남겼어요.",
      };
    }

    if (member.id === "eunseo") {
      return {
        userId: member.id,
        name: member.name,
        status: "pending",
        note: "오늘은 조금 늦게 묵상할 예정이에요.",
      };
    }

    return {
      userId: member.id,
      name: member.name,
      status: "pending",
      note: "아직 시작 전이에요.",
    };
  });
}

async function readPassage(localDate: string): Promise<PageLoadResult<PassageScheduleRecord>> {
  if (!shouldUseAppsScriptRuntime()) {
    return {
      data: getMockTodayPassage(localDate),
      meta: createMeta("mock"),
    };
  }

  const remotePassage = await fetchRemotePassageByDate(localDate);

  if (remotePassage.data) {
    return {
      data: toPassageRecord(remotePassage.data),
      meta: createMeta("apps-script", remotePassage.error),
    };
  }

  if (!shouldAllowMockFallback()) {
    return {
      data: getUnavailablePassage(localDate),
      meta: createMeta("apps-script", remotePassage.error || "Failed to load passage"),
    };
  }

  return {
    data: getMockTodayPassage(localDate),
    meta: createMeta("mock", remotePassage.error),
  };
}

async function readEntriesByDate(localDate: string): Promise<PageLoadResult<EntryFeedItem[]>> {
  if (!shouldUseAppsScriptRuntime()) {
    return {
      data: getMockEntriesByDate(localDate),
      meta: createMeta("mock"),
    };
  }

  const remoteEntries = await fetchRemoteEntriesByDate(localDate);

  if (remoteEntries.data) {
    return {
      data: remoteEntries.data
        .filter((entry) => (entry.status ?? "published") === "published")
        .sort((left, right) => right.created_at.localeCompare(left.created_at))
        .map(toRemoteEntryFeedItem),
      meta: createMeta("apps-script", remoteEntries.error),
    };
  }

  if (!shouldAllowMockFallback()) {
    return {
      data: [],
      meta: createMeta("apps-script", remoteEntries.error || "Failed to load entries"),
    };
  }

  return {
    data: getMockEntriesByDate(localDate),
    meta: createMeta("mock", remoteEntries.error),
  };
}

async function readMonthSummary(month: string): Promise<PageLoadResult<MonthSummary>> {
  if (!shouldUseAppsScriptRuntime()) {
    return {
      data: getMockMonthSummary(month),
      meta: createMeta("mock"),
    };
  }

  const remoteSummary = await fetchRemoteMonthSummary(month);

  if (remoteSummary.data) {
    return {
      data: {
        month,
        items: remoteSummary.data
          .slice()
          .sort((left: RemoteMonthSummaryRecord, right: RemoteMonthSummaryRecord) =>
            sortLocalDatesDesc(left.local_date, right.local_date),
          )
          .map((item) => ({
            localDate: item.local_date,
            dateLabel: formatArchiveDateLabel(item.local_date),
            entryCount: item.entry_count,
          })),
      },
      meta: createMeta("apps-script", remoteSummary.error),
    };
  }

  if (!shouldAllowMockFallback()) {
    return {
      data: {
        month,
        items: [],
      },
      meta: createMeta("apps-script", remoteSummary.error || "Failed to load month summary"),
    };
  }

  return {
    data: getMockMonthSummary(month),
    meta: createMeta("mock", remoteSummary.error),
  };
}

async function readReplies(entryId: string): Promise<PageLoadResult<ReplyItem[]>> {
  if (!shouldUseAppsScriptRuntime()) {
    return {
      data: getMockReplies(entryId),
      meta: createMeta("mock"),
    };
  }

  const remoteReplies = await fetchRemoteReplies(entryId);

  if (remoteReplies.data) {
    return {
      data: remoteReplies.data
        .slice()
        .sort((left, right) => left.created_at.localeCompare(right.created_at))
        .map(toReplyItem),
      meta: createMeta("apps-script", remoteReplies.error),
    };
  }

  if (!shouldAllowMockFallback()) {
    return {
      data: [],
      meta: createMeta("apps-script", remoteReplies.error || "Failed to load replies"),
    };
  }

  return {
    data: getMockReplies(entryId),
    meta: createMeta("mock", remoteReplies.error),
  };
}

async function readEntryById(entryId: string): Promise<PageLoadResult<EntryDetail | null>> {
  if (!shouldUseAppsScriptRuntime()) {
    return {
      data: getMockEntryById(entryId),
      meta: createMeta("mock"),
    };
  }

  const remoteEntry = await fetchRemoteEntryById(entryId);
  const repliesResult = await readReplies(entryId);

  if (remoteEntry.data && (remoteEntry.data.status ?? "published") === "published") {
    return {
      data: {
        ...toRemoteEntryFeedItem(remoteEntry.data),
        replies: repliesResult.data,
      },
      meta: mergeMeta(createMeta("apps-script", remoteEntry.error), repliesResult.meta),
    };
  }

  if (!shouldAllowMockFallback()) {
    return {
      data: null,
      meta: mergeMeta(
        createMeta("apps-script", remoteEntry.error || "Failed to load entry detail"),
        repliesResult.meta,
      ),
    };
  }

  return {
    data: getMockEntryById(entryId),
    meta: mergeMeta(createMeta("mock", remoteEntry.error), repliesResult.meta),
  };
}

export function getViewerContext(): ViewerContext {
  return viewerContext;
}

export function getFamilyMembers(): FamilyMember[] {
  return familyMembers;
}

export function getMockHomePageData(localDate: string): HomePageData {
  const viewer = getViewerContext();
  const todayFeed = getMockEntriesByDate(localDate);
  const myPublishedEntry = todayFeed.find((entry) => entry.author.id === viewer.id);

  return {
    viewer,
    todayPassage: getMockTodayPassage(localDate),
    familyStatus: buildFamilyStatus(todayFeed, localDate),
    myEntryStatus: viewerDraft.localDate === localDate ? "draft" : "published",
    myEntryId: myPublishedEntry?.id ?? "entry-today-jiho",
    todayFeed,
  };
}

export function getMockWritePageData(localDate: string): WritePageData {
  const todayPassage = getMockTodayPassage(localDate);

  return {
    viewer: getViewerContext(),
    todayPassage,
    draft:
      viewerDraft.localDate === localDate
        ? viewerDraft
        : {
            localDate,
            passageReference: todayPassage.reference,
            memorableLine: "",
            reflection: "",
            application: "",
          },
  };
}

export function getMockArchivePageData(month: string): ArchivePageData {
  const summary = getMockMonthSummary(month);

  return {
    month: summary.month,
    groups: summary.items.map((item) => ({
      localDate: item.localDate,
      dateLabel: item.dateLabel,
      items: getMockEntriesByDate(item.localDate),
    })),
  };
}

export function getMockAdminPassagePageData(localDate: string): AdminPassagePageData {
  return {
    viewer: getViewerContext(),
    todayPassage: getMockTodayPassage(localDate),
    recentSchedule: passageScheduleRecords,
  };
}

export function getMockEntryDetailPageData(entryId: string | null) {
  if (!entryId) {
    return null;
  }

  return getMockEntryById(entryId);
}

export async function getTodayPassage(localDate: string): Promise<PassageScheduleRecord> {
  return (await readPassage(localDate)).data;
}

export async function getTodayEntries(localDate: string): Promise<EntryFeedItem[]> {
  return (await readEntriesByDate(localDate)).data;
}

export async function getMonthSummary(month: string): Promise<MonthSummary> {
  return (await readMonthSummary(month)).data;
}

export async function getEntriesByDate(localDate: string): Promise<EntryFeedItem[]> {
  return (await readEntriesByDate(localDate)).data;
}

export async function getReplies(entryId: string): Promise<ReplyItem[]> {
  return (await readReplies(entryId)).data;
}

export async function saveEntry(payload: SaveEntryPayload): Promise<EntryFeedItem> {
  const nextRecord: EntryRecord = {
    id: payload.id ?? `entry-${Date.now()}`,
    authorId: payload.authorId,
    localDate: payload.localDate,
    createdAtUtc: new Date().toISOString(),
    status: payload.status,
    passageReferenceSnapshot: payload.passageReferenceSnapshot,
    memorableLine: payload.memorableLine,
    reflection: payload.reflection,
    application: payload.application,
  };

  const existingIndex = entryRecords.findIndex((entry) => entry.id === nextRecord.id);

  if (existingIndex >= 0) {
    entryRecords[existingIndex] = nextRecord;
  } else {
    entryRecords.push(nextRecord);
  }

  return toMockEntryFeedItem(nextRecord);
}

export async function addReply(payload: AddReplyPayload): Promise<ReplyItem> {
  const nextReply = {
    id: `reply-${Date.now()}`,
    entryId: payload.entryId,
    authorId: payload.authorId,
    body: payload.body,
    createdAtUtc: new Date().toISOString(),
  };

  replyRecords.push(nextReply);

  return toReplyItem(nextReply);
}

export async function getEntryById(entryId: string): Promise<EntryDetail | null> {
  return (await readEntryById(entryId)).data;
}

export async function loadHomePageData(localDate: string): Promise<PageLoadResult<HomePageData>> {
  const viewer = getViewerContext();
  const passageResult = await readPassage(localDate);
  const entriesResult = await readEntriesByDate(localDate);
  const myPublishedEntry = entriesResult.data.find((entry) => entry.author.id === viewer.id);

  return {
    data: {
      viewer,
      todayPassage: passageResult.data,
      familyStatus: buildFamilyStatus(entriesResult.data, localDate),
      myEntryStatus: viewerDraft.localDate === localDate ? "draft" : "published",
      myEntryId: myPublishedEntry?.id ?? "entry-today-jiho",
      todayFeed: entriesResult.data,
    },
    meta: mergeMeta(passageResult.meta, entriesResult.meta),
  };
}

export async function loadWritePageData(localDate: string): Promise<PageLoadResult<WritePageData>> {
  const passageResult = await readPassage(localDate);

  return {
    data: {
      viewer: getViewerContext(),
      todayPassage: passageResult.data,
      draft:
        viewerDraft.localDate === localDate
          ? viewerDraft
          : {
              localDate,
              passageReference: passageResult.data.reference,
              memorableLine: "",
              reflection: "",
              application: "",
            },
    },
    meta: passageResult.meta,
  };
}

export async function loadArchivePageData(month: string): Promise<PageLoadResult<ArchivePageData>> {
  const summaryResult = await readMonthSummary(month);
  const groupResults = await Promise.all(
    summaryResult.data.items.map(async (item) => {
      const entriesResult = await readEntriesByDate(item.localDate);

      return {
        group: {
          localDate: item.localDate,
          dateLabel: item.dateLabel,
          items: entriesResult.data,
        },
        meta: entriesResult.meta,
      };
    }),
  );

  return {
    data: {
      month: summaryResult.data.month,
      groups: groupResults.map((item) => item.group),
    },
    meta: mergeMeta(summaryResult.meta, ...groupResults.map((item) => item.meta)),
  };
}

export async function loadAdminPassagePageData(
  localDate: string,
): Promise<PageLoadResult<AdminPassagePageData>> {
  const passageResult = await readPassage(localDate);

  return {
    data: {
      viewer: getViewerContext(),
      todayPassage: passageResult.data,
      recentSchedule: passageScheduleRecords,
    },
    meta: passageResult.meta,
  };
}

export async function loadEntryDetailPageData(
  entryId: string,
): Promise<PageLoadResult<EntryDetail | null>> {
  return readEntryById(entryId);
}

export { shouldUseAppsScriptRuntime };
