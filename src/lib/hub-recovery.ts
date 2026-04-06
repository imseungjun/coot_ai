import type { HubCategory, HubLink, HubState } from "./hub-types";
import { createDefaultHubState } from "./hub-defaults";
import {
  CANONICAL_KOOT_PORTFOLIO_LINKS,
  CANONICAL_KOOT_REVISION,
  createKootPortfolioCategory,
  KOOT_CANONICAL_REV_STORAGE_KEY,
  KOOT_PORTFOLIO_CATEGORY_ID,
  KOOT_PORTFOLIO_SEED_STORAGE_KEY,
  resolveKootCanonicalEntryToLink,
} from "./hub-canonical";
import { loadHubState, parseHubStateJson } from "./hub-storage";
import { normalizeHubState } from "./hub-utils";

/** 한 번만: 빈 구역에 기본 링크·이름을 채우고, 빠진 기본 구역 id를 추가합니다. */
const FILL_EMPTY_CATS_KEY = "coot-fill-empty-cats-v1";

export function mergeEmptyCategoriesFromDefaults(state: HubState): HubState {
  if (typeof window === "undefined") return state;
  try {
    if (window.localStorage.getItem(FILL_EMPTY_CATS_KEY) === "1") return state;
  } catch {
    return state;
  }

  const def = createDefaultHubState();
  const byId = new Map(def.categories.map((c) => [c.id, c]));
  const existingIds = new Set(state.categories.map((c) => c.id));

  let categories = [...state.categories];
  let changed = false;

  categories = categories.map((c) => {
    const preset = byId.get(c.id);
    if (!preset || c.links.length > 0) return c;
    changed = true;
    return { ...c, name: preset.name, links: preset.links.map((l) => ({ ...l })) };
  });

  for (const c of def.categories) {
    if (!existingIds.has(c.id)) {
      categories.push({
        ...c,
        links: c.links.map((l) => ({ ...l })),
      });
      changed = true;
    }
  }

  try {
    window.localStorage.setItem(FILL_EMPTY_CATS_KEY, "1");
  } catch {
    /* ignore */
  }

  if (!changed) return state;
  return normalizeHubState({ version: 1, categories });
}

function dedupeLinksByUrl(links: HubLink[]): HubLink[] {
  const seen = new Set<string>();
  const out: HubLink[] = [];
  for (const l of links) {
    const k = `${l.url.trim()}|||${l.name.trim()}`;
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(l);
  }
  return out;
}

/** 같은 id 구역끼리 링크 합치기 */
export function mergeHubStates(a: HubState, b: HubState): HubState {
  const map = new Map<string, HubCategory>();

  function addCat(c: HubCategory) {
    const ex = map.get(c.id);
    if (!ex) {
      map.set(c.id, { ...c, links: [...c.links] });
      return;
    }
    const linkMap = new Map<string, HubLink>();
    for (const l of ex.links) linkMap.set(l.id, l);
    for (const l of c.links) {
      if (!linkMap.has(l.id)) linkMap.set(l.id, l);
    }
    map.set(c.id, {
      ...ex,
      order: Math.min(ex.order, c.order),
      links: dedupeLinksByUrl([...linkMap.values()]),
    });
  }

  for (const c of a.categories) addCat(c);
  for (const c of b.categories) addCat(c);

  const categories = [...map.values()].sort((x, y) => x.order - y.order);
  return {
    version: 1,
    categories: categories.map((c, i) => ({ ...c, order: i })),
  };
}

/**
 * 구역 이름이 같고 id만 다른 경우(스냅샷·복사본) 링크를 한 구역으로 합침.
 */
export function mergeCategoriesByNormalizedName(categories: HubCategory[]): HubCategory[] {
  const byName = new Map<string, HubCategory>();

  for (const c of categories) {
    const key = c.name.trim().toLowerCase();
    const ex = byName.get(key);
    if (!ex) {
      byName.set(key, { ...c, links: [...c.links] });
      continue;
    }
    const linkMap = new Map<string, HubLink>();
    for (const l of ex.links) linkMap.set(l.id, l);
    for (const l of c.links) {
      if (!linkMap.has(l.id)) linkMap.set(l.id, l);
    }
    byName.set(key, {
      ...ex,
      id: ex.id,
      order: Math.min(ex.order, c.order),
      links: dedupeLinksByUrl([...linkMap.values()]),
    });
  }

  return [...byName.values()].sort((a, b) => a.order - b.order);
}

export function countHubLinks(state: HubState): number {
  return state.categories.reduce((n, c) => n + c.links.length, 0);
}

/**
 * 쿠트 포트폴리오 구역을 항상 목록 맨 아래로 둡니다.
 * `order` 필드만 맞추지 않으면 `normalizeHubState`/UI 정렬 시 쿠트가 order 0으로 상단에 남습니다.
 */
export function ensureKootPortfolioAtEnd(state: HubState): HubState {
  const idx = state.categories.findIndex((c) => c.id === KOOT_PORTFOLIO_CATEGORY_ID);
  if (idx === -1) return normalizeHubState(state);

  const rest = state.categories.filter((c) => c.id !== KOOT_PORTFOLIO_CATEGORY_ID);
  const koot = state.categories[idx];
  const reordered = [...rest, koot];

  return normalizeHubState({
    version: 1,
    categories: reordered.map((c, i) => ({ ...c, order: i })),
  });
}

