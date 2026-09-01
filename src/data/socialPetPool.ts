/**
 * 平台宠物用户池 + 性格匹配算法
 *
 * 单机版没有真实多用户后端，用本地模拟的"其他平台用户宠物"池充当社交用户池，
 * 供每日心语社交玩法（/api/whisper）与未来社交功能复用。
 * 数据源统一来自 virtualFriends.ts（12 位虚拟星友）。
 *
 * ⚠️ 本文件必须保持零运行时依赖、无 DOM/React 引用（只能 import type 或纯数据模块）：
 * server.ts 经 esbuild --bundle 编译进 dist/server.cjs，任何浏览器依赖都会被拉进服务端。
 */

import { toPlatformPets } from "./virtualFriends";

export interface PlatformPet {
  name: string;
  type: string; // 猫 / 狗 / 兔 / 鸟 / 其他
  ownerName: string;
  personalityTags: string[];
}

/** 平台用户池：从统一虚拟好友数据源派生（12 只） */
export const PLATFORM_PETS: PlatformPet[] = toPlatformPets();

/** 性格六大维度 */
const TRAITS = ["温柔", "好动", "傲娇", "黏人", "贪吃", "安静"] as const;

/** 标签 → 性格维度映射：覆盖用户规范池 + 平台宠物自定标签 */
const TAG_TRAIT_MAP: Record<string, string[]> = {
  // 用户规范池（PetMemoryTimeline.PERSONALITY_TAGS_POOL）
  "温柔精灵": ["温柔"],
  "调皮捣蛋": ["好动"],
  "傲娇小主子": ["傲娇"],
  "贴心小棉袄": ["黏人"],
  "吃货大王": ["贪吃"],
  "老僧入定": ["安静"],
  // 平台宠物自定标签
  "温柔憨厚": ["温柔"],
  "狂野打滚": ["好动"],
  "善解兔意": ["温柔", "黏人"],
  "干饭达人": ["贪吃"],
  "温顺乖巧": ["温柔"],
  "粘人屁颠": ["黏人"],
  "傲娇舔毛": ["傲娇"],
  "高冷慵懒": ["傲娇", "安静"],
  "藏玩具高手": ["安静"],
  "社交恐怖": ["好动"],
  "歌声嘹亮": ["好动"],
  "爱蹭额头": ["黏人"],
  "贪吃软萌": ["贪吃", "温柔"],
  "憨厚黏人": ["温柔", "黏人"],
  "活泼爱玩": ["好动"],
  "忠诚粘人": ["黏人"],
};

function tagTraits(tag: string): string[] {
  if (TAG_TRAIT_MAP[tag]) return TAG_TRAIT_MAP[tag];
  // 兜底关键字匹配，覆盖未来新增标签
  if (tag.includes("温柔") || tag.includes("温顺") || tag.includes("憨厚") || tag.includes("软")) return ["温柔"];
  if (tag.includes("傲") || tag.includes("高冷")) return ["傲娇"];
  if (tag.includes("粘") || tag.includes("黏") || tag.includes("贴")) return ["黏人"];
  if (tag.includes("吃") || tag.includes("干饭")) return ["贪吃"];
  if (tag.includes("睡") || tag.includes("安静") || tag.includes("老僧")) return ["安静"];
  if (tag.includes("皮") || tag.includes("活") || tag.includes("闹") || tag.includes("社交")) return ["好动"];
  return ["温柔"];
}

/** 相似度：精确同名标签 ×3 权重 + 各性格维度重合数累加 */
export function petSimilarity(userTags: string[], pet: PlatformPet): number {
  const exact = userTags.filter(t => pet.personalityTags.includes(t)).length;
  const ut = userTags.flatMap(tagTraits);
  const pt = pet.personalityTags.flatMap(tagTraits);
  let shared = 0;
  for (const t of TRAITS) {
    shared += Math.min(ut.filter(x => x === t).length, pt.filter(x => x === t).length);
  }
  return exact * 3 + shared;
}

/**
 * 挑选每日心语的社交对象。
 * @param userPetName 用户宠物名（用于防自匹配）
 * @param userTags 用户宠物性格标签；有值走性格匹配，无值走随机模式
 */
export function pickSocialPet(userPetName: string, userTags?: string[]): PlatformPet {
  const pool = PLATFORM_PETS.filter(p => p.name !== userPetName); // 防自匹配
  if (userTags && userTags.length > 0) {
    // 性格匹配：取 top-2 再随机抽 1 —— 既"投缘"又有随机性，避免热门组合永远匹配同一只导致文案重复
    const sorted = [...pool].sort((a, b) => petSimilarity(userTags, b) - petSimilarity(userTags, a));
    const top = sorted.slice(0, Math.min(2, sorted.length));
    return top[Math.floor(Math.random() * top.length)];
  }
  return pool[Math.floor(Math.random() * pool.length)];
}
