"use client";

import type { HubState } from "./hub-types";
import { serializeHubState } from "./hub-storage";

export type HubBaselineMeta = {
  state: HubState | null;
  writable: boolean;
};

let baselineWritable = false;
let baselineWritableKnown = false;

export function isHubBaselineWorkspaceWritable(): boolean {
  return baselineWritableKnown && baselineWritable;
}

export async function fetchHubBaselineMeta(): Promise<HubBaselineMeta> {
  try {
    const res = await fetch("/api/hub-baseline");
    if (!res.ok) {
      baselineWritable = false;
      baselineWritableKnown = true;
      return { state: null, writable: false };
    }
    const json = (await res.json()) as HubBaselineMeta & { error?: string };
    baselineWritable = !!json.writable;
    baselineWritableKnown = true;
    return { state: json.state ?? null, writable: baselineWritable };
  } catch {
    baselineWritable = false;
    baselineWritableKnown = true;
    return { state: null, writable: false };
  }
}

const DEBOUNCE_MS = 1200;
let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let lastWrittenJson: string | null = null;

/**
 * 개발 서버(next dev) 또는 HUB_BASELINE_WRITE=1 인 로컬 next start 에서
 * data/hub-baseline.json 으로 디바운스 저장합니다.
 */
export function schedulePushHubBaseline(state: HubState): void {
  if (!isHubBaselineWorkspaceWritable()) return;
  const json = serializeHubState(state);
  if (json === lastWrittenJson) return;
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    debounceTimer = null;
    void pushHubBaselineNow(json);
  }, DEBOUNCE_MS);
}

/** 즉시 디스크에 쓰기. 성공 여부를 반환합니다. */
export async function flushHubBaseline(state: HubState): Promise<boolean> {
  if (!isHubBaselineWorkspaceWritable()) return false;
  const json = serializeHubState(state);
  lastWrittenJson = json;
  if (debounceTimer) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
  }
  return pushHubBaselineNow(json);
}

async function pushHubBaselineNow(json: string): Promise<boolean> {
  if (!isHubBaselineWorkspaceWritable()) return false;
  try {
    const res = await fetch("/api/hub-baseline", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: json,
    });
    if (res.ok) {
      lastWrittenJson = json;
      return true;
    }
    return false;
  } catch {
    return false;
  }
}
