/**
 * 星辰重建 API 服务层
 *
 * 生成"2D 星辰画像"：用 Canvas 对上传照片做真实的星辰化滤镜处理
 * （像素化 + 星辰粒子叠加 + 星云色调映射 + 发光），产出可见的 2D 画像。
 *
 * 3D 建模接口已预留（generate3DModel），未来接入 Tripo3D / Meshy 等第三方 API。
 */

export interface GenerateParams {
  imageBase64: string;
  style: "pixel" | "illustration" | "cyber";
}

export interface GenerateResult {
  id: string;
  imageUrl: string;
  style: string;
  createdAt: number;
}

/** 加载图片（base64 或 URL） */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("图片加载失败"));
    img.src = src;
  });
}

/**
 * 真实的前端星辰化滤镜：把照片转换成星辰像素风 2D 画像。
 * 不同 style 有不同的色调映射和粒子效果。
 */
async function applyStardustFilter(
  source: string,
  style: "pixel" | "illustration" | "cyber"
): Promise<string> {
  const img = await loadImage(source);

  // 输出尺寸
  const SIZE = 512;
  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) return source; // 兜底：不支持 canvas 时返回原图

  // 1. 绘制原图（居中裁剪为正方形）
  const side = Math.min(img.width, img.height);
  const sx = (img.width - side) / 2;
  const sy = (img.height - side) / 2;
  ctx.drawImage(img, sx, sy, side, side, 0, 0, SIZE, SIZE);

  // 2. 读取像素，做像素化 + 星云色调映射
  const pixelSize = style === "pixel" ? 8 : style === "cyber" ? 6 : 5;
  const imageData = ctx.getImageData(0, 0, SIZE, SIZE);
  const data = imageData.data;

  // 色调映射参数（不同风格不同星云色调）
  const toneMap = {
    pixel: { r: 1.0, g: 0.9, b: 1.1, glow: 0.15 },       // 柔和星辰紫粉
    illustration: { r: 1.1, g: 0.95, b: 1.0, glow: 0.2 }, // 暖粉插画
    cyber: { r: 0.85, g: 0.9, b: 1.25, glow: 0.3 },       // 赛博蓝紫霓虹
  }[style];

  // 像素块化处理（遍历每个像素块，取平均色）
  for (let py = 0; py < SIZE; py += pixelSize) {
    for (let px = 0; px < SIZE; px += pixelSize) {
      let r = 0, g = 0, b = 0, count = 0;
      for (let dy = 0; dy < pixelSize && py + dy < SIZE; dy++) {
        for (let dx = 0; dx < pixelSize && px + dx < SIZE; dx++) {
          const idx = ((py + dy) * SIZE + (px + dx)) * 4;
          r += data[idx];
          g += data[idx + 1];
          b += data[idx + 2];
          count++;
        }
      }
      r = (r / count) * toneMap.r;
      g = (g / count) * toneMap.g;
      b = (b / count) * toneMap.b;

      // 写回像素块（带轻微随机抖动模拟星辰颗粒感）
      for (let dy = 0; dy < pixelSize && py + dy < SIZE; dy++) {
        for (let dx = 0; dx < pixelSize && px + dx < SIZE; dx++) {
          const idx = ((py + dy) * SIZE + (px + dx)) * 4;
          const jitter = (Math.random() - 0.5) * 18;
          data[idx] = Math.min(255, Math.max(0, r + jitter));
          data[idx + 1] = Math.min(255, Math.max(0, g + jitter));
          data[idx + 2] = Math.min(255, Math.max(0, b + jitter));
        }
      }
    }
  }
  ctx.putImageData(imageData, 0, 0);

  // 3. 叠加星辰粒子
  const particleCount = style === "cyber" ? 220 : 140;
  for (let i = 0; i < particleCount; i++) {
    const px = Math.random() * SIZE;
    const py = Math.random() * SIZE;
    const pr = 1 + Math.random() * 2.5;
    ctx.beginPath();
    ctx.arc(px, py, pr, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(232, 223, 255, ${0.3 + Math.random() * 0.5})`;
    ctx.fill();
  }

  // 4. 叠加星云光晕（径向渐变）
  const glow = ctx.createRadialGradient(SIZE / 2, SIZE / 2, 0, SIZE / 2, SIZE / 2, SIZE * 0.7);
  const glowColor = style === "cyber" ? "96,165,250" : style === "illustration" ? "244,114,182" : "139,111,184";
  glow.addColorStop(0, `rgba(${glowColor}, ${toneMap.glow})`);
  glow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, SIZE, SIZE);

  return canvas.toDataURL("image/png");
}

/**
 * ============================================================
 * 真实 AI API 接口预留（未来接入时只改这里）
 * ============================================================
 * 目前用前端 Canvas 滤镜模拟，零成本可跑通。
 * 未来接入真实 AI 画图 API 时，只需：
 *   1. 配置 API 端点 + key（建议放在后端，避免前端泄露密钥）
 *   2. 实现 callRealStardustAPI 函数体
 *   3. 在 generateStardustImage 里把 applyStardustFilter 替换为 callRealStardustAPI
 *
 * 建议接入方案：
 *   - 后端新增 POST /api/generate-stardust 路由（服务端持有 API key）
 *   - 前端调用该路由，传 imageBase64 + style，返回 imageUrl
 *   - 可选用 Stable Diffusion / Midjourney API / 国内画图服务（如通义万相、文心一格）
 */

interface RealStardustApiRequest {
  imageBase64: string;
  style: "pixel" | "illustration" | "cyber";
}

interface RealStardustApiResponse {
  success: boolean;
  imageUrl?: string;
  error?: string;
}

/**
 * 真实 AI 画图 API 调用（预留，尚未实现）。
 * TODO: 未来接入时实现此函数，并通过后端代理保护密钥。
 */
async function callRealStardustAPI(req: RealStardustApiRequest): Promise<string> {
  // TODO: 替换为真实后端调用
  // const response = await fetch("/api/generate-stardust", {
  //   method: "POST",
  //   headers: { "Content-Type": "application/json" },
  //   body: JSON.stringify(req),
  // });
  // const data: RealStardustApiResponse = await response.json();
  // if (!data.success || !data.imageUrl) throw new Error(data.error || "生成失败");
  // return data.imageUrl;

  // 未接入时抛出，交由 generateStardustImage 回退到本地 Canvas 滤镜
  throw new Error("真实 AI API 未接入，回退本地滤镜");
}

/**
 * 是否启用真实 AI API（未来接入后改为 true）
 */
const USE_REAL_API = false;

/**
 * 生成 2D 星辰画像。
 * 优先尝试真实 AI API（USE_REAL_API 开启且接入后）；否则回退本地 Canvas 滤镜。
 */
export async function generateStardustImage(params: GenerateParams): Promise<GenerateResult> {
  // 模拟处理耗时（保留未来接 API 的 loading 体验）
  await new Promise((resolve) => setTimeout(resolve, 1200));

  let imageUrl: string;

  if (USE_REAL_API) {
    try {
      imageUrl = await callRealStardustAPI({ imageBase64: params.imageBase64, style: params.style });
    } catch {
      // 真实 API 失败时回退本地滤镜，保证功能不中断
      imageUrl = await applyStardustFilter(params.imageBase64, params.style);
    }
  } else {
    imageUrl = await applyStardustFilter(params.imageBase64, params.style);
  }

  return {
    id: `gen_${Date.now()}`,
    imageUrl,
    style: params.style,
    createdAt: Date.now(),
  };
}

/**
 * 3D 建模接口（未来实现，先留空）
 * TODO: 接入 Tripo3D / Meshy 等图片生 3D API，返回可下载的 glTF 模型 URL
 */
export async function generate3DModel(imageBase64: string): Promise<{ modelUrl: string }> {
  // TODO: 后端代理调用 Tripo3D / Meshy：
  // const response = await fetch("/api/generate-3d", {
  //   method: "POST",
  //   headers: { "Content-Type": "application/json" },
  //   body: JSON.stringify({ imageBase64 }),
  // });
  // const data = await response.json();
  // return { modelUrl: data.modelUrl };
  throw new Error("3D建模功能开发中，敬请期待");
}
