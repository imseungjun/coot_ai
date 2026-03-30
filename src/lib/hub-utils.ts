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

/** 구역 이름에 "포트폴리오"가 있으면 YouTube 스타일 썸네일 그리드 */
export function isPortfolioVideoCategory(name: string): boolean {
  return /포트폴리오/i.test(name.trim());
}

export function newId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
