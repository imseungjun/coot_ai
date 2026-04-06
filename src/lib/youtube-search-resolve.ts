/**
 * YouTube 검색 결과 HTML에서 첫 번째 videoRenderer의 videoId를 추출합니다.
 * 페이지 구조 변경 시 실패할 수 있어, 클라이언트는 실패 시 기존 플레이스홀더로 둡니다.
 */
export function extractFirstVideoIdFromYouTubeSearchHtml(html: string): string | null {
  const marker = '"videoRenderer"';
  let from = 0;
  for (let i = 0; i < 8; i++) {
    const idx = html.indexOf(marker, from);
    if (idx === -1) break;
    const slice = html.slice(idx, idx + 4000);
    const m = slice.match(/"videoId":"([\w-]{11})"/);
    if (m?.[1] && /^[\w-]{11}$/.test(m[1])) return m[1];
    from = idx + marker.length;
  }
  const fallback = html.match(/"videoId":"([\w-]{11})"/);
  return fallback?.[1] && /^[\w-]{11}$/.test(fallback[1]) ? fallback[1] : null;
}
