"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
} from "react";
import { MascotAgent } from "@/components/mascot/MascotAgent";
import { createDefaultHubState } from "@/lib/hub-defaults";
import {
  countHubLinks,
  deepRecoverHubState,
  ensureKootPortfolioAtEnd,
  finalizeHubWithKoot,
  loadBestLocalHubState,
  mergeCategoriesByNormalizedName,
  mergeHubStates,
} from "@/lib/hub-recovery";
import {
  flushHubState,
  HUB_STORAGE_KEY,
  loadHubState,
  parseHubStateJson,
  saveHubState,
  serializeHubState,
} from "@/lib/hub-storage";
import type { HubCategory, HubLink, HubState } from "@/lib/hub-types";
import { pushHubStateRemote } from "@/lib/hub-cloud";
import {
  fetchHubBaselineMeta,
  flushHubBaseline,
  schedulePushHubBaseline,
} from "@/lib/hub-baseline-sync";
import { normalizeHubState, newId } from "@/lib/hub-utils";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import {
  CANONICAL_KOOT_REVISION,
  CANONICAL_KOOT_PORTFOLIO_LINKS,
  KOOT_PORTFOLIO_CATEGORY_ID,
} from "@/lib/hub-canonical";
import { CategoryModal } from "./CategoryModal";
import { HubCategorySection } from "./HubCategorySection";
import { ServiceModal } from "./ServiceModal";
import { StorageOriginNotice } from "./StorageOriginNotice";
import { TestAccessBanner } from "./TestAccessBanner";

