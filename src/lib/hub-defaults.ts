import type { HubState } from "./hub-types";

function link(
  name: string,
  url: string,
  id: string,
): { id: string; name: string; url: string } {
  return { id, name, url };
}

/** 최초 방문 시 시드 데이터 */
export function createDefaultHubState(): HubState {
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
        links: [],
      },
      {
        id: "cat-video",
        name: "영상",
        order: 2,
        links: [],
      },
      {
        id: "cat-detail",
        name: "상세페이지",
        order: 3,
        links: [],
      },
      {
        id: "cat-other",
        name: "기타",
        order: 4,
        links: [],
      },
    ],
  };
}
