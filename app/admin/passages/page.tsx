import { PageHeader } from "@/components/page-header";
import { SectionTitle } from "@/components/section-title";
import { Card } from "@/components/ui/card";
import { mockAdminSchedule, mockAppState } from "@/lib/mock-data";

export default function AdminPassagesPage() {
  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="관리자"
        title="본문 스케줄 관리"
        description="mock admin mode일 때만 진입점을 보여주도록 구성했습니다."
      />

      <Card as="form" className="space-y-5 bg-card-strong">
        <SectionTitle
          title="새 본문 입력"
          description={`현재 mock 관리자: ${mockAppState.viewer.name}`}
        />

        <div className="space-y-2">
          <label htmlFor="schedule-date" className="text-sm font-semibold">
            날짜
          </label>
          <input
            id="schedule-date"
            type="date"
            defaultValue={mockAppState.todayPassage.date}
            className="h-12 w-full rounded-2xl border border-line bg-white/85 px-4 outline-none transition focus:border-accent"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="passage-reference" className="text-sm font-semibold">
            본문 reference
          </label>
          <input
            id="passage-reference"
            defaultValue={mockAppState.todayPassage.reference}
            placeholder="예: 시편 24:1-7"
            className="h-12 w-full rounded-2xl border border-line bg-white/85 px-4 outline-none transition focus:border-accent"
          />
        </div>

        <button
          type="submit"
          className="inline-flex h-12 items-center justify-center rounded-2xl bg-accent px-5 text-sm font-semibold text-white transition hover:opacity-90"
        >
          일정 저장
        </button>
      </Card>

      <Card className="space-y-4">
        <SectionTitle
          title="최근 스케줄"
          description="수기로 입력한 본문 reference 목록을 단순한 리스트로 보여줍니다."
        />
        <div className="space-y-3">
          {mockAdminSchedule.map((item) => (
            <div
              key={item.date}
              className="rounded-2xl border border-line/70 bg-white/75 px-4 py-4"
            >
              <p className="text-sm text-muted">{item.date}</p>
              <p className="mt-1 font-semibold">{item.reference}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
