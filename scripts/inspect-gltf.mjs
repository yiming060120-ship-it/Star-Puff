// 分析 glb 模型内部结构：网格、骨骼(skins)、动画(animations)、节点数量
// 用法：node scripts/inspect-gltf.mjs public/models/pet.glb
import { readFileSync } from "fs";

const file = process.argv[2] || "public/models/pet.glb";
const buf = readFileSync(file);

// ---- 手动解析 GLB 结构（无需依赖 three，避免环境问题） ----
// GLB: 12字节头 + chunks
const magic = buf.toString("utf8", 0, 4);
if (magic !== "glTF") {
  console.error("不是合法 glTF 文件");
  process.exit(1);
}
const version = buf.readUInt32LE(4);
const totalLen = buf.readUInt32LE(8);
console.log(`文件: ${file}`);
console.log(`大小: ${(totalLen / 1024 / 1024).toFixed(2)} MB, glTF version ${version}`);

let offset = 12;
const jsonChunks = [];
const binChunks = [];
while (offset < totalLen) {
  const chunkLen = buf.readUInt32LE(offset);
  const chunkType = buf.toString("utf8", offset + 4, offset + 8);
  if (chunkType === "JSON") {
    jsonChunks.push(buf.slice(offset + 8, offset + 8 + chunkLen));
  } else if (chunkType === "BIN\0") {
    binChunks.push({ start: offset + 8, len: chunkLen });
  }
  offset += 8 + chunkLen;
}

const json = JSON.parse(Buffer.concat(jsonChunks).toString("utf8"));

console.log("\n=== glTF 顶层结构 ===");
console.log(`网格数(meshes): ${json.meshes?.length ?? 0}`);
console.log(`节点数(nodes): ${json.nodes?.length ?? 0}`);
console.log(`骨骼数(skins): ${json.skins?.length ?? 0}`);
console.log(`动画数(animations): ${json.animations?.length ?? 0}`);
console.log(`材质数(materials): ${json.materials?.length ?? 0}`);
console.log(`纹理数(textures): ${json.textures?.length ?? 0}`);
console.log(`顶点访问器数(accessors): ${json.accessors?.length ?? 0}`);

if (json.skins && json.skins.length > 0) {
  console.log("\n=== 骨骼信息 ===");
  json.skins.forEach((skin, i) => {
    console.log(`Skin[${i}] name="${skin.name ?? "(未命名)"}" joints=${skin.joints?.length ?? 0}`);
    if (skin.joints) {
      const jointNames = skin.joints.map(j => json.nodes[j]?.name ?? `node_${j}`);
      console.log(`  关节列表: ${jointNames.join(", ")}`);
    }
  });
}

if (json.animations && json.animations.length > 0) {
  console.log("\n=== 动画信息 ===");
  json.animations.forEach((anim, i) => {
    const channels = anim.channels?.length ?? 0;
    const samplers = anim.samplers?.length ?? 0;
    console.log(`Animation[${i}] name="${anim.name ?? "(未命名)"}" channels=${channels} samplers=${samplers}`);
  });
} else {
  console.log("\n⚠️ 该模型【没有内置动画】—— 是静态模型");
}

if (json.nodes) {
  console.log("\n=== 节点清单（前 40 个）===");
  json.nodes.slice(0, 40).forEach((n, i) => {
    const hasMesh = n.mesh !== undefined ? ` mesh=${n.mesh}` : "";
    const hasChildren = n.children?.length ? ` children=${n.children.length}` : "";
    const isJoint = json.skins?.some(s => s.joints?.includes(i)) ? " [JOINT]" : "";
    console.log(`  node[${i}] name="${n.name ?? "(未命名)"}"${hasMesh}${hasChildren}${isJoint}`);
  });
  if (json.nodes.length > 40) {
    console.log(`  ... 共 ${json.nodes.length} 个节点`);
  }
}

// 网格面数统计
if (json.meshes) {
  console.log("\n=== 网格面数统计 ===");
  let totalTris = 0;
  json.meshes.forEach((m, i) => {
    let tris = 0;
    m.primitives?.forEach(p => {
      const idx = p.indices;
      if (idx !== undefined) {
        tris += Math.floor(json.accessors[idx].count / 3);
      } else {
        const posIdx = p.attributes?.POSITION;
        if (posIdx !== undefined) {
          tris += Math.floor(json.accessors[posIdx].count / 3);
        }
      }
    });
    totalTris += tris;
    console.log(`  mesh[${i}] name="${m.name ?? "(未命名)"}" 三角形≈${tris.toLocaleString()}`);
  });
  console.log(`  总三角形≈${totalTris.toLocaleString()}（约 ${(totalTris/2).toLocaleString()} 面）`);
}
