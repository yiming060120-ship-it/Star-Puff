/**
 * FeedMenu - 食物选择底部弹窗（任务三）
 *
 * 从底部滑出的半屏菜单，横向滚动食物卡片。
 * 每个卡片显示：图标、名称、恢复数值、拥有数量/价格。
 */

import React, { useRef } from "react";
import { foodItems, findFoodById, type FoodInventory } from "../../data/foodItems";
import { Coins, X, ChevronLeft, ChevronRight } from "lucide-react";

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
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollBy = (dir: number) => {
    scrollRef.current?.scrollBy({ left: dir * 180, behavior: "smooth" });
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center" onClick={onClose}>
      {/* 半透明遮罩 */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* BottomSheet */}
      <div
        className="relative w-full max-w-lg bg-[#1a1133]/95 border-t border-x border-purple-500/30 rounded-t-3xl p-5 pb-8 animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 顶部把手 */}
        <div className="w-10 h-1 rounded-full bg-white/20 mx-auto mb-4" />

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

        {/* 食物横向滚动列表（带左右箭头 + 可见滚动条） */}
        <div className="relative">
          {/* 左箭头 */}
          <button
            onClick={() => scrollBy(-1)}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-black/60 border border-white/20 flex items-center justify-center text-white hover:bg-purple-500/40 transition-colors"
            title="向左滑动"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          {/* 右箭头 */}
          <button
            onClick={() => scrollBy(1)}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-black/60 border border-white/20 flex items-center justify-center text-white hover:bg-purple-500/40 transition-colors"
            title="向右滑动"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <div ref={scrollRef} className="flex gap-3 overflow-x-auto pb-3 px-10 custom-scrollbar">
          {foodItems.map((food) => {
            const count = inventory[food.id] ?? 0;
            return (
              <div
                key={food.id}
                className={`min-w-[140px] shrink-0 p-3 rounded-xl border-2 bg-black/30 flex flex-col items-center text-center ${RARITY_STYLE[food.rarity]}`}
              >
                <div className="text-4xl mb-2">{food.icon}</div>
                <div className="text-sm font-bold text-white">{food.name}</div>
                <div className="text-[9px] text-gray-400 mt-1 space-y-0.5">
                  <div className="text-orange-300">+{food.hungerRestore} 饥饿</div>
                  <div className="text-cyan-300">+{food.energyRestore} 能量</div>
                  <div className="text-pink-300">+{food.moodRestore} 心情</div>
                </div>
                <div className="text-[8px] text-gray-500 mt-1 leading-tight line-clamp-2">{food.description}</div>

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
        </div>

        {/* 余额 */}
        <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs">
          <span className="text-gray-400">当前星尘币</span>
          <span className="font-mono text-orange-300 font-bold flex items-center gap-1">
            <Coins className="w-4 h-4" />
            {stardustCoins}
          </span>
        </div>
      </div>
    </div>
  );
}
