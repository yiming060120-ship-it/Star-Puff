/**
 * 手动下载 electron-builder 的辅助二进制（winCodeSign / nsis）到缓存目录，
 * 规避中国大陆网络下 electron-builder 从 GitHub 下载卡住的问题。
 */
import fs from "fs";
import path from "path";
import os from "os";
import https from "https";

const MIRROR = "https://npmmirror.com/mirrors/electron-builder-binaries/";

const FILES = [
  { name: "winCodeSign-2.6.0.7z", subdir: "winCodeSign", verDir: "winCodeSign-2.6.0" },
  { name: "nsis-3.0.4.1.7z", subdir: "nsis", verDir: "nsis-3.0.4.1" },
  { name: "nsis-resources-3.4.1.7z", subdir: "nsis", verDir: "nsis-resources-3.4.1" },
];

const cacheRoot = path.join(os.homedir(), "AppData", "Local", "electron-builder", "Cache");

function download(url, dest) {
  return new Promise((resolve, reject) => {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    const tmp = dest + ".part";
    const file = fs.createWriteStream(tmp);
    https.get(url, { headers: { "User-Agent": "electron-builder" } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        file.close();
        try { fs.unlinkSync(tmp); } catch {}
        return resolve(download(res.headers.location, dest));
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
      }
      const total = Number(res.headers["content-length"] || 0);
      let received = 0;
      res.on("data", (chunk) => {
        received += chunk.length;
        if (total > 0 && received % (10 * 1024 * 1024) < chunk.length) {
          process.stdout.write(`\r  ${path.basename(dest)} ${(received / 1024 / 1024).toFixed(1)}/${(total / 1024 / 1024).toFixed(1)} MB`);
        }
      });
      res.pipe(file);
      file.on("finish", () => {
        file.close();
        process.stdout.write(`\r  ${path.basename(dest)} 完成\n`);
        resolve();
      });
      res.on("error", reject);
    }).on("error", reject);
  });
}

async function main() {
  for (const f of FILES) {
    const dest = path.join(cacheRoot, f.subdir, f.verDir, f.name);
    if (fs.existsSync(dest) && fs.statSync(dest).size > 100000) {
      console.log(`跳过（已存在）: ${f.name}`);
      continue;
    }
    console.log(`下载: ${f.name}`);
    await download(`${MIRROR}${f.name}`, dest);
  }
  console.log("全部完成");
}

main().catch((err) => {
  console.error("失败:", err.message);
  process.exit(1);
});
