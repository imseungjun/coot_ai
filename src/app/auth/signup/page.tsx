import type { Metadata } from "next";
import { SignupForm } from "./SignupForm";

export const metadata: Metadata = {
  title: "회원가입",
  description: "COOT Ai 계정을 만듭니다.",
};

export default function SignupPage() {
  return <SignupForm />;
}
