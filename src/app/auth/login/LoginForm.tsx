"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/client";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const err = searchParams.get("error");
  const registered = searchParams.get("registered");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  if (!isSupabaseConfigured()) {
    return (
      <div className="mx-auto max-w-md px-4 py-16">
        <p className="text-coot-muted">
          Supabase가 설정되지 않았습니다. 프로젝트 루트에{" "}
          <code className="text-coot-text">.env.local</code>에{" "}
          <code className="text-coot-text">NEXT_PUBLIC_SUPABASE_URL</code>,{" "}
          <code className="text-coot-text">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>를 넣어 주세요.
        </p>
        <Link href="/" className="mt-6 inline-block text-sm text-coot-accent underline">
          홈으로
        </Link>
      </div>
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) {
        setMessage(error.message);
        setLoading(false);
        return;
      }
      router.replace("/");
      router.refresh();
    } catch {
      setMessage("로그인 중 오류가 났습니다.");
    }
    setLoading(false);
  }

  return (
    <div className="mx-auto max-w-md px-4 py-12 sm:py-16">
      <h1 className="text-2xl font-bold text-coot-text">로그인</h1>
      <p className="mt-2 text-sm text-coot-muted">
        로그인하면 다른 기기에서도 같은 링크 목록을 불러올 수 있습니다.
      </p>

      {registered ? (
        <p className="mt-4 rounded-xl border border-coot-border bg-coot-surface/50 px-3 py-2 text-sm text-coot-muted">
          회원가입이 완료되었습니다. 이메일 인증을 켜 둔 경우 메일함을 확인한 뒤 로그인하세요.
        </p>
      ) : null}
      {err ? (
        <p className="mt-4 text-sm text-red-400">인증에 실패했습니다. 다시 시도해 주세요.</p>
      ) : null}
      {message ? <p className="mt-4 text-sm text-red-400">{message}</p> : null}

      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <div>
          <label htmlFor="email" className="block text-xs font-medium text-coot-muted">
            이메일
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-xl border border-coot-border bg-coot-bg px-3 py-2 text-sm text-coot-text outline-none ring-coot-accent/30 focus:ring-2"
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-xs font-medium text-coot-muted">
            비밀번호
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-xl border border-coot-border bg-coot-bg px-3 py-2 text-sm text-coot-text outline-none ring-coot-accent/30 focus:ring-2"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full border border-coot-border bg-coot-surface py-2.5 text-sm font-medium text-coot-text hover:border-coot-accent/50 disabled:opacity-50"
        >
          {loading ? "처리 중…" : "로그인"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-coot-muted">
        계정이 없으면{" "}
        <Link href="/auth/signup" className="text-coot-accent underline underline-offset-2">
          회원가입
        </Link>
      </p>
      <p className="mt-4 text-center">
        <Link href="/" className="text-sm text-coot-muted hover:text-coot-text">
          ← 홈으로
        </Link>
      </p>
    </div>
  );
}
