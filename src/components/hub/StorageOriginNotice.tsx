"use client";

import { useEffect, useState } from "react";

const STANDARD_DEV_ORIGIN = "http://localhost:3000";

/**
 * 로컬 개발 시 표준 주소는 `http://localhost:3000` 뿐입니다.
 * 127.0.0.1·다른 포트는 브라우저가 다른 출처로 취급해 저장소가 갈라질 수 있어 안내합니다.
 */
export function StorageOriginNotice() {
  const [ctx, setCtx] = useState<{ host: string } | null>(null);

  useEffect(() => {
    const h = window.location.hostname;
    const port = window.location.port;
    const isLocal = h === "localhost" || h === "127.0.0.1";
    if (!isLocal) {
      setCtx(null);
      return;
    }
    const onStandard3000 = h === "localhost" && port === "3000";
    if (onStandard3000) {
      setCtx(null);
      return;
    }
    setCtx({ host: window.location.host || h });
  }, []);

  if (!ctx) return null;

  return (
    <div className="mb-6 rounded-2xl border border-amber-500/45 bg-gradient-to-br from-amber-950/40 to-coot-bg px-4 py-4 sm:px-5">
      <p className="text-sm font-semibold text-amber-100/95">
        표준 주소는 <code className="text-coot-text">{STANDARD_DEV_ORIGIN}</code> 입니다
      </p>
      <p className="mt-2 text-xs leading-relaxed text-amber-100/80">
        이 프로젝트는 개발·저장 기준을 <strong className="text-coot-text">localhost:3000</strong> 으로 맞춥니다.{" "}
        <code className="rounded bg-black/35 px-1 py-0.5">127.0.0.1</code> 이거나 포트가 다르면 브라우저가{" "}
        <strong className="text-coot-text">다른 사이트</strong>로 보아 저장 목록이 달라질 수 있습니다.
      </p>
      <p className="mt-2 text-xs text-coot-muted">
        지금 접속: <code className="text-coot-text">{ctx.host}</code>
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <a
          href={`${STANDARD_DEV_ORIGIN}/`}
          className="inline-flex items-center rounded-full border border-amber-500/50 bg-black/20 px-3 py-1.5 text-xs font-medium text-amber-50 transition hover:border-coot-accent/60 hover:bg-white/[0.06]"
        >
          localhost:3000 으로 열기
        </a>
      </div>
      <p className="mt-3 text-xs leading-relaxed text-coot-muted">
        예전에 다른 주소로만 편집했다면 그쪽에만 데이터가 남아 있을 수 있습니다. 필요하면 한쪽에서「백업
        내보내기」→ 표준 주소에서「백업 병합」으로 합치면 됩니다.
      </p>
    </div>
  );
}
