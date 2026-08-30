/**
 * useFeeding - 喂食逻辑 hook（任务三）
 *
 * 管理：背包食物数量（localStorage）、购买（扣星尘币）、喂食（扣数量 + 恢复数值）。
 * 数值恢复通过回调交由宿主组件（HomeCanvas/App）执行，本 hook 只负责背包与购买。
 */

import { useCallback, useState } from "react";
import {
  readFoodInventory,
  writeFoodInventory,
  findFoodById,
  type FoodInventory,
} from "../data/foodItems";

export interface UseFeedingOptions {
  /** 当前星尘币余额（只读，用于购买校验） */
  stardustCoins: number;
  /** 扣星尘币（购买食物时） */
  onSpendCoins: (amount: number) => boolean;
  /** 喂食成功后的回调（宿主恢复数值 + 播放动画 + 气泡） */
  onFeed: (foodId: string, hungerRestore: number, energyRestore: number, moodRestore: number) => void;
}

export function useFeeding({ stardustCoins, onSpendCoins, onFeed }: UseFeedingOptions) {
  const [inventory, setInventory] = useState<FoodInventory>(() => readFoodInventory());

  // 持久化背包
  const persist = useCallback((next: FoodInventory) => {
    setInventory(next);
    writeFoodInventory(next);
  }, []);

  /** 喂食：数量足够则扣 1 并触发 onFeed；否则返回 false（需要购买） */
  const feed = useCallback(
    (foodId: string): boolean => {
      const food = findFoodById(foodId);
      if (!food) return false;
      const count = inventory[foodId] ?? 0;
      if (count <= 0) return false;
      const next = { ...inventory, [foodId]: count - 1 };
      persist(next);
      onFeed(foodId, food.hungerRestore, food.energyRestore, food.moodRestore);
      return true;
    },
    [inventory, persist, onFeed]
  );

  /** 购买食物：扣星尘币 + 数量 +1，返回是否成功 */
  const buy = useCallback(
    (foodId: string): boolean => {
      const food = findFoodById(foodId);
      if (!food) return false;
      if (stardustCoins < food.price) return false;
      if (!onSpendCoins(food.price)) return false;
      const next = { ...inventory, [foodId]: (inventory[foodId] ?? 0) + 1 };
      persist(next);
      return true;
    },
    [inventory, stardustCoins, onSpendCoins, persist]
  );

  return { inventory, feed, buy };
}
