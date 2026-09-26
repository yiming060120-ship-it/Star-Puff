/**
 * FeedMenu - 食物选择顶部面板（任务三）
 *
 * 从顶部导航栏下方滑出的菜单，网格展示食物卡片。
 * 每个卡片显示：图标、名称、恢复数值、拥有数量/价格。
 */

import React, { useState } from "react";
// [CLEANUP] 已移除未使用的 findFoodById（组件直接遍历 foodItems）
import { foodItems, FOOD_CATEGORY_NAMES, type FoodInventory } from "../../data/foodItems";
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
  const [selectedFood, setSelectedFood] = useState(foodItems[0]);
  const getCount = (foodId: string) => inventory[foodId] ?? 0;

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

        {/* [细节优化] 已选食物卡片：实时库存 + 说明，喂食/购买后数量同步 */}
        <div className="mb-3.5 p-3 rounded-xl bg-black/40 border border-white/10 flex items-center gap-3">
          <div className="text-4xl">{selectedFood.icon}</div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold text-white">{selectedFood.name}</div>
            <div className="text-[9px] text-purple-300 leading-tight line-clamp-2">{selectedFood.description}</div>
            <div className="text-[9px] text-gray-400 mt-0.5 flex gap-2">
              <span className="text-orange-300">+{selectedFood.hungerRestore} 饥饿</span>
              <span className="text-cyan-300">+{selectedFood.energyRestore} 能量</span>
              <span className="text-pink-300">+{selectedFood.moodRestore} 心情</span>
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="text-[9px] text-purple-400">库存</div>
            <div className="text-lg font-bold text-amber-300 leading-none">×{getCount(selectedFood.id)}</div>
          </div>
        </div>

        {/* [细节优化] 分类食物网格：统一库存展示，点选切换当前食物 */}
        <div className="space-y-3 max-h-52 overflow-y-auto pr-1 custom-scrollbar">
          {(["basic", "snack", "premium", "special"] as const).map((cat) => {
            const list = foodItems.filter((f) => f.category === cat);
            if (list.length === 0) return null;
            return (
              <div key={cat}>
                <div className="text-[10px] text-purple-400 mb-1.5 font-mono tracking-wide">{FOOD_CATEGORY_NAMES[cat]}</div>
                <div className="grid grid-cols-3 gap-2">
                  {list.map((food) => {
                    const count = getCount(food.id);
                    const isSelected = food.id === selectedFood.id;
                    return (
                      <button
                        key={food.id}
                        onClick={() => setSelectedFood(food)}
                        className={`relative aspect-square rounded-xl border-2 flex flex-col items-center justify-center transition-all ${
                          isSelected
                            ? "border-pink-400 bg-pink-500/15 shadow-lg shadow-pink-500/30"
                            : "border-white/10 bg-white/5 hover:border-white/30"
                        } ${count <= 0 ? "opacity-40" : ""}`}
                      >
                        <div className="text-2xl">{food.icon}</div>
                        <div className="text-[9px] text-purple-200 mt-0.5">{food.name}</div>
                        <div className="absolute top-1 right-1 text-[9px] px-1 py-0.5 rounded-full bg-black/50 text-amber-300">
                          ×{count}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* 喂食/购买按钮：数量为 0 禁用并提示；库存实时同步 */}
        <div className="mt-4">
          {getCount(selectedFood.id) > 0 ? (
            <button
              onClick={() => onFeed(selectedFood.id)}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white text-sm font-bold transition-all active:scale-95 shadow-[0_0_15px_rgba(236,72,153,0.4)]"
            >
              🍽️ 喂它吃{selectedFood.name}（剩 {getCount(selectedFood.id)}）
            </button>
          ) : (
            <button
              onClick={() => onBuy(selectedFood.id)}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-white text-sm font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95"
            >
              <Coins className="w-4 h-4" />
              库存不足，{selectedFood.price} 币购买 {selectedFood.name}
            </button>
          )}
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
