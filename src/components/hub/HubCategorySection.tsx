"use client";

import { useState } from "react";
import type { HubCategory, HubLink } from "@/lib/hub-types";
import { isPortfolioVideoCategory } from "@/lib/hub-utils";
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
  const title = category.name.trim() || "이름 없는 구역";
  const portfolioVideo = isPortfolioVideoCategory(category.name);

  return (
    <section className="mb-12 sm:mb-16">
      {/* 제목과 도구를 한 줄(모바일은 세로)로 분리해 '이름 수정' 버튼이 제목처럼 보이지 않게 함 */}
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
        ) : (
          <>
            카드 왼쪽 위 <span className="text-coot-text">≡</span>를 드래그해 순서를 바꾸거나, 카드 오른쪽{" "}
            <span className="text-coot-text">⋮</span> 메뉴에서 위·아래로 이동할 수 있습니다.
          </>
        )}
      </p>

      <ul
        className={
          portfolioVideo
            ? "grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4"
            : "grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7"
        }
      >
        {category.links.map((link, index) => (
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
              dropTarget === index ? "ring-2 ring-coot-accent/60 ring-offset-2 ring-offset-coot-bg" : ""
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
              className="pointer-events-auto absolute left-1 top-1 z-[60] cursor-grab touch-none select-none rounded-md border border-coot-border/60 bg-coot-bg/95 px-1 py-0.5 text-[10px] leading-none text-coot-muted shadow-sm active:cursor-grabbing"
            >
              ≡
            </span>
          </li>
        ))}
        <li>
          <button
            type="button"
            onClick={onAdd}
            className={
              portfolioVideo
                ? "flex min-h-[12rem] w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-coot-border p-4 text-coot-muted transition-colors hover:border-coot-accent/50 hover:bg-white/[0.03] hover:text-coot-text sm:min-h-[14rem]"
                : "flex min-h-[8.5rem] w-full flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-coot-border p-3 text-coot-muted transition-colors hover:border-coot-accent/50 hover:bg-white/[0.03] hover:text-coot-text sm:min-h-[9rem]"
            }
          >
            <span className="flex h-[52px] w-[52px] items-center justify-center rounded-full border border-dashed border-coot-border text-2xl sm:h-14 sm:w-14">
              +
            </span>
            <span className="text-xs font-medium sm:text-sm">추가</span>
          </button>
        </li>
      </ul>
    </section>
  );
}
