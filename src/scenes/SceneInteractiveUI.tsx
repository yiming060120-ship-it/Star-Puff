import React, { useState, useEffect } from 'react';
import { Sparkles, Sprout, Droplets, Store, BookOpen, Shell, Map as MapIcon, Crown, Clock, Zap, Coffee, Flame, Moon, Sun, Book, ArrowRight, Compass, Shield, Scissors } from 'lucide-react';
import { playSound } from '../audio/AudioSynth';

interface SceneInteractiveUIProps {
  sceneId: string;
  addLog: (msg: string) => void;
  onGrantCoins: (amount: number) => void;
  onSpendCoins?: (amount: number) => boolean; // 返回是否扣款成功（余额不足返回 false）
  initialCoins?: number;
}

export const SceneInteractiveUI: React.FC<SceneInteractiveUIProps> = ({ sceneId, addLog, onGrantCoins, onSpendCoins, initialCoins }) => {
  const [coins, setCoins] = useState(initialCoins ?? 100);
  
  // === ROSE PARK (Farming & Harvesting) ===
  const [bed, setBed] = useState<{type: string, state: number, time: number}[]>(Array(6).fill({type: 'none', state: 0, time: 0}));
  const [inventory, setInventory] = useState({ roseSeed: 5, starSeed: 2, magicWater: 3, flowers: 0 });
  const [activeSeed, setActiveSeed] = useState<'roseSeed'|'starSeed'|null>('roseSeed');

  const plantSeed = (idx: number) => {
    if (bed[idx].state === 0 && activeSeed && inventory[activeSeed] > 0) {
      const newBed = [...bed];
      newBed[idx] = { type: activeSeed, state: 1, time: Date.now() };
      setBed(newBed);
      setInventory(prev => ({ ...prev, [activeSeed]: prev[activeSeed] - 1 }));
      addLog(`🌸 种下了${activeSeed === 'roseSeed' ? '玫瑰' : '星光'}种子`);
      playSound("click");
    } else if (bed[idx].state === 3) {
      // Harvest
      const newBed = [...bed];
      const type = newBed[idx].type;
      newBed[idx] = { type: 'none', state: 0, time: 0 };
      setBed(newBed);
      
      const reward = type === 'roseSeed' ? 10 : 30;
      setCoins(c => c + reward);
      onGrantCoins(reward);
      setInventory(prev => ({ ...prev, flowers: prev.flowers + 1 }));
      addLog(`✨ 收获了盛开的花朵！获得 ${reward} 星尘币`);
      playSound("chime");
    }
  };

  const waterSpecific = (idx: number) => {
    if (bed[idx].state === 1 || bed[idx].state === 2) {
      if (inventory.magicWater > 0) {
        const newBed = [...bed];
        newBed[idx] = { ...newBed[idx], state: newBed[idx].state + 1 };
        setBed(newBed);
        setInventory(prev => ({ ...prev, magicWater: prev.magicWater - 1 }));
        addLog("💧 使用了魔法泉水，植物瞬间长大了！");
        playSound("click");
      } else {
        addLog("⚠️ 没有魔法泉水了！");
      }
    }
  };

  // === VEGA TOWN (Baking & Shop Management) ===
  const [shopLevel, setShopLevel] = useState(1);
  const [breads, setBreads] = useState({ croissant: 0, starCake: 0 });
  const [bakingTask, setBakingTask] = useState<{type: string, timeLeft: number} | null>(null);

  useEffect(() => {
    if (!bakingTask) return;
    const interval = setInterval(() => {
      setBakingTask(prev => {
        if (!prev) return null;
        if (prev.timeLeft <= 1) {
          setBreads(b => ({ ...b, [prev.type]: b[prev.type as keyof typeof b] + 1 }));
          addLog(`🍞 ${prev.type === 'croissant' ? '星空牛角包' : '星云蛋糕'} 烘焙完成！`);
          playSound("chime");
          return null;
        }
        return { ...prev, timeLeft: prev.timeLeft - 1 };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [bakingTask, addLog]);

  const startBaking = (type: 'croissant' | 'starCake') => {
    if (bakingTask) return addLog("⚠️ 烤箱正在使用中！");
    if (type === 'starCake' && shopLevel < 2) return addLog("⚠️ 商店需要达到2级才能制作蛋糕！");
    setBakingTask({ type, timeLeft: type === 'croissant' ? 5 : 10 });
    addLog(`🔥 开始烘焙 ${type === 'croissant' ? '牛角包' : '蛋糕'}...`);
    playSound("click");
  };

  const sellGoods = () => {
    let total = 0;
    if (breads.croissant > 0) total += breads.croissant * 15;
    if (breads.starCake > 0) total += breads.starCake * 40;
    
    if (total > 0) {
      setCoins(c => c + total);
      onGrantCoins(total);
      setBreads({ croissant: 0, starCake: 0 });
      addLog(`💰 卖出了所有糕点，获得 ${total} 星尘币！`);
      playSound("sparkle");
    } else {
      addLog("ℹ️ 货架上没有糕点可卖，快去烘焙吧！");
    }
  };

  const upgradeShop = () => {
    if (shopLevel >= 2) return addLog("ℹ️ 商店已满级！");
    if (coins < 200) {
      addLog("⚠️ 星尘币不足，需要 200 星尘币升级。");
      playSound("beep");
      return;
    }
    // 同步扣全局星尘币
    if (onSpendCoins && !onSpendCoins(200)) {
      addLog("⚠️ 星尘币不足，需要 200 星尘币升级。");
      playSound("beep");
      return;
    }
    setCoins(c => c - 200);
    setShopLevel(2);
    addLog("🎊 花费 200 星尘币，商店升级成功！解锁新食谱！");
    playSound("chime");
  };

  // === COMET TRACK (Pet Training & Racing) ===
  const [petStats, setPetStats] = useState({ speed: 10, stamina: 10 });
  const [raceActive, setRaceActive] = useState(false);

  const trainPet = (stat: 'speed' | 'stamina') => {
    if (coins < 20) {
      addLog("⚠️ 星尘币不足 20，无法进行训练。");
      playSound("beep");
      return;
    }
    // 同步扣全局星尘币
    if (onSpendCoins && !onSpendCoins(20)) {
      addLog("⚠️ 星尘币不足，无法进行训练。");
      playSound("beep");
      return;
    }
    setCoins(c => c - 20);
    setPetStats(prev => ({ ...prev, [stat]: prev[stat] + Math.floor(Math.random() * 3) + 1 }));
    addLog(`🏃 训练结束！宠物消耗 20 币，${stat === 'speed' ? '速度' : '耐力'}提升了！`);
    playSound("click");
  };

  const enterRace = () => {
    if (raceActive) return;
    setRaceActive(true);
    addLog("🏁 彗星杯竞速赛正式开始！");
    playSound("click");
    
    setTimeout(() => {
      setRaceActive(false);
      const score = (petStats.speed * 1.5) + petStats.stamina + (Math.random() * 10);
      if (score > 40) {
        setCoins(c => c + 100);
        onGrantCoins(100);
        addLog("🏆 你的宠物获得了冠军！奖励 100 星尘币！");
        playSound("chime");
      } else if (score > 25) {
        setCoins(c => c + 30);
        onGrantCoins(30);
        addLog("🥈 你的宠物获得了亚军！奖励 30 星尘币。");
      } else {
        addLog("💨 你的宠物未能进入前三，继续训练吧！");
      }
    }, 5000);
  };

  // === LIBRARY (Research & Archive) ===
  const [researchPoints, setResearchPoints] = useState(0);
  const [unlockedLore, setUnlockedLore] = useState<string[]>([]);

  const readBook = () => {
    addLog("📖 正在翻阅古老的星际文献...");
    setTimeout(() => {
      const points = Math.floor(Math.random() * 5) + 2;
      setResearchPoints(rp => rp + points);
      addLog(`💡 获得了 ${points} 点研究点数！`);
      playSound("click");
    }, 2000);
  };

  const unlockLore = () => {
    if (researchPoints < 20) {
      addLog("⚠️ 需要 20 点研究点数才能解锁秘闻。");
      return;
    }
    const lorePieces = ["星尘的起源是远古超新星的叹息。", "双子座沙滩的沙子其实是碎裂的时空结晶。", "森林深处沉睡着第一代星际漫游者。"];
    // 先找出尚未解锁的秘闻，避免「扣点但无产出」
    const lockedLore = lorePieces.filter(l => !unlockedLore.includes(l));
    if (lockedLore.length === 0) {
      addLog("📚 所有秘闻都已解锁完毕啦！");
      playSound("click");
      return;
    }
    const newLore = lockedLore[0];
    setResearchPoints(rp => rp - 20);
    setUnlockedLore([...unlockedLore, newLore]);
    addLog(`📜 解锁了新的世界秘闻：${newLore}`);
    playSound("chime");
  };

  return (
    <div className="w-full bg-[#140e30]/85 border border-indigo-400/25 rounded-2xl p-4 backdrop-blur-md mt-4 shadow-[0_8px_30px_rgba(0,0,0,0.4)]">
      {/* Universal Header */}
      <div className="flex items-center justify-between border-b border-indigo-400/20 pb-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/15 border border-indigo-400/30 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-indigo-300" />
          </div>
          <h3 className="text-sm font-bold text-white tracking-wide font-sans">
            {sceneId === 'rose' && "星云花圃"}
            {sceneId === 'vega' && "星尘面包店"}
            {sceneId === 'comet' && "彗星竞速中心"}
            {sceneId === 'library' && "银河图书馆"}
            {sceneId === 'gemini' && "双子座海滨浴场"}
            {sceneId === 'andromeda' && "仙女座祈福喷泉"}
            {sceneId === 'orion' && "猎户座秘境探险"}
          </h3>
        </div>
        <div className="flex items-center gap-2 bg-black/40 border border-white/10 rounded-full px-3 py-1.5">
           <Sparkles className="w-3.5 h-3.5 text-amber-300" />
           <span className="text-sm font-bold text-amber-300 font-sans">{coins}</span>
           <span className="text-[10px] text-white/40">星尘币</span>
        </div>
      </div>

      {/* SCENE: ROSE PARK */}
      {sceneId === 'rose' && (
        <div className="flex gap-6">
          <div className="flex-1 bg-black/40 rounded-lg p-4 border border-white/5">
             <div className="text-xs text-white/50 mb-2">花园土地 (点击播种/收获，多次点击可浇水)</div>
             <div className="grid grid-cols-3 gap-2">
                {bed.map((slot, idx) => (
                  <div key={idx} onClick={() => slot.state === 0 || slot.state === 3 ? plantSeed(idx) : waterSpecific(idx)} className="h-16 bg-white/5 border border-white/10 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-white/10 transition-colors relative overflow-hidden group">
                    {slot.state === 0 && <span className="text-white/20 text-[10px]">空地</span>}
                    {slot.state === 1 && <span className="text-xl">🌱</span>}
                    {slot.state === 2 && <span className="text-2xl">🌿</span>}
                    {slot.state === 3 && <span className="text-3xl drop-shadow-[0_0_8px_rgba(255,105,180,0.8)] animate-pulse">{slot.type === 'roseSeed' ? '🌹' : '🌟'}</span>}
                    
                    {slot.state > 0 && slot.state < 3 && (
                       <div className="absolute inset-0 bg-blue-500/20 opacity-0 group-hover:opacity-100 flex items-center justify-center backdrop-blur-sm transition-all">
                          <Droplets className="w-4 h-4 text-blue-300" />
                       </div>
                    )}
                  </div>
                ))}
             </div>
          </div>
          <div className="w-48 flex flex-col gap-3">
             <div className="bg-black/40 rounded-lg p-3 border border-white/5">
                <div className="text-xs text-white/50 mb-2">背包库存</div>
                <div className="text-xs text-pink-300 flex justify-between cursor-pointer hover:text-pink-200" onClick={() => setActiveSeed('roseSeed')}>
                  <span>🌹 玫瑰种子</span>
                  <span className={activeSeed === 'roseSeed' ? 'font-bold underline' : ''}>x{inventory.roseSeed}</span>
                </div>
                <div className="text-xs text-yellow-300 flex justify-between cursor-pointer hover:text-yellow-200 mt-1" onClick={() => setActiveSeed('starSeed')}>
                  <span>🌟 星光种子</span>
                  <span className={activeSeed === 'starSeed' ? 'font-bold underline' : ''}>x{inventory.starSeed}</span>
                </div>
                <div className="text-xs text-blue-300 flex justify-between mt-1">
                  <span>💧 魔法泉水</span>
                  <span>x{inventory.magicWater}</span>
                </div>
             </div>
             <button
               onClick={() => {
                 // 补充种子和泉水，让花园玩法可以持续
                 setInventory(prev => ({ ...prev, roseSeed: prev.roseSeed + 5, starSeed: prev.starSeed + 2, magicWater: prev.magicWater + 3 }));
                 addLog("🛒 补充了玫瑰种子 x5、星光种子 x2、魔法泉水 x3！");
                 playSound("sparkle");
               }}
               className="py-2 bg-gradient-to-r from-pink-500/20 to-purple-500/20 hover:from-pink-500/40 hover:to-purple-500/40 border border-pink-500/50 rounded-lg text-xs font-bold text-pink-200 transition-all hover:scale-105 active:scale-95"
             >
               领取免费物资
             </button>
          </div>
        </div>
      )}

      {/* SCENE: VEGA TOWN */}
      {sceneId === 'vega' && (
        <div className="flex gap-6">
           <div className="flex-1 bg-black/40 rounded-lg p-4 border border-white/5">
              <div className="flex justify-between items-center mb-4">
                 <div className="text-sm font-bold text-orange-400 flex items-center gap-2 font-sans"><Store className="w-4 h-4"/> 烘焙坊 · {shopLevel} 级</div>
                 {shopLevel < 2 && <button onClick={upgradeShop} className="text-xs bg-yellow-500/20 hover:bg-yellow-500/40 text-yellow-300 px-2.5 py-1 rounded-full border border-yellow-500/50 transition-colors">200 币升级</button>}
              </div>
              <div className="flex gap-4">
                 <button onClick={() => startBaking('croissant')} disabled={!!bakingTask} className="flex-1 py-4 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 rounded-xl flex flex-col items-center justify-center gap-2 disabled:opacity-50 transition-all hover:scale-[1.03] active:scale-95">
                    <span className="text-2xl">🥐</span>
                    <span className="text-xs text-orange-200">制作牛角包 (5s)</span>
                 </button>
                 <button onClick={() => startBaking('starCake')} disabled={!!bakingTask || shopLevel < 2} className="flex-1 py-4 bg-fuchsia-500/10 hover:bg-fuchsia-500/20 border border-fuchsia-500/30 rounded-xl flex flex-col items-center justify-center gap-2 disabled:opacity-50 transition-all hover:scale-[1.03] active:scale-95 relative">
                    {shopLevel < 2 && <div className="absolute top-1 right-2 text-[10px] text-red-400">需 2 级</div>}
                    <span className="text-2xl">🍰</span>
                    <span className="text-xs text-fuchsia-200">制作星云蛋糕 (10s)</span>
                 </button>
              </div>
              {bakingTask && (
                 <div className="mt-4 bg-white/5 rounded-lg p-2 flex items-center gap-3">
                    <Flame className="w-4 h-4 text-orange-500 animate-pulse" />
                    <div className="flex-1 h-2 bg-black rounded-full overflow-hidden">
                       <div className="h-full bg-orange-500 transition-all duration-1000 ease-linear" style={{ width: `${((bakingTask.timeLeft === 10 ? 10 : 5 - bakingTask.timeLeft) / (bakingTask.type === 'croissant' ? 5 : 10)) * 100}%` }} />
                    </div>
                    <span className="text-xs text-white/50">{bakingTask.timeLeft}s</span>
                 </div>
              )}
           </div>
           <div className="w-48 bg-black/40 rounded-lg p-4 border border-white/5 flex flex-col justify-between">
              <div>
                 <div className="text-xs text-white/50 mb-3">展示柜</div>
                 <div className="flex justify-between text-xs text-orange-200 mb-2"><span>🥐 牛角包</span><span>x{breads.croissant}</span></div>
                 <div className="flex justify-between text-xs text-fuchsia-200"><span>🍰 星云蛋糕</span><span>x{breads.starCake}</span></div>
              </div>
              <button onClick={sellGoods} className="w-full py-2 bg-green-500/20 hover:bg-green-500/40 border border-green-500/50 rounded-lg text-xs font-bold text-green-200 transition-colors flex items-center justify-center gap-1">
                 <Sparkles className="w-3 h-3"/> 呼叫顾客售卖
              </button>
           </div>
        </div>
      )}

      {/* SCENE: COMET TRACK */}
      {sceneId === 'comet' && (
        <div className="flex gap-6">
           <div className="flex-1 flex flex-col gap-3">
              <div className="bg-black/40 rounded-lg p-4 border border-white/5">
                 <div className="text-xs text-cyan-400 mb-3 font-bold flex items-center gap-2"><Zap className="w-4 h-4"/> 宠物特训</div>
                 <div className="flex gap-4">
                    <button onClick={() => trainPet('speed')} className="flex-1 py-2 bg-blue-500/10 hover:bg-blue-500/30 border border-blue-500/30 rounded-lg flex flex-col items-center gap-1 transition-all hover:scale-[1.03] active:scale-95">
                       <span className="text-xs text-blue-200">🏃 速度特训 (-20币)</span>
                    </button>
                    <button onClick={() => trainPet('stamina')} className="flex-1 py-2 bg-emerald-500/10 hover:bg-emerald-500/30 border border-emerald-500/30 rounded-lg flex flex-col items-center gap-1 transition-all hover:scale-[1.03] active:scale-95">
                       <span className="text-xs text-emerald-200">🛡️ 耐力特训 (-20币)</span>
                    </button>
                 </div>
              </div>
              <button onClick={enterRace} disabled={raceActive} className="w-full py-3 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 hover:from-cyan-500/40 hover:to-blue-500/40 border border-cyan-500/50 rounded-lg text-sm font-bold text-cyan-200 transition-colors disabled:opacity-50">
                 {raceActive ? "🚀 比赛进行中..." : "🏁 报名参加彗星杯竞速赛"}
              </button>
           </div>
           <div className="w-48 bg-black/40 rounded-lg p-4 border border-white/5">
              <div className="text-xs text-white/50 mb-3">宠物能力面板</div>
              <div className="space-y-3">
                 <div>
                    <div className="flex justify-between text-xs mb-1">
                       <span className="text-blue-300">速度</span>
                       <span className="text-blue-200 font-bold">{petStats.speed}</span>
                    </div>
                    <div className="h-1.5 bg-black rounded-full overflow-hidden"><div className="h-full bg-blue-500" style={{width: `${Math.min(100, petStats.speed * 2)}%`}}/></div>
                 </div>
                 <div>
                    <div className="flex justify-between text-xs mb-1">
                       <span className="text-emerald-300">耐力</span>
                       <span className="text-emerald-200 font-bold">{petStats.stamina}</span>
                    </div>
                    <div className="h-1.5 bg-black rounded-full overflow-hidden"><div className="h-full bg-emerald-500" style={{width: `${Math.min(100, petStats.stamina * 2)}%`}}/></div>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* SCENE: LIBRARY */}
      {sceneId === 'library' && (
        <div className="flex gap-6">
           <div className="flex-1 bg-black/40 rounded-lg p-4 border border-white/5">
              <div className="text-sm font-bold text-purple-400 flex items-center gap-2 mb-4"><BookOpen className="w-4 h-4"/> 档案馆研究室</div>
              <div className="flex gap-4">
                 <button onClick={readBook} className="flex-1 py-6 bg-purple-500/10 hover:bg-purple-500/30 border border-purple-500/30 rounded-xl flex flex-col items-center justify-center gap-2 transition-all hover:scale-[1.03] active:scale-95">
                    <Book className="w-6 h-6 text-purple-300"/>
                    <span className="text-xs text-purple-200">翻阅古籍 (获得研究点数)</span>
                 </button>
                 <button onClick={unlockLore} className="flex-1 py-6 bg-indigo-500/10 hover:bg-indigo-500/30 border border-indigo-500/30 rounded-xl flex flex-col items-center justify-center gap-2 transition-all hover:scale-[1.03] active:scale-95 relative">
                    <div className="absolute top-2 right-2 text-[10px] text-indigo-300 bg-indigo-500/20 px-1.5 py-0.5 rounded">消耗 20 点</div>
                    <Compass className="w-6 h-6 text-indigo-300"/>
                    <span className="text-xs text-indigo-200">解读秘闻</span>
                 </button>
              </div>
           </div>
           <div className="w-64 bg-black/40 rounded-lg p-4 border border-white/5 flex flex-col">
              <div className="flex justify-between items-center mb-3">
                 <span className="text-xs text-white/50">已解锁秘闻录</span>
                 <span className="text-xs text-purple-300 font-bold">研究点: {researchPoints}</span>
              </div>
              <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                 {unlockedLore.length === 0 ? (
                    <div className="text-xs text-white/20 italic text-center mt-4">暂无秘闻，快去研究吧！</div>
                 ) : (
                    unlockedLore.map((lore, i) => (
                       <div key={i} className="bg-white/5 p-2 rounded border border-white/10 text-[10px] text-purple-200 leading-relaxed">
                          {lore}
                       </div>
                    ))
                 )}
              </div>
           </div>
        </div>
      )}

      {/* FALLBACK FOR OTHER SCENES (Just as examples, can expand later) */}
      {['gemini', 'andromeda', 'orion'].includes(sceneId) && (
        <div className="flex items-center justify-center p-10 rounded-xl bg-gradient-to-b from-[#1a1140]/60 to-[#0d0826]/60 border border-indigo-400/15">
           <div className="text-center space-y-3">
              <div className="w-14 h-14 mx-auto rounded-full bg-indigo-500/10 border border-indigo-400/20 flex items-center justify-center">
                <MapIcon className="w-6 h-6 text-indigo-300/60" />
              </div>
              <div>
                <div className="text-sm font-bold text-indigo-200">这片星域正在苏醒中 ✨</div>
                <p className="text-[11px] text-indigo-300/50 mt-1">更多奇妙玩法即将抵达，先四处走走看看吧</p>
              </div>
              <button onClick={() => {
                setCoins(c => c + 10);
                onGrantCoins(10);
                addLog("✨ 在未探索区域发现了一些星尘币！");
                playSound("sparkle");
              }} className="px-5 py-2 bg-indigo-500/15 hover:bg-indigo-500/30 border border-indigo-400/30 rounded-full text-xs text-indigo-200 transition-all hover:scale-105 active:scale-95">
                🌌 四处探索 (+10 币)
              </button>
           </div>
        </div>
      )}
    </div>
  );
}
