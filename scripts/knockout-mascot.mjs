/**
 * 검은/무채색 배경을 투명 처리해 마스코트 PNG 생성.
 * 입력: public/logo/coot-mascot-character-src.png
 * 출력: public/logo/coot-mascot-character.png
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const inputPath = path.join(root, "public", "logo", "coot-mascot-character-src.png");
const outputPath = path.join(root, "public", "logo", "coot-mascot-character.png");

function isNeutralDarkBackground(r, g, b) {
  const sum = r + g + b;
  const avg = sum / 3;
  const spread = Math.abs(r - avg) + Math.abs(g - avg) + Math.abs(b - avg);
  // 순검·회색 배경: RGB가 비슷하고 전체가 어두움. 캐릭터의 청색 그림자는 채도가 있어 spread가 큼.
  return sum < 135 && spread < 32;
}

async function main() {
  if (!fs.existsSync(inputPath)) {
    console.error("입력 파일이 없습니다:", inputPath);
    process.exit(1);
  }

  const { data, info } = await sharp(inputPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  if (channels !== 4) {
    console.error("RGBA가 필요합니다.");
    process.exit(1);
  }

  const out = Buffer.from(data);
  for (let i = 0; i < out.length; i += 4) {
    const r = out[i];
    const g = out[i + 1];
    const b = out[i + 2];
    if (isNeutralDarkBackground(r, g, b)) {
      out[i + 3] = 0;
    }
  }

  await sharp(out, { raw: { width, height, channels: 4 } }).png({ compressionLevel: 9 }).toFile(outputPath);

  console.log("저장:", outputPath);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
