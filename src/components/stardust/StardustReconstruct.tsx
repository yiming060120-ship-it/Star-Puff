/**
 * StardustReconstruct - 星辰重建（照片 → 2D 星辰画像）
 *
 * 上传宠物照片 → Canvas 真实星辰化滤镜 → 产出 2D 星辰画像。
 * 免费每日 1 次，月卡每日 3 次，付费风格/3D 建模预留接口。
 */

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import UploadArea from "./UploadArea";
import StyleSelector, { type StardustStyle } from "./StyleSelector";
import GeneratingOverlay from "./GeneratingOverlay";
import { useImageUpload } from "../../hooks/useImageUpload";
import { useGenerateQuota } from "../../hooks/useGenerateQuota";
import { useGenerateHistory } from "../../hooks/useGenerateHistory";
import { generateStardustImage, type GenerateResult } from "../../services/stardustApi";
import { playSound } from "../../audio/AudioSynth";

interface StardustReconstructProps {
  /** 是否月卡会员（决定免费次数上限 + 风格解锁） */
  isVip: boolean;
  /** 当前星辰币余额 */
  stardustCoins: number;
  /** 扣星辰币（余额不足返回 false） */
  onSpendCoins: (amount: number) => boolean;
  /** toast 提示 */
  triggerToast: (msg: string) => void;
}

