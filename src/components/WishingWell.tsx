import React, { useState } from "react";
import { Sparkles, Send, Coins, Compass, Heart, HeartOff, User, MessageCircle, HelpCircle } from "lucide-react";
import { playSound } from "./AudioSynth";

interface WishingWellProps {
  stardustCoins: number;
  onUpdateCoins: (amount: number) => void;
  triggerToast: (msg: string) => void;
  isGodMode: boolean;
}

interface WishBottle {
  id: string;
  senderName: string;
  petName: string;
  petType: string;
  message: string;
  blessingsCount: number;
  date: string;
}

// Warm, heart-touching preloaded bottles from other universe parents
const INITIAL_BOTTLES: WishBottle[] = [
  { id: "wb_1", senderName: "默默的麻麻", petName: "默默", petType: "狗", message: "默默，你在玫瑰星云公园要乖哦，再也不用打针啦。下辈子还要来做妈妈的小白兔！✨", blessingsCount: 42, date: "3分钟前" },
  { id: "wb_2", senderName: "猫冬爸", petName: "大福", petType: "猫", message: "大福，今天家里下了你最喜欢的金枪鱼罐头味小雨。第512天想你，等爸爸老了也买一张去星云的单程票去找你。🍂", blessingsCount: 156, date: "15分钟前" },
  { id: "wb_3", senderName: "小羽同学", petName: "啾啾", petType: "鸟", message: "啾啾，我们这边是夏天啦，你那边一直都是温度刚好的暖阳对不对？谢谢你在我最难熬的考博那年天天在我键盘上打瞌睡。❤️", blessingsCount: 89, date: "1小时前" },
  { id: "wb_4", senderName: "雪糕麻麻", petName: "雪糕", petType: "狗", message: "宝贝，我的新宝宝今天出生啦。我带她看了你的相框，她咯咯直笑。在星轨上滑行的时候注意安全哦！👼", blessingsCount: 63, date: "4小时前" },
  { id: "wb_5", senderName: "七七爸", petName: "糯米", petType: "兔", message: "糯米糯米！爸爸在双子座沙滩给你洒了大把大把甜苜蓿草！快去吃，别被别的小猫抢走啦。", blessingsCount: 37, date: "半天前" }
];

