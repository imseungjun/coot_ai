import type { HubCategory, HubLink, HubState } from "./hub-types";
import { parseHubStateJson } from "./hub-storage";

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