export function HubDashboard() {
  /** 서버·첫 클라이언트 페인트와 동일하게 맞춰 hydration 오류 방지, 이후 localStorage 반영 */
  const [state, setState] = useState<HubState>(() => createDefaultHubState());
  const stateRef = useRef(state);
  const storageReadyRef = useRef(false);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const fileImportRef = useRef<HTMLInputElement>(null);
  const fileMergeImportRef = useRef<HTMLInputElement>(null);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<HubCategory | null>(null);
  const [serviceModalOpen, setServiceModalOpen] = useState(false);
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [editingLink, setEditingLink] = useState<HubLink | null>(null);
  const [cloudLoggedIn, setCloudLoggedIn] = useState(false);
  /** localStorage 용량 등으로 saveHubState가 실패했을 때 */
  const [storageSaveFailed, setStorageSaveFailed] = useState(false);
  /** data/hub-baseline.json 쓰기 가능(로컬 dev 또는 HUB_BASELINE_WRITE=1) */
  const [baselineFolderWritable, setBaselineFolderWritable] = useState(false);
  const [baselineFolderMessage, setBaselineFolderMessage] = useState<string | null>(null);

  const finalizeWithKootSeed = useCallback((next: HubState) => {
    const merged = finalizeHubWithKoot(next);
    setState(merged);
    saveHubState(merged);
  }, []);

  const loadLocalRecoveryIntoState = useCallback(() => {
    const fromLoader = loadHubState();
    const deep = deepRecoverHubState();
    const empty: HubState = { version: 1, categories: [] };
    const base = fromLoader ?? empty;
    const deepCount = deep ? countHubLinks(deep) : 0;
    const baseCount = countHubLinks(base);

    if (deep && deepCount > baseCount) {
      finalizeWithKootSeed(deep);
    } else if (fromLoader) {
      finalizeWithKootSeed(fromLoader);
    } else if (deep && deepCount > 0) {
      finalizeWithKootSeed(deep);
    } else {
      setState((prev) => {
        const merged = finalizeHubWithKoot(prev);
        saveHubState(merged);
        return merged;
      });
    }
  }, [finalizeWithKootSeed]);

  /** 첫 로드: Supabase 로그인 시 서버 허브 우선, 아니면 로컬 복구 */
  useEffect(() => {
    let cancelled = false;

    async function init() {
      let hadKeyBeforeInit = false;
      try {
        hadKeyBeforeInit = window.localStorage.getItem(HUB_STORAGE_KEY) !== null;
      } catch {
        hadKeyBeforeInit = false;
      }

      const meta = await fetchHubBaselineMeta();
      if (cancelled) return;
      setBaselineFolderWritable(meta.writable);

      function tryApplyBaselineFromWorkspace(): HubState | null {
        if (hadKeyBeforeInit) return null;
        if (!meta.state || meta.state.categories.length === 0) return null;
        const sorted = finalizeHubWithKoot(normalizeHubState(meta.state));
        setState(sorted);
        saveHubState(sorted);
        return sorted;
      }

      function loadLocalOrBaseline(): HubState | null {
        const applied = tryApplyBaselineFromWorkspace();
        if (!applied) loadLocalRecoveryIntoState();
        return applied;
      }

      if (!isSupabaseConfigured()) {
        loadLocalOrBaseline();
        storageReadyRef.current = true;
        return;
      }

      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (cancelled) return;
      setCloudLoggedIn(!!session?.user);

      if (session?.user) {
        const res = await fetch("/api/hub-state");
        if (cancelled) return;
        if (!res.ok) {
          loadLocalOrBaseline();
          storageReadyRef.current = true;
          return;
        }
        const json = (await res.json()) as { state: HubState | null };
        const remote = json.state;
        /** 서버 응답 직후·병합 직전에 다시 읽어, fetch 대기 중에 저장된 편집이 덮어쓰이지 않게 함 */
        const localBest = loadBestLocalHubState();
        const localCount = countHubLinks(localBest);
        const hasRemote =
          remote && Array.isArray(remote.categories) && remote.categories.length > 0;

        /**
         * 서버만 무조건 우선하면, 로컬에서 편집했는데 동기화가 밀린 경우 예전 서버본으로 덮입니다.
         * 로컬·원격 둘 다 있으면 `mergeHubStates(로컬, 원격)`으로 합칩니다. 같은 링크 id는 이 브라우저(로컬)가 이기고,
         * 원격에만 있는 id만 추가됩니다. (원격 링크 총개수만 더 많아도 쿠트 포트폴리오에서 고친 URL이 지워지지 않음)
         */
        if (hasRemote && localCount > 0) {
          const remoteFinal = finalizeHubWithKoot(
            normalizeHubState(remote!),
          );
          const localFinal = finalizeHubWithKoot(
            normalizeHubState(localBest),
          );
          const merged = mergeHubStates(localFinal, remoteFinal);
          const sorted = finalizeHubWithKoot(normalizeHubState(merged));
          setState(sorted);
          saveHubState(sorted);
          await pushHubStateRemote(sorted);
        } else if (hasRemote) {
          /** 로컬이 비어 있어도 sessionStorage·전체 스캔 복구본이 있으면 그걸 먼저 합쳐 서버 예전본만 쓰는 일을 줄임 */
          const remoteSorted = finalizeHubWithKoot(normalizeHubState(remote!));
          const localFresh = loadBestLocalHubState();
          const merged =
            countHubLinks(localFresh) > 0
              ? mergeHubStates(localFresh, remoteSorted)
              : remoteSorted;
          const sorted = finalizeHubWithKoot(normalizeHubState(merged));
          setState(sorted);
          saveHubState(sorted);
          void pushHubStateRemote(sorted);
        } else if (localCount > 0) {
          const sorted = finalizeHubWithKoot(normalizeHubState(localBest));
          setState(sorted);
          saveHubState(sorted);
          await pushHubStateRemote(sorted);
        } else {
          const applied = loadLocalOrBaseline();
          if (applied && session?.user) void pushHubStateRemote(applied);
        }
      } else {
        loadLocalOrBaseline();
      }
      storageReadyRef.current = true;
    }

    void init();
    return () => {
      cancelled = true;
    };
  }, [loadLocalRecoveryIntoState]);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setCloudLoggedIn(!!session?.user);
      /** 로그인 직전에 편집한 로컬 목록을 서버에 한 번 올려 동기화 */
      if (event === "SIGNED_IN" && session?.user && storageReadyRef.current) {
        flushHubState(stateRef.current);
        void pushHubStateRemote(stateRef.current);
        void flushHubBaseline(stateRef.current);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  stateRef.current = state;

  /** 화면 상태가 바뀔 때마다 즉시 브라우저에 저장(편집 경로 누락·비정상 종료 대비) */
  useEffect(() => {
    if (!storageReadyRef.current) return;
    saveHubState(state);
    schedulePushHubBaseline(state);
  }, [state]);

  /** 30초마다 스냅샷(크래시·저장 직전 탭 전환 등 보조) */
  useEffect(() => {
    const id = window.setInterval(() => {
      if (!storageReadyRef.current) return;
      flushHubState(stateRef.current);
      void pushHubStateRemote(stateRef.current);
      void flushHubBaseline(stateRef.current);
    }, 30_000);
    return () => window.clearInterval(id);
  }, []);

  /** 탭 전환·닫기·창 종료 직전 디스크·서버에 최신본 반영 */
  useEffect(() => {
    function flush() {
      flushHubState(stateRef.current);
      void pushHubStateRemote(stateRef.current);
      void flushHubBaseline(stateRef.current);
    }
    function onHidden() {
      if (document.visibilityState === "hidden") {
        flush();
      }
    }
    function onPageHide() {
      flush();
    }
    function onBeforeUnload() {
      flush();
    }
    document.addEventListener("visibilitychange", onHidden);
    window.addEventListener("pagehide", onPageHide);
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => {
      document.removeEventListener("visibilitychange", onHidden);
      window.removeEventListener("pagehide", onPageHide);
      window.removeEventListener("beforeunload", onBeforeUnload);
    };
  }, []);

  /** 저장 시각 표시(복구·편집 이후) */
  useEffect(() => {
    if (!storageReadyRef.current) return;
    setLastSavedAt(
      new Date().toLocaleTimeString("ko-KR", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }),
    );
  }, [state]);

  /** 저장 전 항상 디스크 최신본을 베이스로 사용 → 다른 탭·오래된 React 상태로 덮어쓰기 방지 */
  const persist = useCallback((updater: (base: HubState) => HubState) => {
    setState((prev) => {
      const fromDisk = loadHubState();
      const base = fromDisk ?? prev;
      const next = updater(base);
      /** 쿠트 맨 아래 정렬 + 캐논 리비전 처리(같은 id는 기존 저장값 유지) — 편집 직후에도 허브 규칙과 일치 */
      const sorted = finalizeHubWithKoot(normalizeHubState(next));
      if (!saveHubState(sorted)) {
        queueMicrotask(() => setStorageSaveFailed(true));
      } else {
        queueMicrotask(() => setStorageSaveFailed(false));
      }
      void pushHubStateRemote(sorted);
      return sorted;
    });
  }, []);

  /**
   * 다른 탭·다른 창에서 localStorage가 바뀔 때 동기화.
   * 예전에는 newValue로 통째로 setState 해서, 다른 탭이 오래된 본을 저장하면
   * (방금 이 탭에서 추가한 링크 등이) 통째로 사라질 수 있었음 → 합침.
   */
  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key !== HUB_STORAGE_KEY || e.storageArea !== localStorage) return;
      if (e.newValue === null) {
        setState(createDefaultHubState());
        return;
      }
      const parsed = parseHubStateJson(e.newValue);
      if (!parsed) return;
      const localFinal = finalizeHubWithKoot(normalizeHubState(stateRef.current));
      const remoteFinal = finalizeHubWithKoot(normalizeHubState(parsed));
      const merged = mergeHubStates(localFinal, remoteFinal);
      const sorted = finalizeHubWithKoot(normalizeHubState(merged));
      setState(sorted);
      saveHubState(sorted);
      void pushHubStateRemote(sorted);
      void flushHubBaseline(sorted);
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  /** 현재 화면 상태를 저장소 폴더 data/hub-baseline.json 에 즉시 기록 (Git 커밋용) */
  const saveProjectFolderBaseline = useCallback(async () => {
    const sorted = finalizeHubWithKoot(normalizeHubState(stateRef.current));
    saveHubState(sorted);
    const ok = await flushHubBaseline(sorted);
    if (ok) {
      setBaselineFolderMessage(
        "프로젝트 폴더(data/hub-baseline.json)에 저장했습니다. Git에 커밋하면 재부팅·다른 PC에서도 이 목록을 초기값으로 쓸 수 있습니다.",
      );
    } else {
      setBaselineFolderMessage(
        "폴더 저장에 실패했습니다. 로컬에서 npm run dev 로 실행 중인지 확인하세요. (next start 를 쓰는 경우 .env에 HUB_BASELINE_WRITE=1)",
      );
    }
    window.setTimeout(() => setBaselineFolderMessage(null), 10_000);
  }, []);

  const sortedCategories = useMemo(() => {
    if (!state) return [];
    return [...state.categories].sort((a, b) => a.order - b.order);
  }, [state]);

  function openAddService(categoryId: string) {
    setEditingLink(null);
    setActiveCategoryId(categoryId);
    setServiceModalOpen(true);
  }

  function openEditService(categoryId: string, link: HubLink) {
    setActiveCategoryId(categoryId);
    setEditingLink(link);
    setServiceModalOpen(true);
  }

  /** 수정 중: 입력 후 자동 저장(모달에서 디바운스). 저장 버튼과 동일하게 허브·localStorage 반영. */
  const handleAutoSaveService = useCallback(
    (payload: { name: string; url: string; iconUrl?: string }) => {
      if (!activeCategoryId || !editingLink) return;
      const linkId = editingLink.id;
      persist((base) => ({
        ...base,
        categories: base.categories.map((c) =>
          c.id !== activeCategoryId
            ? c
            : {
                ...c,
                links: c.links.map((l) => {
                  if (l.id !== linkId) return l;
                  const next: HubLink = {
                    id: l.id,
                    name: payload.name,
                    url: payload.url,
                  };
                  if (payload.iconUrl?.trim()) {
                    next.iconUrl = payload.iconUrl.trim();
                  }
                  return next;
                }),
              },
        ),
      }));
    },
    [activeCategoryId, editingLink, persist],
  );

  function handleSaveService(payload: { name: string; url: string; iconUrl?: string }) {
    if (!activeCategoryId) return;
    const catId = activeCategoryId;

    if (editingLink) {
      persist((base) => ({
        ...base,
        categories: base.categories.map((c) =>
          c.id !== catId
            ? c
            : {
                ...c,
                links: c.links.map((l) => {
                  if (l.id !== editingLink.id) return l;
                  const next: HubLink = {
                    id: l.id,
                    name: payload.name,
                    url: payload.url,
                  };
                  if (payload.iconUrl?.trim()) {
                    next.iconUrl = payload.iconUrl.trim();
                  }
                  return next;
                }),
              },
        ),
      }));
      setEditingLink(null);
      return;
    }

    const newLink: HubLink = {
      id: newId(),
      name: payload.name,
      url: payload.url,
      ...(payload.iconUrl?.trim() ? { iconUrl: payload.iconUrl.trim() } : {}),
    };
    persist((base) => ({
      ...base,
      categories: base.categories.map((c) =>
        c.id !== catId ? c : { ...c, links: [...c.links, newLink] },
      ),
    }));
  }

  function handleDeleteLink(categoryId: string, linkId: string) {
    persist((base) => ({
      ...base,
      categories: base.categories.map((c) =>
        c.id !== categoryId
          ? c
          : { ...c, links: c.links.filter((l) => l.id !== linkId) },
      ),
    }));
  }

  function handleAddCategory(name: string) {
    persist((base) => {
      const maxOrder = Math.max(-1, ...base.categories.map((c) => c.order));
      const cat: HubCategory = {
        id: newId(),
        name: name.trim(),
        order: maxOrder + 1,
        links: [],
      };
      return { ...base, categories: [...base.categories, cat] };
    });
  }

  function handleSaveCategoryModal(name: string) {
    const n = name.trim();
    if (!n) return;
    if (editingCategory) {
      persist((base) => ({
        ...base,
        categories: base.categories.map((c) =>
          c.id === editingCategory.id ? { ...c, name: n } : c,
        ),
      }));
      return;
    }
    handleAddCategory(n);
  }

  function moveLink(categoryId: string, fromIndex: number, toIndex: number) {
    if (fromIndex === toIndex) return;
    persist((base) => ({
      ...base,
      categories: base.categories.map((c) => {
        if (c.id !== categoryId) return c;
        const links = [...c.links];
        if (fromIndex < 0 || fromIndex >= links.length) return c;
        if (toIndex < 0 || toIndex >= links.length) return c;
        const [item] = links.splice(fromIndex, 1);
        links.splice(toIndex, 0, item);
        return { ...c, links };
      }),
    }));
  }

  function moveCategory(categoryId: string, dir: -1 | 1) {
    persist((base) => {
      const ordered = [...base.categories].sort((a, b) => a.order - b.order);
      const idx = ordered.findIndex((c) => c.id === categoryId);
      const swap = idx + dir;
      if (idx < 0 || swap < 0 || swap >= ordered.length) return base;
      const next = [...ordered];
      [next[idx], next[swap]] = [next[swap], next[idx]];
      const categories = next.map((c, i) => ({ ...c, order: i }));
      return { ...base, categories };
    });
  }

  function deleteCategory(categoryId: string) {
    if (!window.confirm("이 구역과 안의 모든 링크를 삭제할까요?")) return;
    persist((base) => ({
      ...base,
      categories: base.categories.filter((c) => c.id !== categoryId),
    }));
  }

  function resetToDefault() {
    if (!window.confirm("모든 카테고리와 링크를 초기 데이터로 되돌릴까요?")) return;
    const fresh = createDefaultHubState();
    setState(fresh);
    saveHubState(fresh);
    void pushHubStateRemote(fresh);
  }

  function downloadBackup() {
    const raw = serializeHubState(state);
    const blob = new Blob([raw], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `coot-ai-hub-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function onImportFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = typeof reader.result === "string" ? reader.result : "";
      const parsed = parseHubStateJson(text);
      if (!parsed) {
        window.alert("백업 파일을 읽을 수 없습니다. JSON 형식을 확인해 주세요.");
        return;
      }
      if (!window.confirm("현재 목록을 백업 파일 내용으로 바꿀까요? (저장된 내용은 덮어씁니다)")) {
        return;
      }
      const normalized = normalizeHubState({ version: 1, categories: parsed.categories });
      const sorted = ensureKootPortfolioAtEnd(normalized);
      setState(sorted);
      saveHubState(sorted);
      void pushHubStateRemote(sorted);
    };
    reader.readAsText(file, "utf-8");
  }

  /** 다른 포트·백업 파일의 데이터를 현재 목록과 합침 (덮어쓰지 않음) */
  function onMergeImportFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = typeof reader.result === "string" ? reader.result : "";
      const parsed = parseHubStateJson(text);
      if (!parsed) {
        window.alert("백업 파일을 읽을 수 없습니다. JSON 형식을 확인해 주세요.");
        return;
      }
      if (
        !window.confirm(
          "백업 파일의 구역·링크를 지금 목록과 합칩니다. 같은 이름의 구역은 링크가 합쳐집니다. 계속할까요?",
        )
      ) {
        return;
      }
      const base = loadHubState() ?? stateRef.current;
      const merged = mergeHubStates(base, parsed);
      const normalized = normalizeHubState({
        version: 1,
        categories: mergeCategoriesByNormalizedName(merged.categories).map((c, i) => ({ ...c, order: i })),
      });
      const sorted = ensureKootPortfolioAtEnd(normalized);
      setState(sorted);
      saveHubState(sorted);
      void pushHubStateRemote(sorted);
    };
    reader.readAsText(file, "utf-8");
  }

  /** localStorage·sessionStorage 전체 스캔 후 스냅샷 병합(수동) */
  function tryDeepRecoveryFromStorage() {
    const deep = deepRecoverHubState();
    if (!deep || countHubLinks(deep) === 0) {
      window.alert(
        "브라우저 저장소에서 추가로 복구할 링크를 찾지 못했습니다. 예전에「백업 내보내기」로 받아 둔 JSON이 있으면「백업 가져오기」를 이용해 주세요.",
      );
      return;
    }
    const n = countHubLinks(deep);
    if (
      !window.confirm(
        `저장소에 남아 있는 스냅샷을 합쳐 총 ${n}개의 링크로 복구합니다. 현재 화면 내용은 덮어씁니다. 계속할까요?`,
      )
    ) {
      return;
    }
    const merged = finalizeHubWithKoot(deep);
    setState(merged);
    saveHubState(merged);
    void pushHubStateRemote(merged);
  }

  const kootCategory = state.categories.find((c) => c.id === KOOT_PORTFOLIO_CATEGORY_ID);
  const kootLoadedCount = kootCategory?.links.length ?? 0;
  const kootInSync = kootLoadedCount === CANONICAL_KOOT_PORTFOLIO_LINKS.length;

  const isDev = process.env.NODE_ENV === "development";

  return (
    <div className="mx-auto w-full min-w-0 max-w-[1400px] px-4 py-8 sm:px-6 sm:py-10">
      <StorageOriginNotice />

      {isDev ? (
        <aside
          className="mb-6 rounded-2xl border border-emerald-500/40 bg-emerald-950/30 px-4 py-3 sm:px-5"
          aria-label="로컬 개발 확인"
        >
          <p className="text-sm font-semibold text-emerald-100/95">로컬 개발 서버가 정상입니다</p>
          <p className="mt-1 text-xs leading-relaxed text-emerald-100/75">
            이 초록 안내는 <span className="text-emerald-200/90">npm run dev</span> 로 띄운 개발 모드에서만 보입니다.
            브라우저 주소가{" "}
            <span className="font-mono text-[11px] text-emerald-200/95">http://localhost:3000/</span>
            인지 확인하세요. 배포(production) 빌드에는 이 박스가 나오지 않습니다.
          </p>
        </aside>
      ) : null}

      {storageSaveFailed ? (
        <div className="mb-6 rounded-2xl border border-red-500/50 bg-red-950/35 px-4 py-3 text-sm text-red-100/95 sm:px-5">
          <p className="font-medium">브라우저 저장에 실패했습니다</p>
          <p className="mt-1 text-xs text-red-100/80">
            저장 공간이 부족하거나 사이트 데이터가 막혀 있을 수 있습니다. 다른 탭을 닫거나 브라우저 설정에서 이
            사이트의 저장소를 확인한 뒤,「백업 내보내기」로 JSON을 남겨 두세요.
          </p>
          <button
            type="button"
            onClick={() => setStorageSaveFailed(false)}
            className="mt-3 text-xs font-medium text-red-200 underline underline-offset-2 hover:text-white"
          >
            닫기
          </button>
        </div>
      ) : null}

      <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">AI 바로가기</h1>
          <p className="mt-2 max-w-xl text-coot-muted">
            구역별로 AI 사이트를 모아두고, 카테고리·링크를 추가·수정·드래그 정렬하세요. 변경할 때마다
            이 브라우저에 자동 저장되며, PC를 껐다 켜도 같은 브라우저·같은 주소(
            <span className="text-coot-text">localhost:3000</span>)면 설정이 유지됩니다.
          </p>
          <p className="mt-2 max-w-2xl text-[11px] leading-relaxed text-coot-muted-2">
            프로젝트 폴더의 <code className="rounded bg-coot-surface-2 px-1 py-0.5 text-coot-muted">data/hub-baseline.json</code>
            에도 기록해 두면 Git에 커밋한 뒤 다른 PC나 저장소를 새로 받았을 때 동일한 목록을 초기값으로 불러올 수 있습니다.
          </p>
          {baselineFolderMessage ? (
            <p className="mt-2 max-w-2xl rounded-xl border border-emerald-500/35 bg-emerald-950/25 px-3 py-2 text-xs text-emerald-100/95">
              {baselineFolderMessage}
            </p>
          ) : null}
          {lastSavedAt ? (
            <p className="mt-1.5 text-xs text-coot-muted-2">
              마지막 반영: {lastSavedAt} ·{" "}
              {isSupabaseConfigured() && cloudLoggedIn
                ? "이 브라우저 + 서버(계정 동기화)"
                : "이 브라우저 저장소"}
            </p>
          ) : null}
          <p className="mt-1.5 text-[11px] leading-relaxed text-coot-muted-2">
            쿠트 포트폴리오: 코드 리비전 {CANONICAL_KOOT_REVISION} · 코드에 정의된 링크{" "}
            {CANONICAL_KOOT_PORTFOLIO_LINKS.length}개 · 화면에 로드된 링크 {kootLoadedCount}개
            {kootInSync ? (
              <span className="text-emerald-400/90"> (동기화됨)</span>
            ) : (
              <span className="text-amber-400/90"> (새로고침 또는 리비전 확인)</span>
            )}
          </p>
          {kootCategory ? (
            <p className="mt-2">
              <a
                href="#koot-portfolio"
                className="text-xs font-medium text-coot-accent underline-offset-2 hover:underline"
              >
                쿠트 포트폴리오 구역으로 이동 ↓
              </a>
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setEditingCategory(null);
              setCategoryModalOpen(true);
            }}
            className="rounded-full border border-coot-border bg-coot-surface px-4 py-2 text-sm font-medium text-coot-text hover:border-coot-accent/50"
          >
            카테고리 추가
          </button>
          <button
            type="button"
            onClick={downloadBackup}
            className="rounded-full border border-coot-border bg-coot-surface px-4 py-2 text-sm font-medium text-coot-text hover:border-coot-accent/50"
          >
            백업 내보내기
          </button>
          <button
            type="button"
            onClick={() => fileImportRef.current?.click()}
            className="rounded-full border border-coot-border bg-coot-surface px-4 py-2 text-sm font-medium text-coot-text hover:border-coot-accent/50"
          >
            백업 가져오기
          </button>
          <button
            type="button"
            onClick={() => fileMergeImportRef.current?.click()}
            className="rounded-full border border-coot-border bg-coot-surface px-4 py-2 text-sm font-medium text-coot-text hover:border-coot-accent/50"
            title="다른 포트에서 내보낸 JSON 등을 합칩니다"
          >
            백업 병합
          </button>
          <button
            type="button"
            onClick={tryDeepRecoveryFromStorage}
            className="rounded-full border border-coot-border bg-coot-surface px-4 py-2 text-sm font-medium text-coot-text hover:border-coot-accent/50"
            title="이 브라우저의 localStorage·sessionStorage에 남아 있는 모든 조각을 합칩니다"
          >
            저장소 복구
          </button>
          {baselineFolderWritable ? (
            <button
              type="button"
              onClick={() => void saveProjectFolderBaseline()}
              className="rounded-full border border-coot-accent/45 bg-coot-surface px-4 py-2 text-sm font-medium text-coot-accent hover:border-coot-accent hover:bg-white/[0.04]"
              title="data/hub-baseline.json 에 지금 목록을 씁니다. Git 커밋으로 영구 보관하세요."
            >
              프로젝트 폴더에 저장
            </button>
          ) : null}
          <input
            ref={fileImportRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            tabIndex={-1}
            onChange={onImportFileChange}
          />
          <input
            ref={fileMergeImportRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            tabIndex={-1}
            onChange={onMergeImportFileChange}
          />
          <button
            type="button"
            onClick={resetToDefault}
            className="rounded-full px-4 py-2 text-sm text-coot-muted hover:text-coot-text"
          >
            초기화
          </button>
        </div>
      </div>

      {sortedCategories.length === 0 ? (
        <div className="mb-10 rounded-2xl border border-amber-500/30 bg-amber-950/20 px-4 py-6 text-center sm:px-6">
          <p className="text-sm font-medium text-coot-text">저장된 구역(카테고리)이 없습니다.</p>
          <p className="mt-2 text-xs text-coot-muted">
            브라우저 저장소가 비어 있거나 손상된 경우입니다. 세션 미러에서 자동 복구를 시도했으며, 그래도 비어 있으면 아래에서
            복구할 수 있습니다.
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={resetToDefault}
              className="rounded-full border border-coot-border bg-coot-surface px-4 py-2 text-sm font-medium text-coot-text hover:border-coot-accent/50"
            >
              기본 구역·링크로 복구
            </button>
            <button
              type="button"
              onClick={() => fileImportRef.current?.click()}
              className="rounded-full border border-coot-border bg-coot-surface px-4 py-2 text-sm font-medium text-coot-text hover:border-coot-accent/50"
            >
              백업 JSON 가져오기
            </button>
            <button
              type="button"
              onClick={tryDeepRecoveryFromStorage}
              className="rounded-full border border-coot-border bg-coot-surface px-4 py-2 text-sm font-medium text-coot-text hover:border-coot-accent/50"
            >
              저장소 전체 복구
            </button>
          </div>
        </div>
      ) : null}

      {sortedCategories.map((cat, i) => (
        <HubCategorySection
          key={cat.id}
          category={cat}
          onAdd={() => openAddService(cat.id)}
          onEditLink={(link) => openEditService(cat.id, link)}
          onDeleteLink={(linkId) => handleDeleteLink(cat.id, linkId)}
          onMoveLink={(from, to) => moveLink(cat.id, from, to)}
          onEditCategory={() => {
            setEditingCategory(cat);
            setCategoryModalOpen(true);
          }}
          onMoveUp={() => moveCategory(cat.id, -1)}
          onMoveDown={() => moveCategory(cat.id, 1)}
          onDeleteCategory={() => deleteCategory(cat.id)}
          canMoveUp={i > 0}
          canMoveDown={i < sortedCategories.length - 1}
        />
      ))}

      <div className="mt-10 flex justify-center pb-2">
        <button
          type="button"
          onClick={() => {
            setEditingCategory(null);
            setCategoryModalOpen(true);
          }}
          className="rounded-2xl border border-coot-border bg-coot-surface/90 px-6 py-3 text-sm font-medium text-coot-text shadow-sm backdrop-blur-sm transition hover:border-coot-accent/50 hover:bg-white/[0.06]"
        >
          + 새 카테고리 추가
        </button>
      </div>

      <TestAccessBanner />

      <CategoryModal
        open={categoryModalOpen}
        mode={editingCategory ? "edit" : "add"}
        editingCategoryId={editingCategory?.id ?? null}
        initialName={editingCategory?.name ?? ""}
        onClose={() => {
          setCategoryModalOpen(false);
          setEditingCategory(null);
        }}
        onSave={handleSaveCategoryModal}
      />

      {serviceModalOpen && activeCategoryId ? (
        <ServiceModal
          open={serviceModalOpen}
          categoryId={activeCategoryId}
          linkId={editingLink?.id ?? null}
          title={editingLink ? "AI 서비스 수정" : "AI 서비스 추가"}
          submitLabel={editingLink ? "저장" : "추가"}
          initialName={editingLink?.name ?? ""}
          initialUrl={editingLink?.url ?? ""}
          initialIconUrl={editingLink?.iconUrl ?? ""}
          onClose={() => {
            setServiceModalOpen(false);
            setEditingLink(null);
            setActiveCategoryId(null);
          }}
          onSave={handleSaveService}
          onAutoSave={editingLink ? handleAutoSaveService : undefined}
        />
      ) : null}

      <MascotAgent paused={categoryModalOpen || serviceModalOpen} />
    </div>
  );
}
