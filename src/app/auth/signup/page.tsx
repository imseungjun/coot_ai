"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  if (!isSupabaseConfigured()) {
    return (
      <div className="mx-auto max-w-md px-4 py-16">
        <p className="text-coot-muted">
          Supabase가 설정되지 않았습니다. <code className="text-coot-text">.env.local</code>를 확인해 주세요.
        </p>
        <Link href="/" className="mt-6 inline-block text-sm text-coot-accent underline">
          홈으로
        </Link>
      </div>
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    if (password.length < 6) {
      setMessage("비밀번호는 6자 이상으로 해 주세요.");
      return;
    }
    if (password !== password2) {
      setMessage("비밀번호가 서로 다릅니다.");
      return;
    }
    setLoading(true);
    try {
      const supabase = createClient();
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: origin ? `${origin}/auth/callback` : undefined,
        },
      });
      if (error) {
        setMessage(error.message);
        setLoading(false);
        return;
      }
      router.replace("/auth/login?registered=1");
      router.refresh();
    } catch {
      setMessage("가입 처리 중 오류가 났습니다.");
    }
    setLoading(false);
  }

  return (
    <div className="mx-auto max-w-md px-4 py-12 sm:py-16">
      <h1 className="text-2xl font-bold text-coot-text">회원가입</h1>
      <p className="mt-2 text-sm text-coot-muted">이메일과 비밀번호로 계정을 만듭니다.</p>
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
            비밀번호 (6자 이상)
          </label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-xl border border-coot-border bg-coot-bg px-3 py-2 text-sm text-coot-text outline-none ring-coot-accent/30 focus:ring-2"
          />
        </div>
        <div>
          <label htmlFor="password2" className="block text-xs font-medium text-coot-muted">
            비밀번호 확인
          </label>
          <input
            id="password2"
            type="password"
            autoComplete="new-password"
            required
            value={password2}
            onChange={(e) => setPassword2(e.target.value)}
            className="mt-1 w-full rounded-xl border border-coot-border bg-coot-bg px-3 py-2 text-sm text-coot-text outline-none ring-coot-accent/30 focus:ring-2"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full border border-coot-border bg-coot-surface py-2.5 text-sm font-medium text-coot-text hover:border-coot-accent/50 disabled:opacity-50"
        >
          {loading ? "처리 중…" : "가입하기"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-coot-muted">
        이미 계정이 있으면{" "}
        <Link href="/auth/login" className="text-coot-accent underline underline-offset-2">
          로그인
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
