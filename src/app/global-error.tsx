"use client";

/**
 * 루트 레이아웃까지 실패할 때 — Tailwind 없이도 보이도록 인라인 스타일만 사용
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="ko">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          background: "#010101",
          color: "#f3efea",
          fontFamily: 'system-ui, "Segoe UI", sans-serif',
          padding: "2rem",
        }}
      >
        <h1 style={{ fontSize: "1.25rem", fontWeight: 700 }}>COOT Ai — 화면을 불러오지 못했습니다</h1>
        <p style={{ marginTop: "0.75rem", color: "#a8a19d", fontSize: "0.875rem", wordBreak: "break-word" }}>
          {error.message}
        </p>
        <button
          type="button"
          onClick={reset}
          style={{
            marginTop: "1.25rem",
            padding: "0.5rem 1.25rem",
            borderRadius: "9999px",
            border: "1px solid #312e2e",
            background: "#c8b38f",
            color: "#151311",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          다시 시도
        </button>
        <p style={{ marginTop: "2rem", fontSize: "0.75rem", color: "#7d7d7d" }}>
          계속 흰 화면이면 터미널에서 프로젝트 폴더에서 npm run dev:clean 후 브라우저 강력 새로고침(Ctrl+F5)을 해 보세요.
        </p>
      </body>
    </html>
  );
}
