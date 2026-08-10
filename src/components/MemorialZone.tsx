import React, { useState } from "react";
import { Sparkles, Flower, Star, Heart, Edit3, Calendar, PlusCircle, CheckCircle2, Eye, Award } from "lucide-react";
import { PetConfig } from "../types";
import { playSound } from "./AudioSynth";

interface MemorialZoneProps {
  activePet: PetConfig | null;
  onGrantCoins: (amount: number) => void;
  triggerToast: (msg: string) => void;
}

interface MemorialStone {
  id: string;
  petName: string;
  breed: string;
  passingDate: string;
  parentName: string;
  eulogy: string;
  tributesCount: number;
  flamePulse: boolean;
  fruitsFed: number;
}

const SAMPLE_SHRINES: MemorialStone[] = [
  { id: "ms_1", petName: "毛球", breed: "卷耳猫", passingDate: "2024-05-12", parentName: "默默的麻麻", eulogy: "毛球，你在织女星小镇过得好吗？谢谢你用十年的呼噜声驱散了深夜的所有阴霾。我会早起好好吃饭的。", tributesCount: 231, flamePulse: true, fruitsFed: 54 },
  { id: "ms_2", petName: "哈奇", breed: "哈士奇", passingDate: "2025-01-08", parentName: "哈爸", eulogy: "再也听不到你啃坏拖鞋时的嗷嗷叫了，家室里突然好安静。在彗尾跑道跑慢一点，别再撞着陨石喽！", tributesCount: 189, flamePulse: true, fruitsFed: 42 },
  { id: "ms_3", petName: "米娜", breed: "折耳猫", passingDate: "2023-11-20", parentName: "Luna娜娜", eulogy: "小胖咪，两周年啦。妈妈又给你扎了你喜欢的纸线团。在星空之桥的彼端也要威风凛凛地巡逻哦！", tributesCount: 405, flamePulse: false, fruitsFed: 95 },
  { id: "ms_4", petName: "皮皮", breed: "金毛犬", passingDate: "2025-04-15", parentName: "皮皮大队长", eulogy: "皮皮，你是世界上最棒的狗狗。最后一次闭眼的时候你还冲我摇了尾巴，谢谢你留给我的全部治愈。爸想你。", tributesCount: 112, flamePulse: true, fruitsFed: 19 }
];

