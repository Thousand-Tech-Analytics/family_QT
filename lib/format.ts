type FamilyStatus = "done" | "draft" | "pending";

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
