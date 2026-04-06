/**
 * localhost 가 응답할 때까지 기다린 뒤 기본 브라우저로 URL을 엽니다.
 * - 준비 확인은 /create 가 아니라 / 로 먼저 함 (첫 컴파일 시 /create 가 더 느릴 수 있음)
 * - Windows: exec 비동기 직후 process.exit 하면 start 가 취소될 수 있어 execSync 사용
 */
import http from "node:http";
import { execSync } from "node:child_process";

function parseArgs() {
  let port = Number(process.env.PORT) || 3000;
  let openPath = process.env.OPEN_PATH || "/create";
  let immediate = false;
  for (const a of process.argv.slice(2)) {
    if (a.startsWith("--port=")) port = Number(a.slice(7)) || port;
    if (a.startsWith("--path=")) openPath = a.slice(7) || openPath;
    if (a === "--immediate") immediate = true;
  }
  if (!openPath.startsWith("/")) openPath = `/${openPath}`;
  return { port, openPath, immediate };
}

const { port: PORT, openPath: OPEN_PATH, immediate: OPEN_IMMEDIATE } = parseArgs();
/** 브라우저·localStorage 기준을 localhost:3000 으로 통일 (127.0.0.1 과는 다른 출처로 취급될 수 있음) */
const HOST = "localhost";
const BASE = `http://${HOST}:${PORT}`;
const READY_URL = `${BASE}/`;
const OPEN_URL = `${BASE}${OPEN_PATH}`;
const MAX_ATTEMPTS = 600;
const INTERVAL_MS = 200;

function probe(url) {
  return new Promise((resolve) => {
    const req = http.get(url, (res) => {
      res.resume();
      resolve(res.statusCode != null && res.statusCode < 500);
    });
    req.on("error", () => resolve(false));
    req.setTimeout(5000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

function openBrowserWin(url) {
  // cmd /c start "" "url" — execSync 로 브라우저 뜨기 전에 Node 가 죽지 않게 함
  execSync(`cmd /c start "" "${url}"`, { stdio: "ignore", windowsHide: true });
}

function openBrowser(url) {
  if (process.platform === "win32") {
    openBrowserWin(url);
  } else if (process.platform === "darwin") {
    execSync(`open "${url}"`, { stdio: "ignore" });
  } else {
    execSync(`xdg-open "${url}"`, { stdio: "ignore" });
  }
}

async function main() {
  if (OPEN_IMMEDIATE) {
    try {
      openBrowser(OPEN_URL);
      console.log("COOT Ai: 브라우저를 바로 열었습니다. 연결이 안 되면 잠시 후 새로고침하세요.");
    } catch (e) {
      console.warn("COOT Ai: 브라우저 자동 실행 실패. 직접 여세요: %s", OPEN_URL, e);
    }
  }
  console.log("COOT Ai: 서버 준비 대기 중… (응답 확인: %s)", READY_URL);
  console.log("COOT Ai: 브라우저로 열 주소: %s", OPEN_URL);
  for (let i = 0; i < MAX_ATTEMPTS; i++) {
    if (await probe(READY_URL)) {
      if (!OPEN_IMMEDIATE) {
        try {
          openBrowser(OPEN_URL);
          console.log("COOT Ai: 브라우저를 열었습니다.");
        } catch (e) {
          console.warn("COOT Ai: 브라우저 자동 실행 실패. 직접 여세요: %s", OPEN_URL, e);
        }
      } else {
        console.log("COOT Ai: 서버가 준비되었습니다. 브라우저에서 새로고침(F5)하면 바로 보입니다.");
      }
      process.exit(0);
      return;
    }
    await new Promise((r) => setTimeout(r, INTERVAL_MS));
  }
  console.warn("COOT Ai: 서버 응답 대기 시간이 지났습니다. 직접 여세요: %s", OPEN_URL);
  try {
    openBrowser(OPEN_URL);
  } catch {
    /* ignore */
  }
  process.exit(0);
}

main();
