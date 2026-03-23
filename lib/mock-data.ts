export type MockAuthor = {
  id: string;
  name: string;
  timezone: string;
};

export type MockReply = {
  id: string;
  author: MockAuthor;
  body: string;
  createdAtUtc: string;
  createdTimeLabel: string;
};

export type MockEntry = {
  id: string;
  author: MockAuthor;
  localDate: string;
  createdAtUtc: string;
  createdTimeLabel: string;
  passageReference: string;
  memorableLine: string;
  reflection: string;
  application: string;
  replies: MockReply[];
};

const authors: Record<string, MockAuthor> = {
  jiho: {
    id: "jiho",
    name: "지호",
    timezone: "America/New_York",
  },
  eunseo: {
    id: "eunseo",
    name: "은서",
    timezone: "Asia/Seoul",
  },
  dad: {
    id: "dad",
    name: "아버지",
    timezone: "Asia/Seoul",
  },
  mom: {
    id: "mom",
    name: "어머니",
    timezone: "Asia/Seoul",
  },
};

const entryList: MockEntry[] = [
  {
    id: "entry-today-jiho",
    author: authors.jiho,
    localDate: "2026-03-22",
    createdAtUtc: "2026-03-22T12:30:00Z",
    createdTimeLabel: "오전 8:30",
    passageReference: "시편 24:1-7",
    memorableLine: "내가 여호와의 산에 오를 자 누구인가",
    reflection:
      "오늘은 하나님 앞에 선 마음의 자세를 다시 생각하게 되었어요.\n바쁜 일정 사이에서도 마음을 가볍게 정리하고, 깨끗한 손과 정직한 마음이 무엇인지 천천히 돌아보게 됩니다.",
    application:
      "오늘 말이 급해질 때 한 번 더 멈추고, 저녁에는 짧게라도 감사기도를 드리려고 해요.",
    replies: [
      {
        id: "reply-1",
        author: authors.mom,
        body: "말을 멈추고 마음을 살피겠다는 적용이 참 좋네. 오늘 하루도 평안하길 기도할게.",
        createdAtUtc: "2026-03-22T13:10:00Z",
        createdTimeLabel: "오전 9:10",
      },
      {
        id: "reply-2",
        author: authors.dad,
        body: "정직한 마음이라는 표현이 저도 오래 남습니다. 저도 오늘 업무 전에 잠깐 기도했어요.",
        createdAtUtc: "2026-03-22T14:35:00Z",
        createdTimeLabel: "오전 10:35",
      },
      {
        id: "reply-3",
        author: authors.eunseo,
        body: "저녁 감사기도 같이 나누면 좋겠어요.",
        createdAtUtc: "2026-03-22T15:00:00Z",
        createdTimeLabel: "오전 11:00",
      },
    ],
  },
  {
    id: "entry-today-mom",
    author: authors.mom,
    localDate: "2026-03-22",
    createdAtUtc: "2026-03-22T10:00:00Z",
    createdTimeLabel: "오전 6:00",
    passageReference: "시편 24:1-7",
    memorableLine: "영광의 왕이 들어가시리로다",
    reflection:
      "주님이 들어오시는 삶의 문이 닫혀 있지 않은지 생각했어요. 마음이 분주하면 쉽게 굳어지는데, 오늘은 먼저 주님께 자리를 내어드리고 싶습니다.",
    application:
      "가사 일을 하면서도 서두르지 않고, 마음으로 짧은 기도를 자주 올리겠습니다.",
    replies: [
      {
        id: "reply-4",
        author: authors.jiho,
        body: "마음의 문을 연다는 표현이 참 따뜻해요. 저도 오늘 그 말을 붙잡고 있을게요.",
        createdAtUtc: "2026-03-22T12:40:00Z",
        createdTimeLabel: "오전 8:40",
      },
    ],
  },
  {
    id: "entry-archive-eunseo",
    author: authors.eunseo,
    localDate: "2026-03-21",
    createdAtUtc: "2026-03-21T21:10:00Z",
    createdTimeLabel: "오후 6:10",
    passageReference: "마태복음 11:28-30",
    memorableLine: "내게로 오라 내가 너희를 쉬게 하리라",
    reflection:
      "해야 할 일은 많았지만 쉬게 하신다는 말씀 앞에서 조급함이 조금 가라앉았어요. 쉼은 게으름이 아니라 주님 안에서 호흡을 다시 맞추는 것 같았습니다.",
    application: "자기 전에 휴대폰을 내려놓고 10분 정도 조용히 기도해보려고 해요.",
    replies: [],
  },
  {
    id: "entry-archive-dad",
    author: authors.dad,
    localDate: "2026-03-20",
    createdAtUtc: "2026-03-20T23:20:00Z",
    createdTimeLabel: "오후 8:20",
    passageReference: "잠언 3:5-6",
    memorableLine: "너는 마음을 다하여 여호와를 신뢰하라",
    reflection:
      "결정할 일이 있어 여러 생각이 오갔는데, 이해보다 신뢰가 먼저라는 말씀에 멈춰 섰습니다. 작은 선택에서도 주님께 묻는 습관이 필요함을 느꼈습니다.",
    application: "오늘 결정해야 할 일 하나를 놓고 가족과 함께 기도하고 싶습니다.",
    replies: [],
  },
];

