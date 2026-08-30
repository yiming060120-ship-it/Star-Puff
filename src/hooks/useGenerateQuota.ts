/**
 * useGenerateQuota - 生成次数限制 hook
 *
 * 免费用户每日 1 次，月卡用户每日 3 次（每日 0 点重置）。
 * 免费次数用完 → 付费生成（扣星尘币，走 onSpendCoins 回调）。
 *
 * 付费价格（星尘币）：
 *   - 单次付费生成：60 星尘币/次
 *   - 赛博风格额外：60 星尘币/次（付费风格）
 */

import { useState, useEffect, useCallback } from "react";

const QUOTA_KEY = "stardust_quota";
const PAY_PER_GENERATE = 60; // 单次付费生成价格（星尘币）

function todayStr(): string {
  return new Date().toDateString();
}

export function useGenerateQuota(isVip: boolean, onSpendCoins?: (amount: number) => boolean) {
  const [dailyFreeUsed, setDailyFreeUsed] = useState(0);

  // 每日上限：免费 1 次，月卡 3 次
  const dailyFreeLimit = isVip ? 3 : 1;

  // 读取今日已用次数（跨天自动归零）
  useEffect(() => {
    try {
      const saved = localStorage.getItem(QUOTA_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        if (data.date === todayStr()) {
          setDailyFreeUsed(Number(data.used) || 0);
        } else {
          setDailyFreeUsed(0);
        }
      }
    } catch {
      setDailyFreeUsed(0);
    }
  }, []);

  const canGenerateFree = dailyFreeUsed < dailyFreeLimit;
  const remaining = Math.max(0, dailyFreeLimit - dailyFreeUsed);

  const useOneQuota = useCallback(() => {
    setDailyFreeUsed((prev) => {
      const next = prev + 1;
      try {
        localStorage.setItem(QUOTA_KEY, JSON.stringify({ date: todayStr(), used: next }));
      } catch {
        /* 忽略存储失败 */
      }
      return next;
    });
  }, []);

  /**
   * 付费生成：扣星尘币，成功返回 true。
   * 付费生成不占用每日免费次数。
   */
  const payAndGenerate = useCallback((): boolean => {
    if (!onSpendCoins) return false;
    return onSpendCoins(PAY_PER_GENERATE);
  }, [onSpendCoins]);

  return { dailyFreeUsed, dailyFreeLimit, canGenerateFree, remaining, useOneQuota, payAndGenerate, PAY_PER_GENERATE };
}
