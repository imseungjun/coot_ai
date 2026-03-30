"use client";

import { useEffect, useState } from "react";
import {
  clearCategoryDraft,
  loadCategoryDraft,
  saveCategoryDraft,
} from "@/lib/hub-drafts";

type CategoryModalProps = {
  open: boolean;
  mode: "add" | "edit";
  /** 수정 모드일 때 대상 카테고리 id */
  editingCategoryId?: string | null;
  initialName?: string;
  onClose: () => void;
  onSave: (name: string) => void;
};

export function CategoryModal({
  open,
  mode,
  editingCategoryId = null,
  initialName = "",
  onClose,
  onSave,
}: CategoryModalProps) {
  const [name, setName] = useState("");

  const draftTarget: string | null = mode === "edit" ? editingCategoryId : null;

  useEffect(() => {
    if (!open) return;
    const draft = loadCategoryDraft();
    if (
      draft &&
      draft.targetCategoryId === draftTarget &&
      typeof draft.name === "string"
    ) {
      setName(draft.name);
      return;
    }
    setName(mode === "edit" ? initialName : "");
  }, [open, mode, draftTarget, initialName]);

  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => {
      saveCategoryDraft({ targetCategoryId: draftTarget, name });
    }, 200);
    return () => clearTimeout(t);
  }, [open, draftTarget, name]);

  if (!open) return null;

  const title = mode === "edit" ? "카테고리 수정" : "카테고리 추가";
  const submitLabel = mode === "edit" ? "저장" : "만들기";

  function submit() {
    const n = name.trim();
    if (!n) return;
    clearCategoryDraft();
    onSave(n);
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="category-modal-title"
    >
      <div className="w-full max-w-md rounded-2xl border border-coot-border bg-coot-surface p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 id="category-modal-title" className="text-lg font-semibold text-coot-text">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-coot-muted hover:bg-coot-bg hover:text-coot-text"
            aria-label="닫기"
          >
            ✕
          </button>
        </div>
        <label className="block">
          <span className="mb-1 block text-sm text-coot-muted">구역 이름</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="예: 음성, 코딩, 기타링크"
            className="w-full rounded-xl border border-coot-border bg-coot-bg px-3 py-2 text-sm text-coot-text outline-none focus:border-coot-accent"
            onKeyDown={(e) => {
              if (e.key === "Enter" && name.trim()) submit();
            }}
          />
        </label>
        <p className="mt-2 text-xs text-coot-muted">
          입력 내용은 자동으로 임시 저장됩니다. 창을 닫았다가 다시 열어도 이어서 수정할 수 있습니다.
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-coot-border px-4 py-2 text-sm text-coot-text hover:bg-coot-bg"
          >
            취소
          </button>
          <button
            type="button"
            disabled={!name.trim()}
            onClick={submit}
            className="rounded-full bg-coot-accent px-4 py-2 text-sm font-semibold text-coot-on-accent disabled:opacity-40"
          >
            {submitLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
