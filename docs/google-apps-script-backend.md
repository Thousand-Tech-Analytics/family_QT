# Google Apps Script Backend

현재 앱은 server-side에서만 Google Apps Script Web App을 읽습니다.
브라우저는 `APPS_SCRIPT_WEBAPP_URL`을 직접 알지 못하고, Next.js repository 레이어가 대신 호출합니다.

## 1. 필요한 시트

스프레드시트에 아래 시트를 만듭니다.

- `passage_schedule`
- `entries`
- `replies`

## 2. 컬럼 구조

`passage_schedule`

| local_date | reference |
| --- | --- |
| 2026-03-22 | 시편 24:1-7 |

`entries`

| id | author_id | local_date | created_at_utc | status | passage_reference_snapshot | memorable_line | reflection | application |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |

`replies`

| id | entry_id | author_id | created_at_utc | body |
| --- | --- | --- | --- | --- |

가족 구성원은 아직 앱 코드에 하드코딩되어 있으므로, `author_id`는 현재 코드의 값과 맞아야 합니다.

- `jiho`
- `eunseo`
- `dad`
- `mom`

## 3. Apps Script 설정

1. 구글 스프레드시트에서 `확장 프로그램 > Apps Script`를 엽니다.
2. [`scripts/google-apps-script/Code.gs`](/Users/jihocheon/family_QT/scripts/google-apps-script/Code.gs)의 내용을 붙여넣습니다.
3. `SPREADSHEET_ID`를 실제 시트 ID로 바꿉니다.
4. `배포 > 새 배포 > 웹 앱`으로 배포합니다.
5. 접근 권한은 읽기 가능한 범위로 설정합니다.
6. 배포된 Web App URL을 `.env.local`의 `APPS_SCRIPT_WEBAPP_URL`에 넣습니다.

## 4. 지원 액션

- `action=getPassageByDate&date=YYYY-MM-DD`
- `action=getEntriesByDate&date=YYYY-MM-DD`
- `action=getMonthSummary&month=YYYY-MM`
- `action=getReplies&entryId=...`

추가로 상세 화면을 위해 아래 액션도 함께 지원합니다.

- `action=getEntryById&entryId=...`

## 5. 응답 형식

모든 응답은 아래 형식을 권장합니다.

```json
{
  "ok": true,
  "data": []
}
```

단일 객체일 때도 같은 형식을 사용하면 됩니다.

## 6. 현재 앱 동작

- `APPS_SCRIPT_WEBAPP_URL`이 없으면 mock 데이터로 동작합니다.
- URL이 있어도 Apps Script 호출이 실패하면 mock fallback으로 내려갑니다.
- 쓰기 저장과 답글 등록은 아직 원격 저장으로 연결하지 않았습니다.
