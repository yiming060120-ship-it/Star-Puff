/**
 * 用 Edge headless 循环截 12 个模型的单独缩略图（256x256）。
 * 每个缩略图保存为 species_XX_thumb.png。
 */
import { spawn } from "child_process";
import fs from "fs";
import path from "path";

const EDGE = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
const OUT_DIR = "public/models/species/thumbnails";
const URL_BASE = "http://localhost:3000/species-thumb.html";
fs.mkdirSync(OUT_DIR, { recursive: true });

// 清理旧缩略图
for (const f of fs.readdirSync(OUT_DIR)) {
  if (f.endsWith(".png")) fs.unlinkSync(path.join(OUT_DIR, f));
}

async function shoot(i) {
  const out = path.resolve(OUT_DIR, `species_${String(i).padStart(2, "0")}_thumb.png`);
  return new Promise((resolve) => {
    const p = spawn(EDGE, [
      "--headless=new",
      "--disable-gpu",
      "--no-sandbox",
      "--hide-scrollbars",
      "--window-size=256,256",
      "--virtual-time-budget=15000",
      `--screenshot=${out}`,
      `${URL_BASE}?i=${i}`,
    ], { stdio: "ignore" });
    p.on("exit", () => {
      if (fs.existsSync(out) && fs.statSync(out).size > 1000) {
        console.log(`  模型 ${String(i).padStart(2, "0")} ✓ ${fs.statSync(out).size} bytes`);
      } else {
        console.log(`  模型 ${String(i).padStart(2, "0")} ✗ 失败`);
      }
      resolve();
    });
  });
}

(async () => {
  console.log("开始截 12 个模型缩略图…");
  for (let i = 1; i <= 12; i++) {
    await shoot(i);
  }
  console.log("完成");
})();