export default function StardustReconstruct({ isVip, stardustCoins, onSpendCoins, triggerToast }: StardustReconstructProps) {
  const { image, isDragging, setIsDragging, handleDrop, handleInputChange, clearImage } = useImageUpload();
  const { canGenerateFree, remaining, useOneQuota, payAndGenerate, PAY_PER_GENERATE } = useGenerateQuota(isVip, onSpendCoins);
  const { history, addToHistory, clearHistory } = useGenerateHistory();

  const [selectedStyle, setSelectedStyle] = useState<StardustStyle>("pixel");
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<GenerateResult | null>(null);

  const onError = useCallback((msg: string) => {
    triggerToast(`⚠️ ${msg}`);
    playSound("beep");
  }, [triggerToast]);

  const handleGenerate = async () => {
    if (!image) return;

    // 判断是否走付费路径：
    // 1. 免费次数用完 → 付费生成（扣 60 币）
    // 2. 赛博风格是付费风格 → 额外扣 60 币
    const isPaidStyle = selectedStyle === "cyber";
    const needPayForQuota = !canGenerateFree;

    if (needPayForQuota) {
      // 免费次数用完，必须付费生成
      const totalCost = PAY_PER_GENERATE + (isPaidStyle ? PAY_PER_GENERATE : 0);
      if (stardustCoins < totalCost) {
        triggerToast(`⚠️ 星辰币不足，本次生成需 ${totalCost} 星辰币。`);
        playSound("beep");
        return;
      }
      const ok = window.confirm(`💎 今日免费次数已用完，本次生成需支付 ${totalCost} 星辰币，是否继续？`);
      if (!ok) return;
      if (!payAndGenerate()) {
        triggerToast("⚠️ 付费失败，请重试。");
        return;
      }
      if (isPaidStyle && !onSpendCoins(PAY_PER_GENERATE)) {
        triggerToast("⚠️ 星辰币不足，无法使用赛博星云风。");
        return;
      }
    } else if (isPaidStyle) {
      // 有免费次数，但赛博风格是付费风格，额外扣费
      if (stardustCoins < PAY_PER_GENERATE) {
        triggerToast(`⚠️ 赛博星云风需 ${PAY_PER_GENERATE} 星辰币。`);
        playSound("beep");
        return;
      }
      const ok = window.confirm(`💎 赛博星云风为付费风格，需支付 ${PAY_PER_GENERATE} 星辰币，是否继续？`);
      if (!ok) return;
      if (!onSpendCoins(PAY_PER_GENERATE)) {
        triggerToast("⚠️ 付费失败，请重试。");
        return;
      }
    } else {
      // 免费生成
      useOneQuota();
    }

    setIsGenerating(true);
    try {
      const res = await generateStardustImage({ imageBase64: image, style: selectedStyle });
      setResult(res);
      addToHistory(res);
      playSound("success");
      triggerToast("✨ 星辰画像生成成功！");
    } catch (err) {
      triggerToast("❌ 生成失败，请重试");
      playSound("beep");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSetAvatar = () => {
    if (result) {
      try {
        localStorage.setItem("pet_avatar", result.imageUrl);
      } catch {
        /* 忽略 */
      }
      triggerToast("✨ 已设为宠物头像！");
      playSound("success");
    }
  };

  const handleSave = () => {
    if (!result) return;
    const a = document.createElement("a");
    a.href = result.imageUrl;
    a.download = `星辰画像_${result.id}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    triggerToast("💾 画像已保存到本地！");
  };

  const handleShare = () => {
    triggerToast("📤 分享功能开发中，敬请期待");
  };

  return (
    <div className="bg-[#110c2c]/85 border border-white/10 rounded-3xl p-5 text-white space-y-5 shadow-xl">
      {/* 说明区 */}
      <div className="text-center">
        <h4 className="text-lg font-bold gradient-text mb-1">重建你的星辰伙伴</h4>
        <p className="text-purple-300 text-xs">上传宠物照片，星辰感应将它化为星云间的永恒画像</p>
      </div>

      {/* 上传区 */}
      <UploadArea
        image={image}
        isDragging={isDragging}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => handleDrop(e, onError)}
        onInputChange={(e) => handleInputChange(e, onError)}
        onClear={() => { clearImage(); setResult(null); }}
      />

      {/* 风格选择（上传后显示） */}
      <AnimatePresence>
        {image && !result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            <div>
              <h5 className="text-sm font-medium text-purple-200 mb-3">选择风格</h5>
              <StyleSelector selected={selectedStyle} onSelect={setSelectedStyle} isVip={isVip} />
            </div>

            <div className="space-y-2">
              <button
                onClick={handleGenerate}
                className="shine-hover w-full py-3 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold text-sm transition-all hover:scale-[1.02] active:scale-95 shadow-lg shadow-purple-500/30"
              >
                {canGenerateFree
                  ? (selectedStyle === "cyber" ? `💎 赛博风付费生成（${PAY_PER_GENERATE} 币）` : `✨ 立即生成（今日剩余 ${remaining} 次）`)
                  : `💎 付费生成（${PAY_PER_GENERATE} 币/次）`}
              </button>
              {!isVip && canGenerateFree && (
                <p className="text-center text-xs text-purple-400">升级月卡，每日 3 次免费生成 →</p>
              )}
              <p className="text-center text-[10px] text-purple-400/70">
                当前余额：<span className="text-amber-300 font-mono">{stardustCoins}</span> 星辰币
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 结果展示 */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-4"
          >
            <div className="relative rounded-3xl overflow-hidden border-2 border-purple-400/50 shadow-xl shadow-purple-500/30">
              <img src={result.imageUrl} alt="生成结果" className="w-full" />
              <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-black/50 backdrop-blur-sm text-xs">
                ✨ 星辰画像
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button onClick={handleSetAvatar} className="py-2 rounded-xl glass text-xs hover:bg-white/15 transition-colors">设为头像</button>
              <button onClick={handleSave} className="py-2 rounded-xl glass text-xs hover:bg-white/15 transition-colors">保存</button>
              <button onClick={handleShare} className="py-2 rounded-xl glass text-xs hover:bg-white/15 transition-colors">分享</button>
            </div>

            <button
              onClick={() => { setResult(null); clearImage(); }}
              className="w-full py-2 text-purple-300 text-xs hover:text-white transition-colors"
            >
              ↺ 重新生成
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 历史记录 */}
      {history.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h5 className="text-sm font-medium text-purple-200">我的星辰画像</h5>
            <button onClick={clearHistory} className="text-[10px] text-gray-500 hover:text-rose-400 transition-colors">
              清空记录
            </button>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {history.slice(0, 8).map((item) => (
              <button
                key={item.id}
                onClick={() => setResult(item)}
                className="aspect-square rounded-xl overflow-hidden border border-white/10 hover:border-purple-400 transition-colors"
              >
                <img src={item.imageUrl} alt="历史" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 升级引导 */}
      {!isVip && (
        <div className="glass rounded-2xl p-4 flex items-center gap-3">
          <div className="text-3xl">👑</div>
          <div className="flex-1">
            <div className="text-sm font-medium text-white">升级星云月卡</div>
            <div className="text-xs text-purple-300">每日 3 次免费生成 + 解锁全部风格</div>
          </div>
          <span className="text-xs px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-white font-bold">9.9元/月</span>
        </div>
      )}

      {/* 3D 入口预留 */}
      <div className="glass rounded-2xl p-4 opacity-60">
        <div className="flex items-center gap-3">
          <div className="text-3xl">🧊</div>
          <div className="flex-1">
            <div className="text-sm font-medium text-white">
              3D 星辰建模 <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/80 ml-1">即将上线</span>
            </div>
            <div className="text-xs text-purple-300">上传照片生成可 360° 旋转的 3D 模型</div>
          </div>
          <span className="text-2xl">🔒</span>
        </div>
      </div>

      {/* 生成中遮罩 */}
      <AnimatePresence>
        {isGenerating && <GeneratingOverlay onComplete={() => {}} />}
      </AnimatePresence>
    </div>
  );
}
