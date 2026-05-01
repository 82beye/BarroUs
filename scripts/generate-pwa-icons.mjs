// public/icon.svg + icon-maskable.svg → 다양한 사이즈의 PNG로 변환.
// 한 번만 실행하면 됨: `node scripts/generate-pwa-icons.mjs`

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const publicDir = resolve(root, "public");

const tasks = [
  { src: "icon.svg", out: "icon-192.png", size: 192 },
  { src: "icon.svg", out: "icon-512.png", size: 512 },
  { src: "icon.svg", out: "apple-icon.png", size: 180 },
  { src: "icon-maskable.svg", out: "icon-maskable-192.png", size: 192 },
  { src: "icon-maskable.svg", out: "icon-maskable-512.png", size: 512 },
];

for (const t of tasks) {
  const buf = readFileSync(resolve(publicDir, t.src));
  await sharp(buf, { density: 384 })
    .resize(t.size, t.size, { fit: "contain", background: "#F2EFE7" })
    .png({ quality: 90 })
    .toFile(resolve(publicDir, t.out));
  console.log(`✓ ${t.out} (${t.size}×${t.size})`);
}
