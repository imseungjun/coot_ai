"use client";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto flex min-h-[50vh] max-w-md flex-col items-center justify-center px-4 py-16 text-center">
      <p className="text-sm font-medium text-coot-accent">오류</p>
      <h1 className="mt-2 text-xl font-bold text-coot-text">페이지를 불러오지 못했습니다</h1>
      <p className="mt-2 break-words text-sm text-coot-muted">{error.message}</p>
      <button
        type="button"
        onClick={reset}
        className="mt-6 rounded-full bg-coot-accent px-5 py-2.5 text-sm font-semibold text-coot-on-accent"
      >
        다시 시도
      </button>
    </div>
  );
}
