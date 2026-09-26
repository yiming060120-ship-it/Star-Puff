/**
 * GeneratingOverlay - 生成中的全屏 loading 遮罩（旋转光环 + 进度条 + 阶段文案）
 */

import { useState, useEffect, useRef } from "react";
import { motion } from "motion/react";

const STEPS = ["正在提取宠物特征...", "正在绘制星辰粒子...", "正在注入星云能量...", "即将完成..."];

interface GeneratingOverlayProps {
  onComplete: () => void;
}

export default function GeneratingOverlay({ onComplete }: GeneratingOverlayProps) {
  const [step, setStep] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const stepTimer = setInterval(() => {
      setStep((prev) => Math.min(prev + 1, STEPS.length - 1));
    }, 800);

    const progressTimer = setInterval(() => {
      // [BUG-FIX] clearInterval / setTimeout(onComplete) 原本写在 setProgress 的 updater 内，
      // StrictMode 下 updater 双调用 → onComplete 触发两次，并泄漏一个未清理的 timer。
      // 改为纯计数，完成动作交给下方独立 effect。
      setProgress((prev) => Math.min(prev + 2, 100));
    }, 60);

    return () => {
      clearInterval(stepTimer);
      clearInterval(progressTimer);
    };
  }, [onComplete]);

  // 进度到达 100% 后延迟收尾（独立 effect + ref 防重入，避免重复回调）
  const completedRef = useRef(false);
  useEffect(() => {
    if (progress < 100 || completedRef.current) return;
    completedRef.current = true;
    const doneTimer = setTimeout(onComplete, 300);
    return () => clearTimeout(doneTimer);
  }, [progress, onComplete]);

  return (
    <div className="fixed inset-0 z-[80] bg-[#1A1238]/95 backdrop-blur-md flex flex-col items-center justify-center">
      {/* 旋转光环 */}
      <div className="relative w-40 h-40 mb-8">
        <div className="absolute inset-0 rounded-full border-4 border-purple-500/30" />
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-pink-400 animate-spin" />
        <div className="absolute inset-4 rounded-full bg-gradient-to-br from-purple-600/50 to-pink-600/50 flex items-center justify-center">
          <span className="text-5xl animate-pulse">🌟</span>
        </div>
      </div>

      <p className="text-purple-200 text-lg mb-4">{STEPS[step]}</p>

      <div className="w-64 h-2 bg-white/10 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-purple-400 to-pink-400 rounded-full"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="text-purple-400 text-sm mt-2">{progress}%</p>
    </div>
  );
}
