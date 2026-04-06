"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/client";

const btnBase =
  "inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-medium transition sm:px-4 sm:text-sm";

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

  /** Supabase 미설정 시에도 우측에 버튼 표시 → 클릭 시 설정 안내 페이지로 이동 */
  if (!isSupabaseConfigured()) {
    return (
      <div className="flex shrink-0 items-center gap-2 sm:gap-2.5">
        <Link
          href="/auth/login"
          className={`${btnBase} border border-coot-border bg-coot-surface/50 text-coot-text hover:border-coot-accent/50`}
        >
          로그인
        </Link>
        <Link
          href="/auth/signup"
          className={`${btnBase} border border-coot-accent/40 bg-coot-surface text-coot-accent hover:bg-white/[0.06]`}
        >
          회원가입
        </Link>
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="flex h-8 shrink-0 items-center gap-2 sm:h-9">
        <div className="h-8 w-[4.5rem] animate-pulse rounded-full bg-coot-border/25 sm:w-[5rem]" />
        <div className="h-8 w-[5rem] animate-pulse rounded-full bg-coot-border/25 sm:w-[5.5rem]" />
      </div>
    );
  }

  return (
    <div className="flex shrink-0 items-center gap-2 sm:gap-2.5">
      {session?.user ? (
        <>
          <span className="hidden max-w-[10rem] truncate text-xs text-coot-muted sm:inline lg:max-w-[14rem]">
            {session.user.email}
          </span>
          <button
            type="button"
            onClick={() => void signOut()}
            className={`${btnBase} border border-coot-border bg-coot-surface/50 text-coot-muted hover:text-coot-text`}
          >
            로그아웃
          </button>
        </>
      ) : (
        <>
          <Link
            href="/auth/login"
            className={`${btnBase} border border-coot-border bg-coot-surface/50 text-coot-text hover:border-coot-accent/50`}
          >
            로그인
          </Link>
          <Link
            href="/auth/signup"
            className={`${btnBase} border border-coot-accent/40 bg-coot-surface text-coot-accent hover:bg-white/[0.06]`}
          >
            회원가입
          </Link>
        </>
      )}
    </div>
  );
}
