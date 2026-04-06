import type { HubState } from "./hub-types";
import { KOOT_PORTFOLIO_CATEGORY_ID } from "./hub-canonical";

export function normalizeHubState(state: HubState): HubState {
  return {
    version: 1,
    categories: [...state.categories]
      .sort((a, b) => a.order - b.order)
      .map((c, i) => ({ ...c, order: i })),
  };
}

export function normalizeUrl(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return "";
  /** 같은 사이트 내 상대 경로 */
  if (trimmed.startsWith("/")) return trimmed;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export function faviconUrlForPage(url: string): string {
  const t = url.trim();
  if (t.startsWith("/")) return "";
  try {
    const u = new URL(normalizeUrl(url));
    if (!u.hostname) return "";
    return `https://www.google.com/s2/favicons?domain=${u.hostname}&sz=64`;
  } catch {
    return "";
  }
}

/** 쿠트 포트폴리오: 원형 아이콘 + 라벨 그리드 — id가 맞으면 구역명과 무관하게 동일 UI */
export function isKootCirclePortfolioCategory(name: string, categoryId?: string): boolean {
  if (categoryId === KOOT_PORTFOLIO_CATEGORY_ID) return true;
  const t = name.trim();
  return /쿠트/.test(t) && /포트폴리오/i.test(t);
}

/** 그 외 "포트폴리오" 구역은 가로형 영상 썸네일(VideoLinkTile) */
export function isPortfolioVideoCategory(name: string, categoryId?: string): boolean {
  if (categoryId === KOOT_PORTFOLIO_CATEGORY_ID) return false;
  return /포트폴리오/i.test(name.trim()) && !isKootCirclePortfolioCategory(name, categoryId);
}

export function newId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
