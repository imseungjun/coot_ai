import { normalizeUrl } from "./hub-utils";

/** YouTube 동영상 ID 추출 (watch, shorts, embed, youtu.be) */
export function parseYouTubeVideoId(input: string): string | null {
  const raw = normalizeUrl(input).trim();
  if (!raw) return null;
  try {
    const url = new URL(raw);
    const host = url.hostname.replace(/^www\./i, "").toLowerCase();

    if (host === "youtu.be") {
      const id = url.pathname.replace(/^\//, "").split("/")[0] ?? "";
      return /^[\w-]{11}$/.test(id) ? id : null;
    }

    if (host === "youtube.com" || host === "m.youtube.com" || host === "music.youtube.com") {
      const path = url.pathname;
      if (path.startsWith("/shorts/")) {
        const id = path.split("/")[2] ?? "";
        return /^[\w-]{11}$/.test(id) ? id : null;
      }
      if (path.startsWith("/embed/")) {
        const id = path.split("/")[2] ?? "";
        return /^[\w-]{11}$/.test(id) ? id : null;
      }
      if (path.startsWith("/live/")) {
        const id = path.split("/")[2] ?? "";
        return /^[\w-]{11}$/.test(id) ? id : null;
      }
      const v = url.searchParams.get("v");
      if (v && /^[\w-]{11}$/.test(v)) return v;
    }
  } catch {
    return null;
  }
  return null;
}

/** 썸네일 후보 (앞쪽이 더 고해상도, 실패 시 다음으로) */
export function youtubeThumbnailCandidates(videoId: string): string[] {
  return [
    `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
    `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
    `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
  ];
}
