import type { HubState } from "./hub-types";
import { createKootPortfolioCategory } from "./hub-canonical";
import { parseHubStateJson } from "./hub-storage";
import { normalizeHubState } from "./hub-utils";
import hubBaselineJson from "../../data/hub-baseline.json";

function link(
  name: string,
  url: string,
  id: string,
): { id: string; name: string; url: string } {
  return { id, name, url };
}

/**
 * 프로젝트 루트 `data/hub-baseline.json`을 기본 시드로 씁니다.
 * 화면에서「프로젝트 폴더에 저장」하거나 dev 자동 동기화로 이 파일을 갱신한 뒤,
 * Git에 커밋하면 새 클론·다른 PC에서도 동일한 초기 목록이 됩니다.
 * 파일이 비어 있거나 파싱에 실패하면 아래 fallback 을 씁니다.
 */
function seedFromBaselineFile(): HubState | null {
  try {
    const raw = JSON.stringify(hubBaselineJson);
    const p = parseHubStateJson(raw);
    if (p && p.categories.length > 0) {
      return normalizeHubState(p);
    }
  } catch {
    /* ignore */
  }
  return null;
}

/** 코드에만 있는 예비 시드(hub-baseline.json 이 없거나 손상될 때) */
function buildSeedFallback(): HubState {
  const koot = createKootPortfolioCategory();
  return {
    version: 1,
    categories: [
      {
        id: "cat-agent",
        name: "AI 에이전트",
        order: 0,
        links: [
          link("ChatGPT", "https://chat.openai.com", "seed-chatgpt"),
          link("Gemini", "https://gemini.google.com", "seed-gemini"),
          link("Claude", "https://claude.ai", "seed-claude"),
          link("Perplexity", "https://perplexity.ai", "seed-perplexity"),
          link("노트북 LM", "https://notebooklm.google.com", "seed-nblm"),
          link("구글 AI 스튜디오", "https://aistudio.google.com", "seed-aistudio"),
          link("Grok", "https://grok.com", "seed-grok"),
        ],
      },
      {
        id: "cat-image",
        name: "이미지",
        order: 1,
        links: [
          link("Midjourney", "https://www.midjourney.com", "seed-mj"),
          link("Flux", "https://blackforestlabs.ai", "seed-flux"),
        ],
      },
      {
        id: "cat-video",
        name: "영상",
        order: 2,
        links: [
          link("Sora", "https://openai.com/sora", "seed-sora"),
          link("Kling AI", "https://klingai.com", "seed-kling"),
        ],
      },
      {
        id: "cat-detail",
        name: "상세페이지",
        order: 3,
        links: [],
      },
      {
        id: "cat-other",
        name: "기타링크",
        order: 4,
        links: [
          link("경제시황", "https://www.google.com/search?q=%EA%B2%BD%EC%A0%9C%EC%8B%9C%ED%99%A9", "seed-econ"),
          link("모션캡쳐 데이터", "https://www.google.com/search?q=%EB%AA%A8%EC%85%98%EC%BA%A1%EC%B3%90+%EB%8D%B0%EC%9D%B4%ED%84%B0", "seed-motion"),
          link("AI생성", "https://www.google.com/search?q=AI+%EC%83%9D%EC%84%B1", "seed-ai-gen"),
          link("AI예약", "https://www.google.com/search?q=AI+%EC%98%88%EC%95%BD", "seed-ai-book"),
          link("배우 프로필", "https://www.google.com/search?q=%EB%B0%B0%EC%9A%B0+%ED%94%84%EB%A1%9C%ED%95%84", "seed-actor"),
        ],
      },
      { ...koot, order: 5 },
    ],
  };
}

/** 최초 방문 시 시드 — `data/hub-baseline.json` 우선, 없으면 fallback */
export function createDefaultHubState(): HubState {
  return seedFromBaselineFile() ?? buildSeedFallback();
}
