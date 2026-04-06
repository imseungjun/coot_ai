/** 바로가기 링크별 클릭 수 — 마스코트가 자주 쓰는 아이콘 근처로 이동할 때 사용 */

const MASCOT_LINK_CLICKS_KEY = "coot-hub-link-clicks-v1";

/**
 * 클릭 통계가 비었을 때 마스코트가 우선 찾아갈 링크 id (hub-baseline `data/hub-baseline.json` id와 동일)
 * ChatGPT → Gemini → 힉스필드
 */
export const MASCOT_DEFAULT_POPULAR_LINK_IDS = [
  "seed-chatgpt",
  "seed-gemini",
  "dd7418cf-0cf3-4d96-ba9f-10643873f232",
] as const;

function parseCounts(raw: string | null): Record<string, number> {
  if (!raw) return {};
  try {
    const o = JSON.parse(raw) as unknown;
    if (!o || typeof o !== "object") return {};
    const out: Record<string, number> = {};
    for (const [k, v] of Object.entries(o as Record<string, unknown>)) {
      if (typeof v === "number" && Number.isFinite(v) && v > 0) out[k] = Math.floor(v);
    }
    return out;
  } catch {
    return {};
  }
}

/** 메인 링크(아이콘) 클릭 시 호출 */
export function recordMascotLinkClick(linkId: string): void {
  if (typeof window === "undefined" || !linkId.trim()) return;
  try {
    const counts = parseCounts(localStorage.getItem(MASCOT_LINK_CLICKS_KEY));
    counts[linkId] = (counts[linkId] ?? 0) + 1;
    localStorage.setItem(MASCOT_LINK_CLICKS_KEY, JSON.stringify(counts));
  } catch {
    /* quota 등 */
  }
}

/**
 * 클릭 수 많은 순으로 채우고, 부족하면 기본 인기 링크(ChatGPT·Gemini·힉스필드)로 채움.
 * 항상 최소한 기본 3개 후보가 나오도록 해 마스코트가 좌우만 도는 느낌을 줄임.
 */
export function getTopLinkIdsForMascot(limit = 5): { id: string; count: number }[] {
  if (typeof window === "undefined") {
    return MASCOT_DEFAULT_POPULAR_LINK_IDS.slice(0, limit).map((id) => ({ id, count: 0 }));
  }
  try {
    const counts = parseCounts(localStorage.getItem(MASCOT_LINK_CLICKS_KEY));
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    const out: { id: string; count: number }[] = [];
    const seen = new Set<string>();

    for (const [id, c] of sorted) {
      if (out.length >= limit) break;
      out.push({ id, count: c });
      seen.add(id);
    }
    for (const id of MASCOT_DEFAULT_POPULAR_LINK_IDS) {
      if (out.length >= limit) break;
      if (!seen.has(id)) {
        out.push({ id, count: 0 });
        seen.add(id);
      }
    }
    return out;
  } catch {
    return MASCOT_DEFAULT_POPULAR_LINK_IDS.slice(0, limit).map((id) => ({ id, count: 0 }));
  }
}
