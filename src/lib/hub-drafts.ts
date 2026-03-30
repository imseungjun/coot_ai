const SERVICE_DRAFT_KEY = "coot-hub-service-draft-v1";
const CATEGORY_DRAFT_KEY = "coot-hub-category-draft-v1";

export type ServiceDraftV1 = {
  v: 1;
  categoryId: string;
  linkId: string | null;
  name: string;
  url: string;
  iconTab: "auto" | "manual";
  manualIcon: string;
};

export type CategoryDraftV1 = {
  v: 1;
  /** null = 새 카테고리 추가 중 */
  targetCategoryId: string | null;
  name: string;
};

export function loadServiceDraft(): ServiceDraftV1 | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SERVICE_DRAFT_KEY);
    if (!raw) return null;
    const d = JSON.parse(raw) as ServiceDraftV1;
    if (d?.v !== 1 || typeof d.categoryId !== "string") return null;
    return d;
  } catch {
    return null;
  }
}

export function saveServiceDraft(payload: {
  categoryId: string;
  linkId: string | null;
  name: string;
  url: string;
  iconTab: "auto" | "manual";
  manualIcon: string;
}): void {
  if (typeof window === "undefined") return;
  try {
    const data: ServiceDraftV1 = { v: 1, ...payload };
    localStorage.setItem(SERVICE_DRAFT_KEY, JSON.stringify(data));
  } catch {
    /* quota */
  }
}

export function clearServiceDraft(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(SERVICE_DRAFT_KEY);
}

export function loadCategoryDraft(): CategoryDraftV1 | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(CATEGORY_DRAFT_KEY);
    if (!raw) return null;
    const d = JSON.parse(raw) as CategoryDraftV1;
    if (d?.v !== 1) return null;
    return d;
  } catch {
    return null;
  }
}

export function saveCategoryDraft(payload: {
  targetCategoryId: string | null;
  name: string;
}): void {
  if (typeof window === "undefined") return;
  try {
    const data: CategoryDraftV1 = { v: 1, ...payload };
    localStorage.setItem(CATEGORY_DRAFT_KEY, JSON.stringify(data));
  } catch {
    /* quota */
  }
}

export function clearCategoryDraft(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(CATEGORY_DRAFT_KEY);
}
