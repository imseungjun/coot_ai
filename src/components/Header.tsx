import Image from "next/image";
import Link from "next/link";
import { AuthHeader } from "@/components/AuthHeader";
import { COOT_HEADER_LOGO } from "@/lib/coot-brand";

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-coot-border/80 bg-coot-bg/95 backdrop-blur-md">
      <div className="mx-auto flex h-[4.5rem] max-w-[1400px] items-center justify-between gap-3 px-4 sm:h-20 sm:px-6">
        <Link href="/" className="flex min-w-0 shrink-0 items-center gap-2.5 sm:gap-3">
          <Image
            src={COOT_HEADER_LOGO}
            alt="COOT Ai"
            width={112}
            height={112}
            unoptimized
            className="h-10 w-10 object-contain object-bottom drop-shadow-[0_2px_12px_rgba(115,228,255,0.35)] sm:h-11 sm:w-11"
            priority
          />
          <span className="text-lg font-extrabold tracking-tight text-coot-accent sm:text-xl">COOT Ai</span>
          <span className="hidden text-sm font-medium text-coot-muted sm:inline">· AI 바로가기</span>
        </Link>
        <div className="flex min-w-0 flex-1 items-center justify-end gap-3 sm:gap-4">
          <p className="hidden text-right text-[11px] leading-snug text-coot-muted xl:block xl:max-w-[14rem]">
            로그인 시 계정에 저장 · 다른 기기에서 이어 사용
          </p>
          <AuthHeader />
        </div>
      </div>
    </header>
  );
}
