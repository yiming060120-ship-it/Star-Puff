import React, { useState } from "react";
import { Sparkles, Heart, RefreshCw, Compass, Users, CheckCircle2, UserCheck, Flame } from "lucide-react";
import { PetConfig } from "../types";
import { playSound } from "./AudioSynth";

interface ResonanceSystemProps {
  activePet: PetConfig | null;
  onUpdateCoins: (amount: number) => void;
  triggerToast: (msg: string) => void;
}

interface ResonanceMate {
  name: string;
  breed: string;
  type: string;
  primaryColor: string;
  personalityTags: string[];
  resonanceScore: number;
  parentName: string;
  greetings: string;
  icon: string;
}

const MATCHES: ResonanceMate[] = [
  { name: "斑斑", breed: "中华田园犬", type: "狗", primaryColor: "#e07a5f", personalityTags: ["温柔憨厚", "狂野打滚", "善解兔意"], resonanceScore: 98.7, parentName: "默默的麻麻", greetings: "汪汪！我的主人常说天上的极光树后有一只跟它投缘的小家伙，莫非就是你呀？过来磨屁股！🐾", icon: "🐶" },
  { name: "流星兔", breed: "安哥拉长毛兔", type: "兔", primaryColor: "#a2d2ff", personalityTags: ["干饭达人", "温顺乖巧", "粘人屁颠"], resonanceScore: 95.4, parentName: "雪糕麻麻", greetings: "噗叽噗叽~我在彗尾跑道打卡呢，要不要抓一撮彗星粉尘，送给我们两家的家长做彩虹礼物呢？⭐", icon: "🐰" },
  { name: "喵小九", breed: "英短蓝猫", type: "猫", primaryColor: "#ffd166", personalityTags: ["傲娇舔毛", "高冷慵懒", "藏玩具高手"], resonanceScore: 92.1, parentName: "七七爸", greetings: "喵嗷...愚蠢的主人又在用发光星晶逗我了。我看你的毛球挺温柔的，可以分你半条星云鱼干哦。🐾", icon: "🐱" },
  { name: "闪电青鸟", breed: "玄凤鹦鹉", type: "鸟", primaryColor: "#560bad", personalityTags: ["社交恐怖", "歌声嘹亮", "爱蹭额头"], resonanceScore: 89.8, parentName: "小羽同学", greetings: "啾啾啾！我们在银河图书馆一起听歌吧，新来的《星光海》伴奏特别好听，我会给你伴舞唱高音喔！🎵", icon: "🐤" }
];