/**
 * `hub-canonical.ts`의 쿠트 포트폴리오를 저장소 리비전과 비교해 반영합니다.
 * 리비전이 오르면 **새 캐논 항목만 추가**하고, **같은 id**는 화면에서 마지막으로 저장한 name·url을 유지합니다
 * (앱에서 링크를 고친 뒤에도 다음 배포·새로고침에서 덮어쓰이지 않음).
 */
export function syncKootPortfolioFromCanonical(state: HubState): HubState {
  if (typeof window === "undefined") return state;

  let stored: string | null = null;
  try {
    stored = window.localStorage.getItem(KOOT_CANONICAL_REV_STORAGE_KEY);
  } catch {
    return state;
  }
  if (stored === String(CANONICAL_KOOT_REVISION)) {
    return state;
  }

  const preset = createKootPortfolioCategory();
  const idx = state.categories.findIndex((c) => c.id === KOOT_PORTFOLIO_CATEGORY_ID);
  const existing = idx === -1 ? null : state.categories[idx];
  const existingById = new Map((existing?.links ?? []).map((l) => [l.id, l]));
  const canonicalIds = new Set(CANONICAL_KOOT_PORTFOLIO_LINKS.map((e) => e.id));

  const mergedLinks: HubLink[] = [];
  for (const entry of CANONICAL_KOOT_PORTFOLIO_LINKS) {
    const resolved = resolveKootCanonicalEntryToLink(entry);
    const user = existingById.get(entry.id);
    if (user) {
      mergedLinks.push({
        ...resolved,
        ...user,
        id: entry.id,
        iconUrl: user.iconUrl?.trim() ? user.iconUrl : resolved.iconUrl,
      });
    } else {
      mergedLinks.push(resolved);
    }
  }

  for (const l of existing?.links ?? []) {
    if (!canonicalIds.has(l.id)) {
      mergedLinks.push(l);
    }
  }

  const kootCat: HubCategory = {
    ...preset,
    links: mergedLinks,
    order: existing?.order ?? preset.order,
    name: existing?.name?.trim() ? existing.name : preset.name,
  };

  const categories =
    idx === -1
      ? [...state.categories, { ...kootCat, order: state.categories.length }]
      : state.categories.map((c) => (c.id === KOOT_PORTFOLIO_CATEGORY_ID ? kootCat : c));

  try {
    window.localStorage.setItem(KOOT_CANONICAL_REV_STORAGE_KEY, String(CANONICAL_KOOT_REVISION));
    window.localStorage.setItem(KOOT_PORTFOLIO_SEED_STORAGE_KEY, "1");
  } catch {
    /* ignore */
  }

  return normalizeHubState({ version: 1, categories });
}

/** 빈 구역 채움 → 쿠트 캐논 동기화 → 쿠트 맨 아래 */
export function finalizeHubWithKoot(state: HubState): HubState {
  let s = mergeEmptyCategoriesFromDefaults(state);
  s = syncKootPortfolioFromCanonical(s);
  s = ensureKootPortfolioAtEnd(s);
  return s;
}

/**
 * localStorage·sessionStorage의 모든 키를 훑어 `categories`가 있는 JSON을 찾아 병합합니다.
 * (메인 키 외에 남아 있던 조각·옛 백업 붙여넣기 등도 잡기 위함)
 */
export function deepRecoverHubState(): HubState | null {
  if (typeof window === "undefined") return null;

  const snapshots: HubState[] = [];

  function scan(storage: Storage) {
    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i);
      if (!key) continue;
      try {
        const raw = storage.getItem(key);
        if (!raw || raw.length < 15) continue;
        const t = raw.trim();
        if (!t.startsWith("{")) continue;
        const p = parseHubStateJson(raw);
        if (p && p.categories.length > 0) snapshots.push(p);
      } catch {
        /* ignore */
      }
    }
  }

  scan(localStorage);
  scan(sessionStorage);

  if (snapshots.length === 0) return null;

  let merged = snapshots[0];
  for (let i = 1; i < snapshots.length; i++) {
    merged = mergeHubStates(merged, snapshots[i]);
  }

  merged = {
    version: 1,
    categories: mergeCategoriesByNormalizedName(merged.categories).map((c, i) => ({ ...c, order: i })),
  };

  return merged;
}

/**
 * localStorage·세션 미러·저장소 전체 스캔 중 링크가 가장 많은 본을 고릅니다.
 * `/api/hub-state` 응답을 기다리는 동안 사용자가 링크를 수정·저장한 경우, merge 직전에 다시 호출하면 최신 디스크 값이 반영됩니다.
 */
export function loadBestLocalHubState(): HubState {
  const fromLoader = loadHubState();
  const deep = deepRecoverHubState();
  const empty: HubState = { version: 1, categories: [] };
  const base = fromLoader ?? empty;
  if (deep && countHubLinks(deep) > countHubLinks(base)) return deep;
  return fromLoader ?? base;
}
