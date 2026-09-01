/**
 * FeedMenu - 食物选择顶部面板（任务三）
 *
 * 从顶部导航栏下方滑出的菜单，网格展示食物卡片。
 * 每个卡片显示：图标、名称、恢复数值、拥有数量/价格。
 */

import React from "react";
// [CLEANUP] 已移除未使用的 findFoodById（组件直接遍历 foodItems）
import { foodItems, type FoodInventory } from "../../data/foodItems";
import { Coins, X } from "lucide-react";

interface FeedMenuProps {
  inventory: FoodInventory;
  stardustCoins: number;
  onFeed: (foodId: string) => void;
  onBuy: (foodId: string) => void;
  onClose: () => void;
}

const RARITY_STYLE: Record<string, string> = {
  common: "border-slate-600",
  rare: "border-purple-500",
  epic: "border-amber-400",
};

export default function FeedMenu({ inventory, stardustCoins, onFeed, onBuy, onClose }: FeedMenuProps) {
  return (
    // [细节修复] 遮罩与面板都从顶部导航栏下方（top-32 = 128px = header 64 + nav 64）开始，
    // 避免盖住顶部 logo 与导航栏（此前 inset-0 + pt-14 会让面板与 logo 重叠遮挡）
    <div className="fixed inset-x-0 top-32 bottom-0 z-[70] flex items-start justify-center" onClick={onClose}>
      {/* 半透明遮罩（仅覆盖内容区，不遮顶部 logo/导航） */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* 顶部面板（食物菜单显示在内容区顶部，一眼可见，无需滚动） */}
      <div
        className="relative w-full max-w-lg bg-[#1a1133]/95 border-b border-x border-purple-500/30 rounded-b-3xl p-5 pb-6 animate-slide-down"
        onClick={(e) => e.stopPropagation()}
      >

        {/* 标题 */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-white">🍽️ 喂点什么好呢？</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors"
            title="关闭"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* [细节优化] 食物网格：5 种食物一眼全见，无需左右滑动，点一下即喂/购 */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {foodItems.map((food) => {
            const count = inventory[food.id] ?? 0;
            return (
              <div
                key={food.id}
                className={`p-3 rounded-xl border-2 bg-black/30 flex flex-col items-center text-center ${RARITY_STYLE[food.rarity]}`}
              >
                <div className="text-3xl mb-1">{food.icon}</div>
                <div className="text-sm font-bold text-white leading-tight">{food.name}</div>
                <div className="text-[9px] text-gray-400 mt-1 space-y-0.5">
                  <div className="text-orange-300">+{food.hungerRestore} 饥饿</div>
                  <div className="text-cyan-300">+{food.energyRestore} 能量</div>
                  <div className="text-pink-300">+{food.moodRestore} 心情</div>
                </div>

                <div className="mt-2 w-full">
                  {count > 0 ? (
                    <button
                      onClick={() => onFeed(food.id)}
                      className="w-full py-1.5 rounded-lg bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white text-xs font-bold transition-all active:scale-95"
                    >
                      喂食（剩 {count}）
                    </button>
                  ) : (
                    <button
                      onClick={() => onBuy(food.id)}
                      className="w-full py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-white text-xs font-bold flex items-center justify-center gap-1 transition-all active:scale-95"
                    >
                      <Coins className="w-3 h-3" />
                      {food.price} 购买
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* 余额 */}
        <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs">
          <span className="text-gray-400">当前星辰币</span>
          <span className="font-mono text-orange-300 font-bold flex items-center gap-1">
            <Coins className="w-4 h-4" />
            {stardustCoins}
          </span>
        </div>
      </div>
    </div>
  );
}
