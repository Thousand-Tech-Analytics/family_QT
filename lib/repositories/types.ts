export type UserRole = "member" | "admin";
export type EntryStatus = "draft" | "published";
export type FamilyStatus = "done" | "draft" | "pending";
export type DataSourceKind = "apps-script" | "mock";

export type FamilyMember = {
  id: string;
  name: string;
  timezone: string;
  role: UserRole;
};

export type ViewerContext = {
  id: string;
  name: string;
  timezone: string;
  localDate: string;
  isAdmin: boolean;
};

export type PassageScheduleRecord = {
  localDate: string;
  reference: string;
};

export type EntryRecord = {
  id: string;
  authorId: string;
  localDate: string;
  createdAtUtc: string;
  status: EntryStatus;
  passageReferenceSnapshot: string;
  memorableLine: string;
  reflection: string;
  application: string;
};

export type ReplyRecord = {
  id: string;
  entryId: string;
  authorId: string;
  body: string;
  createdAtUtc: string;
};

export type EntryDraft = {
  localDate: string;
  passageReference: string;
  memorableLine: string;
  reflection: string;
  application: string;
};

export type EntryFeedItem = {
  id: string;
  author: FamilyMember;
  localDate: string;
  createdAtUtc: string;
  createdTimeLabel: string;
  passageReference: string;
  memorableLine: string;
  reflection: string;
  application: string;
  replyCount: number;
};

export type ReplyItem = {
  id: string;
  author: FamilyMember;
  body: string;
  createdAtUtc: string;
  createdTimeLabel: string;
};

export type EntryDetail = EntryFeedItem & {
  replies: ReplyItem[];
};

export type FamilyStatusItem = {
  userId: string;
  name: string;
  status: FamilyStatus;
  note: string;
};

export type MonthSummaryItem = {
  localDate: string;
  dateLabel: string;
  entryCount: number;
};

export type MonthSummary = {
  month: string;
  items: MonthSummaryItem[];
};

export type SaveEntryPayload = {
  id?: string;
  authorId: string;
  localDate: string;
  status: EntryStatus;
  passageReferenceSnapshot: string;
  memorableLine: string;
  reflection: string;
  application: string;
};

export type AddReplyPayload = {
  entryId: string;
  authorId: string;
  body: string;
};

export type HomePageData = {
  viewer: ViewerContext;
  todayPassage: PassageScheduleRecord;
  familyStatus: FamilyStatusItem[];
  myEntryStatus: EntryStatus;
  myEntryId: string | null;
  todayFeed: EntryFeedItem[];
};

export type WritePageData = {
  viewer: ViewerContext;
  todayPassage: PassageScheduleRecord;
  entryId: string | null;
  entryStatus: EntryStatus | null;
  draft: EntryDraft;
};

export type ArchivePageData = {
  month: string;
  groups: Array<{
    localDate: string;
    dateLabel: string;
    items: EntryFeedItem[];
  }>;
};

export type AdminPassagePageData = {
  viewer: ViewerContext;
  todayPassage: PassageScheduleRecord;
  recentSchedule: PassageScheduleRecord[];
};

export type ReadMeta = {
  source: DataSourceKind;
  error: string | null;
};

export type PageLoadResult<T> = {
  data: T;
  meta: ReadMeta;
};
