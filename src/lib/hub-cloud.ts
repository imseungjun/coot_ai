"use client";

import type { HubState } from "./hub-types";
import { isSupabaseConfigured } from "./supabase/env";

/** 로그인된 경우에만 서버에 허브 상태를 올립니다. */
export async function pushHubStateRemote(state: HubState): Promise<void> {
  if (!isSupabaseConfigured()) return;
  try {
    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return;
    await fetch("/api/hub-state", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(state),
    });
  } catch {
    /* 네트워크 오류는 무시 — 로컬은 이미 저장됨 */
  }
}
