/**
 * 组装免安装单机版：把构建产物打包成桌面上的一个自包含文件夹。
 *
 * 产物结构（双击 start.bat 即启动）：
 *   StarPuff单机版/
 *     dist/         ← vite 前端静态资源（index.html + assets + models）
 *     server.cjs    ← esbuild 打包后的 Express 后端（自包含，无需 node_modules）
 *     start.bat     ← 双击启动：set NODE_ENV=production + 开浏览器 + node server.cjs
 *     说明.txt
 *
 * 依赖 Node.js（本机已装 v24）。运行前需先 `npm run build`。
 */
import { existsSync, cpSync, copyFileSync, writeFileSync, rmSync, mkdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { homedir } from "node:os";

const repoRoot = resolve(import.meta.dirname, "..");
const distDir = join(repoRoot, "dist");
const targetRoot = join(homedir(), "Desktop", "StarPuff单机版");

const red = (s) => `\x1b[31m${s}\x1b[0m`;
const green = (s) => `\x1b[32m${s}\x1b[0m`;
const cyan = (s) => `\x1b[36m${s}\x1b[0m`;

function main() {
  if (!existsSync(join(distDir, "index.html"))) {
    console.error(red("[失败] dist/index.html 不存在，请先运行：npm run build"));
    process.exit(1);
  }
  if (!existsSync(join(distDir, "server.cjs"))) {
    console.error(red("[失败] dist/server.cjs 不存在，请先运行：npm run build"));
    process.exit(1);
  }

  // 干净重建目标文件夹（存档在浏览器 localStorage，不在该目录，重建安全）
  rmSync(targetRoot, { recursive: true, force: true });
  mkdirSync(join(targetRoot, "dist"), { recursive: true });

  // 1. 前端静态资源
  cpSync(distDir, join(targetRoot, "dist"), { recursive: true });
  // 2. 后端（放根，start.bat 的 cwd=文件夹根 → 生产态 distPath=cwd/dist 正确）
  copyFileSync(join(distDir, "server.cjs"), join(targetRoot, "server.cjs"));

  // 3. start.bat（必须 set NODE_ENV=production，否则 server 走 vite dev 分支会在无 node_modules 时崩溃）
  const bat = [
    "@echo off",
    "chcp 65001 >nul",
    "title StarPuff 喵汪星云 · 单机版",
    "cd /d \"%~dp0\"",
    "",
    "where node >nul 2>nul",
    "if errorlevel 1 (",
    "  echo [错误] 未检测到 Node.js！",
    "  echo 请到 https://nodejs.org 下载并安装 Node.js 20 以上（LTS 版即可），",
    "  echo 安装完成后重新双击本文件即可启动。",
    "  pause",
    "  exit /b 1",
    ")",
    "",
    "set NODE_ENV=production",
    "set PORT=3000",
    "",
    "echo ============================================",
    "echo   StarPuff 喵汪星云 · 单机离线版",
    "echo   启动后请访问 http://127.0.0.1:3000",
    "echo   完全离线运行，不依赖网络与外部服务。",
    "echo   关闭本窗口即可退出程序。",
    "echo ============================================",
    "start \"\" \"http://127.0.0.1:3000\"",
    "node server.cjs",
    "pause",
  ].join("\r\n");
  writeFileSync(join(targetRoot, "start.bat"), bat, "utf8");

  // 4. 说明.txt
  const readme = [
    "StarPuff 喵汪星云 · 单机版",
    "============================================",
    "",
    "【如何启动】",
    "1. 本机需已安装 Node.js 20 或更高版本（未安装请到 https://nodejs.org 下载 LTS 版）。",
    "2. 双击本文件夹里的 start.bat。",
    "3. 浏览器会自动打开 http://127.0.0.1:3000 ，开始使用。",
    "4. 关闭弹出的黑色窗口即退出程序。",
    "",
    "【特性】",
    "- 完全离线：不联网、不需要 Gemini Key，所有功能本地运行。",
    "- 虚拟 AI 星友：社区有 12 位星友家长发帖互动、信箱会收到星友来信、",
    "  社区顶部有「星友通讯录」可打招呼攒友好度、星门偶遇虚拟好友宠物。",
    "- 存档保存在浏览器本地（localStorage），关闭浏览器不丢失。",
    "",
    "【常见问题】",
    "- 双击后窗口一闪而过：多半是端口 3000 被占用。",
    "  先关闭其它占用 3000 端口的程序，或把 start.bat 里 set PORT=3000 改成 3001。",
    "- 想换端口：编辑 start.bat，把 3000 改为其它数字（如 3001），并同步改浏览器地址。",
    "",
  ].join("\r\n");
  writeFileSync(join(targetRoot, "说明.txt"), readme, "utf8");

  console.log(green(`[完成] 单机版已组装到：`));
  console.log(cyan(`  ${targetRoot}`));
  console.log("  内容：dist/（前端）+ server.cjs（后端）+ start.bat + 说明.txt");
  console.log("  双击 start.bat 即可启动（需本机已装 Node.js）。");
}

main();
