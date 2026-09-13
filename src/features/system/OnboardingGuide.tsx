/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { playSound } from "../../audio/AudioSynth";
// [CLEANUP] 已移除未使用的 useEffect，以及 7 个未使用的图标：
// Sparkles / Compass / Cookie / Smile / Star / Trophy / Heart
import { ArrowRight, X } from "lucide-react";

interface OnboardingGuideProps {
  onComplete: () => void;
  onNavigateTab: (tab: "home" | "galaxy" | "community" | "store" | "profile") => void;
  isOpen: boolean;
}

const GUIDE_STEPS = [
  {
    title: "✨ 欢迎来到喵汪星云 ✨",
    description: "这是你的星宠，它从星云彼端来到你身边，会一直陪着你。点一下它，它会开心地回应你哦。",
    targetText: "去摸摸它",
    highlightId: "pet-canvas",
    actionDesc: "点一下宠物，和它互动",
    image: "/assets/images/unsplash/1506318137071-a8e063b4bec0.jpg"
  },
  {
    title: "💬 它会跟你说话",
    description: "点开「陪伴私语」，和你的星宠说说心里话，它会认真倾听，还会温柔地回应你。",
    targetText: "去和它聊聊",
    highlightId: "chat",
    actionDesc: "打开陪伴私语，发一条消息",
    image: "/assets/images/unsplash/1451187580459-43490279c0fa.jpg"
  },
  {
    title: "🍖 它也会饿哦",
    description: "记得喂它吃点好吃的，它会特别开心。你已经学会啦，剩下的就自己慢慢探索吧～",
    targetText: "点亮星辰，开始陪伴",
    highlightId: "feed",
    actionDesc: "喂它吃点好吃的",
    image: "/assets/images/unsplash/1534447677768-be436bb09401.jpg"
  }
];

export default function OnboardingGuide({ onComplete, onNavigateTab, isOpen }: OnboardingGuideProps) {
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const step = GUIDE_STEPS[currentStep];

  const handleNext = () => {
    playSound("click");
    if (currentStep < GUIDE_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      playSound("success");
      onComplete(); // complete flow & award coins
    }
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[9999] flex items-center justify-center p-4 animate-fade-in" id="quantum-onboarding-modal">
      <div className="bg-[#150a31] border-2 border-pink-500/40 rounded-3xl p-5 md:p-8 max-w-lg w-full relative overflow-hidden shadow-[0_0_50px_rgba(239,71,111,0.2)]">
        {/* Particle visual ambiance backdrops */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-pink-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header step counter indicators */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-pink-500 rounded-full animate-ping" />
            <span className="text-[10px] font-mono font-bold tracking-widest text-pink-300 uppercase">
              新手引航仪 / STEP {currentStep + 1} OF {GUIDE_STEPS.length}
            </span>
          </div>
          <button 
            onClick={() => { playSound("click"); onComplete(); }}
            className="text-gray-500 hover:text-white transition-colors cursor-pointer"
            title="跳过引导 Skip"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Illustrative preview banner */}
        <div className="w-full h-44 rounded-2xl overflow-hidden relative border border-white/10 mb-6 group">
          <img 
            referrerPolicy="no-referrer"
            src={step.image} 
            alt={step.title} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#150a31] via-transparent to-transparent" />
          <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur border border-white/10 px-2.5 py-1 rounded-full text-[9px] font-mono text-cyan-300">
            星云信标：{step.actionDesc}
          </div>
        </div>

        {/* Message body dialogue cards */}
        <div className="space-y-3.5 mb-6">
          <h2 className="text-lg font-extrabold text-white font-sans tracking-tight">
            {step.title}
          </h2>
          <p className="text-xs text-indigo-100/90 leading-relaxed text-justify">
            {step.description}
          </p>
        </div>

        {/* Dots progress indicator line */}
        <div className="flex items-center gap-1.5 mb-6">
          {GUIDE_STEPS.map((_, i) => (
            <div 
              key={i} 
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === currentStep 
                  ? "w-8 bg-gradient-to-r from-pink-500 to-indigo-500" 
                  : i < currentStep 
                    ? "w-2 bg-pink-500/40" 
                    : "w-2 bg-white/10"
              }`}
            />
          ))}
          <span className="text-[9px] font-mono text-gray-500 ml-auto">
            完成可获新手丰厚星辰奖励 🏆
          </span>
        </div>

        {/* Footer command cluster buttons */}
        <div className="flex items-center justify-between gap-3 pt-2 border-t border-white/5">
          <button
            onClick={() => { playSound("click"); onComplete(); }}
            className="text-xs text-gray-400 hover:text-white hover:underline transition-all cursor-pointer"
          >
            跳过引导
          </button>
          
          <button
            onClick={handleNext}
            className="px-6 py-2.5 bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 hover:from-pink-500 hover:via-purple-500 hover:to-indigo-500 border border-pink-400/20 text-white font-bold font-mono tracking-widest text-xs rounded-xl flex items-center gap-1.5 active:scale-95 transition-all shadow-lg shadow-purple-500/10 cursor-pointer"
          >
            <span>{step.targetText}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
