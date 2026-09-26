/**
 * useGenerateQuota - 生成次数限制 hook
 *
 * 免费用户每日 1 次，月卡用户每日 3 次（每日 0 点重置）。
 * 免费次数用完 → 付费生成（扣星辰币，走 onSpendCoins 回调）。
 *
 * 付费价格（星辰币）：
 *   - 单次付费生成：60 星辰币/次
 *   - 赛博风格额外：60 星辰币/次（付费风格）
 */

import { useState, useEffect, useCallback } from "react";

// [BUG-FIX] 键名必须是 starpuff_ 前缀，否则不会被 saveManager 纳入存档快照，
// 换机/云同步恢复后生成配额会丢失。
const QUOTA_KEY = "starpuff_quota";
/** 旧版本使用的无前缀键，读取时兼容一次 */
const LEGACY_QUOTA_KEY = "stardust_quota";
const PAY_PER_GENERATE = 60; // 单次付费生成价格（星辰币）

function todayStr(): string {
  return new Date().toDateString();
}

/** 读取「今天」的已用免费次数；跨天或读取失败均返回 0 */
function readUsedToday(): number {
  try {
    const saved = localStorage.getItem(QUOTA_KEY) ?? localStorage.getItem(LEGACY_QUOTA_KEY);
    if (!saved) return 0;
    const data = JSON.parse(saved);
    return data?.date === todayStr() ? Number(data.used) || 0 : 0;
  } catch {
    return 0;
  }
}

export function useGenerateQuota(isVip: boolean, onSpendCoins?: (amount: number) => boolean) {
  const [dailyFreeUsed, setDailyFreeUsed] = useState(0);

  // 每日上限：免费 1 次，月卡 3 次
  const dailyFreeLimit = isVip ? 3 : 1;

  // [BUG-FIX] 原实现只在组件挂载时判断一次跨天：Electron 常驻应用数天不刷新时，
  // 过了午夜 dailyFreeUsed 不会归零，免费用户会永久失去每日免费次数；
  // 且跨天后调用 useOneQuota 会把「昨天的用量 +1」写进今天。
  // 改为：挂载时 + 每 60 秒 + 每次消耗前，都以「当天日期」重新对齐用量。
  useEffect(() => {
    setDailyFreeUsed(readUsedToday());
    const timer = setInterval(() => setDailyFreeUsed(readUsedToday()), 60_000);
    return () => clearInterval(timer);
  }, []);

  const canGenerateFree = dailyFreeUsed < dailyFreeLimit;
  const remaining = Math.max(0, dailyFreeLimit - dailyFreeUsed);

  const useOneQuota = useCallback(() => {
    // 以存储中「今天」的用量为基准递增，天然完成跨天归零（不再依赖挂载时的旧状态）
    const next = readUsedToday() + 1;
    try {
      localStorage.setItem(QUOTA_KEY, JSON.stringify({ date: todayStr(), used: next }));
    } catch {
      /* 忽略存储失败 */
    }
    setDailyFreeUsed(next);
  }, []);

  /**
   * 付费生成：扣星辰币，成功返回 true。
   * 付费生成不占用每日免费次数。
   */
  const payAndGenerate = useCallback((): boolean => {
    if (!onSpendCoins) return false;
    return onSpendCoins(PAY_PER_GENERATE);
  }, [onSpendCoins]);

  return { dailyFreeUsed, dailyFreeLimit, canGenerateFree, remaining, useOneQuota, payAndGenerate, PAY_PER_GENERATE };
}