export default function ResonanceSystem({ activePet, onUpdateCoins, triggerToast }: ResonanceSystemProps) {
  const [activeMatch, setActiveMatch] = useState<ResonanceMate | null>(null);
  const [isMatching, setIsMatching] = useState(false);
  const [cuddleSuccess, setCuddleSuccess] = useState(false);

  const handleMatchCompanion = () => {
    playSound("click");
    setIsMatching(true);
    setCuddleSuccess(false);

    setTimeout(() => {
      // Pick random mate from array
      const chosen = MATCHES[Math.floor(Math.random() * MATCHES.length)];
      setActiveMatch(chosen);
      setIsMatching(false);
      playSound("success");
      triggerToast(`🌠 【魂魄共鸣】星空连系完成！您的宝贝与【${chosen.name}】共鸣度高达 ${chosen.resonanceScore}%！`);
    }, 1500);
  };

  const handleCuddleAction = () => {
    if (!activeMatch) return;
    playSound("chime");
    setCuddleSuccess(true);
    onUpdateCoins(15);
    triggerToast(`🫂 【星光贴贴】大成功！${activePet?.name || "小宠物"} 与它的灵魂星伴 ${activeMatch.name} 亲热贴面滚在了一起，获得星尘币 +15 ✨`);
  };

  return (
    <div className="w-full bg-[#0a0614]/90 border border-purple-500/15 rounded-2xl p-5 relative overflow-hidden shadow-[0_12px_28px_rgba(0,0,0,0.45)]">
      {/* Visual Background decorative elements */}
      <div className="absolute top-0 left-0 w-24 h-24 rounded-full bg-cyan-500/5 blur-2xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-24 h-24 rounded-full bg-pink-500/5 blur-2xl pointer-events-none" />

      {/* Header bar area */}
      <div className="flex items-center justify-between pb-3 border-b border-white/5 mb-5 relative z-10">
        <div>
          <h4 className="text-sm font-bold text-white tracking-widest font-sans flex items-center gap-2">
            共鸣同伴星系 <span className="text-[10px] text-cyan-400 font-mono font-normal">Resonance Companion</span>
          </h4>
          <p className="text-[9px] text-gray-400 font-mono">寻找宿命中的星云玩伴契合共同翱翔</p>
        </div>
        <Users className="w-5 h-5 text-indigo-400 opacity-65" />
      </div>

      <div className="relative z-10">
        {activeMatch ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Left Box: Compatibility Profile Card */}
            <div className="space-y-4">
              <div className="bg-[#110c2c] border border-cyan-500/25 rounded-2xl p-4 relative shadow-[inset_0_1px_3px_rgba(0,0,0,0.4)]">
                {/* Resonance Score Badge */}
                <div className="absolute -top-3 -right-2 bg-gradient-to-r from-cyan-500 to-indigo-600 text-white font-mono font-bold text-[9px] px-3 py-1 rounded-full border border-cyan-400/40 flex items-center gap-1 shadow-lg">
                  <Flame className="w-3 h-3 text-[#ffbe0b] fill-[#ffbe0b] animate-pulse" />
                  <span>心灵共鸣度: {activeMatch.resonanceScore}%</span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-full bg-black/40 border border-white/10 flex items-center justify-center text-3xl select-none relative shadow-[0_0_15px_rgba(6,182,212,0.15)] shrink-0">
                    {activeMatch.icon}
                    <div 
                      className="absolute inset-0 rounded-full border border-cyan-400/30 animate-ping"
                      style={{ animationDuration: "3.5s" }}
                    />
                  </div>
                  <div>
                    <h5 className="text-[13px] font-bold text-white">
                      {activeMatch.name} <span className="text-[9px] font-mono font-normal text-indigo-300 bg-indigo-900/40 px-1.5 py-0.5 rounded border border-indigo-500/10 inline-block ml-1">{activeMatch.breed}</span>
                    </h5>
                    <p className="text-[8.5px] text-gray-500 font-mono mt-0.5">家长爸妈: {activeMatch.parentName}</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {activeMatch.personalityTags.map((t, idx) => (
                        <span key={idx} className="text-[8px] font-mono text-cyan-300 bg-cyan-500/10 border border-cyan-500/15 px-1.5 py-0.5 rounded">
                          #{t}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Greetings message box */}
                <div className="mt-3.5 bg-black/30 p-3 rounded-xl border border-white/5 relative leading-relaxed">
                  <p className="text-[10px] text-indigo-200 font-mono italic">
                    “{activeMatch.greetings}”
                  </p>
                </div>
              </div>

              {/* Match actions selection panel */}
              <div className="flex gap-2.5">
                <button
                  onClick={handleMatchCompanion}
                  disabled={isMatching}
                  className="px-3.5 py-2 bg-black/45 border border-white/10 hover:border-white/20 text-gray-400 hover:text-white rounded-lg text-[9px] font-mono flex items-center gap-1 transition-colors"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isMatching ? "animate-spin" : ""}`} />
                  重测共鸣契合
                </button>

                <button
                  onClick={handleCuddleAction}
                  disabled={cuddleSuccess}
                  className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1.5 transition-all ${
                    cuddleSuccess
                      ? "bg-emerald-600/25 border border-emerald-500/30 text-emerald-400 cursor-not-allowed"
                      : "bg-[#fc407a]/15 hover:bg-[#fc407a]/30 border border-[#fc407a]/30 text-pink-300 animate-pulse"
                  }`}
                >
                  <Heart className="w-3.5 h-3.5 fill-pink-400" />
                  {cuddleSuccess ? "已心灵贴贴联谊 (币+15)" : "模拟双宠大世界贴贴贴 (星尘币+15)"}
                </button>
              </div>
            </div>

            {/* Right Box: Simulation Graphic Animation of 2 cuddle pets */}
            <div className="bg-black/35 border border-white/5 rounded-xl p-4 flex flex-col justify-between items-center relative min-h-[180px]">
              {/* Back ambient grids */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(123,97,255,0.06)_0%,_transparent_75%)] pointer-events-none" />
              
              <div className="text-[8px] font-mono tracking-widest text-slate-500 uppercase z-10">
                ⭐ ASTROCADE 贴贴拟真互动空间
              </div>

              {/* Animation Stage */}
              <div className="relative w-full h-24 flex items-center justify-center gap-8">
                {/* User Pet */}
                <div className={`text-4xl select-none relative flex flex-col items-center ${cuddleSuccess ? "animate-bounce translate-x-4" : ""}`} style={{ animationDuration: "2s" }}>
                  <span>{activePet?.type.includes("猫") ? "🐱" : activePet?.type.includes("狗") ? "🐶" : "🐰"}</span>
                  <span className="text-[8px] font-mono text-gray-400 mt-1 uppercase leading-none">{activePet?.name || "我的小天神"}</span>
                  <div className="absolute bottom-[-6px] w-6 h-1 rounded-full bg-[#fc407a]/15 blur-[1px]" />
                </div>

                {/* Sparkling hearts animation */}
                <div className="flex flex-col items-center justify-center min-w-[20px]">
                  {cuddleSuccess ? (
                    <div className="flex flex-col gap-1 items-center animate-ping">
                      <Heart className="w-5 h-5 text-[#fc407a] fill-[#fc407a]" />
                      <Sparkles className="w-4 h-4 text-[#ffbe0b]" />
                    </div>
                  ) : (
                    <span className="text-gray-600 font-mono text-[9px] animate-pulse">---🪐---</span>
                  )}
                </div>

                {/* Companion Pet */}
                <div className={`text-4xl select-none relative flex flex-col items-center ${cuddleSuccess ? "animate-bounce -translate-x-4" : "translate-x-0"}`} style={{ animationDuration: "1.8s" }}>
                  <span>{activeMatch.icon}</span>
                  <span className="text-[8px] font-mono text-cyan-300 mt-1 uppercase leading-none">{activeMatch.name}</span>
                  <div className="absolute bottom-[-6px] w-6 h-1 rounded-full bg-cyan-400/15 blur-[1px]" />
                </div>
              </div>

              <div className="text-[7.5px] font-mono text-gray-500 text-center z-10 leading-normal max-w-xs uppercase">
                {cuddleSuccess 
                  ? "🌈 契约星能激荡！两只宝物散发粉色星尘粒子，友谊契约等级升华。"
                  : "💡 点击左侧【大世界贴贴】按钮。让两只小宠靠近撒娇翻滚，共同吸收散逸星塵能量！"
                }
              </div>
            </div>
          </div>
        ) : (
          <div className="p-6 flex flex-col items-center justify-center text-center max-w-md mx-auto">
            <Compass className="w-9 h-9 text-indigo-400/25 mb-2.5 animate-spin" style={{ animationDuration: "15s" }} />
            <h5 className="text-[11px] font-bold text-white tracking-widest uppercase mb-1">
              宇宙宿命匹配检测
            </h5>
            <p className="text-[9px] text-gray-500 leading-relaxed mb-4 font-mono">
              在大星空彼端，是否也有一只宝贝拥有和它完全契合的性格电波、生前爱玩相同的毛线团？点击开启引力扫描，连系它的灵魂同伴吧。
            </p>
            <button
              onClick={handleMatchCompanion}
              disabled={isMatching}
              className="px-5 py-2 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-600 hover:to-indigo-700 text-white font-mono text-[10px] font-bold tracking-widest rounded-xl transition-all shadow-[0_4px_12px_rgba(6,182,212,0.35)]"
            >
              {isMatching ? "🌌 高维量子重构匹配中..." : "🌌 开始引力扫描匹配灵魂同伴"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
