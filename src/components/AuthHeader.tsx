"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/client";

export function AuthHeader() {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setReady(true);
      return;
    }
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setReady(true);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });
    return () => subscription.unsubscribe();
  }, []);

  async function signOut() {
    if (!isSupabaseConfigured()) return;
    const supabase = createClient();
    await supabase.auth.signOut();
    router.refresh();
    window.location.href = "/";
  }

  if (!ready || !isSupabaseConfigured()) {
    return null;
  }

  return (
    <div className="flex max-w-[min(100%,12rem)] flex-col items-end gap-1 sm:max-w-none sm:flex-row sm:items-center sm:gap-2">
      {session?.user ? (
        <>
          <span className="hidden truncate text-xs text-coot-muted sm:inline sm:max-w-[10rem]">
            {session.user.email}
          </span>
          <button
            type="button"
            onClick={() => void signOut()}
            className="shrink-0 rounded-full border border-coot-border bg-coot-surface/50 px-3 py-1 text-xs font-medium text-coot-muted hover:text-coot-text"
          >
            로그아웃
          </button>
        </>
      ) : (
        <>
          <Link
            href="/auth/login"
            className="shrink-0 rounded-full border border-coot-border bg-coot-surface/50 px-3 py-1 text-xs font-medium text-coot-text hover:border-coot-accent/50"
          >
            로그인
          </Link>
          <Link
            href="/auth/signup"
            className="shrink-0 rounded-full border border-coot-accent/40 bg-coot-surface px-3 py-1 text-xs font-medium text-coot-accent hover:bg-white/[0.06]"
          >
            회원가입
          </Link>
        </>
      )}
    </div>
  );
}
