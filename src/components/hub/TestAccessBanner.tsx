"use client";

import { useEffect, useState } from "react";

export function TestAccessBanner() {
  const [open, setOpen] = useState(false);
  const [href, setHref] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setHref(typeof window !== "undefined" ? window.location.href.split("#")[0] : "");
  }, []);

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  const samples = ["http://localhost:3000/", "http://127.0.0.1:3000/"];

  return (
    <div className="mt-14 rounded-2xl border border-coot-border/80 bg-coot-surface/30">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left sm:px-5 sm:py-3.5"
        aria-expanded={open ? "true" : "false"}
      >
        <span className="text-sm text-coot-muted">
          <span className="font-medium text-coot-text">개발·접속 안내</span>
          <span className="hidden sm:inline">
            {" "}
            — 로컬 주소, npm 스크립트, 미리보기
          </span>
        </span>
        <span className="shrink-0 text-coot-muted">{open ? "접기 ▲" : "펼치기 ▼"}</span>
      </button>
      {open ? (
        <div className="border-t border-coot-border/60 px-4 pb-4 pt-2 sm:px-5 sm:pb-5">
          <p className="text-xs text-coot-muted">
            데이터는 이 브라우저 localStorage에 저장됩니다.{" "}
            <strong className="font-medium text-coot-text">
              항상 같은 주소(호스트·포트)로 접속하세요
            </strong>
            — <code className="rounded bg-coot-bg px-1">:3000</code>과{" "}
            <code className="rounded bg-coot-bg px-1">:3001</code>도 저장소가 완전히 다릅니다.{" "}
            <code className="rounded bg-coot-bg px-1">localhost</code>와{" "}
            <code className="rounded bg-coot-bg px-1">127.0.0.1</code>도 마찬가지입니다.
          </p>
          <ul className="mt-3 space-y-2 text-sm">
            <li className="flex flex-wrap items-center gap-2">
              <span className="text-coot-muted">현재:</span>
              <code className="max-w-full truncate rounded-lg bg-coot-bg px-2 py-1 text-xs text-coot-text">
                {href || "(로딩 중)"}
              </code>
              <button
                type="button"
                onClick={() => href && copy(href)}
                disabled={!href}
                className="shrink-0 rounded-full border border-coot-border bg-coot-bg px-3 py-1 text-xs font-medium text-coot-text hover:border-coot-accent/50 disabled:opacity-40"
              >
                {copied ? "복사됨" : "복사"}
              </button>
            </li>
            {samples.map((u) => (
              <li key={u} className="flex flex-wrap items-center gap-2">
                <span className="text-coot-muted">로컬:</span>
                <a
                  href={u}
                  className="break-all text-sm text-coot-text underline decoration-coot-border underline-offset-2 hover:text-coot-accent"
                >
                  {u}
                </a>
                <button
                  type="button"
                  onClick={() => copy(u)}
                  className="shrink-0 rounded-full border border-coot-border bg-coot-bg px-3 py-1 text-xs font-medium text-coot-text hover:border-coot-accent/50"
                >
                  복사
                </button>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs leading-relaxed text-coot-muted">
            <code className="rounded bg-coot-bg px-1 py-0.5 text-coot-text">npm run dev</code> ·{" "}
            <code className="rounded bg-coot-bg px-1 py-0.5 text-coot-text">npm run dev:open</code> (홈 자동 열기) ·{" "}
            <code className="rounded bg-coot-bg px-1 py-0.5">run-dev.bat</code> ·{" "}
            <code className="rounded bg-coot-bg px-1 py-0.5">preview.bat</code> /{" "}
            <code className="rounded bg-coot-bg px-1 py-0.5 text-coot-text">npm run preview</code>
          </p>
        </div>
      ) : null}
    </div>
  );
}
