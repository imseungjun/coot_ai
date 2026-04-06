"use client";

import { useState, type MouseEvent } from "react";
import { recordMascotLinkClick } from "@/lib/mascot-link-clicks";
import { faviconUrlForPage, normalizeUrl } from "@/lib/hub-utils";
import type { HubLink } from "@/lib/hub-types";

type LinkTileProps = {
  link: HubLink;
  onEdit: () => void;
  onDelete: () => void;
  onReorderUp?: () => void;
  onReorderDown?: () => void;
};

export function LinkTile({ link, onEdit, onDelete, onReorderUp, onReorderDown }: LinkTileProps) {
  const [imgOk, setImgOk] = useState(true);
  const iconSrc =
    link.iconUrl && link.iconUrl.length > 0 ? link.iconUrl : faviconUrlForPage(link.url);
  const iconImgClass =
    link.iconUrl && link.iconUrl.length > 0
      ? "h-9 w-9 object-contain sm:h-10 sm:w-10"
      : "h-8 w-8 object-contain sm:h-9 sm:w-9";
  const initial = link.name.trim().charAt(0).toUpperCase() || "?";
  const href = normalizeUrl(link.url);
  const internal = href.startsWith("/");

  function closeMenu(e: MouseEvent<HTMLButtonElement>) {
    (e.currentTarget.closest("details") as HTMLDetailsElement | null)?.removeAttribute("open");
  }

  return (
    <div
      className="hub-link-tile group relative flex min-h-[8.5rem] flex-col pt-6 sm:min-h-[9rem] sm:pt-7"
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
        className="flex flex-1 flex-col items-center gap-2 rounded-2xl border border-transparent px-3 pb-2 pt-1 text-center text-coot-text no-underline transition-colors hover:border-coot-border hover:bg-white/[0.04]"
      >
        <span className="flex h-[52px] w-[52px] shrink-0 items-center justify-center overflow-hidden rounded-full bg-white shadow-sm sm:h-14 sm:w-14">
          {iconSrc && imgOk ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={iconSrc}
              alt=""
              draggable={false}
              className={iconImgClass}
              onError={() => setImgOk(false)}
            />
          ) : (
            <span className="text-lg font-semibold text-coot-accent">{initial}</span>
          )}
        </span>
        <span className="line-clamp-2 flex min-h-[2.5rem] w-full max-w-[7rem] items-start justify-center text-center text-xs font-medium leading-snug text-coot-text sm:max-w-[7.5rem] sm:text-sm">
          {link.name}
        </span>
      </a>

      <details className="absolute right-0 top-0 z-30">
        <summary
          className="list-none flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-coot-bg/95 text-coot-muted ring-1 ring-coot-border opacity-95 transition-opacity hover:text-coot-text [&::-webkit-details-marker]:hidden"
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
