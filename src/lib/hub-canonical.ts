import type { HubCategory, HubLink } from "./hub-types";

/** 썸네일·원형 타일에서 YouTube 로고로 보이도록 */
export const YOUTUBE_TILE_ICON_URL =
  "https://www.google.com/s2/favicons?domain=youtube.com&sz=128";

export const KOOT_PORTFOLIO_CATEGORY_ID = "cat-koot-portfolio";

/**
 * @deprecated 레거시. `CANONICAL_KOOT_REVISION` 동기화 시 함께 맞춤.
 */
export const KOOT_PORTFOLIO_SEED_STORAGE_KEY = "coot-koot-portfolio-seed-v3";

/**
 * `hub-canonical.ts` 링크·이름을 브라우저에 반영하려면 이 숫자를 1 올리세요.
 * 11: 화면 20타일 기준(블소 비도술사 제외), SOL _ 쏠·아키텍드 표기.
 */
export const CANONICAL_KOOT_REVISION = 11;

export const KOOT_CANONICAL_REV_STORAGE_KEY = "coot-koot-canonical-rev";

/** 표시 이름 → YouTube 검색 결과 URL (한 곳에서만 생성) */
export function youtubeSearchUrlForName(name: string): string {
  const q = encodeURIComponent(name.replace(/\s+/g, " ").trim());
  return `https://www.youtube.com/results?search_query=${q}`;
}

/**
 * 쿠트 포트폴리오 타일 목록 — 앱 전체가 이 정의만 참조합니다.
 * `data/hub-baseline.json` 쿠트 포트폴리오와 동일한 watch URL·순서(20개).
 * 수정 시 이 배열·baseline·`CANONICAL_KOOT_REVISION`을 함께 맞추세요.
 */
export const CANONICAL_KOOT_PORTFOLIO_LINKS: ReadonlyArray<{
  id: string;
  name: string;
  /** 비우면 `name`으로 YouTube 검색 URL을 만듭니다. */
  url?: string;
}> = [
  {
    id: "koot-raven2",
    name: "레이븐2",
    url: "https://www.youtube.com/watch?v=ybGAzpC7Yjg&t=201s",
  },
  { id: "koot-raven2-assassin", name: "레이븐2 어쌔신", url: "https://www.youtube.com/watch?v=E4bpQomHAnc" },
  { id: "koot-raven2-gunslinger", name: "레이븐2 건슬링어", url: "https://www.youtube.com/watch?v=EYv4nzF_ka8" },
  { id: "koot-raven2-deathbringer", name: "레이븐2 데스브링어", url: "https://www.youtube.com/watch?v=3cZzkhyeNJM" },
  { id: "koot-seven-deadly-sins", name: "십대죄_7", url: "https://www.youtube.com/watch?v=FgcetSpOGdc" },
  { id: "koot-vampire", name: "뱀파이어_", url: "https://www.youtube.com/watch?v=ibNV_MbvZx0" },
  { id: "koot-vampire-red", name: "뱀파이어_레드", url: "https://www.youtube.com/watch?v=gsYusPqwLx8" },
  { id: "koot-sol-sol", name: "SOL _ 쏠", url: "https://www.youtube.com/watch?v=jRykO-HJfYM" },
  { id: "koot-chosun-hyuk", name: "조선 협객전", url: "https://www.youtube.com/watch?v=EolUhqCM9WU&t=37s" },
  { id: "koot-mir5", name: "미르5", url: "https://www.youtube.com/watch?v=nmfzrxUSJK4" },
  { id: "koot-night-crow", name: "나이트 크로우", url: "https://www.youtube.com/watch?v=4k-OLmtrTm8&t=70s" },
  { id: "koot-ymir", name: "레전드 오브 이미르", url: "https://www.youtube.com/watch?v=8ajbX8JOKoI" },
  { id: "koot-architect", name: "아키텍드", url: "https://www.youtube.com/watch?v=UxNvbonI8lg" },
  { id: "koot-arsdal", name: "아스달연대기", url: "https://www.youtube.com/watch?v=vkCYVCkCaDU&t=3s" },
  { id: "koot-rf-online", name: "RF 온라인", url: "https://www.youtube.com/watch?v=jYpA0863QZA" },
  { id: "koot-rf-online-2", name: "RF 온라인_", url: "https://www.youtube.com/watch?v=x2oj7od19LE" },
  { id: "koot-got", name: "왕좌의 게임", url: "https://www.youtube.com/watch?v=B0nNDliNtos" },
  { id: "koot-bns-ghost", name: "블소 귀검사", url: "https://www.youtube.com/watch?v=X5SwPuBqN9g" },
  { id: "koot-bns-miho", name: "블소 미호검사", url: "https://www.youtube.com/watch?v=mNCoYfJOVbI" },
  { id: "koot-bns-warlock", name: "블소 사술사", url: "https://www.youtube.com/watch?v=FeB1FUsB1uM" },
];

/** 캐논 한 줄 → 저장용 링크 (동기화·초기값 공통) */
export function resolveKootCanonicalEntryToLink(
  entry: (typeof CANONICAL_KOOT_PORTFOLIO_LINKS)[number],
): HubLink {
  const url = entry.url?.trim()
    ? entry.url.trim()
    : youtubeSearchUrlForName(entry.name);
  return {
    id: entry.id,
    name: entry.name,
    url,
    iconUrl: YOUTUBE_TILE_ICON_URL,
  };
}

/** 스크린샷 기준 순서(좌→우, 위→아래) — 20개 */
export function createKootPortfolioCategory(): HubCategory {
  return {
    id: KOOT_PORTFOLIO_CATEGORY_ID,
    name: "쿠트 포트폴리오",
    order: 99,
    links: CANONICAL_KOOT_PORTFOLIO_LINKS.map(resolveKootCanonicalEntryToLink),
  };
}
