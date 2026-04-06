import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = {
  title: "로그인",
  description: "COOT Ai 계정으로 로그인합니다.",
};

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="py-12 text-center text-sm text-coot-muted">페이지를 불러오는 중…</div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
