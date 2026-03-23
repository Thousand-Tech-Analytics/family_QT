import {
  entryRecords,
  familyMembers,
  passageScheduleRecords,
  replyRecords,
  viewerContext,
  viewerDraft,
} from "@/lib/repositories/mock-source";
import { unstable_noStore as noStore } from "next/cache";
import {
  fetchRemoteEntriesByDate,
  fetchRemoteEntryById,
  fetchRemoteMonthSummary,
  fetchRemotePassageByDate,
  fetchRemoteReplies,
  type RemoteEntryRecord,
  type RemoteMonthSummaryRecord,
  type RemotePassageRecord,
  type RemoteReplyRecord,
} from "@/lib/repositories/apps-script-source";
import {
  formatArchiveDateLabel,
  formatTimeLabel,
  sortByCreatedAtDesc,
  sortByCreatedAtUtcDesc,
  sortLocalDatesDesc,
} from "@/lib/format";
import type {
  AddReplyPayload,
  AdminPassagePageData,
  ArchivePageData,
  EntryDetail,
  EntryFeedItem,
  EntryRecord,
  FamilyMember,
  FamilyStatusItem,
  HomePageData,
  MonthSummary,
  PassageScheduleRecord,
  ReplyItem,
  SaveEntryPayload,
  ViewerContext,
  WritePageData,
} from "@/lib/repositories/types";

function getFamilyMemberById(id: string) {
  const member = familyMembers.find((item) => item.id === id);

  if (!member) {
    throw new Error(`Unknown family member: ${id}`);
  }

  return member;
}

function findPassage(localDate: string): PassageScheduleRecord {
  return (
    passageScheduleRecords.find((item) => item.localDate === localDate) ?? {
      localDate,
      reference: "아직 본문이 준비되지 않았어요.",
    }
  );
}

function getReplyCount(entryId: string) {
  return replyRecords.filter((reply) => reply.entryId === entryId).length;
}

function toPassageRecord(record: RemotePassageRecord): PassageScheduleRecord {
  return {
    localDate: record.localDate,
    reference: record.reference,
  };
}

function toEntryFeedItem(entry: EntryRecord): EntryFeedItem {
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
    replyCount: getReplyCount(entry.id),
  };
}

function toReplyItem(record: (typeof replyRecords)[number] | RemoteReplyRecord): ReplyItem {
  const author = getFamilyMemberById(record.authorId);

  return {
    id: record.id,
    author,
    body: record.body,
    createdAtUtc: record.createdAtUtc,
    createdTimeLabel: formatTimeLabel(record.createdAtUtc, author.timezone),
  };
}

function toRemoteEntryFeedItem(entry: RemoteEntryRecord): EntryFeedItem {
  const author = getFamilyMemberById(entry.authorId);

  return {
    id: entry.id,
    author,
    localDate: entry.localDate,
    createdAtUtc: entry.createdAtUtc,
    createdTimeLabel: formatTimeLabel(entry.createdAtUtc, author.timezone),
    passageReference: entry.passageReferenceSnapshot,
    memorableLine: entry.memorableLine ?? "",
    reflection: entry.reflection,
    application: entry.application ?? "",
    replyCount: entry.replyCount ?? 0,
  };
}

