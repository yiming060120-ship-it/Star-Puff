/**
 * StyleSelector - 风格选择（3 种：像素免费 / 插画月卡 / 赛博付费）
 */

import { motion } from "motion/react";

export type StardustStyle = "pixel" | "illustration" | "cyber";

interface StyleOption {
  id: StardustStyle;
  name: string;
  icon: string;
  desc: string;
  vipOnly: boolean;
  price: number;
}

const STYLES: StyleOption[] = [
  { id: "pixel", name: "星尘像素风", icon: "🌟", desc: "经典星云像素艺术", vipOnly: false, price: 0 },
  { id: "illustration", name: "梦幻插画风", icon: "🌸", desc: "柔和治愈的手绘插画", vipOnly: true, price: 0 },
  { id: "cyber", name: "赛博星云风", icon: "💎", desc: "未来感霓虹星云效果", vipOnly: false, price: 6 },
];

interface StyleSelectorProps {
  selected: StardustStyle;
  onSelect: (id: StardustStyle) => void;
  isVip: boolean;
}

export default function StyleSelector({ selected, onSelect, isVip }: StyleSelectorProps) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 custom-scrollbar">
      {STYLES.map((style) => {
        const locked = style.vipOnly && !isVip;
        const isSelected = selected === style.id;

        return (
          <motion.button
            key={style.id}
            onClick={() => !locked && onSelect(style.id)}
            whileHover={{ scale: locked ? 1 : 1.05 }}
            whileTap={{ scale: locked ? 1 : 0.95 }}
            className={`
              relative shrink-0 w-28 p-3 rounded-2xl border-2 text-left
              transition-all duration-300
              ${isSelected
                ? "border-pink-400 bg-pink-500/10 shadow-lg shadow-pink-500/30"
                : "border-white/10 bg-white/5 hover:border-white/30"}
              ${locked ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}
            `}
          >
            <div className="text-3xl mb-2">{style.icon}</div>
            <div className="text-white text-sm font-medium mb-1">{style.name}</div>
            <div className="text-purple-300 text-[10px] leading-tight">{style.desc}</div>

            {locked && <div className="absolute top-2 right-2 text-xs">🔒</div>}
            {style.price > 0 && !locked && (
              <div className="absolute top-2 right-2 text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/80 text-white">
                {style.price}元
              </div>
            )}
          </motion.button>
        );
      })}
    </div>
  );
}
