"use client";

import { useEffect, useState } from "react";
import {
  clearServiceDraft,
  loadServiceDraft,
  saveServiceDraft,
} from "@/lib/hub-drafts";
import { faviconUrlForPage, normalizeUrl } from "@/lib/hub-utils";

type ServiceModalProps = {
  open: boolean;
  title?: string;
  submitLabel?: string;
  initialName?: string;
  initialUrl?: string;
  initialIconUrl?: string;
  /** 열린 동안 초안 저장·복구에 사용 */
  categoryId: string;
  linkId: string | null;
  onClose: () => void;
  onSave: (payload: { name: string; url: string; iconUrl?: string }) => void;
  /** 기존 링크 수정 시: 입력 후 자동 저장(디바운스). 저장 버튼 없이도 허브에 반영됩니다. */
  onAutoSave?: (payload: { name: string; url: string; iconUrl?: string }) => void;
};

export function ServiceModal({
  open,
  title = "AI 서비스 추가",
  submitLabel = "추가",
  initialName = "",
  initialUrl = "",
  initialIconUrl = "",
  categoryId,
  linkId,
  onClose,
  onSave,
  onAutoSave,
}: ServiceModalProps) {
  const [name, setName] = useState(initialName);
  const [url, setUrl] = useState(initialUrl);
  const [iconTab, setIconTab] = useState<"auto" | "manual">(
    initialIconUrl ? "manual" : "auto",
  );
  const [manualIcon, setManualIcon] = useState(initialIconUrl);
  /** 수정 모드에서 자동 저장을 켜기 전 짧은 딜레이(초기값 중복 저장 방지) */
  const [autoSaveGate, setAutoSaveGate] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setFormError(null);
    const draft = loadServiceDraft();
    const matches =
      draft &&
      draft.categoryId === categoryId &&
      draft.linkId === linkId;
    if (matches) {
      setName(draft.name);
      setUrl(draft.url);
      setIconTab(draft.iconTab);
      setManualIcon(draft.manualIcon);
      return;
    }
    setName(initialName);
    setUrl(initialUrl);
    setManualIcon(initialIconUrl);
    setIconTab(initialIconUrl ? "manual" : "auto");
  }, [open, categoryId, linkId, initialName, initialUrl, initialIconUrl]);

  useEffect(() => {
    if (!open || !linkId) {
      setAutoSaveGate(false);
      return;
    }
    setAutoSaveGate(false);
    const t = window.setTimeout(() => setAutoSaveGate(true), 600);
    return () => window.clearTimeout(t);
  }, [open, linkId]);

  useEffect(() => {
    if (!open || !onAutoSave || !linkId || !autoSaveGate) return;
    const n = name.trim();
    const u = normalizeUrl(url);
    if (!n || !u) return;
    const t = window.setTimeout(() => {
      let iconUrl: string | undefined;
      if (iconTab === "manual" && manualIcon.trim()) {
        iconUrl = manualIcon.trim();
      } else {
        iconUrl = undefined;
      }
      onAutoSave({ name: n, url: u, iconUrl });
    }, 550);
    return () => window.clearTimeout(t);
  }, [open, linkId, onAutoSave, autoSaveGate, name, url, iconTab, manualIcon]);

  useEffect(() => {
    if (!open || !categoryId) return;
    const t = window.setTimeout(() => {
      saveServiceDraft({
        categoryId,
        linkId,
        name,
        url,
        iconTab,
        manualIcon,
      });
    }, 250);
    return () => clearTimeout(t);
  }, [open, categoryId, linkId, name, url, iconTab, manualIcon]);

  if (!open) return null;

  const normalized = normalizeUrl(url);
  const previewAuto = normalized ? faviconUrlForPage(normalized) : "";

  function handleSave() {
    const n = name.trim();
    const u = normalizeUrl(url);
    if (!n || !u) {
      setFormError("이름과 URL을 모두 입력해 주세요. (URL은 youtube.com/... 형식 또는 https:// 로 시작)");
      return;
    }
    setFormError(null);
    let iconUrl: string | undefined;
    if (iconTab === "manual" && manualIcon.trim()) {
      iconUrl = manualIcon.trim();
    } else {
      iconUrl = undefined;
    }
    clearServiceDraft();
    onSave({ name: n, url: u, iconUrl });
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="service-modal-title"
    >
      <div className="w-full max-w-md rounded-2xl border border-coot-border bg-coot-surface p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 id="service-modal-title" className="text-lg font-semibold text-coot-text">
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

        <p className="mb-4 text-xs text-coot-muted">
          {linkId
            ? "이름·URL·아이콘을 바꾸면 잠시 후 자동으로 허브에 저장됩니다.「저장」을 누르면 창이 닫힙니다."
            : "입력 중인 내용은 자동으로 임시 저장됩니다. 브라우저를 닫았다가 같은 구역에서 다시 열면 이어서 작성할 수 있습니다."}
        </p>

        {formError ? (
          <p className="mb-4 rounded-xl border border-amber-500/40 bg-amber-950/30 px-3 py-2 text-xs text-amber-100/95">
            {formError}
          </p>
        ) : null}

        <div className="space-y-4">
          <label className="block">
            <span className="mb-1 block text-sm text-coot-muted">서비스 이름</span>
            <input
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setFormError(null);
              }}
              placeholder="예: My AI Tool"
              className="w-full rounded-xl border border-coot-border bg-coot-bg px-3 py-2 text-sm text-coot-text outline-none focus:border-coot-accent"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm text-coot-muted">URL</span>
            <input
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                setFormError(null);
              }}
              placeholder="예: chatgpt.com 또는 /help"
              className="w-full rounded-xl border border-coot-border bg-coot-bg px-3 py-2 text-sm text-coot-text outline-none focus:border-coot-accent"
            />
          </label>

          <div>
            <span className="mb-2 block text-sm text-coot-muted">아이콘</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIconTab("auto")}
                className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                  iconTab === "auto"
                    ? "bg-coot-accent text-coot-on-accent"
                    : "bg-coot-bg text-coot-muted"
                }`}
              >
                자동 감지
              </button>
              <button
                type="button"
                onClick={() => setIconTab("manual")}
                className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                  iconTab === "manual"
                    ? "bg-coot-accent text-coot-on-accent"
                    : "bg-coot-bg text-coot-muted"
                }`}
              >
                직접 URL
              </button>
            </div>
            {iconTab === "auto" ? (
              <div className="mt-3 flex items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full border border-coot-border bg-white">
                  {previewAuto ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={previewAuto}
                      alt=""
                      className="h-9 w-9 object-contain"
                    />
                  ) : (
                    <span className="text-xs text-neutral-400">?</span>
                  )}
                </div>
                <p className="text-xs text-coot-muted">
                  URL 도메인 기준 파비콘을 불러옵니다.
                </p>
              </div>
            ) : (
              <input
                value={manualIcon}
                onChange={(e) => setManualIcon(e.target.value)}
                placeholder="아이콘 이미지 URL"
                className="mt-3 w-full rounded-xl border border-coot-border bg-coot-bg px-3 py-2 text-sm text-coot-text outline-none focus:border-coot-accent"
              />
            )}
          </div>
        </div>

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
            onClick={handleSave}
            disabled={!name.trim() || !normalizeUrl(url)}
            className="rounded-full bg-coot-accent px-4 py-2 text-sm font-semibold text-coot-on-accent disabled:opacity-40"
          >
            {submitLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
