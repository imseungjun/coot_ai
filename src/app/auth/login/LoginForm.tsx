"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { AuthFieldRow } from "@/components/auth/AuthFieldRow";
import { useAuthEnvStatus } from "@/components/auth/useAuthEnvStatus";

const inputInner =
  "w-full border-0 bg-transparent py-3 pl-2 pr-3 text-sm text-coot-text outline-none placeholder:text-coot-muted-2";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const err = searchParams.get("error");
  const registered = searchParams.get("registered");
  const envReady = useAuthEnvStatus();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok) {
        setMessage(data.error ?? "로그인에 실패했습니다.");
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

  async function onForgotPassword() {
    setMessage(null);
    const trimmed = email.trim();
    if (!trimmed) {
      setMessage("비밀번호 찾기를 위해 이메일을 입력해 주세요.");
      return;
    }
    setForgotLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok) {
        setMessage(data.error ?? "요청에 실패했습니다.");
      } else {
        setMessage("비밀번호 재설정 링크를 이메일로 보냈습니다. 메일함을 확인해 주세요.");
      }
    } catch {
      setMessage("요청 처리 중 오류가 났습니다.");
    }
    setForgotLoading(false);
  }

  return (
    <>
      <div className="mb-6 text-center">
        <h2 className="text-xl font-semibold text-coot-text sm:text-2xl">로그인</h2>
        <p className="mt-2 text-sm text-coot-muted">저장한 AI 바로가기를 다시 불러오세요.</p>
      </div>

      {envReady === false ? (
        <div className="mb-5 rounded-xl border border-amber-500/35 bg-amber-950/25 px-3 py-2.5 text-xs leading-relaxed text-amber-100/90">
          <strong className="text-amber-50">Supabase 연결이 필요합니다.</strong> 프로젝트 루트{" "}
          <code className="text-coot-accent">.env.local</code>에{" "}
          <code className="break-all">NEXT_PUBLIC_SUPABASE_URL</code>,{" "}
          <code className="break-all">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>를 넣고{" "}
          <strong className="text-amber-50">서버를 다시 시작</strong>해 주세요.
        </div>
      ) : null}

      {registered ? (
        <p className="mb-4 rounded-xl border border-coot-border bg-coot-surface-2/50 px-3 py-2.5 text-sm text-coot-muted">
          회원가입이 완료되었습니다. 이메일 인증을 켜 둔 경우 메일함을 확인한 뒤 로그인하세요.
        </p>
      ) : null}
      {err ? (
        <p className="mb-4 text-sm text-red-400">인증에 실패했습니다. 다시 시도해 주세요.</p>
      ) : null}
      {message ? (
        <p
          className={`mb-4 text-sm ${message.includes("보냈습니다") ? "text-coot-muted" : "text-red-400"}`}
        >
          {message}
        </p>
      ) : null}

      <form onSubmit={onSubmit} className="space-y-3">
        <div>
          <span className="mb-1.5 block text-xs font-medium text-coot-muted">이메일</span>
          <AuthFieldRow icon={<span aria-hidden>✉️</span>} highlight={email.includes("@")}>
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              required
              placeholder="이메일"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputInner}
            />
          </AuthFieldRow>
        </div>
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-xs font-medium text-coot-muted">비밀번호</span>
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="text-xs font-medium text-coot-accent-muted transition hover:text-coot-accent"
            >
              {showPassword ? "숨기기" : "표시"}
            </button>
          </div>
          <AuthFieldRow icon={<span aria-hidden>🔒</span>}>
            <input
              id="login-password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              required
              placeholder="비밀번호"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputInner}
            />
          </AuthFieldRow>
        </div>

        <label className="flex cursor-pointer items-center gap-2.5 py-1 text-sm text-coot-muted">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="h-4 w-4 rounded border-coot-border bg-[#111111] text-coot-accent focus:ring-coot-accent/30"
          />
          로그인 상태 유지
        </label>

        <button
          type="submit"
          disabled={loading || envReady === false}
          className="mt-2 w-full rounded-xl bg-coot-accent py-3 text-sm font-semibold text-coot-on-accent transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "처리 중…" : envReady === false ? "Supabase 설정 후 로그인" : "로그인"}
        </button>
      </form>

      <div className="mt-6 flex items-center justify-between gap-3 text-sm">
        <Link href="/auth/signup" className="font-medium text-coot-accent hover:text-coot-text">
          회원가입
        </Link>
        <button
          type="button"
          disabled={forgotLoading || envReady === false}
          onClick={() => void onForgotPassword()}
          className="text-coot-muted transition hover:text-coot-text disabled:opacity-50"
        >
          {forgotLoading ? "전송 중…" : "비밀번호 찾기"}
        </button>
      </div>
    </>
  );
}
