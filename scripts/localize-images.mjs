/**
 * 一次性脚本：把源码里的 images.unsplash.com 外链下载到本地并替换为本地路径，
 * 同时下载 Cat.gltf + Cat0.bin 到 public/models/cat/。保证断网无破图。
 *
 * 用法：node scripts/localize-images.mjs
 */
import { readdirSync, readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = join(ROOT, "src");
const IMG_DIR = join(ROOT, "public", "assets", "images", "unsplash");
const CAT_DIR = join(ROOT, "public", "models", "cat");

// photo id 形如 1543466835-00a7907e9de1，含连字符
const UNSPLASH_RE = /https:\/\/images\.unsplash\.com\/photo-([a-zA-Z0-9-]+)\?[^"'\s)]*/g;
const PHOTO_ID_RE = /photo-([a-zA-Z0-9-]+)/;

// 收集 src/ 下所有 ts/tsx 文件
function collectFiles(dir, acc = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) collectFiles(p, acc);
    else if (/\.(ts|tsx)$/.test(entry.name)) acc.push(p);
  }
  return acc;
}

// 按 photo id 聚合所有出现（含各自 w 参数）
function collectUrls() {
  const byId = new Map(); // id -> { urls: Set, maxW: number, files: Set }
  for (const file of collectFiles(SRC)) {
    const text = readFileSync(file, "utf8");
    for (const match of text.matchAll(UNSPLASH_RE)) {
      const id = match[1];
      const w = Number(new URL(match[0]).searchParams.get("w") ?? 0);
      if (!byId.has(id)) byId.set(id, { urls: new Set(), maxW: 0, files: new Set() });
      const entry = byId.get(id);
      entry.urls.add(match[0]);
      entry.maxW = Math.max(entry.maxW, w);
      entry.files.add(file);
    }
  }
  return byId;
}

// 并发受限下载
async function download(url, outPath, retries = 2) {
  for (let i = 0; i <= retries; i++) {
    try {
      const res = await fetch(url, { redirect: "follow" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      writeFileSync(outPath, Buffer.from(await res.arrayBuffer()));
      return true;
    } catch (e) {
      if (i === retries) throw e;
      await new Promise((r) => setTimeout(r, 1000 * (i + 1)));
    }
  }
  return false;
}

async function main() {
  mkdirSync(IMG_DIR, { recursive: true });
  mkdirSync(CAT_DIR, { recursive: true });

  const byId = collectUrls();
  console.log(`发现 ${byId.size} 张唯一 Unsplash 图片（共 39 处引用）\n`);

  const replaceInFiles = new Map(); // file -> text（累积替换）
  let okCount = 0;
  let failCount = 0;

  const queue = [...byId.entries()];
  const CONCURRENCY = 5;
  let idx = 0;
  const workers = Array.from({ length: Math.min(CONCURRENCY, queue.length) }, async () => {
    while (idx < queue.length) {
      const [id, entry] = queue[idx++];
      const w = Math.max(entry.maxW || 0, 300);
      const url = `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&q=80&w=${w}`;
      const out = join(IMG_DIR, `${id}.jpg`);
      try {
        if (!existsSync(out)) await download(url, out);
        // 源码替换：该 id 的所有 unsplash URL → 本地路径
        const local = `/assets/images/unsplash/${id}.jpg`;
        const re = new RegExp(`https://images\\.unsplash\\.com/photo-${id}\\?[^"'\s)]*`, "g");
        for (const f of entry.files) {
          const text = replaceInFiles.get(f) ?? readFileSync(f, "utf8");
          replaceInFiles.set(f, text.replace(re, local));
        }
        okCount++;
        console.log(`  ✓ photo-${id}  (${w}px, ${(existsSync(out) ? readFileSync(out).length : 0) / 1024 | 0}KB)`);
      } catch (e) {
        failCount++;
        console.error(`  ✗ photo-${id} 下载失败: ${e.message}`);
      }
    }
  });
  await Promise.all(workers);

  // Cat.gltf + Cat0.bin
  console.log("\n下载 Cat 3D 模型…");
  try {
    // raw.githubusercontent.com 国内不可达，改走 jsdelivr CDN
    const gltfUrl = "https://cdn.jsdelivr.net/gh/KhronosGroup/glTF-Sample-Models@master/2.0/Cat/glTF/Cat.gltf";
    const binUrl = "https://cdn.jsdelivr.net/gh/KhronosGroup/glTF-Sample-Models@master/2.0/Cat/glTF/Cat0.bin";
    if (!existsSync(join(CAT_DIR, "Cat.gltf"))) await download(gltfUrl, join(CAT_DIR, "Cat.gltf"));
    if (!existsSync(join(CAT_DIR, "Cat0.bin"))) await download(binUrl, join(CAT_DIR, "Cat0.bin"));
    const gltfFile = join(SRC, "pet3d", "Pet3DReconstruction.tsx");
    const text = replaceInFiles.get(gltfFile) ?? readFileSync(gltfFile, "utf8");
    replaceInFiles.set(gltfFile, text.replace(
      /https:\/\/raw\.githubusercontent\.com\/KhronosGroup\/glTF-Sample-Models\/master\/2\.0\/Cat\/glTF\/Cat\.gltf/g,
      "/models/cat/Cat.gltf"
    ));
    console.log("  ✓ Cat.gltf + Cat0.bin → /models/cat/");
  } catch (e) {
    failCount++;
    console.error(`  ✗ Cat 模型下载失败: ${e.message}`);
  }

  // 写回所有被替换文件
  for (const [file, text] of replaceInFiles) writeFileSync(file, text);

  console.log(`\n完成：成功 ${okCount}/${byId.size}，失败 ${failCount}。未下载成功的图保留原外链。`);
}

main().catch((e) => { console.error(e); process.exit(1); });
