"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { getTopLinkIdsForMascot } from "@/lib/mascot-link-clicks";
import { MASCOT_CONTAINER_H, MASCOT_BODY_W, type MascotMode } from "./mascot-types";

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

function initialY(): number {
  if (typeof window === "undefined") return 400;
  const pad = 8;
  return Math.max(pad, window.innerHeight - MASCOT_CONTAINER_H - 20);
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
  const yRef = useRef(initialY());
  const [x, setX] = useState(12);
  const [y, setY] = useState(() => initialY());
  const [facing, setFacing] = useState(1);
  const [mode, setMode] = useState<MascotMode>("idle");
  const [inspectLinkId, setInspectLinkId] = useState<string | null>(null);
  const topVisitCycleRef = useRef(0);

  const bounds = useCallback(() => {
    const pad = 8;
    const vh = window.innerHeight;
    const vw = window.innerWidth;
    const maxX = Math.max(pad, vw - HIT_W - pad);
    const maxY = Math.max(pad, vh - MASCOT_CONTAINER_H - pad);
    return { minX: pad, maxX, minY: pad, maxY };
  }, []);

  const syncX = useCallback((nx: number) => {
    const { minX, maxX } = bounds();
    const cx = clamp(nx, minX, maxX);
    xRef.current = cx;
    setX(cx);
  }, [bounds]);

  const syncY = useCallback((ny: number) => {
    const { minY, maxY } = bounds();
    const cy = clamp(ny, minY, maxY);
    yRef.current = cy;
    setY(cy);
  }, [bounds]);

  const randomTargetPose = useCallback(() => {
    const { minX, maxX, minY, maxY } = bounds();
    return {
      x: randomInRange(minX, maxX),
      y: randomInRange(minY, maxY),
    };
  }, [bounds]);

  const animateToPose = useCallback(
    (targetX: number, targetY: number, durationMs: number) => {
      const { minX, maxX, minY, maxY } = bounds();
      const toX = clamp(targetX, minX, maxX);
      const toY = clamp(targetY, minY, maxY);
      const fromX = xRef.current;
      const fromY = yRef.current;
      const start = performance.now();

      return new Promise<void>((resolve) => {
        function frame(now: number) {
          if (!enabled || pausedRef.current) {
            resolve();
            return;
          }
          const t = Math.min(1, (now - start) / durationMs);
          const ease = 1 - (1 - t) ** 2;
          syncX(fromX + (toX - fromX) * ease);
          syncY(fromY + (toY - fromY) * ease);
          if (t < 1) {
            requestAnimationFrame(frame);
          } else {
            resolve();
          }
        }
        requestAnimationFrame(frame);
      });
    },
    [bounds, enabled, syncX, syncY],
  );

  const pointNearLink = useCallback(() => {
    const nodes = document.querySelectorAll<HTMLElement>('[data-mascot-anchor="link"]');
    if (nodes.length === 0) {
      const p = randomTargetPose();
      return { x: p.x, y: p.y, linkId: null as string | null };
    }

    const top = getTopLinkIdsForMascot(6);
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
    const { minX, maxX, minY, maxY } = bounds();
    const linkCx = r.left + r.width / 2;
    const linkCy = r.top + r.height / 2;
    const rawX = linkCx - HIT_W / 2 + side * randomInRange(18, 40);
    const rawY = linkCy - MASCOT_CONTAINER_H / 2 + randomInRange(-14, 14);
    return {
      x: clamp(rawX, minX, maxX),
      y: clamp(rawY, minY, maxY),
      linkId,
    };
  }, [bounds, randomTargetPose]);

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

        await new Promise((r) =>
          setTimeout(r, first ? randomInRange(900, 1800) : randomInRange(2400, 5200)),
        );
        first = false;
        if (cancelled || pausedRef.current) continue;

        const mobile = window.matchMedia("(max-width: 640px)").matches;
        const r = Math.random();

        /* 뷰포트 아무 곳이나 배회 */
        if (r < 0.14) {
          const { x: tx, y: ty } = randomTargetPose();
          setFacing(tx < xRef.current ? -1 : 1);
          setMode("walk");
          await animateToPose(tx, ty, mobile ? randomInRange(900, 1500) : randomInRange(1100, 2000));
          if (cancelled) break;
          if (Math.random() < 0.45) {
            setMode("jump");
            await new Promise((res) => setTimeout(res, mobile ? 400 : 480));
            if (cancelled) break;
          }
          setMode("idle");
          continue;
        }

        if (r < 0.93) {
          const { x: tx, y: ty, linkId } = pointNearLink();
          setFacing(tx < xRef.current ? -1 : 1);
          setMode("walk");
          await animateToPose(tx, ty, mobile ? randomInRange(1000, 1600) : randomInRange(1200, 2200));
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
  }, [enabled, reduced, paused, animateToPose, pointNearLink, randomTargetPose]);

  useEffect(() => {
    function onResize() {
      syncX(xRef.current);
      syncY(yRef.current);
    }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [syncX, syncY]);

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
    y,
    facing,
    mode,
    reduced,
  };
}
