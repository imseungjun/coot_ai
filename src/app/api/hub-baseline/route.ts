import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { parseHubStateJson } from "@/lib/hub-storage";
import type { HubState } from "@/lib/hub-types";

const BASELINE_REL = ["data", "hub-baseline.json"] as const;

function baselinePath(): string {
  return path.join(process.cwd(), ...BASELINE_REL);
}

/** 개발 서버 또는 로컬에서만 폴더 쓰기 허용(배포본은 기본 비활성) */
function canWriteBaseline(): boolean {
  if (process.env.NODE_ENV === "development") return true;
  return process.env.HUB_BASELINE_WRITE === "1";
}

export async function GET() {
  const writable = canWriteBaseline();
  try {
    const raw = await readFile(baselinePath(), "utf8");
    const parsed = parseHubStateJson(raw);
    return NextResponse.json({ state: parsed, writable });
  } catch (e: unknown) {
    const code = (e as NodeJS.ErrnoException).code;
    if (code === "ENOENT") {
      return NextResponse.json({ state: null, writable });
    }
    console.error("[hub-baseline GET]", e);
    return NextResponse.json({ error: "읽기 실패" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  if (!canWriteBaseline()) {
    return NextResponse.json(
      {
        error:
          "프로젝트 폴더 저장은 로컬에서만 가능합니다. npm run dev 로 실행하거나, .env에 HUB_BASELINE_WRITE=1 을 넣고 next start 를 쓰세요.",
      },
      { status: 403 },
    );
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
    return NextResponse.json({ error: "유효하지 않은 허브 데이터입니다." }, { status: 400 });
  }

  const payload: HubState = {
    version: 1,
    categories: [...parsed.categories]
      .sort((a, b) => a.order - b.order)
      .map((c, i) => ({ ...c, order: i })),
  };

  const file = baselinePath();
  await mkdir(path.dirname(file), { recursive: true });
  const out = JSON.stringify(payload, null, 2);
  await writeFile(file, `${out}\n`, "utf8");

  return NextResponse.json({ ok: true });
}
