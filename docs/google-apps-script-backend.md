# Google Apps Script Backend

이 앱은 GitHub Pages 같은 정적 호스팅을 목표로 하므로, production에서는 브라우저가 Google Apps Script Web App을 직접 읽습니다.
Next.js server runtime이나 Vercel proxy는 production read path에 필요하지 않습니다.

## 필요한 시트

- `passage_schedule`
- `entries`
- `replies`

## 컬럼 구조

`passage_schedule`

| local_date | reference |
| --- | --- |
| 2026-03-22 | 시편 24:1-7 |

`entries`

| entry_id | member_id | local_date | created_at | status | passage_reference_snapshot | memorable_line | reflection | application_or_prayer |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |

`replies`

| reply_id | entry_id | member_id | body | created_at | updated_at |
| --- | --- | --- | --- | --- | --- |

가족 구성원은 아직 앱 코드에 하드코딩되어 있으므로 `member_id`는 아래 값 중 하나여야 합니다.

- `jiho`
- `eunseo`
- `dad`
- `mom`

## Apps Script 설정

1. 구글 스프레드시트에서 `확장 프로그램 > Apps Script`를 엽니다.
2. [`scripts/google-apps-script/Code.gs`](/Users/jihocheon/family_QT/scripts/google-apps-script/Code.gs)를 붙여넣습니다.
3. `SPREADSHEET_ID`를 실제 시트 ID로 바꿉니다.
4. `배포 > 새 배포 > 웹 앱`으로 배포합니다.
5. read path만 먼저 쓰므로 웹 앱 읽기 접근이 가능해야 합니다.
6. GitHub Pages 빌드 환경 또는 `.env.production`에 아래 값을 넣습니다.

```bash
NEXT_PUBLIC_APPS_SCRIPT_WEBAPP_URL=...
```

## 지원 액션

- `action=getPassageByDate&date=YYYY-MM-DD`
- `action=getEntriesByDate&date=YYYY-MM-DD`
- `action=getMonthSummary&month=YYYY-MM`
- `action=getReplies&entryId=...`
- `action=getEntryById&entryId=...`

## 응답 형식

기본 JSON 형식:

```json
{
  "ok": true,
  "data": []
}
```

브라우저 CORS가 막히는 경우를 위해 JSONP도 지원하는 편이 안전합니다.
그 경우 `callback=함수이름` 쿼리를 받았을 때 아래처럼 자바스크립트를 반환하면 됩니다.

```js
callbackName({"ok":true,"data":[]})
```

현재 제공된 `Code.gs` 템플릿은 JSON과 JSONP를 둘 다 지원합니다.

## 현재 앱 동작

- development에서는 mock 데이터가 기본입니다.
- production에서는 `NEXT_PUBLIC_APPS_SCRIPT_WEBAPP_URL`이 있으면 Apps Script 읽기를 우선합니다.
- production에서는 URL이 없을 때만 mock fallback을 사용합니다.
- production에서 URL은 있지만 Apps Script 읽기가 실패하면 mock으로 바꾸지 않고, 클라이언트가 Apps Script source 상태를 유지합니다.
- development에서는 작은 data badge로 source를 확인할 수 있습니다.
- `saveEntry`와 `addReply`는 아직 mock/in-memory 상태입니다.
