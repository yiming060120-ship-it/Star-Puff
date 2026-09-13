import { useMemo } from "react";
import { motion } from "motion/react";

interface Star {
  id: number;
  left: number;
  top: number;
  size: number;
  delay: number;
  duration: number;
}

/** 右侧情感功能区的漂浮星尘背景：25 颗随机大小/位置的星尘，持续闪烁上浮 */
export default function StarDustBackground() {
  const stars = useMemo<Star[]>(
    () =>
      Array.from({ length: 25 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        top: Math.random() * 100,
        size: Math.random() * 2 + 1,
        delay: Math.random() * 5,
        duration: Math.random() * 3 + 3,
      })),
    []
  );

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {stars.map((star) => (
        <motion.div
          key={star.id}
          className="absolute rounded-full"
          style={{
            left: `${star.left}%`,
            top: `${star.top}%`,
            width: star.size,
            height: star.size,
            background: star.id % 3 === 0 ? "#ec4899" : star.id % 3 === 1 ? "#a855f7" : "#fff",
            boxShadow: `0 0 ${star.size * 3}px currentColor`,
          }}
          animate={{ opacity: [0.2, 1, 0.2], scale: [1, 1.5, 1], y: [0, -10, 0] }}
          transition={{ duration: star.duration, delay: star.delay, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}
