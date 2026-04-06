"use client";

import { useState, type MouseEvent } from "react";
import { recordMascotLinkClick } from "@/lib/mascot-link-clicks";
import { faviconUrlForPage, normalizeUrl } from "@/lib/hub-utils";
import type { HubLink } from "@/lib/hub-types";
import { useYoutubeTileMedia } from "./useYoutubeTileMedia";

type KootPortfolioVideoTileProps = {
  link: HubLink;
  onEdit: () => void;
  onDelete: () => void;
  onReorderUp?: () => void;
  onReorderDown?: () => void;
};

function hostLabel(url: string): string {
  try {
    return new URL(normalizeUrl(url)).hostname.replace(/^www\./i, "");
  } catch {
    return "링크";
  }
}

/** 쿠트 포트폴리오 — 유튜브 채널 동영상 탭과 유사한 다크 썸네일 카드 */
export function KootPortfolioVideoTile({
  link,
  onEdit,
  onDelete,
  onReorderUp,
  onReorderDown,
}: KootPortfolioVideoTileProps) {
  const [imgOk, setImgOk] = useState(true);
  const {
    href,
    internal,
    searchMode,
    effectiveYtId,
    thumbList,
    thumbIdx,
    setThumbIdx,
    thumbDead,
    setThumbDead,
    remoteThumb,
    oembedThumb,
    searchResolving,
  } = useYoutubeTileMedia(link.url, link.id);

  const iconSrc =
    link.iconUrl && link.iconUrl.length > 0 ? link.iconUrl : faviconUrlForPage(link.url);
  const initial = link.name.trim().charAt(0).toUpperCase() || "?";

  function closeMenu(e: MouseEvent<HTMLButtonElement>) {
    (e.currentTarget.closest("details") as HTMLDetailsElement | null)?.removeAttribute("open");
  }

  const ytThumb = thumbList[thumbIdx] ?? thumbList[0];
  const showVimeoOrRemote = !effectiveYtId && !searchMode && remoteThumb;

  /** 유튜브 oEmbed 채널명(metaAuthor)은 표시하지 않음 — 수정한 link.name만 제목으로 쓰고 혼선 방지 */
  const metaLine =
    effectiveYtId || searchMode ? "YouTube" : hostLabel(link.url);

  return (
    <div
      className="group relative flex flex-col"
      data-mascot-anchor="link"
      data-mascot-link-id={link.id}
    >
      <a
        href={href || "#"}
        target={internal ? undefined : "_blank"}
        rel={internal ? undefined : "noopener noreferrer"}
        draggable={false}
        onDragStart={(e) => {
          e.preventDefault();
        }}
        onClick={(e) => {
          if (!href) e.preventDefault();
          else recordMascotLinkClick(link.id);
        }}
        className="block w-full max-w-full rounded-xl border border-transparent text-white no-underline outline-none transition-colors hover:border-white/10 hover:bg-white/[0.02] visited:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/25"
      >
        <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-[#212121] ring-1 ring-white/[0.06]">
          {effectiveYtId && ytThumb && !thumbDead ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={ytThumb}
              alt=""
              draggable={false}
              className="h-full w-full object-cover"
              onError={() => {
                if (thumbIdx < thumbList.length - 1) setThumbIdx((i) => i + 1);
                else setThumbDead(true);
              }}
            />
          ) : effectiveYtId && oembedThumb ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={oembedThumb}
              alt=""
              draggable={false}
              className="h-full w-full object-cover"
            />
          ) : effectiveYtId && thumbDead ? (
            <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-[#212121]">
              <span className="rounded bg-[#ff0000] px-2 py-1 text-[10px] font-bold text-white">YouTube</span>
              <span className="text-[10px] text-white/50">썸네일을 불러올 수 없음</span>
            </div>
          ) : showVimeoOrRemote ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={remoteThumb!}
              alt=""
              draggable={false}
              className="h-full w-full object-cover"
            />
          ) : searchMode && !effectiveYtId && searchResolving ? (
            <div className="relative flex h-full w-full items-center justify-center bg-gradient-to-br from-[#303030] via-[#181818] to-[#0a0a0a]">
              <span
                className="h-10 w-10 animate-pulse rounded-full border-2 border-white/20 border-t-coot-accent"
                aria-hidden
              />
              <span className="pointer-events-none absolute bottom-2 right-2 rounded bg-black/85 px-1.5 py-0.5 text-[11px] font-medium tabular-nums text-white">
                검색
              </span>
            </div>
          ) : searchMode && !effectiveYtId ? (
            <div className="relative flex h-full w-full items-center justify-center bg-gradient-to-br from-[#303030] via-[#181818] to-[#0a0a0a]">
              <span
                className="flex h-14 w-14 items-center justify-center rounded-full bg-[#ff0000] shadow-lg ring-2 ring-black/30 sm:h-16 sm:w-16"
                aria-hidden
              >
                <span className="ml-1 inline-block h-0 w-0 border-y-[11px] border-l-[18px] border-y-transparent border-l-white" />
              </span>
              <span className="pointer-events-none absolute bottom-2 right-2 rounded bg-black/85 px-1.5 py-0.5 text-[11px] font-medium tabular-nums text-white">
                검색
              </span>
            </div>
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-b from-[#2a2a2a] to-[#0d0d0d] px-4">
              {iconSrc && imgOk ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={iconSrc}
                  alt=""
                  draggable={false}
                  className="h-14 w-14 object-contain opacity-90"
                  onError={() => setImgOk(false)}
                />
              ) : (
                <span className="text-2xl font-semibold text-white/90">{initial}</span>
              )}
              <span className="text-center text-[10px] text-white/45">{hostLabel(link.url)}</span>
            </div>
          )}

          {(effectiveYtId || showVimeoOrRemote || (searchMode && !effectiveYtId)) && (
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/80 to-transparent" />
          )}
        </div>

        <div className="mt-2 flex min-h-[2.5rem] gap-1 pr-6">
          <h3 className="line-clamp-2 flex-1 text-left text-sm font-medium leading-snug text-white">
            {link.name}
          </h3>
        </div>
        <p className="mt-0.5 line-clamp-1 text-left text-xs text-white/55">{metaLine}</p>
      </a>

      <details className="absolute right-0 top-0 z-30 sm:right-0.5 sm:top-0.5">
        <summary
          className="list-none flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-black/60 text-white/80 opacity-95 ring-1 ring-white/10 backdrop-blur-sm transition-opacity hover:text-white [&::-webkit-details-marker]:hidden"
          aria-label="링크 메뉴"
        >
          ⋮
        </summary>
        <div className="absolute right-0 z-40 mt-1 min-w-[7.5rem] rounded-xl border border-white/10 bg-[#282828] py-1 shadow-xl">
          {onReorderUp ? (
            <button
              type="button"
              className="w-full px-3 py-2 text-left text-xs text-white hover:bg-white/[0.08]"
              onClick={(e) => {
                e.preventDefault();
                onReorderUp();
                closeMenu(e);
              }}
            >
              한 칸 위로
            </button>
          ) : null}
          {onReorderDown ? (
            <button
              type="button"
              className="w-full px-3 py-2 text-left text-xs text-white hover:bg-white/[0.08]"
              onClick={(e) => {
                e.preventDefault();
                onReorderDown();
                closeMenu(e);
              }}
            >
              한 칸 아래로
            </button>
          ) : null}
          <button
            type="button"
            className="w-full px-3 py-2 text-left text-xs text-white hover:bg-white/[0.08]"
            onClick={(e) => {
              e.preventDefault();
              onEdit();
              closeMenu(e);
            }}
          >
            수정
          </button>
          <button
            type="button"
            className="w-full px-3 py-2 text-left text-xs text-red-400 hover:bg-red-950/40"
            onClick={(e) => {
              e.preventDefault();
              onDelete();
              closeMenu(e);
            }}
          >
            삭제
          </button>
        </div>
      </details>
    </div>
  );
}
