
# AGENTS.md

이 저장소에서 작업하는 모든 에이전트는 아래 지침을 따른다.

## 1. Source of truth
- `SPEC.md`를 제품 요구사항의 기준 문서로 사용한다.
- 요구사항이 애매할 때는 `SPEC.md`에 맞는 더 단순한 구현을 선택한다.
- 제품 동작을 임의로 바꾸지 않는다.
- UX, 데이터 규칙, 타임존 규칙을 추측으로 변경하지 않는다.

## 2. Preferred stack
- Next.js App Router
- TypeScript
- Tailwind CSS
- Supabase for Auth + Database
- Vercel-friendly deployment patterns
- 기본 패키지 매니저는 `npm` 사용

최신 구현 방식이 필요할 때는 각 공식 문서의 현재 권장 방식을 우선한다.

## 3. Product constraints
반드시 지킬 것:
- 이 앱은 비공개 가족용 앱이다.
- 기본 UI 언어는 한국어다.
- 모바일 우선으로 구현한다.
- “오늘”과 “오늘의 본문”은 사용자별 local date 기준이다.
- timezone은 반드시 IANA timezone string을 사용한다.
- 본문은 관리자가 수기로 입력한 reference 문자열만 사용한다.
- Bible API 또는 성경 원문 자동 불러오기는 구현하지 않는다.
- 엔트리 저장 시 본문 reference snapshot을 저장한다.
- 게시된 엔트리는 user당 local_date별 1개다.
- 답글 개수는 무제한이다.
- V1에서는 reply thread depth = 1 이다.
- 게임화 요소를 넣지 않는다.

## 4. UI/UX rules
- 모바일 화면에서 가장 먼저 보기 좋고 쓰기 쉬워야 한다.
- 과한 SNS 느낌을 피한다.
- 레이아웃은 따뜻하고 차분한 카드형 UI를 우선한다.
- 큰 글자, 충분한 여백, 읽기 쉬운 입력 폼을 선호한다.
- 하단 네비게이션은 단순하게 유지한다.
- 화면에 중요한 CTA는 한 번에 하나만 강조한다.
- 장식보다 가독성과 사용성을 우선한다.

## 5. Architecture preferences
- 가능한 한 Server Components를 기본으로 사용한다.
- 꼭 필요한 경우에만 Client Components를 사용한다.
- 컴포넌트는 작고 읽기 쉽게 분리한다.
- 재사용 가능한 UI를 만들되 과도한 추상화는 피한다.
- 파일명과 코드 구조는 단순하고 예측 가능하게 유지한다.
- mock data와 real data 경계를 명확히 둔다.

## 6. Auth and security
- 앱 내용은 인증된 사용자만 볼 수 있어야 한다.
- 관리자 페이지는 role 기반으로 제한한다.
- Supabase 사용 시 RLS를 고려한 구조를 우선한다.
- secret은 절대로 코드에 하드코딩하지 않는다.
- 환경 변수는 `.env.local` 사용
- 예시 환경 변수는 `.env.example`에 정리한다.

## 7. Time and date handling
- timestamp는 UTC로 저장한다.
- local_date는 별도 필드로 저장한다.
- local_date는 사용자의 timezone 기준으로 계산한다.
- 고정 UTC offset을 직접 저장/사용하지 않는다.
- draft가 자정을 넘어도 원래 draft의 local_date를 유지하는 규칙을 보존한다.
- 과거 엔트리 조회 시 entry의 snapshot 데이터를 우선한다.

## 8. Database and data modeling
- 스키마는 `SPEC.md`의 데이터 모델 초안을 따른다.
- 엔트리와 답글 구조를 불필요하게 복잡하게 만들지 않는다.
- V1에서는 multi-family SaaS 구조로 확장하지 않는다.
- 처음부터 지나치게 일반화하지 않는다.

## 9. Dependency policy
- 새 의존성 추가는 최소화한다.
- 큰 라이브러리를 넣기 전에 정말 필요한지 판단한다.
- 단순한 UI/로직은 직접 구현을 우선한다.
- shadcn/ui 같은 추가 UI 체계는 명시적 필요가 있을 때만 도입한다.

## 10. Code quality
- 읽기 쉬운 코드를 우선한다.
- 불필요하게 clever한 코드는 피한다.
- 주석은 필요한 곳에만 짧게 쓴다.
- 타입을 가능한 명확하게 유지한다.
- 임시 코드 / dead code / 사용하지 않는 파일은 남기지 않는다.

## 11. Workflow
작업 방식:
1. 작은 단위로 작업한다.
2. 먼저 구조를 만들고, 그다음 기능을 붙인다.
3. mock data로 UI를 확인한 뒤 real data를 연결한다.
4. 큰 변경 전후로 diff가 읽기 쉽도록 유지한다.

우선순위:
1. 프로젝트 scaffold
2. 공통 layout / navigation
3. 홈 / 쓰기 / 상세 / 기록 / 관리자 페이지 골격
4. 인증
5. 본문 스케줄 로직
6. 엔트리 draft / publish
7. 답글
8. 기록 조회
9. polish

## 12. Validation
의미 있는 변경 후 가능한 범위에서 아래를 실행한다:
- `npm run lint`
- `npm run typecheck`
- `npm run build`

해당 스크립트가 아직 없으면, 추가 가능한 범위에서 프로젝트에 맞게 정리한다.

## 13. Accessibility and responsiveness
- 모바일 뷰포트에서 깨지지 않아야 한다.
- 기본적인 접근성을 지킨다.
- label, button text, focus state를 명확히 한다.
- 키보드 접근성도 너무 나쁘지 않게 유지한다.

## 14. Initial implementation target
첫 구현은 아래를 목표로 한다:
- Next.js 프로젝트 초기화
- App Router 기반 라우트 생성
- `/`
- `/write`
- `/entries/[id]`
- `/archive`
- `/admin/passages`
- `/login`
- 공통 레이아웃
- 모바일 우선 네비게이션
- mock data 기반 홈 화면
- 차분한 한국어 UI

## 15. Done criteria for early milestone
초기 마일스톤 완료 기준:
- 앱이 로컬에서 실행된다.
- 주요 라우트가 존재한다.
- 모바일에서 기본 레이아웃이 usable 하다.
- 홈 / 쓰기 / 상세 / 기록 / 관리자 골격이 보인다.
- 한국어 UI 카피가 들어가 있다.
- today / timezone / local_date 규칙을 코드 구조상 반영할 준비가 되어 있다.
