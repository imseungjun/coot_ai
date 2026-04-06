import { normalizeUrl } from "./hub-utils";

/** 검색 결과 페이지 URL인지 (썸네일은 별도 API로 첫 동영상 ID 추정) */
export function isYouTubeSearchUrl(url: string): boolean {
  try {
    const u = new URL(normalizeUrl(url));
    return (
      /youtube\.com$/i.test(u.hostname.replace(/^www\./i, "")) && u.pathname.startsWith("/results")
    );
  } catch {
    return false;
  }
}

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
    `https://img.youtube.com/vi/${videoId}/sddefault.jpg`,
    `https://img.youtube.com/vi/${videoId}/default.jpg`,
  ];
}