export default function MemorialZone({ activePet, onGrantCoins, triggerToast }: MemorialZoneProps) {
  const [shrines, setShrines] = useState<MemorialStone[]>(SAMPLE_SHRINES);
  const [activeStoneId, setActiveStoneId] = useState<string | null>(SAMPLE_SHRINES[0].id);
  const [isRegistering, setIsRegistering] = useState(false);
  const [customEulogy, setCustomEulogy] = useState("");

  const handleTributeFlower = (id: string) => {
    playSound("sparkle");
    setShrines(prev => prev.map(s => {
      if (s.id === id) {
        return { ...s, tributesCount: s.tributesCount + 1 };
      }
      return s;
    }));
    onGrantCoins(10);
    triggerToast("🌼 您献上了一束【星尘白菊】以致敬缅怀！赠予您星尘币 +10 ✨");
  };

  const handleTributeStarFruit = (id: string) => {
    playSound("success");
    setShrines(prev => prev.map(s => {
      if (s.id === id) {
        return { ...s, fruitsFed: s.fruitsFed + 1, tributesCount: s.tributesCount + 2 };
      }
      return s;
    }));
    onGrantCoins(20);
    triggerToast("🍒 您供奉了一枚【星河仙果】传递温暖！赠予您星尘币 +20 🍒");
  };

  const handleRegisterActivePet = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePet) return;

    if (shrines.some(s => s.petName === activePet.name)) {
      triggerToast("📌 【星碑守护】您的爱宠名册中此宝贝已拥有专属永恒星碑，无需重复登录。");
      setIsRegistering(false);
      return;
    }

    playSound("chime");
    const newStone: MemorialStone = {
      id: `ms_registered_${Date.now()}`,
      petName: activePet.name,
      breed: activePet.breed,
      passingDate: activePet.passingDate || "踏彩虹桥之日",
      parentName: "星之守护者 (您)",
      eulogy: customEulogy || `“${activePet.name}在遥远的喵汪星轨里继续快乐奔跑，你是爸爸妈妈永恒的星尘骄傲。”`,
      tributesCount: 1,
      flamePulse: true,
      fruitsFed: 0
    };

    setShrines(prev => [newStone, ...prev]);
    setActiveStoneId(newStone.id);
    setIsRegistering(false);
    setCustomEulogy("");
    triggerToast("✨ 【星碑筑成】成功为爱宠在银河永恒星碑区立下光能纪念碑！");
  };

  const selectedStone = shrines.find(s => s.id === activeStoneId) || shrines[0];

  return (
    <div className="w-full bg-[#0a0614]/90 border border-purple-500/15 rounded-2xl p-5 relative shadow-[0_12px_28px_rgba(0,0,0,0.45)]">
      {/* Visual Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-3 border-b border-white/5 mb-5 relative z-10">
        <div>
          <h4 className="text-sm font-bold text-white tracking-widest font-sans flex items-center gap-2">
            永恒纪念碑星区 <span className="text-[10px] text-purple-400 font-mono font-normal">Eternal Monuments</span>
          </h4>
          <p className="text-[9px] text-gray-400 font-mono">在此悼念、致敬，为各守护天神洒下不熄之光</p>
        </div>
        
        {activePet && (
          <button
            onClick={() => {
              playSound("bubble");
              setIsRegistering(true);
            }}
            className="px-3.5 py-1.5 bg-gradient-to-r from-purple-600/30 to-purple-500/20 hover:from-purple-600 hover:to-purple-500 text-purple-300 hover:text-white border border-purple-500/30 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            为【{activePet.name}】建立永动星碑
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
        {/* Left Side: Monuments list card (Vertical Columns) */}
        <div className="md:col-span-1 space-y-2 max-h-[340px] overflow-y-auto pr-1 custom-scrollbar">
          <div className="text-[9px] font-mono tracking-widest text-[#7B61FF] mb-1.5 uppercase">
            🌟 织女星网格星脉碑座 ({shrines.length}):
          </div>
          {shrines.map(stone => {
            const isActive = stone.id === activeStoneId;
            return (
              <button
                key={stone.id}
                onClick={() => {
                  setActiveStoneId(stone.id);
                  playSound("click");
                }}
                className={`w-full text-left p-3 rounded-xl border transition-all flex items-center gap-3 relative ${
                  isActive
                    ? "bg-purple-900/25 border-purple-500 shadow-[inset_0_1px_4px_rgba(255,255,255,0.05),0_0_10px_rgba(123,97,255,0.15)]"
                    : "bg-black/30 hover:bg-black/60 border-white/5 text-gray-400"
                }`}
              >
                {/* 3D Voxel style tombstone representation in micro form */}
                <div className="w-9 h-11 bg-slate-800 rounded-t-lg border-t-2 border-slate-500/40 relative flex flex-col items-center justify-between py-1 shadow-inner shrink-0 leading-none">
                  <span className="text-[6.5px] font-bold font-mono text-slate-400">{stone.petName[0]}</span>
                  <div className="flex items-center gap-0.5 pb-0.5 justify-center">
                    {/* Flame pulse icon */}
                    <span className={`w-1.5 h-1.5 rounded-full ${stone.flamePulse ? "bg-amber-400 animate-ping" : "bg-gray-600"}`} />
                    <span className={`absolute w-1 h-1.5 bg-amber-500 rounded-full ${stone.flamePulse ? "animate-pulse" : ""}`} />
                  </div>
                </div>

                <div className="flex-1 overflow-hidden">
                  <div className="flex items-center justify-between text-[11px] font-bold text-white leading-none">
                    <span className="truncate">{stone.petName}</span>
                    <span className="text-[8px] font-mono font-normal text-slate-500">{stone.passingDate.slice(0, 7)}桥</span>
                  </div>
                  <p className="text-[9px] text-indigo-300 font-mono mt-1 leading-none">{stone.breed}</p>
                  <p className="text-[8px] text-gray-500 truncate mt-1 leading-none">家长: {stone.parentName}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Right Side: Detailed Tribute viewport and controls */}
        <div className="md:col-span-2 bg-[#090514]/90 rounded-2xl p-5 border border-white/5 flex flex-col justify-between min-h-[320px]">
          {selectedStone ? (
            <div className="space-y-4 flex-1 flex flex-col justify-between">
              <div className="space-y-3">
                {/* Visual Top details */}
                <div className="flex items-start justify-between">
                  <div>
                    <h5 className="text-lg font-bold tracking-widest text-[#fc407a] drop-shadow-[0_0_8px_rgba(252,64,122,0.4)] flex items-center gap-1.5 leading-none">
                      🕊️ {selectedStone.petName} 之碑 · 永恒殿堂 
                    </h5>
                    <div className="flex items-center gap-2 mt-2 text-[10px] text-indigo-300 font-mono">
                      <span>🎂 品种: {selectedStone.breed}</span>
                      <span>•</span>
                      <span>📅 踏桥日: {selectedStone.passingDate}</span>
                    </div>
                  </div>
                  
                  {/* Memorial Active Ribbon */}
                  <span className="px-2.5 py-0.5 bg-purple-500/10 border border-purple-500/20 text-purple-300 rounded text-[9px] font-mono tracking-tighter uppercase flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#fc407a] animate-ping" />
                    星台祭奠
                  </span>
                </div>

                {/* Parent Eulogy Text Board */}
                <div className="bg-[#110c2c] border-l-4 border-[#fc407a] rounded-r-xl p-4 relative shadow-[inset_0_1px_3px_rgba(0,0,0,0.4)]">
                  <span className="absolute top-2 left-2 text-2xl text-purple-500/15 italic font-serif">“</span>
                  <p className="text-xs text-indigo-100 font-serif leading-relaxed italic relative z-10 pl-2">
                    {selectedStone.eulogy}
                  </p>
                  <div className="text-right text-[9px] text-gray-500 font-mono mt-2 pr-2">
                    —— 家长爸爸妈妈：{selectedStone.parentName} 执笔思念
                  </div>
                </div>

                {/* Current tribute stats visual grids */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="bg-black/40 border border-white/5 rounded-xl p-2 px-3 text-center flex items-center justify-between">
                    <span className="text-[10px] text-gray-400">🌼 已收星迹白菊</span>
                    <span className="text-xs font-mono font-bold text-yellow-400">{selectedStone.tributesCount} 朵</span>
                  </div>
                  <div className="bg-black/40 border border-white/5 rounded-xl p-2 px-3 text-center flex items-center justify-between">
                    <span className="text-[10px] text-gray-400">🍒 已奉养群星仙果</span>
                    <span className="text-xs font-mono font-bold text-pink-400">{selectedStone.fruitsFed} 颗</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons: Tribute options */}
              <div className="pt-4 border-t border-white/5 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => handleTributeFlower(selectedStone.id)}
                  className="flex-1 bg-yellow-500/10 hover:bg-yellow-500/25 border border-yellow-500/30 text-yellow-300 py-2.5 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all"
                >
                  <Flower className="w-4 h-4" />
                  献上星光白菊纪念 (星尘币 +10)
                </button>

                <button
                  onClick={() => handleTributeStarFruit(selectedStone.id)}
                  className="flex-1 bg-pink-500/15 hover:bg-pink-500/35 border border-pink-500/30 text-pink-300 py-2.5 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all animate-pulse"
                >
                  <Star className="w-4 h-4 fill-pink-300" />
                  供奉仙星果实追忆 (星尘币 +20)
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <Eye className="w-8 h-8 text-gray-500/30 mb-2" />
              <p className="text-xs text-gray-400">暂无选定的星碑细节，点击左侧挑选进行拜祭烛送吧。</p>
            </div>
          )}
        </div>
      </div>

      {/* Monument Registration Pop-up Modal */}
      {isRegistering && activePet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md select-none animate-fade-in">
          <div className="relative w-full max-w-lg bg-[#0e0a1f] border border-purple-500/35 rounded-2xl p-6 shadow-[0_0_35px_rgba(123,97,255,0.4)]">
            <h3 className="text-sm font-bold text-white mb-2 tracking-widest flex items-center gap-1.5 font-sans">
              👑 永久登录：新立皇家爱宠星碑
            </h3>
            <p className="text-[10px] text-gray-400 leading-normal mb-4 font-mono">
              您可以将当前守护神【{activePet.name}】登录至永久星碑公墓区。立碑后，来自其他千百名守护大世界的看星人均可在此向它致敬、供菊，每天都会产生自发的温情守护金币回馈。
            </p>

            <form onSubmit={handleRegisterActivePet} className="space-y-4">
              <div className="space-y-2">
                <div className="text-[10px] font-mono text-purple-300 flex items-center gap-1">
                  <Edit3 className="w-3.5 h-3.5 text-pink-400" /> 撰写铭刻碑文 (思思念念之语) :
                </div>
                <textarea
                  value={customEulogy}
                  onChange={(e) => setCustomEulogy(e.target.value)}
                  maxLength={110}
                  required
                  placeholder="例如：毛球，谢谢你陪过我的那段阴郁冬天。你在彩虹桥那边好好的，多长草，少贪凉，要听银河图书馆张馆长的话哦。下辈子我们还要做最好的家人..."
                  className="w-full h-24 bg-black/50 border border-white/10 rounded-xl p-3 text-[11px] text-indigo-100 placeholder:text-gray-600 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 leading-relaxed resize-none custom-scrollbar"
                />
                <span className="block text-right text-[8.5px] font-mono text-gray-500 mt-1">
                  {customEulogy.length}/110 字符
                </span>
              </div>

              <div className="flex gap-3 justify-end pt-2 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setIsRegistering(false)}
                  className="px-3.5 py-1.5 bg-black/35 hover:bg-black/60 border border-white/10 rounded-lg text-[10px] text-gray-400 font-bold transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  镌刻立碑并公开展示
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
