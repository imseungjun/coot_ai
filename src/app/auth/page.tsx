import { redirect } from "next/navigation";

/** `/auth` 접속 시 로그인 화면으로 */
export default function AuthIndexPage() {
  redirect("/auth/login");
}
