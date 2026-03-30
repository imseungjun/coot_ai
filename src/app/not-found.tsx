import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-lg px-4 py-20 text-center">
      <p className="text-sm font-medium text-coot-accent">404</p>
      <h1 className="mt-2 text-2xl font-bold text-coot-text">페이지를 찾을 수 없습니다</h1>
      <p className="mt-3 text-sm text-coot-muted">주소가 바뀌었거나 삭제된 페이지일 수 있습니다.</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link
          href="/"
          className="rounded-full bg-coot-accent px-5 py-2.5 text-sm font-semibold text-coot-on-accent"
        >
          AI 바로가기로 돌아가기
        </Link>
      </div>
    </div>
  );
}
