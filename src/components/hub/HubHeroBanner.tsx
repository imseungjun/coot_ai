"use client";

import type { ReactNode } from "react";

/** 배경 루프용 (loop=1일 때 playlist에 동일 ID 필요) */
const HUB_HERO_VIDEO_ID = "40z7mWfbZR0";
const HUB_HERO_START_SEC = 9;

function heroEmbedSrc(): string {
  const id = HUB_HERO_VIDEO_ID;
  const q = new URLSearchParams({
    autoplay: "1",
    mute: "1",
    loop: "1",
    playlist: id,
    controls: "0",
    playsinline: "1",
    modestbranding: "1",
    rel: "0",
    start: String(HUB_HERO_START_SEC),
    iv_load_policy: "3",
    disablekb: "1",
  });
  return `https://www.youtube-nocookie.com/embed/${id}?${q.toString()}`;
}

type HubHeroBannerProps = {
  children: ReactNode;
};

/**
 * AI 바로가기 상단 배너: YouTube 무음·자동·루프 배경 + 어두운 오버레이 위에 콘텐츠
 */
export function HubHeroBanner({ children }: HubHeroBannerProps) {
  return (
    <section className="relative mb-10 overflow-hidden rounded-2xl border border-coot-border/25 shadow-lg shadow-black/20">
      <div className="pointer-events-none absolute inset-0 z-0">
        <iframe
          className="absolute left-1/2 top-1/2 h-[56.25vw] min-h-full w-[177.78vh] min-w-full -translate-x-1/2 -translate-y-1/2 border-0"
          src={heroEmbedSrc()}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen={false}
          title="배경 영상"
          tabIndex={-1}
          aria-hidden
        />
      </div>
      <div
        className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-b from-black/78 via-black/58 to-black/72"
        aria-hidden
      />
      <div className="relative z-10 bg-black/20 py-6 sm:py-8">
        {children}
      </div>
    </section>
  );
}
