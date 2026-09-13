import { motion } from "motion/react";

interface IconNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  unreadLetters: number;
}

const NAV_ITEMS = [
  { id: "chat", icon: "💬", name: "陪伴私语", primary: true },
  { id: "whispers", icon: "💌", name: "星辰来信", primary: true },
  { id: "feed", icon: "🍖", name: "喂食", primary: false },
  { id: "interact", icon: "✋", name: "互动", primary: false },
  { id: "settings", icon: "⚙️", name: "设置", primary: false },
];

/** 右侧功能区顶部图标列：陪伴私语 / 星辰来信 为主要功能（大号渐变发光），其余为普通功能 */
export default function IconNav({ activeTab, onTabChange, unreadLetters }: IconNavProps) {
  return (
    <div className="flex items-center justify-around px-3 py-3 relative shrink-0 border-b border-[rgba(168,85,247,0.2)] bg-gradient-to-b from-[rgba(168,85,247,0.08)] to-transparent">
      {NAV_ITEMS.map((item) => {
        const isActive = activeTab === item.id;
        const isPrimary = item.primary;
        return (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className="relative flex flex-col items-center gap-1 cursor-pointer outline-none bg-transparent border-0"
            style={{ padding: "6px 8px" }}
          >
            <motion.div
              whileHover={{ scale: 1.15, y: -2 }}
              whileTap={{ scale: 0.95 }}
              className={`relative flex items-center justify-center rounded-2xl transition-all duration-300 ${
                isActive
                  ? isPrimary
                    ? "shadow-[0_0_20px_rgba(168,85,247,0.5),0_0_40px_rgba(236,72,153,0.2)]"
                    : "shadow-[0_0_15px_rgba(168,85,247,0.3)]"
                  : ""
              }`}
              style={{
                width: isPrimary ? 52 : 44,
                height: isPrimary ? 52 : 44,
                fontSize: isPrimary ? 26 : 22,
                background: isActive
                  ? isPrimary
                    ? "linear-gradient(135deg, rgba(168,85,247,0.35), rgba(236,72,153,0.35))"
                    : "rgba(168,85,247,0.25)"
                  : "rgba(255,255,255,0.05)",
                border: isActive
                  ? "2px solid rgba(168,85,247,0.6)"
                  : isPrimary
                    ? "2px solid rgba(168,85,247,0.3)"
                    : "2px solid transparent",
              }}
            >
              {/* 主要图标呼吸光晕 */}
              {isPrimary && !isActive && (
                <motion.div
                  className="absolute inset-0 rounded-2xl"
                  style={{ background: "radial-gradient(circle, rgba(168,85,247,0.2), transparent 70%)" }}
                  animate={{ opacity: [0.3, 0.8, 0.3] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              )}
              <span style={{ filter: isActive ? "none" : "grayscale(0.2)" }}>{item.icon}</span>

              {/* 星辰来信未读角标 */}
              {item.id === "whispers" && unreadLetters > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 rounded-full flex items-center justify-center text-[11px] font-bold text-white"
                  style={{
                    background: "linear-gradient(135deg, #ef4444, #ec4899)",
                    boxShadow: "0 0 10px rgba(239,68,68,0.6)",
                  }}
                >
                  {unreadLetters > 99 ? "99+" : unreadLetters}
                </motion.span>
              )}
            </motion.div>

            {/* 图标名称 */}
            <span
              className="text-[11px] whitespace-nowrap transition-colors duration-300"
              style={{
                color: isActive ? (isPrimary ? "#f0abfc" : "#c4b5fd") : "rgba(196,181,253,0.5)",
                fontWeight: isPrimary ? 600 : 400,
              }}
            >
              {item.name}
            </span>

            {/* 选中态底部指示条 */}
            {isActive && (
              <motion.div
                layoutId="nav-indicator"
                className="absolute -bottom-[13px] left-1/2 -translate-x-1/2 rounded-full"
                style={{
                  width: isPrimary ? 32 : 24,
                  height: 3,
                  background: isPrimary ? "linear-gradient(90deg, #a855f7, #ec4899)" : "#a855f7",
                  boxShadow: `0 0 8px ${isPrimary ? "#ec4899" : "#a855f7"}`,
                }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
