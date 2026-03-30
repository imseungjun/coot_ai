"use client";

import { useEffect, useState, type MouseEvent } from "react";
import { recordMascotLinkClick } from "@/lib/mascot-link-clicks";
import { faviconUrlForPage, normalizeUrl } from "@/lib/hub-utils";
import type { HubLink } from "@/lib/hub-types";
import { parseYouTubeVideoId, youtubeThumbnailCandidates } from "@/lib/youtube";

type VideoLinkTileProps = {
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

export function VideoLinkTile({
  link,
  onEdit,
  onDelete,
  onReorderUp,
  onReorderDown,
}: VideoLinkTileProps) {
  const [imgOk, setImgOk] = useState(true);
  const href = normalizeUrl(link.url);
  const internal = href.startsWith("/");
  const ytId = parseYouTubeVideoId(link.url);
  const thumbList = ytId ? youtubeThumbnailCandidates(ytId) : [];
  const [thumbIdx, setThumbIdx] = useState(0);
  const [thumbDead, setThumbDead] = useState(false);
  const [remoteThumb, setRemoteThumb] = useState<string | null>(null);
  const [metaAuthor, setMetaAuthor] = useState<string | null>(null);
  const [provider, setProvider] = useState<string | null>(null);

  useEffect(() => {
    setThumbIdx(0);
    setThumbDead(false);
    setRemoteThumb(null);
    setMetaAuthor(null);
    setProvider(null);
    setImgOk(true);
  }, [link.id, link.url]);

  const iconSrc =
    link.iconUrl && link.iconUrl.length > 0 ? link.iconUrl : faviconUrlForPage(link.url);
  const initial = link.name.trim().charAt(0).toUpperCase() || "?";

  useEffect(() => {
    if (!href || internal) return;
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch(`/api/video-oembed?url=${encodeURIComponent(href)}`);
        if (!r.ok || cancelled) return;
        const j = (await r.json()) as {
          author_name?: string | null;
          thumbnail_url?: string | null;
          provider?: string | null;
        };
        if (cancelled) return;
        if (!ytId && j.thumbnail_url) setRemoteThumb(j.thumbnail_url);
        if (j.author_name) setMetaAuthor(j.author_name);
        if (j.provider) setProvider(j.provider);
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [href, internal, ytId]);

  function closeMenu(e: MouseEvent<HTMLButtonElement>) {
    (e.currentTarget.closest("details") as HTMLDetailsElement | null)?.removeAttribute("open");
  }

  const ytThumb = thumbList[thumbIdx] ?? thumbList[0];
  const showVimeoOrRemote = !ytId && remoteThumb;

  const metaSecondary =
    metaAuthor != null
      ? metaAuthor
      : provider === "youtube" || ytId
        ? "YouTube"
        : provider === "vimeo"
          ? "Vimeo"
          : hostLabel(link.url);

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
        className="block rounded-xl border border-transparent outline-none transition-colors hover:border-coot-border hover:bg-white/[0.03]"
      >
        <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-zinc-900 ring-1 ring-white/[0.06]">
          {ytId && ytThumb && !thumbDead ? (
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
          ) : ytId && thumbDead ? (
            <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-zinc-900">
              <span className="rounded bg-red-600 px-2 py-1 text-[10px] font-bold text-white">YouTube</span>
              <span className="text-[10px] text-coot-muted">썸네일을 불러올 수 없음</span>
            </div>
          ) : showVimeoOrRemote ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={remoteThumb!}
              alt=""
              draggable={false}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-b from-zinc-800 to-zinc-950 px-4">
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
                <span className="text-2xl font-semibold text-coot-accent">{initial}</span>
              )}
              <span className="text-center text-[10px] text-coot-muted">썸네일 없음 · {hostLabel(link.url)}</span>
            </div>
          )}

          {ytId || showVimeoOrRemote ? (
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/70 to-transparent" />
          ) : null}
        </div>

        <div className="mt-2 flex min-h-[2.75rem] gap-1.5 pr-5">
          <h3 className="line-clamp-2 flex-1 text-left text-sm font-semibold leading-snug text-coot-text">
            {link.name}
          </h3>
        </div>
        <p className="mt-0.5 line-clamp-1 text-left text-xs text-coot-muted">{metaSecondary}</p>
      </a>

      <details className="absolute right-1 top-1 z-30">
        <summary
          className="list-none flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-black/55 text-coot-muted opacity-95 ring-1 ring-white/10 backdrop-blur-sm transition-opacity hover:text-coot-text sm:opacity-0 sm:group-hover:opacity-100 [&::-webkit-details-marker]:hidden"
          aria-label="링크 메뉴"
        >
          ⋮
        </summary>
        <div className="absolute right-0 z-40 mt-1 min-w-[7.5rem] rounded-xl border border-coot-border bg-coot-bg py-1 shadow-lg">
          {onReorderUp ? (
            <button
              type="button"
              className="w-full px-3 py-2 text-left text-xs text-coot-text hover:bg-white/[0.06]"
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
              className="w-full px-3 py-2 text-left text-xs text-coot-text hover:bg-white/[0.06]"
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
            className="w-full px-3 py-2 text-left text-xs text-coot-text hover:bg-white/[0.06]"
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
            className="w-full px-3 py-2 text-left text-xs text-red-400 hover:bg-red-950/30"
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
