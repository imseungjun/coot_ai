"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { getTopLinkIdsForMascot } from "@/lib/mascot-link-clicks";
import { MASCOT_BODY_W, type MascotMode } from "./mascot-types";

const HIT_W = MASCOT_BODY_W;

function clamp(n: number, min: number, max: number) {
  return Math.min(Math.max(n, min), max);
}

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useLayoutEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return reduced;
}

function randomInRange(a: number, b: number) {
  return a + Math.random() * (b - a);
}

function escapeAttrSelector(value: string) {
  if (typeof CSS !== "undefined" && typeof CSS.escape === "function") {
    return CSS.escape(value);
  }
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

type Options = {
  paused: boolean;
  enabled: boolean;
};

export function useMascotBehavior({ paused, enabled }: Options) {
  const reduced = usePrefersReducedMotion();
  const pausedRef = useRef(paused);
  pausedRef.current = paused;

  const xRef = useRef(12);
  const [x, setX] = useState(12);
  const [facing, setFacing] = useState(1);
  const [mode, setMode] = useState<MascotMode>("idle");
  const [inspectLinkId, setInspectLinkId] = useState<string | null>(null);
  /** 1·2·3순위(클릭 많은 링크)를 순서대로 돌며 방문 */
  const topVisitCycleRef = useRef(0);

  const syncX = useCallback((nx: number) => {
    const padX = 8;
    const maxX = Math.max(padX, window.innerWidth - HIT_W - padX);
    const cx = clamp(nx, padX, maxX);
    xRef.current = cx;
    setX(cx);
  }, []);

  const boundsX = useCallback(() => {
    const padX = 8;
    const maxX = Math.max(padX, window.innerWidth - HIT_W - padX);
    return { minX: padX, maxX };
  }, []);

  const randomTargetX = useCallback(() => {
    const { minX, maxX } = boundsX();
    return randomInRange(minX, maxX);
  }, [boundsX]);

  const animateToX = useCallback(
    (targetX: number, durationMs: number) => {
      const { minX, maxX } = boundsX();
      const to = clamp(targetX, minX, maxX);
      const from = xRef.current;
      const start = performance.now();

      return new Promise<void>((resolve) => {
        function frame(now: number) {
          if (!enabled || pausedRef.current) {
            resolve();
            return;
          }
          const t = Math.min(1, (now - start) / durationMs);
          const ease = 1 - (1 - t) ** 2;
          syncX(from + (to - from) * ease);
          if (t < 1) {
            requestAnimationFrame(frame);
          } else {
            resolve();
          }
        }
        requestAnimationFrame(frame);
      });
    },
    [boundsX, enabled, syncX],
  );

  const pointNearLinkX = useCallback(() => {
    const nodes = document.querySelectorAll<HTMLElement>('[data-mascot-anchor="link"]');
    if (nodes.length === 0) return { x: randomTargetX(), linkId: null as string | null };

    const top = getTopLinkIdsForMascot(5);
    /** 클릭 많은 순·기본(ChatGPT·Gemini·힉스필드) 순으로 순환, 가끔 아무 타일 */
    const useFavorite = Math.random() < 0.9;

    let el: HTMLElement | null = null;
    let linkId: string | null = null;

    if (useFavorite && top.length > 0) {
      const i = topVisitCycleRef.current % top.length;
      topVisitCycleRef.current++;
      const id = top[i]!.id;
      const sel = `[data-mascot-link-id="${escapeAttrSelector(id)}"]`;
      el = document.querySelector<HTMLElement>(sel);
      linkId = id;
    }

    if (!el) {
      const pick = nodes[Math.floor(Math.random() * nodes.length)]!;
      el = pick;
      linkId = pick.getAttribute("data-mascot-link-id");
    }

    const r = el.getBoundingClientRect();
    const side = Math.random() > 0.5 ? -1 : 1;
    const { minX, maxX } = boundsX();
    const raw = r.left + r.width / 2 - HIT_W / 2 + side * randomInRange(18, 40);
    return { x: clamp(raw, minX, maxX), linkId };
  }, [boundsX, randomTargetX]);

  useEffect(() => {
    if (!enabled || reduced || paused) return;
    let cancelled = false;

    async function loop() {
      let first = true;
      while (!cancelled) {
        if (pausedRef.current) {
          await new Promise((r) => setTimeout(r, 400));
          continue;
        }

        // 첫 사이클은 짧게: 곧 걷기·점프가 보이도록 (이후는 여유 있게)
        await new Promise((r) =>
          setTimeout(r, first ? randomInRange(900, 1800) : randomInRange(2400, 5200)),
        );
        first = false;
        if (cancelled || pausedRef.current) continue;

        const mobile = window.matchMedia("(max-width: 640px)").matches;
        const r = Math.random();

        /* 무작위 좌우는 소수만 — 대부분 인기 링크(클릭 상위 + 기본 GPT·제미나이·힉스필드) 근처 왕복 */
        if (r < 0.07) {
          const tx = randomTargetX();
          setFacing(tx < xRef.current ? -1 : 1);
          setMode("walk");
          await animateToX(tx, mobile ? randomInRange(900, 1500) : randomInRange(1100, 2000));
          if (cancelled) break;
          if (Math.random() < 0.45) {
            setMode("jump");
            await new Promise((res) => setTimeout(res, mobile ? 400 : 480));
            if (cancelled) break;
          }
          setMode("idle");
          continue;
        }

        if (r < 0.94) {
          const { x: tx, linkId } = pointNearLinkX();
          setFacing(tx < xRef.current ? -1 : 1);
          setMode("walk");
          await animateToX(tx, mobile ? randomInRange(1000, 1600) : randomInRange(1200, 2200));
          if (cancelled) break;
          setMode("jump");
          await new Promise((res) => setTimeout(res, mobile ? 420 : 500));
          if (cancelled) break;
          setMode("inspect");
          if (linkId) setInspectLinkId(linkId);
          await new Promise((res) => setTimeout(res, mobile ? 1200 : 1800));
          if (cancelled) break;
          setInspectLinkId(null);
          setMode("idle");
          continue;
        }

        await new Promise((res) => setTimeout(res, randomInRange(600, 1400)));
      }
    }

    loop();
    return () => {
      cancelled = true;
    };
  }, [enabled, reduced, paused, animateToX, pointNearLinkX, randomTargetX]);

  useEffect(() => {
    function onResize() {
      syncX(xRef.current);
    }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [syncX]);

  useEffect(() => {
    if (!inspectLinkId) return;
    const sel = `[data-mascot-link-id="${escapeAttrSelector(inspectLinkId)}"]`;
    const el = document.querySelector<HTMLElement>(sel);
    if (el) el.classList.add("mascot-near");
    return () => {
      if (el) el.classList.remove("mascot-near");
    };
  }, [inspectLinkId]);

  return {
    x,
    facing,
    mode,
    reduced,
  };
}
