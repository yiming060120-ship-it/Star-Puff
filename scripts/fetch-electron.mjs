/**
 * 手动下载 Electron 运行时到 electron-builder 缓存目录，
 * 规避中国大陆网络环境下 electron-builder 从 GitHub 下载卡住的问题。
 *
 * 缓存路径约定（electron-builder 26.x）：
 *   ~/AppData/Local/electron-builder/Cache/electron/electron-v{version}-win32-x64.zip
 */
import fs from "fs";
import path from "path";
import os from "os";
import https from "https";

const VERSION = "43.4.0";
const FILE = `electron-v${VERSION}-win32-x64.zip`;
const MIRROR = process.env.ELECTRON_MIRROR || "https://npmmirror.com/mirrors/electron/";
const URL = `${MIRROR}${VERSION}/${FILE}`;

const cacheDir = path.join(os.homedir(), "AppData", "Local", "electron-builder", "Cache", "electron");
const dest = path.join(cacheDir, FILE);

fs.mkdirSync(cacheDir, { recursive: true });

if (fs.existsSync(dest) && fs.statSync(dest).size > 10 * 1024 * 1024) {
  console.log(`已存在缓存，跳过下载: ${dest}`);
  process.exit(0);
}

console.log(`下载 Electron: ${URL}`);
console.log(`目标: ${dest}`);

const tmp = dest + ".part";
const file = fs.createWriteStream(tmp);

function download(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { "User-Agent": "electron-download" } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        // 跟随重定向
        file.close();
        fs.unlinkSync(tmp);
        return resolve(download(res.headers.location));
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode}`));
      }
      const total = Number(res.headers["content-length"] || 0);
      let received = 0;
      res.on("data", (chunk) => {
        received += chunk.length;
        if (total > 0 && received % (5 * 1024 * 1024) < chunk.length) {
          process.stdout.write(`\r  已下载 ${(received / 1024 / 1024).toFixed(1)} MB / ${(total / 1024 / 1024).toFixed(1)} MB`);
        }
      });
      res.pipe(file);
      file.on("finish", () => {
        file.close();
        console.log(`\n下载完成`);
        resolve();
      });
      res.on("error", reject);
    }).on("error", reject);
  });
}

download(URL)
  .then(() => {
    fs.renameSync(tmp, dest);
    console.log(`已保存: ${dest}`);
  })
  .catch((err) => {
    console.error("下载失败:", err.message);
    try { if (fs.existsSync(tmp)) fs.unlinkSync(tmp); } catch {}
    process.exit(1);
  });
