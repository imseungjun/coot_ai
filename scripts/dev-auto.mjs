/**
 * 이 프로젝트는 http://localhost:3000 만 표준으로 씁니다.
 * 3000번이 사용 중이면 3001로 넘기지 않고 종료합니다(저장소·주소 혼선 방지).
 */
import net from "node:net";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const binDir = path.join(root, "node_modules", ".bin");

/** Next는 기본적으로 :::PORT 에 바인드하므로, 호스트 지정 없이 점유 여부를 봅니다. */
function portFree(port) {
  return new Promise((resolve) => {
    const srv = net.createServer();
    srv.once("error", () => resolve(false));
    srv.once("listening", () => {
      srv.close(() => resolve(true));
    });
    srv.listen(port);
  });
}

async function pickPort() {
  if (await portFree(3000)) return 3000;
  console.error(
    "COOT Ai: 3000번 포트가 사용 중입니다. 다른 Next/Node 프로세스를 종료한 뒤 다시 실행하세요.",
  );
  console.error(
    "COOT Ai: 이 저장소는 http://localhost:3000 만 개발 기준 주소로 사용합니다.",
  );
  process.exit(1);
}

const port = await pickPort();

const concurrentlyJs = path.join(
  root,
  "node_modules",
  "concurrently",
  "dist",
  "bin",
  "concurrently.js",
);

const pathEnv = `${binDir}${path.delimiter}${process.env.PATH ?? ""}`;
const env = { ...process.env, PATH: pathEnv };

const child = spawn(
  process.execPath,
  [
    concurrentlyJs,
    `next dev -p ${port}`,
    `node scripts/wait-and-open.mjs --port=${port} --path=/ --immediate`,
  ],
  {
    cwd: root,
    env,
    stdio: "inherit",
    windowsHide: true,
  },
);

child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 0);
});
