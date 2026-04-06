"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AuthFieldRow } from "@/components/auth/AuthFieldRow";
import { useAuthEnvStatus } from "@/components/auth/useAuthEnvStatus";

const inputInner =
  "w-full border-0 bg-transparent py-3 pl-2 pr-3 text-sm text-coot-text outline-none placeholder:text-coot-muted-2";

function validateNickname(raw: string): string | null {
  const id = raw.trim();
  if (id.length < 2) return "닉네임(아이디)은 2자 이상 입력해 주세요.";
  if (id.length > 32) return "닉네임(아이디)은 32자 이하로 해 주세요.";
  if (/\s/.test(raw)) return "닉네임에 공백을 넣을 수 없습니다.";
  if (!/^[a-zA-Z0-9_가-힣]+$/.test(id)) {
    return "닉네임은 영문, 숫자, 밑줄(_), 한글만 사용할 수 있습니다.";
  }
  return null;
}

export function SignupForm() {
  const router = useRouter();
  const envReady = useAuthEnvStatus();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showPassword2, setShowPassword2] = useState(false);
  const [nickname, setNickname] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const emailLooksOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);

    const emailTrim = email.trim();
    if (!emailTrim) {
      setMessage("이메일을 입력해 주세요.");
      return;
    }
    if (password.length < 6) {
      setMessage("비밀번호는 6자 이상으로 해 주세요.");
      return;
    }
    if (password !== password2) {
      setMessage("비밀번호 확인이 일치하지 않습니다.");
      return;
    }
    const nickErr = validateNickname(nickname);
    if (nickErr) {
      setMessage(nickErr);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: emailTrim,
          password,
          nickname: nickname.trim(),
        }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok) {
        setMessage(data.error ?? "가입에 실패했습니다.");
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
    <>
      <div className="mb-6 text-center">
        <h2 className="text-xl font-semibold text-coot-text sm:text-2xl">회원가입</h2>
        <p className="mt-2 text-sm text-coot-muted">이메일·닉네임·비밀번호로 계정을 만듭니다.</p>
      </div>

      {envReady === false ? (
        <div className="mb-5 rounded-xl border border-amber-500/35 bg-amber-950/25 px-3 py-2.5 text-xs leading-relaxed text-amber-100/90">
          <strong className="text-amber-50">Supabase 연결이 필요합니다.</strong>
          <br />
          프로젝트 폴더 <code className="text-coot-accent">.env.local</code> 파일을 열고, Supabase 대시보드(
          <a
            href="https://supabase.com/dashboard/project/_/settings/api"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-coot-accent"
          >
            Settings → API
          </a>
          )에서 복사한 값을 붙여 넣으세요.
          <br />
          <code className="mt-1 inline-block break-all text-[11px] text-coot-muted">
            NEXT_PUBLIC_SUPABASE_URL=https://…supabase.co
          </code>
          <br />
          <code className="inline-block break-all text-[11px] text-coot-muted">
            NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ…
          </code>
          <br />
          저장한 뒤 터미널에서 개발 서버를 <strong className="text-amber-50">종료(Ctrl+C) 후 다시 npm run dev</strong>로
          실행해야 적용됩니다.
        </div>
      ) : null}

      {message ? <p className="mb-4 text-sm text-red-400">{message}</p> : null}

      <form onSubmit={onSubmit} className="space-y-3">
        <div>
          <span className="mb-1.5 block text-xs font-medium text-coot-muted">이메일</span>
          <AuthFieldRow icon={<span aria-hidden>✉️</span>} highlight={emailLooksOk}>
            <input
              id="signup-email"
              type="email"
              autoComplete="email"
              required
              placeholder="example@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputInner}
            />
          </AuthFieldRow>
        </div>

        <div>
          <span className="mb-1.5 block text-xs font-medium text-coot-muted">닉네임 (표시 이름)</span>
          <AuthFieldRow icon={<span aria-hidden>👤</span>}>
            <input
              id="signup-nickname"
              type="text"
              autoComplete="username"
              required
              placeholder="영문·숫자·한글·_ (2~32자)"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className={inputInner}
            />
          </AuthFieldRow>
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-xs font-medium text-coot-muted">비밀번호 (6자 이상)</span>
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
              id="signup-password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              required
              placeholder="비밀번호"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputInner}
            />
          </AuthFieldRow>
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-xs font-medium text-coot-muted">비밀번호 확인</span>
            <button
              type="button"
              onClick={() => setShowPassword2((v) => !v)}
              className="text-xs font-medium text-coot-accent-muted transition hover:text-coot-accent"
            >
              {showPassword2 ? "숨기기" : "표시"}
            </button>
          </div>
          <AuthFieldRow icon={<span aria-hidden>🔐</span>}>
            <input
              id="signup-password2"
              type={showPassword2 ? "text" : "password"}
              autoComplete="new-password"
              required
              placeholder="비밀번호 다시 입력"
              value={password2}
              onChange={(e) => setPassword2(e.target.value)}
              className={inputInner}
            />
          </AuthFieldRow>
        </div>

        <button
          type="submit"
          disabled={loading || envReady === false}
          className="mt-2 w-full rounded-xl bg-coot-accent py-3 text-sm font-semibold text-coot-on-accent transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "처리 중…" : envReady === false ? "Supabase 설정 후 가입 가능" : "가입하고 시작하기"}
        </button>
      </form>

      <p className="mt-8 text-center text-sm text-coot-muted">
        이미 계정이 있으신가요?{" "}
        <Link href="/auth/login" className="font-medium text-coot-accent underline underline-offset-2">
          로그인
        </Link>
      </p>
    </>
  );
}
