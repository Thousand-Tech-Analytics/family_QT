import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";

export default function LoginPage() {
  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="비공개 가족 앱"
        title="가족 묵상실에 로그인"
        description="V1에서는 실제 인증 연동 전 단계이므로, 차분한 진입 화면과 구조만 먼저 준비했습니다."
      />

      <Card as="form" className="space-y-5 bg-card-strong">
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-semibold">
            이메일
          </label>
          <input
            id="email"
            type="email"
            placeholder="family@example.com"
            className="h-12 w-full rounded-2xl border border-line bg-white/85 px-4 outline-none transition focus:border-accent"
          />
        </div>

        <button
          type="submit"
          className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-accent px-5 text-sm font-semibold text-white transition hover:opacity-90"
        >
          로그인 링크 받기
        </button>

        <p className="text-sm leading-6 text-muted">
          실제 인증은 아직 연결하지 않았습니다. 현재는 private family app 구조와 UI만 구성되어 있습니다.
        </p>

        <Link href="/" className="text-sm font-semibold text-accent">
          mock 홈으로 돌아가기
        </Link>
      </Card>
    </div>
  );
}
