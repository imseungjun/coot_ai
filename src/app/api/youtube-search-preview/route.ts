import { NextResponse } from "next/server";
import { normalizeUrl } from "@/lib/hub-utils";
import { extractFirstVideoIdFromYouTubeSearchHtml } from "@/lib/youtube-search-resolve";

export const dynamic = "force-dynamic";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

/**
 * YouTube 검색 결과 URL 또는 검색어로 첫 동영상 ID를 추정합니다.
 * 쿠트 포트폴리오 등 검색 링크에서 썸네일을 쓰기 위한 용도입니다.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const rawUrl = searchParams.get("url");
  const qParam = searchParams.get("q");

  let searchQuery: string | null = null;
  if (qParam?.trim()) {
    searchQuery = qParam.trim().slice(0, 200);
  } else if (rawUrl?.trim()) {
    try {
      const u = new URL(normalizeUrl(rawUrl.trim()));
      const host = u.hostname.replace(/^www\./i, "").toLowerCase();
      if (
        (host === "youtube.com" || host === "m.youtube.com") &&
        u.pathname.startsWith("/results")
      ) {
        searchQuery = u.searchParams.get("search_query")?.trim().slice(0, 200) ?? null;
      }
    } catch {
      /* ignore */
    }
  }

  if (!searchQuery) {
    return NextResponse.json({ videoId: null as string | null });
  }

  try {
    const target = `https://www.youtube.com/results?search_query=${encodeURIComponent(searchQuery)}`;
    const r = await fetch(target, {
      headers: {
        "User-Agent": UA,
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
      },
      next: { revalidate: 86_400 },
    });
    if (!r.ok) {
      return NextResponse.json({ videoId: null as string | null });
    }
    const html = await r.text();
    const videoId = extractFirstVideoIdFromYouTubeSearchHtml(html);
    return NextResponse.json({ videoId });
  } catch {
    return NextResponse.json({ videoId: null as string | null });
  }
}
