import { Suspense } from "react";
import { LoginForm } from "./LoginForm";

export default function LoginPage() {
  return (
    <Suspense
      fallback={<div className="mx-auto max-w-md px-4 py-16 text-sm text-coot-muted">로딩 중…</div>}
    >
      <LoginForm />
    </Suspense>
  );
}