async function buildFamilyStatus(localDate: string): Promise<FamilyStatusItem[]> {
  const publishedEntries = await getTodayEntries(localDate);

  return familyMembers.map((member) => {
    if (member.id === viewerContext.id && viewerDraft.localDate === localDate) {
      return {
        userId: member.id,
        name: member.name,
        status: "draft",
        note: "임시저장한 글이 있어 이어서 쓸 수 있어요.",
      };
    }

    const hasPublishedEntry = publishedEntries.some((entry) => entry.author.id === member.id);

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

export function getViewerContext(): ViewerContext {
  return viewerContext;
}

export function getFamilyMembers(): FamilyMember[] {
  return familyMembers;
}

export async function getTodayPassage(localDate: string): Promise<PassageScheduleRecord> {
  noStore();
  const remotePassage = await fetchRemotePassageByDate(localDate);

  if (remotePassage) {
    return toPassageRecord(remotePassage);
  }

  return findPassage(localDate);
}

export async function getTodayEntries(localDate: string): Promise<EntryFeedItem[]> {
  noStore();
  const remoteEntries = await fetchRemoteEntriesByDate(localDate);

  if (remoteEntries) {
    return remoteEntries
      .filter((entry) => (entry.status ?? "published") === "published")
      .sort(sortByCreatedAtUtcDesc)
      .map(toRemoteEntryFeedItem);
  }

  return entryRecords
    .filter((entry) => entry.localDate === localDate && entry.status === "published")
    .sort(sortByCreatedAtDesc)
    .map(toEntryFeedItem);
}

export async function getEntriesByDate(localDate: string): Promise<EntryFeedItem[]> {
  noStore();
  const remoteEntries = await fetchRemoteEntriesByDate(localDate);

  if (remoteEntries) {
    return remoteEntries
      .filter((entry) => (entry.status ?? "published") === "published")
      .sort(sortByCreatedAtUtcDesc)
      .map(toRemoteEntryFeedItem);
  }

  return entryRecords
    .filter((entry) => entry.localDate === localDate && entry.status === "published")
    .sort(sortByCreatedAtDesc)
    .map(toEntryFeedItem);
}

export async function getMonthSummary(month: string): Promise<MonthSummary> {
  noStore();
  const remoteSummary = await fetchRemoteMonthSummary(month);

  if (remoteSummary) {
    return {
      month,
      items: remoteSummary
        .slice()
        .sort((left: RemoteMonthSummaryRecord, right: RemoteMonthSummaryRecord) =>
          sortLocalDatesDesc(left.localDate, right.localDate),
        )
        .map((item) => ({
          localDate: item.localDate,
          dateLabel: formatArchiveDateLabel(item.localDate),
          entryCount: item.entryCount,
        })),
    };
  }

  const localDates = Array.from(
    new Set(
      entryRecords
        .filter((entry) => entry.localDate.startsWith(month) && entry.status === "published")
        .map((entry) => entry.localDate),
    ),
  ).sort(sortLocalDatesDesc);

  return {
    month,
    items: await Promise.all(
      localDates.map(async (localDate) => ({
        localDate,
        dateLabel: formatArchiveDateLabel(localDate),
        entryCount: (await getEntriesByDate(localDate)).length,
      })),
    ),
  };
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

  return toEntryFeedItem(nextRecord);
}

export async function getReplies(entryId: string): Promise<ReplyItem[]> {
  noStore();
  const remoteReplies = await fetchRemoteReplies(entryId);

  if (remoteReplies) {
    return remoteReplies
      .slice()
      .sort((left, right) => left.createdAtUtc.localeCompare(right.createdAtUtc))
      .map(toReplyItem);
  }

  return replyRecords
    .filter((reply) => reply.entryId === entryId)
    .sort((left, right) => left.createdAtUtc.localeCompare(right.createdAtUtc))
    .map(toReplyItem);
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
  noStore();
  const remoteEntry = await fetchRemoteEntryById(entryId);

  if (remoteEntry && (remoteEntry.status ?? "published") === "published") {
    return {
      ...toRemoteEntryFeedItem(remoteEntry),
      replies: await getReplies(entryId),
    };
  }

  const record = entryRecords.find((entry) => entry.id === entryId && entry.status === "published");

  if (!record) {
    return null;
  }

  return {
    ...toEntryFeedItem(record),
    replies: await getReplies(entryId),
  };
}

export async function getHomePageData(localDate: string): Promise<HomePageData> {
  noStore();
  const viewer = getViewerContext();
  const todayFeed = await getTodayEntries(localDate);
  const myPublishedEntry = todayFeed.find((entry) => entry.author.id === viewer.id);

  return {
    viewer,
    todayPassage: await getTodayPassage(localDate),
    familyStatus: await buildFamilyStatus(localDate),
    myEntryStatus: viewerDraft.localDate === localDate ? "draft" : "published",
    myEntryId: myPublishedEntry?.id ?? "entry-today-jiho",
    todayFeed,
  };
}

export async function getWritePageData(localDate: string): Promise<WritePageData> {
  noStore();
  const todayPassage = await getTodayPassage(localDate);

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

export async function getArchivePageData(month: string): Promise<ArchivePageData> {
  noStore();
  const summary = await getMonthSummary(month);

  return {
    month: summary.month,
    groups: await Promise.all(
      summary.items.map(async (item) => ({
      localDate: item.localDate,
      dateLabel: item.dateLabel,
        items: await getEntriesByDate(item.localDate),
      })),
    ),
  };
}

export async function getAdminPassagePageData(localDate: string): Promise<AdminPassagePageData> {
  noStore();
  return {
    viewer: getViewerContext(),
    todayPassage: await getTodayPassage(localDate),
    recentSchedule: passageScheduleRecords,
  };
}
