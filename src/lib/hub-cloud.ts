"use client";

import type { HubState } from "./hub-types";
import { isSupabaseConfigured } from "./supabase/env";

async function putHubStateOnce(body: string): Promise<Response> {
  return fetch("/api/hub-state", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body,
  });
}

/**
 * 로그인된 경우에만 서버에 허브 상태를 올립니다.
 * 링크 수정·순서 변경 직후 호출되며, 일시 오류 시 1회 재시도합니다.
 */
export async function pushHubStateRemote(state: HubState): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  try {
    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return false;

    const json = JSON.stringify(state);
    let res = await putHubStateOnce(json);
    if (!res.ok && res.status >= 500) {
      await new Promise((r) => setTimeout(r, 400));
      res = await putHubStateOnce(json);
    }
    return res.ok;
  } catch {
    return false;
  }
}
