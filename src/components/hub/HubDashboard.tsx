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
import { normalizeHubState, newId } from "@/lib/hub-utils";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";
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

  function loadLocalRecoveryIntoState() {
    const fromLoader = loadHubState();
    const deep = deepRecoverHubState();
    const empty: HubState = { version: 1, categories: [] };
    const base = fromLoader ?? empty;
    const deepCount = deep ? countHubLinks(deep) : 0;
    const baseCount = countHubLinks(base);

    if (deep && deepCount > baseCount) {
      setState(deep);
      saveHubState(deep);
    } else if (fromLoader) {
      setState(fromLoader);
    } else if (deep && deepCount > 0) {
      setState(deep);
      saveHubState(deep);
    }
  }

  /** 첫 로드: Supabase 로그인 시 서버 허브 우선, 아니면 로컬 복구 */
  useEffect(() => {
    let cancelled = false;

    async function init() {
      if (!isSupabaseConfigured()) {
        loadLocalRecoveryIntoState();
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
          loadLocalRecoveryIntoState();
          storageReadyRef.current = true;
          return;
        }
        const json = (await res.json()) as { state: HubState | null };
        const remote = json.state;
        const fromLoader = loadHubState();
        const deep = deepRecoverHubState();
        const empty: HubState = { version: 1, categories: [] };
        const localBest = (() => {
          const base = fromLoader ?? empty;
          if (deep && countHubLinks(deep) > countHubLinks(base)) return deep;
          return fromLoader ?? base;
        })();
        const localCount = countHubLinks(localBest);
        const hasRemote =
          remote && Array.isArray(remote.categories) && remote.categories.length > 0;

        if (hasRemote) {
          const sorted = normalizeHubState(remote!);
          setState(sorted);
          saveHubState(sorted);
        } else if (localCount > 0) {
          const sorted = normalizeHubState(localBest);
          setState(sorted);
          saveHubState(sorted);
          await pushHubStateRemote(sorted);
        } else {
          loadLocalRecoveryIntoState();
        }
      } else {
        loadLocalRecoveryIntoState();
      }
      storageReadyRef.current = true;
    }

    void init();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setCloudLoggedIn(!!session?.user);
    });
    return () => subscription.unsubscribe();
  }, []);

  stateRef.current = state;

  /** 탭 전환·닫기 직전 디스크에 한 번 더 맞춤(브라우저 종료 시 유실 완화) */
  useEffect(() => {
    function onHidden() {
      if (document.visibilityState === "hidden") {
        flushHubState(stateRef.current);
        void pushHubStateRemote(stateRef.current);
      }
    }
    function onPageHide() {
      flushHubState(stateRef.current);
      void pushHubStateRemote(stateRef.current);
    }
    document.addEventListener("visibilitychange", onHidden);
    window.addEventListener("pagehide", onPageHide);
    return () => {
      document.removeEventListener("visibilitychange", onHidden);
      window.removeEventListener("pagehide", onPageHide);
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
      const sorted: HubState = {
        version: 1,
        categories: [...next.categories]
          .sort((a, b) => a.order - b.order)
          .map((c, i) => ({ ...c, order: i })),
      };
      saveHubState(sorted);
      void pushHubStateRemote(sorted);
      return sorted;
    });
  }, []);

  /** 다른 탭·다른 창에서 저장된 내용 동기화 */
  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key !== HUB_STORAGE_KEY || e.storageArea !== localStorage) return;
      if (e.newValue === null) {
        setState(createDefaultHubState());
        return;
      }
      const parsed = parseHubStateJson(e.newValue);
      if (parsed) setState(parsed);
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
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
                links: c.links.map((l) =>
                  l.id === editingLink.id
                    ? {
                        ...l,
                        name: payload.name,
                        url: payload.url,
                        iconUrl: payload.iconUrl,
                      }
                    : l,
                ),
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
      iconUrl: payload.iconUrl,
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
      const sorted: HubState = {
        version: 1,
        categories: [...parsed.categories]
          .sort((a, b) => a.order - b.order)
          .map((c, i) => ({ ...c, order: i })),
      };
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
      const sorted: HubState = {
        version: 1,
        categories: mergeCategoriesByNormalizedName(merged.categories).map((c, i) => ({ ...c, order: i })),
      };
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
    setState(deep);
    saveHubState(deep);
    void pushHubStateRemote(deep);
  }

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6 sm:py-10">
      <div className="relative z-[100]">
      <StorageOriginNotice />

      <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">AI 바로가기</h1>
          <p className="mt-2 max-w-xl text-coot-muted">
            구역별로 AI 사이트를 모아두고, 카테고리·링크를 추가·수정·드래그 정렬하세요. 변경 사항은
            이 브라우저에 자동 저장되며, 다음에 같은 주소로 열면 이어서 작업할 수 있습니다.
          </p>
          {lastSavedAt ? (
            <p className="mt-1.5 text-xs text-coot-muted-2">
              마지막 반영: {lastSavedAt} ·{" "}
              {isSupabaseConfigured() && cloudLoggedIn
                ? "이 브라우저 + 서버(계정 동기화)"
                : "이 브라우저 저장소"}
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
        />
      ) : null}
      </div>

      <MascotAgent paused={categoryModalOpen || serviceModalOpen} />
    </div>
  );
}
