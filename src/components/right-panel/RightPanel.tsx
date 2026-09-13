import type { ReactNode } from "react";
import { motion } from "motion/react";
import StarDustBackground from "./StarDustBackground";

interface RightPanelProps {
  children: ReactNode;
}

/** 右侧情感功能区外壳：发光分隔线 + 顶部/底部光带 + 漂浮星尘背景 */
export default function RightPanel({ children }: RightPanelProps) {
  return (
    <motion.aside
      initial={{ x: 80, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="relative w-full md:w-[42%] md:min-w-[380px] md:max-w-[520px] h-full flex flex-col shrink-0 overflow-hidden"
      style={{
        background:
          "linear-gradient(180deg, rgba(30,20,60,0.85) 0%, rgba(20,15,45,0.92) 50%, rgba(25,18,55,0.88) 100%)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderLeft: "1px solid rgba(168,85,247,0.3)",
        boxShadow:
          "-8px 0 40px rgba(168,85,247,0.15), inset 1px 0 0 rgba(255,255,255,0.05)",
      }}
    >
      {/* 顶部装饰光带（紫→粉→紫，缓慢流动） */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px] pointer-events-none"
        style={{
          background:
            "linear-gradient(90deg, transparent, #a855f7, #ec4899, #a855f7, transparent)",
          backgroundSize: "200% 100%",
          animation: "shimmer 3s linear infinite",
        }}
      />
      {/* 左侧发光分隔线 */}
      <div
        className="absolute left-0 top-0 bottom-0 w-[2px] pointer-events-none"
        style={{
          background:
            "linear-gradient(180deg, transparent, rgba(168,85,247,0.6), rgba(236,72,153,0.6), rgba(168,85,247,0.6), transparent)",
          boxShadow: "0 0 15px rgba(168,85,247,0.5)",
        }}
      />
      {/* 漂浮星尘背景 */}
      <StarDustBackground />
      {/* 内容层 */}
      <div className="relative z-10 flex flex-col h-full">{children}</div>
      {/* 底部装饰光带 */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[1px] pointer-events-none"
        style={{
          background: "linear-gradient(90deg, transparent, rgba(236,72,153,0.4), transparent)",
        }}
      />
    </motion.aside>
  );
}
