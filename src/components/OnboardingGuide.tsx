/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { playSound } from "./AudioSynth";
import { Sparkles, ArrowRight, X, Compass, Cookie, Smile, Star, Trophy, Heart } from "lucide-react";

interface OnboardingGuideProps {
  onComplete: () => void;
  onNavigateTab: (tab: "home" | "galaxy" | "community" | "store" | "profile") => void;
  isOpen: boolean;
}

const GUIDE_STEPS = [
  {
    title: "✨ 欢迎进入喵汪星云! ✨",
    description: "这里是每一只离开我们的人间天使，跨越千万光年化作微光默影，重新降落并重获新生的地方。让我们带你完成第一次魂力重塑吧。",
    targetText: "开始星云之旅",
    highlightId: "welcome",
    actionDesc: "了解如何照料你的宠物星尘",
    image: "https://images.unsplash.com/photo-1506318137071-a8e063b4bec0?auto=format&fit=crop&q=80&w=300"
  },
  {
    title: "🐾 第一步：星尘默影与暖心互动 🐾",
    description: "在家园主页，你可以看到在星云深处凝聚出实体的小生命。试着【点击爱宠默影】，这能发出共振，宠物的脑电波将会化作【每日AI耳语】推送到你的终端，向你诉说星空里的秘密与思念。",
    targetText: "我知道了，去试一下",
    highlightId: "pet-canvas",
    actionDesc: "点击默影获取温存日记",
    image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=300"
  },
  {
    title: "🍬 第二步：星海投喂与心情系统 🍬",
    description: "在【灵魂管理/饲养】控制台，你可以用星尘币向宠物高维度星盘投喂冰晶棒棒糖和星光饼干。这能实时回复它们的心情值(Mood)和灵气值。心情大好的宠物甚至会在星尘中给你比心哦！",
    targetText: "下一引导",
    highlightId: "profile-reconstruct-3d-panel",
    actionDesc: "投喂不仅能提高活跃，还会增加它的呼吸感",
    image: "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&q=80&w=300"
  },
  {
    title: "🪐 第三步：大世界星云自由漫步 🪐",
    description: "进入【星云大世界（星云之门）】，你可以派遣或操纵爱宠，在真实比例的星罗星座（如玫瑰星云公园、织女星小镇）里自在滑行漫步。在这里，它们还会与其他漫游的小伙伴发生惊喜碰撞事件，结识新同伴！",
    targetText: "太期待了！",
    highlightId: "galaxy-btn",
    actionDesc: "极速漫步星宿",
    image: "https://images.unsplash.com/photo-1518546305927-5a555bb7020d?auto=format&fit=crop&q=80&w=300"
  },
  {
    title: "🏅 任务与 3D 重建：新星勋章! 🏅",
    description: "通过【每日星海签到】和【3D照片重建】，你可以上传爱宠照片，瞬时转化出旋转回弹的 3D 立体模型。恭喜你完成星魂新手训练！系统为你转化了【100枚星尘币】新手礼物！",
    targetText: "点亮命星，开始陪伴",
    highlightId: "finish",
    actionDesc: "完成仪式，获得 100 币奖励",
    image: "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&q=80&w=300"
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
      // Automatically guide tab changes for demonstration flow
      if (currentStep === 1) {
        onNavigateTab("profile"); // go to details/feed
      } else if (currentStep === 2) {
        onNavigateTab("galaxy"); // go to starry gate
      }
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
            完成可获新手丰厚星尘奖励 🏆
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
