"use client";

import { useCallback, useLayoutEffect, useState } from "react";
import { COOT_MASCOT_CHARACTER } from "@/lib/coot-brand";
import {
  MASCOT_BODY_H,
  MASCOT_BODY_W,
  MASCOT_CONTAINER_H,
  MASCOT_RAIL_BOTTOM_PX,
  MASCOT_STORAGE_DISABLED,
} from "./mascot-types";
import { useMascotBehavior } from "./useMascotBehavior";

type MascotAgentProps = {
  /** 모달 등 열릴 때 움직임·보조 애니메이션 정지 */
  paused?: boolean;
};

export function MascotAgent({ paused = false }: MascotAgentProps) {
  const [showMascot, setShowMascot] = useState(true);

  useLayoutEffect(() => {
    try {
      setShowMascot(localStorage.getItem(MASCOT_STORAGE_DISABLED) !== "1");
    } catch {
      setShowMascot(true);
    }
  }, []);

  const toggle = useCallback(() => {
    setShowMascot((prev) => {
      const next = !prev;
      try {
        if (!next) localStorage.setItem(MASCOT_STORAGE_DISABLED, "1");
        else localStorage.removeItem(MASCOT_STORAGE_DISABLED);
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const { x, y, facing, mode, reduced } = useMascotBehavior({
    paused,
    enabled: showMascot,
  });

  const motionOk = showMascot && !reduced && !paused;
  const staticX = 8;
  const displayX = reduced && showMascot ? staticX : x;
  const displayY = reduced && showMascot ? undefined : y;

  if (!showMascot) {
    return (
      <div className="pointer-events-none fixed bottom-4 left-4 z-40 sm:bottom-6 sm:left-6">
        <button
          type="button"
          onClick={toggle}
          className="pointer-events-auto rounded-full border border-coot-border bg-coot-surface/95 px-3 py-1.5 text-xs font-medium text-coot-muted shadow-lg backdrop-blur hover:border-coot-accent/50 hover:text-coot-text"
        >
          캐릭터 켜기
        </button>
      </div>
    );
  }

  return (
    <div
      className="pointer-events-none fixed z-40 select-none will-change-transform"
      style={{
        left: displayX,
        ...(displayY !== undefined
          ? { top: displayY, bottom: "auto" }
          : { bottom: MASCOT_RAIL_BOTTOM_PX, top: "auto" }),
        width: MASCOT_BODY_W,
        height: MASCOT_CONTAINER_H,
      }}
      aria-hidden
    >
      <div className="relative flex h-full w-full flex-col items-center justify-end">
        <div
          className="flex items-end justify-center"
          style={{
            transform: `scaleX(${facing})`,
            transformOrigin: "center bottom",
          }}
        >
          <div
            className={[
              "will-change-transform",
              motionOk && mode === "idle"
                ? "animate-mascot-breathe"
                : motionOk && mode === "walk"
                  ? "animate-mascot-walk"
                  : motionOk && mode === "jump"
                    ? "animate-mascot-hop"
                    : motionOk && mode === "inspect"
                      ? "animate-mascot-inspect"
                      : "",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={COOT_MASCOT_CHARACTER}
              alt="COOT 마스코트"
              width={MASCOT_BODY_W}
              height={MASCOT_BODY_H}
              className={
                motionOk
                  ? "pointer-events-none bg-transparent max-h-[74px] w-auto max-w-[60px] object-contain object-bottom drop-shadow-[0_2px_8px_rgba(200,179,143,0.25)] drop-shadow-[0_0_11px_rgba(49,46,46,0.5)]"
                  : "pointer-events-none bg-transparent max-h-[74px] w-auto max-w-[60px] object-contain object-bottom"
              }
              style={{ height: MASCOT_BODY_H }}
              draggable={false}
            />
          </div>
        </div>

        <div
          className={`pointer-events-none absolute bottom-0 left-1/2 h-1.5 w-[26px] -translate-x-1/2 rounded-[100%] bg-black/35 blur-[1px] ${
            motionOk && mode === "jump" ? "animate-mascot-shadow-hop" : ""
          } ${motionOk && mode === "walk" ? "animate-mascot-shadow-walk" : ""}`}
          aria-hidden
        />
      </div>

      <button
        type="button"
        onClick={toggle}
        className="pointer-events-auto absolute -right-1 top-0 rounded-full border border-coot-border bg-coot-bg/95 px-1.5 py-0.5 text-[10px] font-medium text-coot-muted shadow hover:text-coot-text"
        aria-label="캐릭터 숨기기"
      >
        숨김
      </button>
    </div>
  );
}
