import type { HubCategory, HubLink, HubState } from "./hub-types";

export const HUB_STORAGE_KEY = "coot-hub-state-v1";

/** sessionStorage 미러 키(동일 문자열, 저장소만 다름) */
const HUB_SESSION_MIRROR_KEY = "coot-hub-state-v1-mirror";

function normalizeLink(raw: unknown, catIndex: number, linkIndex: number): HubLink | null {
  if (!raw || typeof raw !== "object") return null;
  const l = raw as Record<string, unknown>;
  const id = typeof l.id === "string" ? l.id : `link-${catIndex}-${linkIndex}`;
  const name = typeof l.name === "string" ? l.name : "";
  const url = typeof l.url === "string" ? l.url : "";
  if (!name.trim() && !url.trim()) return null;
  const iconUrl = typeof l.iconUrl === "string" && l.iconUrl.trim() ? l.iconUrl.trim() : undefined;
  return iconUrl ? { id, name, url, iconUrl } : { id, name, url };
}

function normalizeCategory(raw: unknown, index: number): HubCategory | null {
  if (!raw || typeof raw !== "object") return null;
  const c = raw as Record<string, unknown>;
  const id = typeof c.id === "string" ? c.id : `cat-${index}`;
  const name = typeof c.name === "string" ? c.name : "이름 없음";
  const order = typeof c.order === "number" && Number.isFinite(c.order) ? c.order : index;
  const linksRaw = c.links;
  const links: HubLink[] = [];
  if (Array.isArray(linksRaw)) {
    linksRaw.forEach((lr, j) => {
      const nl = normalizeLink(lr, index, j);
      if (nl) links.push(nl);
    });
  }
  return { id, name, order, links };
}

/** JSON 문자열 → 상태 (구버전·불완전한 필드도 최대한 복구) */
export function parseHubStateJson(raw: string): HubState | null {
  try {
    const data = JSON.parse(raw) as unknown;
    if (!data || typeof data !== "object") return null;
    const o = data as Record<string, unknown>;
    const categoriesRaw = o.categories;
    if (!Array.isArray(categoriesRaw)) return null;
    const categories: HubCategory[] = categoriesRaw
      .map((c, i) => normalizeCategory(c, i))
      .filter((c): c is HubCategory => c !== null);
    if (categories.length === 0 && categoriesRaw.length > 0) return null;
    return { version: 1, categories };
  } catch {
    return null;
  }
}

function writeMirror(json: string): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(HUB_SESSION_MIRROR_KEY, json);
  } catch {
    /* ignore */
  }
}

/**
 * 바로가기 전체 상태 저장. localStorage + sessionStorage 동시 기록(한쪽 실패 시 다른 쪽 보조).
 * HubDashboard에서 `state` 변경 시·탭 숨김·beforeunload·주기 스냅샷으로 자동 호출됩니다.
 */
export function saveHubState(state: HubState): boolean {
  if (typeof window === "undefined") return false;
  const payload: HubState = {
    version: 1,
    categories: state.categories,
  };
  const json = JSON.stringify(payload);
  let localOk = false;
  try {
    localStorage.setItem(HUB_STORAGE_KEY, json);
    localOk = true;
  } catch (e) {
    console.warn(
      "[COOT Ai] localStorage에 저장하지 못했습니다. sessionStorage·백업 파일을 사용해 주세요.",
      e,
    );
  }
  writeMirror(json);
  return localOk;
}

export function loadHubState(): HubState | null {
  if (typeof window === "undefined") return null;
  try {
    let localRaw: string | null = null;
    let sessionRaw: string | null = null;
    try {
      localRaw = localStorage.getItem(HUB_STORAGE_KEY);
    } catch {
      /* ignore */
    }
    try {
      sessionRaw = sessionStorage.getItem(HUB_SESSION_MIRROR_KEY);
    } catch {
      /* ignore */
    }

    const parsedLocal = localRaw ? parseHubStateJson(localRaw) : null;
    const parsedSession = sessionRaw ? parseHubStateJson(sessionRaw) : null;
    const nLocal = parsedLocal?.categories.length ?? 0;
    const nSession = parsedSession?.categories.length ?? 0;

    /**
     * 로컬에 빈 categories만 남은 경우가 있음(저장 레이스·실수로 [] 덮어쓰기 등).
     * 이때 세션 미러에 예전 목록이 남아 있으면 그쪽으로 복구한다.
     */
    let result: HubState | null = null;
    if (parsedLocal && nLocal === 0 && parsedSession && nSession > 0) {
      result = parsedSession;
    } else if (!parsedLocal && parsedSession) {
      result = parsedSession;
    } else if (parsedLocal) {
      result = parsedLocal;
    } else if (parsedSession) {
      result = parsedSession;
    }

    /** 세션에서 살린 데이터를 로컬에 다시 써서 다음 방문부터 일관되게 */
    if (result && result.categories.length > 0) {
      try {
        const pl = localRaw ? parseHubStateJson(localRaw) : null;
        if ((pl?.categories.length ?? 0) === 0) {
          saveHubState(result);
        }
      } catch {
        /* ignore */
      }
    }

    return result;
  } catch {
    return null;
  }
}

/** 탭 종료·백그라운드 전환 시 최신 React 상태를 디스크에 맞춤 */
export function flushHubState(state: HubState): void {
  saveHubState(state);
}

export function clearHubState(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(HUB_STORAGE_KEY);
  } catch {
    /* ignore */
  }
  try {
    sessionStorage.removeItem(HUB_SESSION_MIRROR_KEY);
  } catch {
    /* ignore */
  }
}

/** 내보내기용 JSON 문자열 */
export function serializeHubState(state: HubState): string {
  return JSON.stringify({ version: 1, categories: state.categories }, null, 2);
}
