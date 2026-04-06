"use client";

import { useEffect, useState } from "react";

/** 서버 기준 Supabase 공개 키 설정 여부(클라이언트 번들과 무관) */
export function useAuthEnvStatus(): boolean | null {
  const [configured, setConfigured] = useState<boolean | null>(null);
  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/env-status")
      .then((r) => r.json())
      .then((d: { configured?: boolean }) => {
        if (!cancelled) setConfigured(!!d.configured);
      })
      .catch(() => {
        if (!cancelled) setConfigured(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);
  return configured;
}
