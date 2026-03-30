/** 바로가기 링크별 클릭 수 — 마스코트가 자주 쓰는 아이콘 근처로 이동할 때 사용 */

const MASCOT_LINK_CLICKS_KEY = "coot-hub-link-clicks-v1";

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

/** 클릭 수 많은 순, 최대 limit개 */
export function getTopLinkIdsForMascot(limit = 3): { id: string; count: number }[] {
  if (typeof window === "undefined") return [];
  try {
    const counts = parseCounts(localStorage.getItem(MASCOT_LINK_CLICKS_KEY));
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([id, count]) => ({ id, count }));
  } catch {
    return [];
  }
}
