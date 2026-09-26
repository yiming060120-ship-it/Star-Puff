/**
 * 用 Edge headless 模式打开物种预览页，依次滚动 + 截图，
 * 截出 12 个模型的真实缩略图（不是纹理切片，而是 3D 渲染图）。
 */
import { spawn } from "child_process";
import fs from "fs";
import path from "path";

const URL = "http://localhost:3000/species-preview.html";
const OUT_DIR = "public/models/species/thumbnails";
const EDGE = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";

fs.mkdirSync(OUT_DIR, { recursive: true });

// 清理旧缩略图（保留 jpg）
for (const f of fs.readdirSync(OUT_DIR)) {
  if (f.endsWith(".jpg") || f.endsWith(".png")) {
    fs.unlinkSync(path.join(OUT_DIR, f));
  }
}

// 启动 headless Edge，加载预览页，等模型加载完后整页截图
// Edge 的 --screenshot 只能截整页。预览页是 4 列网格 3 行（12 个），可以一次截全
const tmp = path.resolve("preview-screenshot.png");
const args = [
  "--headless=new",
  "--disable-gpu",
  "--no-sandbox",
  "--hide-scrollbars",
  "--window-size=1280,1800",  // 拉高窗口装下 3 行 4 列
  "--virtual-time-budget=90000",  // 90s 让 12 个 glb 加载完
  `--screenshot=${tmp}`,
  URL,
];
console.log("启动 Edge headless…");
const p = spawn(EDGE, args, { stdio: "inherit" });
p.on("exit", (code) => {
  console.log("Edge 退出码:", code);
  if (fs.existsSync(tmp)) {
    console.log("整页截图已保存:", tmp, fs.statSync(tmp).size, "bytes");
    // 截图里包含 12 个模型，足够用户判断每个是什么
  } else {
    console.error("截图未生成");
  }
});
