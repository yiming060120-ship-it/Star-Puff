/**
 * 手动组装免安装版（便携版）到 release/win-unpacked，
 * 完全绕过 electron-builder 的 winCodeSign/NSIS 下载卡点。
 *
 * 结构：
 *   release/win-unpacked/
 *   ├── StarPuff.exe          (由 electron.exe 重命名)
 *   ├── *.dll / *.pak / locales / resources (Electron 运行时)
 *   └── resources/
 *       ├── app/              (electron/main.cjs + preload.cjs + package.json + node_modules)
 *       └── dist/             (前端 dist：index.html + assets + server.cjs)
 */
import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const OUT = path.join(ROOT, "release", "win-unpacked");
const ELECTRON_DIST = path.join(ROOT, "node_modules", "electron", "dist");

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const item of fs.readdirSync(src)) {
    const s = path.join(src, item);
    const d = path.join(dest, item);
    const st = fs.statSync(s);
    if (st.isDirectory()) {
      copyDir(s, d);
    } else {
      fs.copyFileSync(s, d);
    }
  }
}

function copyFile(src, dest) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
}

console.log("=== 手动组装便携版 StarPuff ===");

// 1. 复制 Electron 运行时
console.log("1. 复制 Electron 运行时...");
fs.mkdirSync(OUT, { recursive: true });
for (const item of fs.readdirSync(ELECTRON_DIST)) {
  const s = path.join(ELECTRON_DIST, item);
  const d = path.join(OUT, item);
  const st = fs.statSync(s);
  if (st.isDirectory()) {
    copyDir(s, d);
  } else {
    fs.copyFileSync(s, d);
  }
}

// 2. 重命名 electron.exe -> StarPuff.exe
const exeSrc = path.join(OUT, "electron.exe");
const exeDest = path.join(OUT, "StarPuff.exe");
if (fs.existsSync(exeSrc)) {
  fs.renameSync(exeSrc, exeDest);
  console.log("2. electron.exe -> StarPuff.exe 完成");
} else {
  console.log("2. 警告: electron.exe 不存在");
}

// 3. resources/app/ 放主进程与 preload
console.log("3. 复制 app 主进程...");
const appDir = path.join(OUT, "resources", "app");
copyFile(path.join(ROOT, "electron", "main.cjs"), path.join(appDir, "main.cjs"));
copyFile(path.join(ROOT, "electron", "preload.cjs"), path.join(appDir, "preload.cjs"));
// 精简 package.json（只保留 main 字段，避免把整个 node_modules 打进 app）
const miniPkg = { name: "starpuff", main: "main.cjs" };
fs.writeFileSync(path.join(appDir, "package.json"), JSON.stringify(miniPkg, null, 2), "utf8");

// 4. 复制 native 模块到 resources/node_modules
// 关键：main.cjs（resources/app）与 server.cjs（resources/dist）都会向上查找 node_modules，
// 统一放 resources/node_modules 可让两者都能解析到。
console.log("4. 复制 native 模块到 resources/node_modules ...");
for (const mod of ["steamworks.js", "better-sqlite3", "bindings", "file-uri-to-path"]) {
  const src = path.join(ROOT, "node_modules", mod);
  if (fs.existsSync(src)) {
    copyDir(src, path.join(OUT, "resources", "node_modules", mod));
    console.log(`   ${mod} ✓`);
  } else {
    console.log(`   ${mod} ✗ (不存在，跳过)`);
  }
}

// 5. resources/dist/ 放前端 + 服务端
console.log("5. 复制前端 dist...");
copyDir(path.join(ROOT, "dist"), path.join(OUT, "resources", "dist"));

// 6. 清理：删掉 electron 自带的 default_app（避免冲突）
const defaultApp = path.join(OUT, "resources", "default_app.asar");
if (fs.existsSync(defaultApp)) {
  fs.rmSync(defaultApp, { force: true });
  console.log("6. 已移除 default_app.asar");
}

console.log("\n=== 完成！便携版位于 release/win-unpacked ===");
console.log("双击 release/win-unpacked/StarPuff.exe 即可运行");
