import { NextResponse } from "next/server";
import { normalizeUrl } from "@/lib/hub-utils";
import { parseYouTubeVideoId } from "@/lib/youtube";

export const dynamic = "force-dynamic";

type OEmbedPayload = {
  provider: "youtube" | "vimeo" | null;
  title: string | null;
  author_name: string | null;
  thumbnail_url: string | null;
};

/**
 * 브라우저 CORS 없이 oEmbed 메타(채널명·썸네일)를 가져옵니다.
 * YouTube·Vimeo URL만 처리, 그 외는 빈 값.
 */
export async function GET(req: Request) {
  const target = new URL(req.url).searchParams.get("url");
  if (!target?.trim()) {
    return NextResponse.json({ provider: null, title: null, author_name: null, thumbnail_url: null });
  }

  const normalized = normalizeUrl(target.trim());

  try {
    if (parseYouTubeVideoId(normalized)) {
      const r = await fetch(
        `https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(normalized)}`,
        { next: { revalidate: 3600 } },
      );
      if (r.ok) {
        const j = (await r.json()) as { title?: string; author_name?: string; thumbnail_url?: string };
        const payload: OEmbedPayload = {
          provider: "youtube",
          title: typeof j.title === "string" ? j.title : null,
          author_name: typeof j.author_name === "string" ? j.author_name : null,
          thumbnail_url: typeof j.thumbnail_url === "string" ? j.thumbnail_url : null,
        };
        return NextResponse.json(payload);
      }
    }

    if (/vimeo\.com/i.test(normalized)) {
      const r = await fetch(
        `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(normalized)}`,
        { next: { revalidate: 3600 } },
      );
      if (r.ok) {
        const j = (await r.json()) as { title?: string; author_name?: string; thumbnail_url?: string };
        const payload: OEmbedPayload = {
          provider: "vimeo",
          title: typeof j.title === "string" ? j.title : null,
          author_name: typeof j.author_name === "string" ? j.author_name : null,
          thumbnail_url: typeof j.thumbnail_url === "string" ? j.thumbnail_url : null,
        };
        return NextResponse.json(payload);
      }
    }
  } catch {
    /* ignore */
  }

  return NextResponse.json({ provider: null, title: null, author_name: null, thumbnail_url: null });
}
