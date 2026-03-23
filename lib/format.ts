import type { EntryRecord, FamilyStatus } from "@/lib/repositories/types";

export function getTodayDateLabel(localDate: string) {
  const [year, month, day] = localDate.split("-").map(Number);

  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "full",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

export function getFamilyStatusTone(status: FamilyStatus) {
  switch (status) {
    case "done":
      return {
        label: "완료",
        className: "bg-success/15 text-success",
      };
    case "draft":
      return {
        label: "작성중",
        className: "bg-progress/15 text-progress",
      };
    case "pending":
    default:
      return {
        label: "아직",
        className: "bg-pending/15 text-pending",
      };
  }
}

export function formatTimeLabel(timestampUtc: string, timezone: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: timezone,
  }).format(new Date(timestampUtc));
}

export function formatArchiveDateLabel(localDate: string) {
  const [year, month, day] = localDate.split("-").map(Number);

  return `${year}년 ${month}월 ${day}일`;
}

export function sortByCreatedAtDesc(left: EntryRecord, right: EntryRecord) {
  return right.createdAtUtc.localeCompare(left.createdAtUtc);
}

export function sortByCreatedAtUtcDesc(
  left: { createdAtUtc: string },
  right: { createdAtUtc: string },
) {
  return right.createdAtUtc.localeCompare(left.createdAtUtc);
}

export function sortLocalDatesDesc(left: string, right: string) {
  return right.localeCompare(left);
}
