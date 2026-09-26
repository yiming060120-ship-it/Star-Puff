/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Steam 成就中心：集中定义成就 API 名（须与 Steam 后台注册一致）与幂等解锁。
 * 离线/浏览器环境下 activateAchievement 自动降级为 no-op，游戏不受影响。
 * 对应文档：docs/steam/achievements.md
 */

import { activateAchievement } from "../hooks/useSteam";

export const ACHIEVEMENTS = {
  firstCheckIn: "ach_first_check_in", // 首次签到
  sevenDayStreak: "ach_7_day_streak", // 连续签到 7 天
  firstWhisper: "ach_first_whisper", // 首次生成耳语
  first3dReconstruct: "ach_first_3d_reconstruct", // 首次 3D 重建
  firstPurchase: "ach_first_purchase", // 首次完成内购
  coins1000: "ach_coins_1000", // 星辰币累计 ≥ 1000
  petLevel10: "ach_pet_level_10", // 任一宠物等级 ≥ 10
  multiPets: "ach_multi_pets", // 同时拥有 2 只及以上宠物
} as const;

const mark = (name: string) => localStorage.setItem(`starpuff_ach_${name}`, "1");
const marked = (name: string) => localStorage.getItem(`starpuff_ach_${name}`) === "1";

/** 幂等解锁：已解锁/离线时跳过，避免无谓 IPC */
export async function unlock(name: string): Promise<boolean> {
  if (marked(name)) return false;
  const ok = await activateAchievement(name);
  if (ok) mark(name);
  return ok;
}