export const mockAppState = {
  viewer: {
    ...authors.jiho,
    isAdmin: true,
    localDate: "2026-03-22",
  },
  todayPassage: {
    date: "2026-03-22",
    reference: "시편 24:1-7",
  },
  myEntryStatus: "draft" as const,
  myEntryId: "entry-today-jiho",
  familyStatus: [
    {
      userId: authors.mom.id,
      name: authors.mom.name,
      status: "done" as const,
      note: "오늘 나눔을 조용히 남겼어요.",
    },
    {
      userId: authors.jiho.id,
      name: authors.jiho.name,
      status: "draft" as const,
      note: "임시저장한 글이 있어 이어서 쓸 수 있어요.",
    },
    {
      userId: authors.dad.id,
      name: authors.dad.name,
      status: "pending" as const,
      note: "아직 시작 전이에요.",
    },
    {
      userId: authors.eunseo.id,
      name: authors.eunseo.name,
      status: "pending" as const,
      note: "오늘은 조금 늦게 묵상할 예정이에요.",
    },
  ],
  todayFeed: entryList.filter((entry) => entry.localDate === "2026-03-22"),
  writeDraft: {
    localDate: "2026-03-22",
    passageReference: "시편 24:1-7",
    memorableLine: "내가 여호와의 산에 오를 자 누구인가",
    reflection:
      "오늘은 마음을 깨끗하게 지킨다는 말이 계속 남았습니다. 바쁘게 지나치지 않고 한 번 더 주님 앞에서 마음을 정리하고 싶어요.",
    application: "회의 전에 잠깐 묵상하고, 저녁에 가족을 위해 짧게 기도하려고 합니다.",
  },
};

export const mockArchiveGroups = [
  {
    date: "2026-03-22",
    dateLabel: "2026년 3월 22일",
    items: entryList.filter((entry) => entry.localDate === "2026-03-22"),
  },
  {
    date: "2026-03-21",
    dateLabel: "2026년 3월 21일",
    items: entryList.filter((entry) => entry.localDate === "2026-03-21"),
  },
  {
    date: "2026-03-20",
    dateLabel: "2026년 3월 20일",
    items: entryList.filter((entry) => entry.localDate === "2026-03-20"),
  },
];

export const mockAdminSchedule = [
  {
    date: "2026-03-24",
    reference: "요한복음 15:1-8",
  },
  {
    date: "2026-03-23",
    reference: "시편 27:1-6",
  },
  {
    date: "2026-03-22",
    reference: "시편 24:1-7",
  },
  {
    date: "2026-03-21",
    reference: "마태복음 11:28-30",
  },
];

export function getEntryById(id: string) {
  return entryList.find((entry) => entry.id === id);
}
