"use client";

import { usePathname } from "next/navigation";
import { Header } from "@/components/Header";

/** 로그인·회원가입 등 `/auth/*` 에서는 메인 헤더를 숨겨 로고·버튼이 두 번 나오지 않게 함 */
export function AuthRouteHeader() {
  const pathname = usePathname();
  if (pathname?.startsWith("/auth")) {
    return null;
  }
  return <Header />;
}
