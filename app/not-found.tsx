import Link from "next/link";
import { Card } from "@/components/ui/card";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] items-center">
      <Card className="w-full space-y-4 text-center">
        <p className="text-sm text-muted">찾을 수 없는 나눔입니다.</p>
        <h1 className="text-2xl font-bold">요청한 글이 아직 준비되지 않았어요</h1>
        <p className="text-sm leading-6 text-muted">
          mock 데이터에 없는 엔트리일 수 있습니다. 홈이나 기록 화면에서 다시 열어보세요.
        </p>
        <Link
          href="/"
          className="inline-flex h-12 items-center justify-center rounded-2xl bg-accent px-5 text-sm font-semibold text-white"
        >
          홈으로 돌아가기
        </Link>
      </Card>
    </div>
  );
}