export default function WishingWell({ stardustCoins, onUpdateCoins, triggerToast, isGodMode }: WishingWellProps) {
  const [myWishText, setMyWishText] = useState("");
  const [bottles, setBottles] = useState<WishBottle[]>(INITIAL_BOTTLES);
  const [currentRetrieved, setCurrentRetrieved] = useState<WishBottle | null>(null);
  const [mySentWishes, setMySentWishes] = useState<WishBottle[]>([]);
  const [blessedIds, setBlessedIds] = useState<string[]>([]);
  const [isSpinningWell, setIsSpinningWell] = useState(false);

  const handleThrowWish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!myWishText.trim()) return;

    const cost = 200;
    if (stardustCoins < cost && !isGodMode) {
      playSound("beep");
      triggerToast("❌ 您的星尘币不足 200 点，无法兑换【星尘许愿币】来扔漂流瓶。可在上帝模式下一键充值！");
      return;
    }

    playSound("sparkle");
    if (!isGodMode) {
      onUpdateCoins(-cost);
    }

    const newBottle: WishBottle = {
      id: `wb_my_${Date.now()}`,
      senderName: "星之守护者 (您)",
      petName: "我的守护宠",
      petType: "小天神",
      message: myWishText,
      blessingsCount: 0,
      date: "刚刚"
    };

    setMySentWishes(prev => [newBottle, ...prev]);
    setMyWishText("");
    triggerToast("🌌 【温情流浪】您的思念之瓶已汇入星尘漩涡，在全银河星云漫游中...");
    
    // Simulating particle effect spin
    setIsSpinningWell(true);
    setTimeout(() => {
      setIsSpinningWell(false);
    }, 1800);
  };

  const handleRetrieveBottle = () => {
    playSound("bubble");
    setIsSpinningWell(true);
    
    setTimeout(() => {
      setIsSpinningWell(false);
      // Pick a random bottle ensuring we don't repeat the current one immediately if possible
      const filtered = bottles.filter(b => b.id !== currentRetrieved?.id);
      const chosen = filtered.length > 0 
        ? filtered[Math.floor(Math.random() * filtered.length)]
        : bottles[Math.floor(Math.random() * bottles.length)];
      
      setCurrentRetrieved(chosen);
      playSound("success");
      triggerToast(`🎣 成功捞起一枚来自【${chosen.senderName}】写给小宠【${chosen.petName}】的思念之瓶！`);
    }, 1200);
  };

  const handleBlessBottle = (bottleId: string) => {
    if (blessedIds.includes(bottleId)) return;

    playSound("success");
    setBlessedIds(p => [...p, bottleId]);
    
    // Feed reward loop (+10 coins) for empathy
    onUpdateCoins(10);
    
    // Increment count locally
    setBottles(prev => prev.map(b => b.id === bottleId ? { ...b, blessingsCount: b.blessingsCount + 1 } : b));
    if (currentRetrieved && currentRetrieved.id === bottleId) {
      setCurrentRetrieved(prev => prev ? { ...prev, blessingsCount: prev.blessingsCount + 1 } : null);
    }
    
    triggerToast("💖 发出了一份【宇宙温柔拥抱】祝福！因传递爱意，获得星尘币 +10 ✨");
  };

  return (
    <div className="w-full bg-[#110c2c]/85 border border-[#fc407a]/20 rounded-2xl p-5 relative overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.5)]">
      {/* Decorative starry vortex backing */}
      <div className={`absolute top-0 right-0 w-36 h-36 rounded-full bg-gradient-to-tr from-purple-500/10 to-pink-500/5 blur-2xl pointer-events-none transition-transform duration-[2000ms] ${isSpinningWell ? "rotate-[360deg] scale-125" : ""}`} />

      <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/5 relative z-10">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-pink-500/20 flex items-center justify-center text-md animate-pulse">
            🪐
          </div>
          <div>
            <h4 className="text-sm font-bold text-white tracking-widest font-sans flex items-center gap-1.5">
              星尘许愿池 <span className="text-[10px] text-pink-300 font-mono font-normal">Wishing Well</span>
            </h4>
            <p className="text-[9px] text-gray-400 font-mono">星系各端的眷恋在此回响共鸣</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-pink-400 bg-pink-500/10 border border-pink-500/20 px-2.5 py-0.5 rounded-full flex items-center gap-1">
            <Coins className="w-3 h-3 text-orange-400" />
            思念瓶费用: {isGodMode ? "免费/上帝特权" : "200 星尘币/次"}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
        {/* Left column: Throw input */}
        <div className="space-y-4">
          <form onSubmit={handleThrowWish} className="space-y-3">
            <div className="text-[11px] text-slate-300 flex items-center gap-1">
              <Send className="w-3.5 h-3.5 text-pink-400" /> 写给天堂彼端小宝贝的悄悄话：
            </div>
            <div className="relative">
              <textarea
                value={myWishText}
                onChange={(e) => setMyWishText(e.target.value)}
                maxLength={90}
                required
                placeholder="例如：糯米，在银河小镇要好好睡觉哦，妈妈今天给你种了新的小麦草，风吹向星轨的时候，你一定能闻到甜甜的味道对不对..."
                className="w-full h-24 bg-black/45 border border-white/10 rounded-xl p-3 text-[11px] text-indigo-100 placeholder:text-gray-500 focus:outline-none focus:border-pink-500/40 focus:ring-1 focus:ring-pink-500/20 leading-relaxed resize-none custom-scrollbar"
              />
              <span className="absolute bottom-2.5 right-3 text-[8.5px] font-mono text-gray-500">
                {myWishText.length}/90 字符
              </span>
            </div>
            
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-pink-500 to-[#fc407a] hover:from-pink-600 hover:to-[#eb316c] text-white py-2 rounded-lg text-[11px] font-bold transition-all shadow-[0_4px_12px_rgba(252,64,122,0.3)] flex items-center justify-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              投递【星心漂流瓶】到星域
            </button>
          </form>

          {/* List of my thrown wishes */}
          {mySentWishes.length > 0 && (
            <div className="space-y-2">
              <div className="text-[10px] font-mono text-purple-300">📬 我的流浪星瓶 ({mySentWishes.length}) :</div>
              <div className="max-h-24 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
                {mySentWishes.map((w, idx) => (
                  <div key={idx} className="bg-white/[0.02] border border-white/5 rounded-lg p-2 text-[10px] text-gray-400 hover:border-pink-500/10 transition-colors">
                    <div className="flex items-center justify-between font-mono text-[8px] text-gray-500 mb-0.5">
                      <span>🐾 飘往仙女座之桥</span>
                      <span>{w.date}</span>
                    </div>
                    <p className="italic leading-normal text-slate-300">“{w.message}”</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right column: Retrieve wishing bottles with Empathy reward cycle */}
        <div className="bg-[#0b071a]/80 rounded-xl p-4 border border-white/5 flex flex-col justify-between min-h-[220px]">
          {currentRetrieved ? (
            <div className="space-y-3 flex-1 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-1.5 border-b border-white/5 mb-2">
                  <div className="flex items-center gap-1">
                    <span className="text-[11px] font-bold text-cyan-300 font-sans flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-gray-400" />
                      {currentRetrieved.senderName} 
                    </span>
                    <span className="text-[8.5px] text-slate-500 font-mono">寄予 💎【{currentRetrieved.petName}】</span>
                  </div>
                  <span className="text-[8px] font-mono text-gray-500">{currentRetrieved.date}</span>
                </div>
                
                {/* Message body */}
                <div className="bg-black/30 p-3 rounded-lg border border-pink-500/5 relative">
                  <span className="absolute -top-2 left-2 text-md text-pink-500/25 italic">“</span>
                  <p className="text-[11px] text-indigo-100 font-serif leading-relaxed italic pr-2">
                    {currentRetrieved.message}
                  </p>
                </div>
              </div>

              {/* Action: Send Blessing */}
              <div className="pt-2 flex items-center justify-between border-t border-white/5 mt-3">
                <button
                  onClick={() => handleBlessBottle(currentRetrieved.id)}
                  disabled={blessedIds.includes(currentRetrieved.id)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1.5 transition-all ${
                    blessedIds.includes(currentRetrieved.id)
                      ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400"
                      : "bg-[#fc407a]/15 hover:bg-[#fc407a]/30 border border-[#fc407a]/30 text-pink-300 animate-pulse"
                  }`}
                >
                  <Heart className={`w-3.5 h-3.5 ${blessedIds.includes(currentRetrieved.id) ? "fill-emerald-400" : "fill-pink-400"}`} />
                  {blessedIds.includes(currentRetrieved.id) ? "已传递温暖" : "投喂思念拥抱 (+10⭐)"}
                </button>

                <div className="text-[9px] font-mono text-gray-500">
                  💖 已收到 <span className="text-pink-400 font-bold">{currentRetrieved.blessingsCount}</span> 位守望者拥抱
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
              <Compass className="w-8 h-8 text-indigo-400/30 mb-2 animate-spin" style={{ animationDuration: "12s" }} />
              <h5 className="text-[11px] font-bold text-white tracking-widest uppercase mb-1">
                思念星海钓筒
              </h5>
              <p className="text-[9px] text-gray-500 max-w-xs leading-normal">
                无数爱宠父母在小巢各端留下的思念流淌在真空中。点击下方按钮捞取一颗回荡的瓶子，用拥抱温暖他们吧。
              </p>
            </div>
          )}

          <div className="mt-4 pt-2.5 border-t border-white/5">
            <button
              onClick={handleRetrieveBottle}
              disabled={isSpinningWell}
              className="w-full bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/30 text-indigo-300 py-1.5 rounded-lg text-[10px] font-bold font-mono transition-colors uppercase flex items-center justify-center gap-1"
            >
              {isSpinningWell ? (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping mr-1" />
                  星尘捕捞网降射中...
                </>
              ) : (
                <>
                  🎣 抛线捞取【流淌思念瓶】
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
