import { NextResponse } from "next/server";
import { parseHubStateJson } from "@/lib/hub-storage";
import type { HubState } from "@/lib/hub-types";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase 미설정" }, { status: 503 });
  }
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase 미설정" }, { status: 503 });
  }
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();
  if (userErr || !user) {
    return NextResponse.json({ state: null }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("hub_states")
    .select("payload")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    console.error("[hub-state GET]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data?.payload) {
    return NextResponse.json({ state: null });
  }

  const raw = JSON.stringify(data.payload);
  const parsed = parseHubStateJson(raw);
  return NextResponse.json({ state: parsed });
}

export async function PUT(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase 미설정" }, { status: 503 });
  }
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase 미설정" }, { status: 503 });
  }
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();
  if (userErr || !user) {
    return NextResponse.json({ error: "로그인 필요" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON 아님" }, { status: 400 });
  }

  const raw = JSON.stringify(body);
  const parsed = parseHubStateJson(raw);
  if (!parsed) {
    return NextResponse.json({ error: "유효하지 않은 허브 데이터" }, { status: 400 });
  }

  const payload: HubState = {
    version: 1,
    categories: [...parsed.categories]
      .sort((a, b) => a.order - b.order)
      .map((c, i) => ({ ...c, order: i })),
  };

  const { error } = await supabase.from("hub_states").upsert(
    {
      user_id: user.id,
      payload,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );

  if (error) {
    console.error("[hub-state PUT]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
