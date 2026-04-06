import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

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

type Body = {
  email?: string;
  password?: string;
  nickname?: string;
};

/**
 * 브라우저에 NEXT_PUBLIC_* 가 없어도 서버 .env.local 만 맞으면 가입 가능하도록 처리.
 */
export async function POST(request: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !key) {
    return NextResponse.json(
      {
        error:
          "Supabase가 설정되지 않았습니다. 프로젝트 루트 .env.local에 NEXT_PUBLIC_SUPABASE_URL과 NEXT_PUBLIC_SUPABASE_ANON_KEY를 넣고 개발 서버를 다시 시작해 주세요.",
      },
      { status: 503 },
    );
  }

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "요청 형식이 올바르지 않습니다." }, { status: 400 });
  }

  const email = body.email?.trim() ?? "";
  const password = body.password ?? "";
  const nickname = body.nickname?.trim() ?? "";

  if (!email || !password || !nickname) {
    return NextResponse.json({ error: "이메일·비밀번호·닉네임을 모두 입력해 주세요." }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ error: "비밀번호는 6자 이상으로 해 주세요." }, { status: 400 });
  }
  const nickErr = validateNickname(nickname);
  if (nickErr) {
    return NextResponse.json({ error: nickErr }, { status: 400 });
  }

  const originHeader = request.headers.get("origin");
  const referer = request.headers.get("referer");
  const origin =
    originHeader ??
    (referer ? new URL(referer).origin : null) ??
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
    "http://localhost:3000";
  const emailRedirectTo = `${origin}/auth/callback`;

  const supabase = createClient(url, key);
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo,
      data: { username: nickname },
    },
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
