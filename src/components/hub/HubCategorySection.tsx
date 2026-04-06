"use client";

import { useState } from "react";
import type { HubCategory, HubLink } from "@/lib/hub-types";
import { isKootCirclePortfolioCategory, isPortfolioVideoCategory } from "@/lib/hub-utils";
import { KootPortfolioVideoTile } from "./KootPortfolioVideoTile";
import { LinkTile } from "./LinkTile";
import { VideoLinkTile } from "./VideoLinkTile";

type HubCategorySectionProps = {
  category: HubCategory;
  onAdd: () => void;
  onEditLink: (link: HubLink) => void;
  onDeleteLink: (linkId: string) => void;
  onMoveLink: (fromIndex: number, toIndex: number) => void;
  onEditCategory: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDeleteCategory: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
};

export function HubCategorySection({
  category,
  onAdd,
  onEditLink,
  onDeleteLink,
  onMoveLink,
  onEditCategory,
  onMoveUp,
  onMoveDown,
  onDeleteCategory,
  canMoveUp,
  canMoveDown,
}: HubCategorySectionProps) {
  const [dropTarget, setDropTarget] = useState<number | null>(null);
  const [kootSortTab, setKootSortTab] = useState<"latest" | "popular" | "date">("latest");
  const title = category.name.trim() || "이름 없는 구역";
  const kootCircle = isKootCirclePortfolioCategory(category.name, category.id);
  const portfolioVideo = isPortfolioVideoCategory(category.name, category.id);

  /** hub-category-grid* 클래스는 globals.css에서 그리드·목록 초기화(글머리 제거) 고정 */
  const gridClassName = kootCircle
    ? "hub-category-grid hub-category-grid--koot grid grid-cols-2 items-start gap-x-3 gap-y-5 sm:grid-cols-3 sm:gap-x-4 lg:grid-cols-4"
    : portfolioVideo
      ? "hub-category-grid hub-category-grid--video grid grid-cols-2 items-start gap-4 sm:grid-cols-3 lg:grid-cols-4"
      : "hub-category-grid hub-category-grid--default grid grid-cols-2 items-start gap-3 sm:grid-cols-4 sm:gap-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7";

  const linkRows = category.links.map((link, index) => (
    <li
      key={link.id}
      onDragOver={(e) => {
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = "move";
        setDropTarget(index);
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
          setDropTarget(null);
        }
      }}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
        const raw = e.dataTransfer.getData("text/plain");
        const from = Number.parseInt(raw, 10);
        setDropTarget(null);
        if (!Number.isNaN(from) && from !== index) {
          onMoveLink(from, index);
        }
      }}
      className={`relative min-h-0 rounded-2xl transition-shadow ${
        dropTarget === index
          ? kootCircle
            ? "ring-2 ring-white/35 ring-offset-2 ring-offset-[#0f0f0f]"
            : "ring-2 ring-coot-accent/60 ring-offset-2 ring-offset-coot-bg"
          : ""
      }`}
    >
      {portfolioVideo ? (
        <VideoLinkTile
          link={link}
          onEdit={() => onEditLink(link)}
          onDelete={() => {
            if (typeof window !== "undefined" && window.confirm("이 링크를 삭제할까요?")) {
              onDeleteLink(link.id);
            }
          }}
          onReorderUp={index > 0 ? () => onMoveLink(index, index - 1) : undefined}
          onReorderDown={
            index < category.links.length - 1 ? () => onMoveLink(index, index + 1) : undefined
          }
        />
      ) : kootCircle ? (
        <KootPortfolioVideoTile
          link={link}
          onEdit={() => onEditLink(link)}
          onDelete={() => {
            if (typeof window !== "undefined" && window.confirm("이 링크를 삭제할까요?")) {
              onDeleteLink(link.id);
            }
          }}
          onReorderUp={index > 0 ? () => onMoveLink(index, index - 1) : undefined}
          onReorderDown={
            index < category.links.length - 1 ? () => onMoveLink(index, index + 1) : undefined
          }
        />
      ) : (
        <LinkTile
          link={link}
          onEdit={() => onEditLink(link)}
          onDelete={() => {
            if (typeof window !== "undefined" && window.confirm("이 링크를 삭제할까요?")) {
              onDeleteLink(link.id);
            }
          }}
          onReorderUp={index > 0 ? () => onMoveLink(index, index - 1) : undefined}
          onReorderDown={
            index < category.links.length - 1 ? () => onMoveLink(index, index + 1) : undefined
          }
        />
      )}
      <span
        draggable
        title="이 핸들을 드래그해 순서 변경"
        aria-label="링크 순서 변경"
        onDragStart={(e) => {
          e.stopPropagation();
          e.dataTransfer.setData("text/plain", String(index));
          e.dataTransfer.effectAllowed = "move";
        }}
        onDragEnd={() => setDropTarget(null)}
        className={`pointer-events-auto absolute left-1 top-1 z-[60] cursor-grab touch-none select-none rounded-md px-1 py-0.5 text-[10px] leading-none shadow-sm active:cursor-grabbing ${
          kootCircle
            ? "border border-white/25 bg-black/75 text-white/85"
            : "border border-coot-border/60 bg-coot-bg/95 text-coot-muted"
        }`}
      >
        ≡
      </span>
    </li>
  ));

  const addTile = (
    <li key="__add">
      <button
        type="button"
        onClick={onAdd}
        className={
          portfolioVideo || kootCircle
            ? "flex min-h-[12rem] w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-white/20 bg-[#0f0f0f]/40 p-4 text-white/50 transition-colors hover:border-white/35 hover:bg-white/[0.04] hover:text-white/80 sm:min-h-[14rem]"
            : "flex min-h-[8.5rem] w-full flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-coot-border p-3 text-coot-muted transition-colors hover:border-coot-accent/50 hover:bg-white/[0.03] hover:text-coot-text sm:min-h-[9rem]"
        }
      >
        <span
          className={`flex h-[52px] w-[52px] items-center justify-center rounded-full border border-dashed text-2xl sm:h-14 sm:w-14 ${
            kootCircle ? "border-white/25 text-white/60" : "border-coot-border"
          }`}
        >
          +
        </span>
        <span className="text-xs font-medium sm:text-sm">추가</span>
      </button>
    </li>
  );

  const sortBar = kootCircle ? (
    <div className="mb-4 flex flex-wrap gap-2">
      {(
        [
          ["latest", "최신순"],
          ["popular", "인기순"],
          ["date", "날짜순"],
        ] as const
      ).map(([id, label]) => (
        <button
          key={id}
          type="button"
          onClick={() => setKootSortTab(id)}
          className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
            kootSortTab === id
              ? "bg-white text-black"
              : "bg-[#272727] text-white/95 hover:bg-[#3f3f3f]"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  ) : null;

  const grid = (
    <ul className={`${gridClassName} m-0 w-full max-w-full list-none p-0`}>
      {linkRows}
      {addTile}
    </ul>
  );

  return (
    <section
      id={kootCircle ? "koot-portfolio" : undefined}
      className={`mb-12 w-full max-w-full sm:mb-16 ${kootCircle ? "scroll-mt-28" : "scroll-mt-24"}`}
    >
      <div className="mb-4 flex flex-col gap-3 border-b border-coot-border/40 pb-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="flex min-w-0 items-start gap-2 sm:gap-3">
          <span
            className="mt-1 shrink-0 cursor-default text-coot-muted select-none"
            title="카테고리 순서는 오른쪽 화살표로 변경"
            aria-hidden
          >
            ⋮⋮
          </span>
          <h2 className="min-w-0 break-words text-xl font-bold tracking-tight text-coot-text sm:text-2xl">
            {title}
          </h2>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
          <button
            type="button"
            onClick={onEditCategory}
            className="rounded-full border border-coot-border bg-coot-surface px-3 py-1.5 text-xs font-medium text-coot-text hover:border-coot-accent/50"
          >
            구역명 편집
          </button>
          <button
            type="button"
            onClick={onMoveUp}
            disabled={!canMoveUp}
            className="rounded-full border border-coot-border bg-coot-surface/50 px-3 py-1.5 text-xs font-medium text-coot-muted hover:text-coot-text disabled:opacity-30"
            title="구역을 위로"
          >
            ↑
          </button>
          <button
            type="button"
            onClick={onMoveDown}
            disabled={!canMoveDown}
            className="rounded-full border border-coot-border bg-coot-surface/50 px-3 py-1.5 text-xs font-medium text-coot-muted hover:text-coot-text disabled:opacity-30"
            title="구역을 아래로"
          >
            ↓
          </button>
          <details className="relative">
            <summary className="list-none cursor-pointer rounded-full border border-coot-border bg-coot-surface/50 px-3 py-1.5 text-xs font-medium text-coot-muted hover:text-coot-text [&::-webkit-details-marker]:hidden">
              더보기
            </summary>
            <div className="absolute right-0 z-30 mt-1 min-w-[9rem] rounded-xl border border-coot-border bg-coot-bg py-1 shadow-lg">
              <button
                type="button"
                onClick={() => onDeleteCategory()}
                className="w-full px-3 py-2 text-left text-xs text-red-400 hover:bg-red-950/30"
              >
                구역 삭제
              </button>
            </div>
          </details>
        </div>
      </div>

      <p className="mb-3 text-xs text-coot-muted">
        {portfolioVideo ? (
          <>
            썸네일 왼쪽 위 <span className="text-coot-text">≡</span>를 드래그해 순서를 바꾸거나, 썸네일 오른쪽 위{" "}
            <span className="text-coot-text">⋮</span> 메뉴에서 위·아래로 이동할 수 있습니다.
          </>
        ) : kootCircle ? (
          <>
            동영상 카드 왼쪽 위 <span className="text-coot-text">≡</span>로 순서를 바꾸거나, 썸네일 오른쪽 위{" "}
            <span className="text-coot-text">⋮</span>에서 이동·수정할 수 있습니다.
          </>
        ) : (
          <>
            카드 왼쪽 위 <span className="text-coot-text">≡</span>를 드래그해 순서를 바꾸거나, 카드 오른쪽{" "}
            <span className="text-coot-text">⋮</span> 메뉴에서 위·아래로 이동할 수 있습니다.
          </>
        )}
      </p>

      {kootCircle ? (
        <div className="w-full max-w-full overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0f0f0f] p-4 sm:p-5">
          {sortBar}
          {grid}
        </div>
      ) : (
        grid
      )}
    </section>
  );
}
