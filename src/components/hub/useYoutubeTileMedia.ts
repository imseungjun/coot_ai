"use client";

import { useEffect, useState } from "react";
import { normalizeUrl } from "@/lib/hub-utils";
import {
  isYouTubeSearchUrl,
  parseYouTubeVideoId,
  youtubeThumbnailCandidates,
} from "@/lib/youtube";

/**
 * YouTube 검색 링크 → 서버에서 첫 동영상 ID 추정, CDN/oEmbed 썸네일·채널명 로딩.
 */
export function useYoutubeTileMedia(linkUrl: string, linkId: string) {
  const href = normalizeUrl(linkUrl);
  const internal = href.startsWith("/");
  const ytId = parseYouTubeVideoId(linkUrl);
  const searchMode = !ytId && isYouTubeSearchUrl(href);

  const [resolvedYtId, setResolvedYtId] = useState<string | null>(null);
  const [searchResolving, setSearchResolving] = useState(false);
  const [thumbIdx, setThumbIdx] = useState(0);
  const [thumbDead, setThumbDead] = useState(false);
  const [remoteThumb, setRemoteThumb] = useState<string | null>(null);
  const [oembedThumb, setOembedThumb] = useState<string | null>(null);
  const [metaAuthor, setMetaAuthor] = useState<string | null>(null);
  const [provider, setProvider] = useState<string | null>(null);

  const effectiveYtId = ytId ?? resolvedYtId;
  const thumbList = effectiveYtId ? youtubeThumbnailCandidates(effectiveYtId) : [];

  useEffect(() => {
    setThumbIdx(0);
    setThumbDead(false);
    setRemoteThumb(null);
    setOembedThumb(null);
    setMetaAuthor(null);
    setProvider(null);
    setResolvedYtId(null);
    setSearchResolving(false);
  }, [linkId, linkUrl]);

  useEffect(() => {
    if (!searchMode || !href) return;
    let cancelled = false;
    setSearchResolving(true);
    (async () => {
      try {
        const r = await fetch(`/api/youtube-search-preview?url=${encodeURIComponent(href)}`);
        if (!r.ok || cancelled) return;
        const j = (await r.json()) as { videoId?: string | null };
        if (cancelled) return;
        if (j.videoId && /^[\w-]{11}$/.test(j.videoId)) setResolvedYtId(j.videoId);
      } catch {
        /* ignore */
      } finally {
        if (!cancelled) setSearchResolving(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [searchMode, href, linkId]);

  useEffect(() => {
    if (!href || internal) return;
    if (searchMode && !effectiveYtId) return;

    const oembedTarget =
      effectiveYtId != null ? `https://www.youtube.com/watch?v=${effectiveYtId}` : href;

    let cancelled = false;
    (async () => {
      try {
        const r = await fetch(`/api/video-oembed?url=${encodeURIComponent(oembedTarget)}`);
        if (!r.ok || cancelled) return;
        const j = (await r.json()) as {
          author_name?: string | null;
          thumbnail_url?: string | null;
          provider?: string | null;
        };
        if (cancelled) return;
        if (j.thumbnail_url) {
          if (effectiveYtId) setOembedThumb(j.thumbnail_url);
          else setRemoteThumb(j.thumbnail_url);
        }
        if (j.author_name) setMetaAuthor(j.author_name);
        if (j.provider) setProvider(j.provider);
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [href, internal, searchMode, effectiveYtId]);

  return {
    href,
    internal,
    ytId,
    searchMode,
    effectiveYtId,
    thumbList,
    thumbIdx,
    setThumbIdx,
    thumbDead,
    setThumbDead,
    remoteThumb,
    oembedThumb,
    metaAuthor,
    provider,
    searchResolving,
  };
}
