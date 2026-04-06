import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/** 클라이언트 번들과 무관하게 서버에 Supabase 공개 키가 있는지 확인 */
export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  return NextResponse.json({ configured: !!(url && key) });
}
