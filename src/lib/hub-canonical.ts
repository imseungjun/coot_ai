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
 * 9: 캐논 동기화 시 같은 id는 UI에서 수정한 url·이름을 덮어쓰지 않고 병합합니다.
 */
export const CANONICAL_KOOT_REVISION = 9;

export const KOOT_CANONICAL_REV_STORAGE_KEY = "coot-koot-canonical-rev";

/** 표시 이름 → YouTube 검색 결과 URL (한 곳에서만 생성) */
export function youtubeSearchUrlForName(name: string): string {
  const q = encodeURIComponent(name.replace(/\s+/g, " ").trim());
  return `https://www.youtube.com/results?search_query=${q}`;
}

/**
 * 쿠트 포트폴리오 타일 목록 — 앱 전체가 이 정의만 참조합니다.
 * 아래 `url`은 예전에 타일에서 트레일러(watch 링크)로 쓰이던 영상들을 dev 로그·세션 기준으로 복구한 값입니다.
 * 항목과 영상이 어긋나면 해당 줄만 `url`을 바꾼 뒤 `CANONICAL_KOOT_REVISION`을 1 올리세요.
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
  { id: "koot-raven2-assassin", name: "레이븐2 어쌔신", url: "https://www.youtube.com/watch?v=C0j4w7pL3-E" },
  { id: "koot-raven2-gunslinger", name: "레이븐2 건슬링어", url: "https://www.youtube.com/watch?v=jSM1aGIyDeg" },
  { id: "koot-raven2-deathbringer", name: "레이븐2 데스브링어", url: "https://www.youtube.com/watch?v=Hl_n58oa-as" },
  { id: "koot-seven-deadly-sins", name: "칠대죄_7", url: "https://www.youtube.com/watch?v=ZOvhfnkzbd0" },
  { id: "koot-vampire", name: "뱀피르_", url: "https://www.youtube.com/watch?v=1aHjm5pmeB8" },
  { id: "koot-vampire-red", name: "뱀피르_레드", url: "https://www.youtube.com/watch?v=NA-0xmvXsK4" },
  { id: "koot-sol-sol", name: "SOL _ 쏠", url: "https://www.youtube.com/watch?v=3zngfX26y8E" },
  { id: "koot-chosun-hyuk", name: "조선 협객전", url: "https://www.youtube.com/watch?v=RuORKyaDPCo" },
  { id: "koot-mir5", name: "미르5", url: "https://www.youtube.com/watch?v=Mon1nleERZQ" },
  { id: "koot-night-crow", name: "나이트 크로우", url: "https://www.youtube.com/watch?v=Hku41CkaT3k" },
  { id: "koot-ymir", name: "이미르", url: "https://www.youtube.com/watch?v=HSgXmS0VpQk" },
  { id: "koot-architect", name: "아키텍트", url: "https://www.youtube.com/watch?v=5MEATOByCI0" },
  { id: "koot-arsdal", name: "아스달연대기", url: "https://www.youtube.com/watch?v=7FBSB9b7EIw" },
  { id: "koot-rf-online", name: "RF 온라인", url: "https://www.youtube.com/watch?v=6xhBCUAQZmU" },
  { id: "koot-rf-online-2", name: "RF 온라인_", url: "https://www.youtube.com/watch?v=0XvbAjAkcQE" },
  { id: "koot-got", name: "왕좌의 게임", url: "https://www.youtube.com/watch?v=X8ccUeP8SJw" },
  { id: "koot-bns-ghost", name: "블소 귀검사", url: "https://www.youtube.com/watch?v=0NryH6_ZR4Y" },
  { id: "koot-bns-miho", name: "블소 미호검사", url: "https://www.youtube.com/watch?v=NkmS2ILh_xg" },
  { id: "koot-bns-warlock", name: "블소 사술사", url: "https://www.youtube.com/watch?v=L20J3q-YP2E" },
  { id: "koot-bns-throw", name: "블소 비도술사", url: "https://www.youtube.com/watch?v=5KT_2qOHUVw" },
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

/** 스크린샷 기준 순서(좌→우, 위→아래) — 21개 */
export function createKootPortfolioCategory(): HubCategory {
  return {
    id: KOOT_PORTFOLIO_CATEGORY_ID,
    name: "쿠트 포트폴리오",
    order: 99,
    links: CANONICAL_KOOT_PORTFOLIO_LINKS.map(resolveKootCanonicalEntryToLink),
  };
}
