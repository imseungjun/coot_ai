"use client";

import { useEffect, useState } from "react";

/**
 * localhost에서 포트마다 localStorage가 갈라지는 문제를 눈에 띄게 안내합니다.
 * (예: :3000 에 쿠트 포트폴리오, :3001 에 AI 에이전트 — 서로 다른 저장소)
 */
export function StorageOriginNotice() {
  const [ctx, setCtx] = useState<{
    hostLabel: string;
    p3000: string;
    p3001: string;
  } | null>(null);

  useEffect(() => {
    const h = window.location.hostname;
    const isLocal = h === "localhost" || h === "127.0.0.1";
    if (!isLocal) {
      setCtx(null);
      return;
    }
    setCtx({
      hostLabel: window.location.host || h,
      p3000: `http://${h}:3000/`,
      p3001: `http://${h}:3001/`,
    });
  }, []);

  if (!ctx) return null;

  return (
    <div className="mb-6 rounded-2xl border border-amber-500/45 bg-gradient-to-br from-amber-950/40 to-coot-bg px-4 py-4 sm:px-5">
      <p className="text-sm font-semibold text-amber-100/95">
        같은 PC라도 주소(포트)가 다르면 저장 목록이 따로입니다
      </p>
      <p className="mt-2 text-xs leading-relaxed text-amber-100/80">
        브라우저는 <code className="rounded bg-black/35 px-1 py-0.5">localhost:3000</code>과{" "}
        <code className="rounded bg-black/35 px-1 py-0.5">localhost:3001</code>을
        <strong className="text-coot-text"> 완전히 다른 사이트</strong>로 취급해 저장소를 나눕니다. 그래서
        한쪽에서 넣은 링크가 다른 쪽에 안 보이는 것처럼 느껴질 수 있습니다.
      </p>
      <p className="mt-2 text-xs text-coot-muted">
        지금 접속: <code className="text-coot-text">{ctx.hostLabel}</code>
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <a
          href={ctx.p3000}
          className="inline-flex items-center rounded-full border border-amber-500/50 bg-black/20 px-3 py-1.5 text-xs font-medium text-amber-50 transition hover:border-coot-accent/60 hover:bg-white/[0.06]"
        >
          :3000 으로 열기
        </a>
        <a
          href={ctx.p3001}
          className="inline-flex items-center rounded-full border border-amber-500/50 bg-black/20 px-3 py-1.5 text-xs font-medium text-amber-50 transition hover:border-coot-accent/60 hover:bg-white/[0.06]"
        >
          :3001 으로 열기
        </a>
      </div>
      <p className="mt-3 text-xs leading-relaxed text-coot-muted">
        두 쪽에 나뉘어 있다면: 한쪽에서「백업 내보내기」→ 다른 쪽에서「백업 병합」으로 합치면 됩니다.
      </p>
    </div>
  );
}
