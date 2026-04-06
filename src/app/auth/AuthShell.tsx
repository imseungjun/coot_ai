"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { COOT_HEADER_LOGO } from "@/lib/coot-brand";

const tabBase =
  "flex-1 rounded-full px-4 py-2.5 text-center text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coot-accent/50";
const tabActive = "bg-coot-accent text-coot-on-accent shadow-sm";
const tabIdle = "text-coot-muted hover:bg-white/[0.06] hover:text-coot-text";

/** 중앙 정렬 단일 카드 — COOT 다크톤, 로그인/회원가입 공통 틀 */
export function AuthShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLogin = pathname?.startsWith("/auth/login") ?? false;
  const isSignup = pathname?.startsWith("/auth/signup") ?? false;

  return (
    <div className="min-h-[calc(100dvh-4.5rem)] bg-coot-bg px-4 py-8 sm:min-h-[calc(100dvh-5rem)] sm:py-10">
      <div className="mx-auto flex w-full max-w-md flex-col">
        <Link
          href="/"
          className="mb-6 self-start text-sm font-medium text-coot-muted transition hover:text-coot-text"
        >
          ← AI 바로가기로
        </Link>

        <div className="mb-6 flex flex-col items-center text-center">
          <Image
            src={COOT_HEADER_LOGO}
            alt="COOT Ai"
            width={112}
            height={112}
            unoptimized
            className="h-16 w-16 object-contain drop-shadow-[0_2px_12px_rgba(115,228,255,0.28)] sm:h-[4.5rem] sm:w-[4.5rem]"
          />
          <h1 className="mt-4 text-xl font-bold tracking-tight text-coot-text sm:text-2xl">COOT Ai</h1>
          <p className="mt-1 text-sm text-coot-muted">AI 바로가기</p>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-coot-muted">
            편집 내용은 자동 저장되며, 로그인하면 계정에 동기화됩니다.
          </p>
        </div>

        <div className="w-full rounded-3xl border border-coot-border bg-coot-surface p-6 shadow-[0_20px_60px_rgba(0,0,0,0.5)] sm:p-8">
          <div
            className="mb-6 flex rounded-full border border-coot-border bg-black/25 p-1"
            role="tablist"
            aria-label="로그인 또는 회원가입"
          >
            <Link
              href="/auth/login"
              className={`${tabBase} ${isLogin ? tabActive : tabIdle}`}
              aria-current={isLogin ? "page" : undefined}
            >
              로그인
            </Link>
            <Link
              href="/auth/signup"
              className={`${tabBase} ${isSignup ? tabActive : tabIdle}`}
              aria-current={isSignup ? "page" : undefined}
            >
              회원가입
            </Link>
          </div>

          <div className="min-h-0">{children}</div>
        </div>
      </div>
    </div>
  );
}
