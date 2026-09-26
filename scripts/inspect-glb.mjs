/**
 * 解析 12 个 species glb 文件，提取：
 * 1. mesh 名称、节点名称（找动物种类线索）
 * 2. 内嵌纹理图片（导出为 png/jpg，用于缩略图和确认动物）
 */
import fs from "fs";
import path from "path";

const DIR = "public/models/species";
const OUT_DIR = "public/models/species/thumbnails";
fs.mkdirSync(OUT_DIR, { recursive: true });

function parseGlb(buf) {
  // GLB header: magic(4) version(4) length(4)
  const magic = buf.readUInt32LE(0);
  if (magic !== 0x46546c67) throw new Error("not glb");
  let offset = 12;
  let json = null;
  const binChunks = [];
  while (offset < buf.length) {
    const chunkLen = buf.readUInt32LE(offset);
    const chunkType = buf.readUInt32LE(offset + 4);
    const chunkData = buf.slice(offset + 8, offset + 8 + chunkLen);
    if (chunkType === 0x4e4f534a) { // JSON
      json = JSON.parse(chunkData.toString("utf8"));
    } else if (chunkType === 0x004e4942) { // BIN
      binChunks.push(chunkData);
    }
    offset += 8 + chunkLen;
  }
  return { json, binChunks };
}

const results = [];
for (let i = 1; i <= 12; i++) {
  const file = `species_${String(i).padStart(2, "0")}.glb`;
  const full = path.join(DIR, file);
  const buf = fs.readFileSync(full);
  const { json, binChunks } = parseGlb(buf);

  // 收集 mesh 名称和节点名称
  const meshNames = (json.meshes || []).map(m => m.name).filter(Boolean);
  const nodeNames = (json.nodes || []).map(n => n.name).filter(Boolean);
  const materialNames = (json.materials || []).map(m => m.name).filter(Boolean);

  // 提取纹理图片
  const images = json.images || [];
  const textureExtracted = [];
  if (images.length > 0 && binChunks.length > 0) {
    const bin = binChunks[0];
    const bufferViews = json.bufferViews || [];
    images.forEach((img, idx) => {
      if (img.bufferView !== undefined && img.mimeType) {
        const bv = bufferViews[img.bufferView];
        if (bv && bv.byteOffset !== undefined && bv.byteLength) {
          const data = bin.slice(bv.byteOffset, bv.byteOffset + bv.byteLength);
          const ext = img.mimeType.includes("png") ? "png" : img.mimeType.includes("jpeg") ? "jpg" : "bin";
          const outFile = path.join(OUT_DIR, `${file.replace(".glb", "")}_tex${idx}.${ext}`);
          fs.writeFileSync(outFile, data);
          textureExtracted.push({ idx, ext, size: data.length, file: outFile });
        }
      } else if (img.uri) {
        // data URI
        const m = img.uri.match(/^data:(image\/\w+);base64,(.+)$/);
        if (m) {
          const data = Buffer.from(m[2], "base64");
          const ext = m[1].includes("png") ? "png" : m[1].includes("jpeg") ? "jpg" : "bin";
          const outFile = path.join(OUT_DIR, `${file.replace(".glb", "")}_tex${idx}.${ext}`);
          fs.writeFileSync(outFile, data);
          textureExtracted.push({ idx, ext, size: data.length, file: outFile });
        }
      }
    });
  }

  results.push({
    file,
    meshNames,
    nodeNames: nodeNames.slice(0, 10),
    materialNames: materialNames.slice(0, 5),
    imageCount: images.length,
    textures: textureExtracted,
  });
  console.log(`\n=== ${file} ===`);
  console.log("  meshes:", JSON.stringify(meshNames.slice(0, 15)));
  console.log("  nodes:", JSON.stringify(nodeNames.slice(0, 10)));
  console.log("  materials:", JSON.stringify(materialNames.slice(0, 5)));
  console.log("  images:", images.length, "纹理导出:", textureExtracted.length);
}

fs.writeFileSync("glb-inspect-result.json", JSON.stringify(results, null, 2), "utf8");
console.log("\n已写入 glb-inspect-result.json");
