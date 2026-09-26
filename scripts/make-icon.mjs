/**
 * 生成应用图标 build/icon.ico
 *
 * 从源图片（src/assets/images/puff_cat_1779553092843.png，实为 JPEG）生成 ICO。
 * ICO 容器内直接嵌入图片数据（PNG 或 JPEG），Vista+ Windows 与 electron-builder 均兼容。
 *
 * 用法：node scripts/make-icon.mjs
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, "..");

const srcFile = path.join(projectRoot, "src", "assets", "images", "puff_cat_1779553092843.png");
const outDir = path.join(projectRoot, "build");
const outIco = path.join(outDir, "icon.ico");

if (!existsSync(srcFile)) {
  console.error("源图片不存在:", srcFile);
  process.exit(1);
}

const buf = readFileSync(srcFile);

// 识别格式并解析尺寸
let width = 256;
let height = 256;
let isPng = false;
let isJpeg = false;

if (buf.length >= 24 && buf.toString("ascii", 0, 8) === "\x89PNG\r\n\x1a\n") {
  isPng = true;
  width = buf.readUInt32BE(16);
  height = buf.readUInt32BE(20);
} else if (buf.length >= 4 && buf[0] === 0xff && buf[1] === 0xd8) {
  isJpeg = true;
  // 解析 JPEG SOF 标记获取尺寸
  let off = 2;
  while (off < buf.length - 9) {
    if (buf[off] !== 0xff) { off++; continue; }
    const marker = buf[off + 1];
    if (marker === 0xc0 || marker === 0xc1 || marker === 0xc2 || marker === 0xc3) {
      height = buf.readUInt16BE(off + 5);
      width = buf.readUInt16BE(off + 7);
      break;
    }
    const segLen = buf.readUInt16BE(off + 2);
    off += 2 + segLen;
  }
}

if (!isPng && !isJpeg) {
  console.error("源文件既不是 PNG 也不是 JPEG");
  process.exit(1);
}

console.log(`源图片: ${isPng ? "PNG" : "JPEG"}, 尺寸 ${width}x${height}`);

// ICO 头部（6 字节）：保留=0, 类型=1(icon), 图像数=1
const icoHeader = Buffer.alloc(6);
icoHeader.writeUInt16LE(0, 0);
icoHeader.writeUInt16LE(1, 2);
icoHeader.writeUInt16LE(1, 4);

// 目录项（16 字节）
const dirEntry = Buffer.alloc(16);
dirEntry.writeUInt8(width >= 256 ? 0 : width, 0);   // 宽（256 记为 0）
dirEntry.writeUInt8(height >= 256 ? 0 : height, 1); // 高
dirEntry.writeUInt8(0, 2);  // 调色板颜色数
dirEntry.writeUInt8(0, 3);  // 保留
dirEntry.writeUInt16LE(1, 4);   // planes
dirEntry.writeUInt16LE(32, 6);  // bits per pixel
dirEntry.writeUInt32LE(buf.length, 8); // 数据大小
dirEntry.writeUInt32LE(6 + 16, 12);    // 数据偏移

mkdirSync(outDir, { recursive: true });
writeFileSync(outIco, Buffer.concat([icoHeader, dirEntry, buf]));
console.log(`已生成图标: ${outIco} (${width}x${height}, ${buf.length} bytes)`);
