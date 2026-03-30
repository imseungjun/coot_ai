import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "coot-bg": "#010101",
        "coot-surface": "#171414",
        "coot-surface-2": "#211d1d",
        "coot-border": "#312e2e",
        "coot-border-strong": "#4e4949",
        "coot-text": "#f3efea",
        "coot-muted": "#a8a19d",
        "coot-muted-2": "#7d7d7d",
        "coot-accent": "#c8b38f",
        "coot-accent-muted": "#9a928a",
        "coot-on-accent": "#151311",
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      keyframes: {
        /** 살짝 흔들리는 호흡 + 스케일 — 둥실 떠 있는 느낌 */
        "mascot-breathe": {
          "0%, 100%": {
            transform: "translateY(0) scale(1) rotate(-1.5deg)",
          },
          "50%": {
            transform: "translateY(-5px) scale(1.045) rotate(1.5deg)",
          },
        },
        /** 통통 걷기 + 좌우 기울기 */
        "mascot-walk": {
          "0%, 100%": { transform: "translateY(0) rotate(-3deg)" },
          "25%": { transform: "translateY(-5px) rotate(3deg)" },
          "50%": { transform: "translateY(-1px) rotate(-3deg)" },
          "75%": { transform: "translateY(-5px) rotate(3deg)" },
        },
        /** 통통 점프 + 살짝 뒤틀림 */
        "mascot-hop": {
          "0%, 100%": { transform: "translateY(0) scale(1, 1) rotate(0deg)" },
          "22%": { transform: "translateY(-20px) scale(1.06, 1.08) rotate(-4deg)" },
          "48%": { transform: "translateY(0) scale(0.94, 0.92) rotate(2deg)" },
          "68%": { transform: "translateY(-6px) scale(1.03, 1.02) rotate(-2deg)" },
          "88%": { transform: "translateY(0) scale(1, 1) rotate(0deg)" },
        },
        /** 링크 볼 때 살짝 관심 표현 */
        "mascot-inspect": {
          "0%, 100%": { transform: "translateY(-3px) scale(1.03) rotate(-4deg)" },
          "33%": { transform: "translateY(-6px) scale(1.06) rotate(4deg)" },
          "66%": { transform: "translateY(-2px) scale(1.04) rotate(-2deg)" },
        },
        "mascot-shadow-hop": {
          "0%, 100%": { transform: "translateX(-50%) scaleX(1)", opacity: "0.38" },
          "22%": { transform: "translateX(-50%) scaleX(0.58)", opacity: "0.18" },
          "48%": { transform: "translateX(-50%) scaleX(1.08)", opacity: "0.42" },
          "100%": { transform: "translateX(-50%) scaleX(1)", opacity: "0.38" },
        },
        "mascot-shadow-walk": {
          "0%, 100%": { transform: "translateX(-50%) scaleX(1)", opacity: "0.34" },
          "25%": { transform: "translateX(-50%) scaleX(0.88)", opacity: "0.26" },
          "50%": { transform: "translateX(-50%) scaleX(1)", opacity: "0.34" },
          "75%": { transform: "translateX(-50%) scaleX(0.88)", opacity: "0.26" },
        },
      },
      animation: {
        "mascot-breathe": "mascot-breathe 2.6s ease-in-out infinite",
        "mascot-walk": "mascot-walk 0.36s linear infinite",
        "mascot-hop": "mascot-hop 0.55s cubic-bezier(0.34, 1.56, 0.64, 1)",
        "mascot-inspect": "mascot-inspect 1.4s ease-in-out infinite",
        "mascot-shadow-hop": "mascot-shadow-hop 0.55s cubic-bezier(0.34, 1.56, 0.64, 1)",
        "mascot-shadow-walk": "mascot-shadow-walk 0.36s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
