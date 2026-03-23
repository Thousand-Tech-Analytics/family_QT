import {
  fetchRemoteEntriesByDate,
  fetchRemoteEntryById,
  fetchRemoteMonthSummary,
  fetchRemotePassageByDate,
  fetchRemoteReplies,
  hasAppsScriptPublicUrl,
  saveRemoteEntry,
  saveRemoteReply,
  shouldUseAppsScriptRuntime,
  type RemoteEntryRecord,
  type RemoteMonthSummaryRecord,
  type RemotePassageRecord,
  type RemoteReplyRecord,
} from "@/lib/repositories/apps-script-source";
import { formatArchiveDateLabel, formatTimeLabel, sortLocalDatesDesc } from "@/lib/format";
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

type StoredEntryRecord = {
  id: string;
  memberId: string;
  localDate: string;
  createdAtUtc: string;
  status: "draft" | "published";
  passageReferenceSnapshot: string;
  memorableLine: string;
  reflection: string;
  application: string;
  replyCount: number;
};

function createMeta(source: DataSourceKind, error: string | null = null): ReadMeta {
  return {
    source,
    error,
  };
}

function debugFallback(reason: string, details?: Record<string, string | boolean | null>) {
  if (process.env.NODE_ENV !== "development") {
    return;
  }

  console.info("[repository] fallback decision", {
    reason,
    ...details,
  });
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

function getVisibleFamilyMembers() {
  if (shouldUseAppsScriptRuntime()) {
    return familyMembers.filter((member) => member.id !== "eunseo");
  }

  return familyMembers;
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

function toStoredRemoteEntryRecord(entry: RemoteEntryRecord): StoredEntryRecord {
  return {
    id: entry.entry_id,
    memberId: entry.member_id,
    localDate: entry.local_date,
    createdAtUtc: entry.created_at,
    status: entry.status ?? "published",
    passageReferenceSnapshot: entry.passage_reference_snapshot,
    memorableLine: entry.memorable_line ?? "",
    reflection: entry.reflection,
    application: entry.application_or_prayer ?? "",
    replyCount: entry.replyCount ?? 0,
  };
}

function toStoredMockEntryRecord(entry: EntryRecord): StoredEntryRecord {
  return {
    id: entry.id,
    memberId: entry.authorId,
    localDate: entry.localDate,
    createdAtUtc: entry.createdAtUtc,
    status: entry.status,
    passageReferenceSnapshot: entry.passageReferenceSnapshot,
    memorableLine: entry.memorableLine,
    reflection: entry.reflection,
    application: entry.application,
    replyCount: getMockReplyCount(entry.id),
  };
}

function toEntryFeedItem(entry: StoredEntryRecord): EntryFeedItem {
  const author = getFamilyMemberById(entry.memberId);

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
    replyCount: entry.replyCount,
  };
}

function toMockEntryFeedItem(entry: EntryRecord): EntryFeedItem {
  return toEntryFeedItem(toStoredMockEntryRecord(entry));
}

function toRemoteEntryFeedItem(entry: RemoteEntryRecord): EntryFeedItem {
  return toEntryFeedItem(toStoredRemoteEntryRecord(entry));
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

function getInitialPassage(localDate: string): PassageScheduleRecord {
  return {
    localDate,
    reference: "본문을 불러오는 중이에요.",
  };
}

function getLatestEntryForMember(records: StoredEntryRecord[], memberId: string) {
  return (
    records
      .filter((entry) => entry.memberId === memberId)
      .sort((left, right) => right.createdAtUtc.localeCompare(left.createdAtUtc))[0] ?? null
  );
}

function toPublishedFeed(records: StoredEntryRecord[]) {
  return records
    .filter((entry) => entry.status === "published")
    .sort((left, right) => right.createdAtUtc.localeCompare(left.createdAtUtc))
    .map(toEntryFeedItem);
}

function getMockStoredEntriesByDate(localDate: string): StoredEntryRecord[] {
  const records = entryRecords
    .filter((entry) => entry.localDate === localDate)
    .map(toStoredMockEntryRecord);

  if (viewerDraft.localDate === localDate) {
    const existingViewerEntry = getLatestEntryForMember(records, viewerContext.id);

    if (existingViewerEntry) {
      existingViewerEntry.status = "draft";
      existingViewerEntry.passageReferenceSnapshot = viewerDraft.passageReference;
      existingViewerEntry.memorableLine = viewerDraft.memorableLine;
      existingViewerEntry.reflection = viewerDraft.reflection;
      existingViewerEntry.application = viewerDraft.application;
    } else {
      records.push({
        id: "draft-local-viewer",
        memberId: viewerContext.id,
        localDate,
        createdAtUtc: new Date(`${localDate}T12:00:00Z`).toISOString(),
        status: "draft",
        passageReferenceSnapshot: viewerDraft.passageReference,
        memorableLine: viewerDraft.memorableLine,
        reflection: viewerDraft.reflection,
        application: viewerDraft.application,
        replyCount: 0,
      });
    }
  }

  return records.sort((left, right) => right.createdAtUtc.localeCompare(left.createdAtUtc));
}

function buildFamilyStatus(records: StoredEntryRecord[]): FamilyStatusItem[] {
  return getVisibleFamilyMembers().map((member) => {
    const memberEntry = getLatestEntryForMember(records, member.id);

    if (memberEntry?.status === "draft") {
      return {
        userId: member.id,
        name: member.name,
        status: "draft",
        note: "임시저장한 글이 있어 이어서 쓸 수 있어요.",
      };
    }

    if (memberEntry?.status === "published") {
      return {
        userId: member.id,
        name: member.name,
        status: "done",
        note: "오늘 나눔을 조용히 남겼어요.",
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

function getInitialHomePageData(localDate: string): HomePageData {
  return {
    viewer: getViewerContext(),
    todayPassage: getInitialPassage(localDate),
    familyStatus: buildFamilyStatus([]),
    myEntryStatus: "published",
    myEntryId: null,
    todayFeed: [],
  };
}

function getInitialWritePageData(localDate: string): WritePageData {
  return {
    viewer: getViewerContext(),
    todayPassage: getInitialPassage(localDate),
    entryId: null,
    entryStatus: null,
    draft: {
      localDate,
      passageReference: "",
      memorableLine: "",
      reflection: "",
      application: "",
    },
  };
}

function getInitialArchivePageData(month: string): ArchivePageData {
  return {
    month,
    groups: [],
  };
}

function getMockTodayPassage(localDate: string): PassageScheduleRecord {
  return findMockPassage(localDate);
}

function getMockEntriesByDate(localDate: string): EntryFeedItem[] {
  return toPublishedFeed(getMockStoredEntriesByDate(localDate));
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

async function readPassage(localDate: string): Promise<PageLoadResult<PassageScheduleRecord>> {
  if (!shouldUseAppsScriptRuntime()) {
    debugFallback("using mock passage because production Apps Script runtime is disabled", {
      hasPublicUrl: hasAppsScriptPublicUrl(),
    });
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
    debugFallback("production Apps Script passage failed and mock fallback is disabled", {
      hasPublicUrl: hasAppsScriptPublicUrl(),
      error: remotePassage.error,
    });
    return {
      data: getUnavailablePassage(localDate),
      meta: createMeta("apps-script", remotePassage.error || "Failed to load passage"),
    };
  }

  debugFallback("using mock passage because local development fallback is allowed", {
    hasPublicUrl: hasAppsScriptPublicUrl(),
    error: remotePassage.error,
  });
  return {
    data: getMockTodayPassage(localDate),
    meta: createMeta("mock", remotePassage.error),
  };
}

async function readStoredEntriesByDate(localDate: string): Promise<PageLoadResult<StoredEntryRecord[]>> {
  if (!shouldUseAppsScriptRuntime()) {
    debugFallback("using mock stored entries because production Apps Script runtime is disabled", {
      hasPublicUrl: hasAppsScriptPublicUrl(),
    });
    return {
      data: getMockStoredEntriesByDate(localDate),
      meta: createMeta("mock"),
    };
  }

  const remoteEntries = await fetchRemoteEntriesByDate(localDate);

  if (remoteEntries.data) {
    return {
      data: remoteEntries.data.map(toStoredRemoteEntryRecord),
      meta: createMeta("apps-script", remoteEntries.error),
    };
  }

  if (!shouldAllowMockFallback()) {
    debugFallback("production Apps Script stored entries failed and mock fallback is disabled", {
      hasPublicUrl: hasAppsScriptPublicUrl(),
      error: remoteEntries.error,
    });
    return {
      data: [],
      meta: createMeta("apps-script", remoteEntries.error || "Failed to load entries"),
    };
  }

  debugFallback("using mock stored entries because local development fallback is allowed", {
    hasPublicUrl: hasAppsScriptPublicUrl(),
    error: remoteEntries.error,
  });
  return {
    data: getMockStoredEntriesByDate(localDate),
    meta: createMeta("mock", remoteEntries.error),
  };
}

async function readEntriesByDate(localDate: string): Promise<PageLoadResult<EntryFeedItem[]>> {
  const entriesResult = await readStoredEntriesByDate(localDate);

  return {
    data: toPublishedFeed(entriesResult.data),
    meta: entriesResult.meta,
  };
}

async function readMonthSummary(month: string): Promise<PageLoadResult<MonthSummary>> {
  if (!shouldUseAppsScriptRuntime()) {
    debugFallback("using mock month summary because production Apps Script runtime is disabled", {
      hasPublicUrl: hasAppsScriptPublicUrl(),
    });
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
    debugFallback("production Apps Script month summary failed and mock fallback is disabled", {
      hasPublicUrl: hasAppsScriptPublicUrl(),
      error: remoteSummary.error,
    });
    return {
      data: {
        month,
        items: [],
      },
      meta: createMeta("apps-script", remoteSummary.error || "Failed to load month summary"),
    };
  }

  debugFallback("using mock month summary because local development fallback is allowed", {
    hasPublicUrl: hasAppsScriptPublicUrl(),
    error: remoteSummary.error,
  });
  return {
    data: getMockMonthSummary(month),
    meta: createMeta("mock", remoteSummary.error),
  };
}

async function readReplies(entryId: string): Promise<PageLoadResult<ReplyItem[]>> {
  if (!shouldUseAppsScriptRuntime()) {
    debugFallback("using mock replies because production Apps Script runtime is disabled", {
      hasPublicUrl: hasAppsScriptPublicUrl(),
    });
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
    debugFallback("production Apps Script replies failed and mock fallback is disabled", {
      hasPublicUrl: hasAppsScriptPublicUrl(),
      error: remoteReplies.error,
    });
    return {
      data: [],
      meta: createMeta("apps-script", remoteReplies.error || "Failed to load replies"),
    };
  }

  debugFallback("using mock replies because local development fallback is allowed", {
    hasPublicUrl: hasAppsScriptPublicUrl(),
    error: remoteReplies.error,
  });
  return {
    data: getMockReplies(entryId),
    meta: createMeta("mock", remoteReplies.error),
  };
}

async function readEntryById(entryId: string): Promise<PageLoadResult<EntryDetail | null>> {
  if (!shouldUseAppsScriptRuntime()) {
    debugFallback("using mock entry detail because production Apps Script runtime is disabled", {
      hasPublicUrl: hasAppsScriptPublicUrl(),
    });
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
    debugFallback("production Apps Script entry detail failed and mock fallback is disabled", {
      hasPublicUrl: hasAppsScriptPublicUrl(),
      error: remoteEntry.error,
    });
    return {
      data: null,
      meta: mergeMeta(
        createMeta("apps-script", remoteEntry.error || "Failed to load entry detail"),
        repliesResult.meta,
      ),
    };
  }

  debugFallback("using mock entry detail because local development fallback is allowed", {
    hasPublicUrl: hasAppsScriptPublicUrl(),
    error: remoteEntry.error,
  });
  return {
    data: getMockEntryById(entryId),
    meta: mergeMeta(createMeta("mock", remoteEntry.error), repliesResult.meta),
  };
}

export function getViewerContext(): ViewerContext {
  return viewerContext;
}

export function getFamilyMembers(): FamilyMember[] {
  return getVisibleFamilyMembers();
}

export function getMockHomePageData(localDate: string): HomePageData {
  const viewer = getViewerContext();
  const todayEntries = getMockStoredEntriesByDate(localDate);
  const myEntry = getLatestEntryForMember(todayEntries, viewer.id);

  return {
    viewer,
    todayPassage: getMockTodayPassage(localDate),
    familyStatus: buildFamilyStatus(todayEntries),
    myEntryStatus: myEntry?.status === "draft" ? "draft" : "published",
    myEntryId: myEntry?.status === "published" ? myEntry.id : null,
    todayFeed: toPublishedFeed(todayEntries),
  };
}

export function getInitialHomePageDataForRuntime(localDate: string): HomePageData {
  return shouldUseAppsScriptRuntime() ? getInitialHomePageData(localDate) : getMockHomePageData(localDate);
}

export function getMockWritePageData(localDate: string): WritePageData {
  const todayPassage = getMockTodayPassage(localDate);
  const viewerEntry = getLatestEntryForMember(getMockStoredEntriesByDate(localDate), viewerContext.id);

  return {
    viewer: getViewerContext(),
    todayPassage,
    entryId: viewerEntry?.id ?? null,
    entryStatus: viewerEntry?.status ?? null,
    draft:
      viewerEntry
        ? {
            localDate,
            passageReference: viewerEntry.passageReferenceSnapshot,
            memorableLine: viewerEntry.memorableLine,
            reflection: viewerEntry.reflection,
            application: viewerEntry.application,
          }
        : {
            localDate,
            passageReference: todayPassage.reference,
            memorableLine: "",
            reflection: "",
            application: "",
          },
  };
}

export function getInitialWritePageDataForRuntime(localDate: string): WritePageData {
  return shouldUseAppsScriptRuntime()
    ? getInitialWritePageData(localDate)
    : getMockWritePageData(localDate);
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

export function getInitialArchivePageDataForRuntime(month: string): ArchivePageData {
  return shouldUseAppsScriptRuntime() ? getInitialArchivePageData(month) : getMockArchivePageData(month);
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

export function getInitialEntryDetailPageDataForRuntime() {
  return null;
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
  if (shouldUseAppsScriptRuntime()) {
    const remoteSave = await saveRemoteEntry({
      entryId: payload.id,
      memberId: payload.authorId,
      localDate: payload.localDate,
      status: payload.status,
      passageReferenceSnapshot: payload.passageReferenceSnapshot,
      memorableLine: payload.memorableLine,
      reflection: payload.reflection,
      applicationOrPrayer: payload.application,
    });

    if (remoteSave.data) {
      return toRemoteEntryFeedItem(remoteSave.data);
    }

    if (!shouldAllowMockFallback()) {
      throw new Error(remoteSave.error || "Failed to save entry");
    }
  }

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

  viewerDraft.localDate = payload.localDate;
  viewerDraft.passageReference = payload.passageReferenceSnapshot;
  viewerDraft.memorableLine = payload.memorableLine;
  viewerDraft.reflection = payload.reflection;
  viewerDraft.application = payload.application;

  return toMockEntryFeedItem(nextRecord);
}

export async function addReply(payload: AddReplyPayload): Promise<ReplyItem> {
  if (shouldUseAppsScriptRuntime()) {
    const remoteReply = await saveRemoteReply({
      entryId: payload.entryId,
      memberId: payload.authorId,
      body: payload.body,
    });

    if (remoteReply.data) {
      return toReplyItem(remoteReply.data);
    }

    if (!shouldAllowMockFallback()) {
      throw new Error(remoteReply.error || "Failed to add reply");
    }
  }

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
  const entriesResult = await readStoredEntriesByDate(localDate);
  const myEntry = getLatestEntryForMember(entriesResult.data, viewer.id);

  return {
    data: {
      viewer,
      todayPassage: passageResult.data,
      familyStatus: buildFamilyStatus(entriesResult.data),
      myEntryStatus: myEntry?.status === "draft" ? "draft" : "published",
      myEntryId: myEntry?.status === "published" ? myEntry.id : null,
      todayFeed: toPublishedFeed(entriesResult.data),
    },
    meta: mergeMeta(passageResult.meta, entriesResult.meta),
  };
}

export async function loadWritePageData(localDate: string): Promise<PageLoadResult<WritePageData>> {
  const passageResult = await readPassage(localDate);
  const entriesResult = await readStoredEntriesByDate(localDate);
  const viewerEntry = getLatestEntryForMember(entriesResult.data, viewerContext.id);

  return {
    data: {
      viewer: getViewerContext(),
      todayPassage: passageResult.data,
      entryId: viewerEntry?.id ?? null,
      entryStatus: viewerEntry?.status ?? null,
      draft:
        viewerEntry
          ? {
              localDate,
              passageReference: viewerEntry.passageReferenceSnapshot,
              memorableLine: viewerEntry.memorableLine,
              reflection: viewerEntry.reflection,
              application: viewerEntry.application,
            }
          : {
              localDate,
              passageReference: passageResult.data.reference,
              memorableLine: "",
              reflection: "",
              application: "",
            },
    },
    meta: mergeMeta(passageResult.meta, entriesResult.meta),
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
