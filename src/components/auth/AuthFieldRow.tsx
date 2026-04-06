"use client";

import type { ReactNode } from "react";

type AuthFieldRowProps = {
  icon: ReactNode;
  children: ReactNode;
  /** 포커스 시 테두리 강조 (유효 입력 등) */
  highlight?: boolean;
};

/** eformsign 스타일 — 왼쪽 아이콘 칸 + 오른쪽 입력 (다크톤) */
export function AuthFieldRow({ icon, children, highlight }: AuthFieldRowProps) {
  return (
    <div
      className={`flex overflow-hidden rounded-xl border bg-[#111111] transition focus-within:ring-2 focus-within:ring-coot-accent/25 ${
        highlight
          ? "border-coot-accent shadow-[0_0_0_1px_rgba(200,179,143,0.35)]"
          : "border-coot-border focus-within:border-coot-accent"
      }`}
    >
      <span
        className="flex w-11 shrink-0 select-none items-center justify-center border-r border-coot-border/80 bg-black/35 text-base text-coot-muted sm:w-12"
        aria-hidden
      >
        {icon}
      </span>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
