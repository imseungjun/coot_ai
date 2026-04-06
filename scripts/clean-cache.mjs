/**
 * `Cannot find module './611.js'` 등 Webpack 청크 불일치 시 실행.
 * .next 및 (있으면) node_modules/.cache 를 삭제합니다.
 *
 * 중요: `next dev` 가 돌아가는 동안 .next 를 지우면 manifest/청크가 깨져
 * Internal Server Error(ENOENT next-font-manifest 등)가 납니다.
 * 항상 dev 서버를 먼저 종료(Ctrl+C)한 뒤 이 스크립트를 실행하세요.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

console.warn(
  "[clean-cache] next dev 가 켜져 있으면 먼저 종료한 뒤 사용하세요. (실행 중 삭제 시 500 오류)",
);

for (const name of [".next", path.join("node_modules", ".cache")]) {
  const p = path.join(root, name);
  try {
    fs.rmSync(p, { recursive: true, force: true });
    console.log("[clean-cache] removed:", name);
  } catch (e) {
    console.warn("[clean-cache] skip:", name, e?.message ?? e);
  }
}
