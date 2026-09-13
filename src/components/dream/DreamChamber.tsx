import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";

interface DreamChamberProps {
  isOpen: boolean;
  petName: string;
  species: string; // "猫" | "狗" | "兔" | "仓鼠" | 其他
  triggerToast: (msg: string) => void;
  onClose: () => void;
}

// 睡姿（每 45 秒随机切换）
const CAT_POSES = [
  { emoji: "🐱", name: "蜷缩", desc: "缩成一团，像个小毛球" },
  { emoji: "😺", name: "仰睡", desc: "四脚朝天，露出小肚子" },
  { emoji: "😸", name: "侧睡", desc: "侧着身子，爪子伸得长长的" },
  { emoji: "🙀", name: "趴睡", desc: "脸埋在爪子里，屁股撅着" },
];
const DOG_POSES = [
  { emoji: "🐶", name: "蜷缩", desc: "缩成一团，像个小毛球" },
  { emoji: "🐕", name: "仰睡", desc: "四脚朝天，露出小肚子" },
  { emoji: "🦮", name: "侧睡", desc: "侧着身子，爪子伸得长长的" },
  { emoji: "🐩", name: "趴睡", desc: "脸埋在爪子里，屁股撅着" },
];
const OTHER_POSES = [
  { emoji: "🐰", name: "蜷缩", desc: "缩成一团，像个小毛球" },
  { emoji: "🐹", name: "侧睡", desc: "侧着身子，缩成小球" },
];

// 梦话库
const CAT_TALKS = [
  "嗯...小鱼干...好好吃...😋",
  "主人...人家好喜欢你...🥰",
  "不要抢人家的被窝...哼...😤",
  "呼噜...呼噜...💤",
  "嗯...人家才没有胖...只是毛多...😾",
  "这个梦...好甜好甜...🍬",
  "主人...摸摸人家的耳朵嘛...🥺",
  "不要醒...人家还想睡...😴",
  "哇...毛线球...追到了...✨",
];
const DOG_TALKS = [
  "汪...追到飞盘了...好开心...🐶",
  "主人...人家是最棒的...嘿嘿...🥰",
  "嗯...肉骨头...好香...🍖",
  "呼...呼...睡得好香...💤",
  "主人...带人家去散步嘛...🥺",
  "人家...保护主人...💪",
  "摇尾巴...摇呀摇...😊",
  "不要醒...还想做梦...😴",
];
const COMMON_TALKS = [
  "不要走...人家还要玩...🥺",
  "主人...抱抱...💫",
  "哇...好多星星...✨",
  "人家...还能再吃一碗...🍖",
  "飞起来了...好高好高...🌙",
  "这个梦...好甜好甜...🍬",
];

// 梦境泡泡类型
const DREAM_BUBBLES: Record<string, string[]> = {
  food: ["🍣", "🍖", "🍰", "🐟", "🍪"],
  adventure: ["🌟", "🚀", "🌈", "☁️", "🌙"],
  owner: ["💕", "🥰", "👤", "💫", "🎀"],
  weird: ["🌀", "🍄", "🎭", "🦋", "🔮"],
};

// 梦境类型（醒来生成梦境卡片）
const DREAM_TYPES = [
  {
    type: "food",
    name: "美食梦",
    icon: "🍰",
    descriptions: [
      "它梦到自己掉进了小鱼干海里，游啊游啊吃个不停...",
      "它梦到一个无限大的蛋糕，它吃了一口又一口，永远吃不完...",
      "它梦到你给它做了一顿超级大餐，它感动得在梦里都哭了...",
    ],
  },
  {
    type: "adventure",
    name: "冒险梦",
    icon: "🚀",
    descriptions: [
      "它梦到自己变成了太空宠物，在星云里飞来飞去...",
      "它梦到和你一起在彗星跑道上赛跑，它跑了第一名！",
      "它梦到自己是个侠客，在猎户座森林里探险...",
    ],
  },
  {
    type: "owner",
    name: "和主人的梦",
    icon: "💕",
    descriptions: [
      "它梦到你一直陪着它，你们在星云里走了好久好久...",
      "它梦到你摸它的头，摸啊摸啊，它幸福得不想醒...",
      "它梦到你们第一次见面的那天，它紧张得爪子都出汗了...",
    ],
  },
  {
    type: "weird",
    name: "奇怪的梦",
    icon: "🌀",
    descriptions: [
      "它梦到自己变成了一只巨大的兔子，追着一个小胡萝卜跑...",
      "它梦到所有东西都倒过来了，它在天花板上走路...",
      "它梦到自己会说话了，第一句就是\"主人我好爱你\"...",
    ],
  },
];

interface DreamRecord {
  id: string;
  type: string;
  name: string;
  icon: string;
  desc: string;
  date: string;
}

// 保存梦境到日记（localStorage，最多 10 条）
const saveDream = (dream: { type: string; name: string; icon: string; desc: string }) => {
  try {
    const saved: DreamRecord[] = JSON.parse(localStorage.getItem("pet_dreams") || "[]");
    saved.unshift({
      id: Date.now().toString(),
      ...dream,
      date: new Date().toLocaleDateString("zh-CN"),
    });
    localStorage.setItem("pet_dreams", JSON.stringify(saved.slice(0, 10)));
  } catch {
    /* 忽略存储失败 */
  }
};

const SPECIES_EMOJI: Record<string, string> = {
  猫: "🐱",
  狗: "🐶",
  兔: "🐰",
  仓鼠: "🐹",
  鸟: "🐦",
};

/** 星空背景：星星 + 流动星云 + 流星 + 萤火虫 */
const DreamBackground = () => {
  const stars = Array.from({ length: 45 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    top: Math.random() * 65,
    size: Math.random() * 2 + 1,
    delay: Math.random() * 4,
    duration: Math.random() * 2 + 2,
  }));
  const flies = Array.from({ length: 8 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    top: 40 + Math.random() * 40,
    duration: 6 + Math.random() * 4,
    delay: Math.random() * 5,
  }));

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
            background: star.id % 4 === 0 ? "#ec4899" : star.id % 4 === 1 ? "#a855f7" : "#fff",
            boxShadow: `0 0 ${star.size * 3}px currentColor`,
          }}
          animate={{ opacity: [0.2, 1, 0.2] }}
          transition={{ duration: star.duration, delay: star.delay, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
      {/* 流动星云 */}
      <motion.div
        className="absolute top-1/4 left-1/4 w-72 h-72 rounded-full opacity-20"
        style={{ background: "radial-gradient(circle, #a855f7, transparent 70%)", filter: "blur(40px)" }}
        animate={{ x: [0, 20, 0], y: [0, -15, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-1/3 right-1/4 w-52 h-52 rounded-full opacity-15"
        style={{ background: "radial-gradient(circle, #ec4899, transparent 70%)", filter: "blur(30px)" }}
        animate={{ x: [0, -18, 0], y: [0, 12, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />
      {/* 萤火虫 */}
      {flies.map((fly) => (
        <motion.div
          key={fly.id}
          className="absolute w-1.5 h-1.5 rounded-full"
          style={{
            left: `${fly.left}%`,
            top: `${fly.top}%`,
            background: "#fde047",
            boxShadow: "0 0 8px #fde047, 0 0 16px #fbbf24",
          }}
          animate={{ x: [0, 30, -20, 10, 0], y: [0, -20, -10, -30, 0], opacity: [0.2, 1, 0.5, 1, 0.2] }}
          transition={{ duration: fly.duration, delay: fly.delay, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
      {/* 流星 */}
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="absolute w-16 h-[2px] rounded-full"
          style={{ top: `${10 + i * 14}%`, background: "linear-gradient(90deg, #fff, transparent)", boxShadow: "0 0 8px #fff" }}
          initial={{ left: "110%", opacity: 0 }}
          animate={{ left: "-20%", opacity: [0, 1, 0] }}
          transition={{ duration: 1.5, delay: 3 + i * 6, repeat: Infinity, repeatDelay: 8, ease: "easeIn" }}
        />
      ))}
    </div>
  );
};

export default function DreamChamber({ isOpen, petName, species, triggerToast, onClose }: DreamChamberProps) {
  const [sleepMinutes, setSleepMinutes] = useState(0);
  const [dreamCount, setDreamCount] = useState(0);
  const [currentTalk, setCurrentTalk] = useState("");
  const [isAccompanying, setIsAccompanying] = useState(false);
  const [sleepCountdown, setSleepCountdown] = useState<number | null>(null);
  const [showSleepOptions, setShowSleepOptions] = useState(false);
  const [petTwitch, setPetTwitch] = useState(false); // 睡觉小抽动
  const [isTurning, setIsTurning] = useState(false); // 点击翻身
  const [isPetting, setIsPetting] = useState(false); // 长按摸头
  const [wakeStage, setWakeStage] = useState<0 | 1 | 2 | 3>(0);
  const [dreamCard, setDreamCard] = useState<{ type: string; name: string; icon: string; desc: string } | null>(null);
  const [currentPose, setCurrentPose] = useState<{ emoji: string; name: string; desc: string } | null>(null);
  const [bubbles, setBubbles] = useState<Array<{ id: number; emoji: string; x: number }>>([]);

  const talkTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sleepTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const twitchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const poseTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const bubbleTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bubbleIdRef = useRef(0);

  const baseEmoji = SPECIES_EMOJI[species] ?? "🐾";

  const getPoses = () => {
    if (species.includes("猫")) return CAT_POSES;
    if (species.includes("狗")) return DOG_POSES;
    return OTHER_POSES;
  };

  const pickTalk = () => {
    const pool = species.includes("猫") ? CAT_TALKS : species.includes("狗") ? DOG_TALKS : COMMON_TALKS;
    return pool[Math.floor(Math.random() * pool.length)];
  };

  // 初始化睡姿
  useEffect(() => {
    const poses = getPoses();
    setCurrentPose(poses[0]);
  }, [isOpen]);

  // 睡眠计时
  useEffect(() => {
    if (!isOpen) return;
    sleepTimerRef.current = setInterval(() => setSleepMinutes((m) => m + 1), 60000);
    return () => {
      if (sleepTimerRef.current) clearInterval(sleepTimerRef.current);
      if (talkTimerRef.current) clearTimeout(talkTimerRef.current);
      if (twitchTimerRef.current) clearTimeout(twitchTimerRef.current);
      if (poseTimerRef.current) clearInterval(poseTimerRef.current);
      if (bubbleTimerRef.current) clearInterval(bubbleTimerRef.current);
    };
  }, [isOpen]);

  // 随机说梦话
  useEffect(() => {
    if (!isOpen) return;
    const showTalk = () => {
      setCurrentTalk(pickTalk());
      setDreamCount((c) => c + 1);
      talkTimerRef.current = setTimeout(() => {
        setCurrentTalk("");
        talkTimerRef.current = setTimeout(showTalk, 7000 + Math.random() * 6000);
      }, 5000 + Math.random() * 2500);
    };
    talkTimerRef.current = setTimeout(showTalk, 2500);
    return () => {
      if (talkTimerRef.current) clearTimeout(talkTimerRef.current);
    };
  }, [isOpen]);

  // 宠物小抽动
  useEffect(() => {
    if (!isOpen) return;
    const twitch = () => {
      setPetTwitch(true);
      twitchTimerRef.current = setTimeout(() => setPetTwitch(false), 450);
      twitchTimerRef.current = setTimeout(twitch, 4500 + Math.random() * 4000);
    };
    twitchTimerRef.current = setTimeout(twitch, 4000 + Math.random() * 3000);
    return () => {
      if (twitchTimerRef.current) clearTimeout(twitchTimerRef.current);
    };
  }, [isOpen]);

  // 睡姿随机切换（每 45 秒）
  useEffect(() => {
    if (!isOpen) return;
    const poses = getPoses();
    poseTimerRef.current = setInterval(() => {
      setCurrentPose(poses[Math.floor(Math.random() * poses.length)]);
    }, 45000);
    return () => {
      if (poseTimerRef.current) clearInterval(poseTimerRef.current);
    };
  }, [isOpen]);

  // 梦境泡泡（每 2.5 秒飘一个）
  useEffect(() => {
    if (!isOpen) return;
    bubbleTimerRef.current = setInterval(() => {
      const types = Object.keys(DREAM_BUBBLES);
      const type = types[Math.floor(Math.random() * types.length)];
      const emojis = DREAM_BUBBLES[type];
      const emoji = emojis[Math.floor(Math.random() * emojis.length)];
      const id = ++bubbleIdRef.current;
      const x = Math.random() * 60 - 30;
      setBubbles((prev) => [...prev.slice(-6), { id, emoji, x }]);
      setTimeout(() => setBubbles((prev) => prev.filter((b) => b.id !== id)), 4000);
    }, 2500);
    return () => {
      if (bubbleTimerRef.current) clearInterval(bubbleTimerRef.current);
    };
  }, [isOpen]);

  // 点击宠物：翻身 + 嘟囔
  const handlePetClick = () => {
    if (wakeStage > 0) return;
    setIsTurning(true);
    setTimeout(() => setIsTurning(false), 800);
    const mumbles = [
      "嗯...别闹...人家还要睡...😴",
      "唔...小鱼干...别跑...🐟",
      "哼...人家的被窝...不许抢...😾",
      "主人...再陪人家睡会儿...🥺",
      "呼噜...呼噜...💤",
    ];
    setCurrentTalk(mumbles[Math.floor(Math.random() * mumbles.length)]);
    setTimeout(() => setCurrentTalk(""), 4000);
  };

  // 长按宠物：摸头 + 爱心
  const handlePressStart = () => {
    if (wakeStage > 0) return;
    pressTimerRef.current = setTimeout(() => {
      setIsPetting(true);
      triggerToast("你轻轻摸了摸它的头，它睡得更香了... 💫");
      setTimeout(() => setIsPetting(false), 2000);
    }, 500);
  };
  const handlePressEnd = () => {
    if (pressTimerRef.current) clearTimeout(pressTimerRef.current);
  };

  // 陪它睡：弹时长选项
  const handleAccompany = () => {
    setShowSleepOptions(true);
  };

  const startSleep = (minutes: number | null) => {
    setShowSleepOptions(false);
    setIsAccompanying(true);
    if (minutes) {
      setSleepCountdown(minutes * 60);
      const timer = setInterval(() => {
        setSleepCountdown((prev) => {
          if (prev === null || prev <= 1) {
            clearInterval(timer);
            setIsAccompanying(false);
            setSleepCountdown(null);
            triggerToast("你睡醒了，它还在睡... 🌙");
            return null;
          }
          return prev - 1;
        });
      }, 1000);
    }
  };

  // 唤醒：渐进式 3 阶段
  const handleWake = () => {
    if (wakeStage > 0) return;
    setWakeStage(1);
    setTimeout(() => setWakeStage(2), 800);
    setTimeout(() => setWakeStage(3), 1600);
    setTimeout(() => {
      const dreamType = DREAM_TYPES[Math.floor(Math.random() * DREAM_TYPES.length)];
      const desc = dreamType.descriptions[Math.floor(Math.random() * dreamType.descriptions.length)];
      const card = { type: dreamType.type, name: dreamType.name, icon: dreamType.icon, desc };
      setDreamCard(card);
      saveDream(card);
      setWakeStage(0);
    }, 2800);
  };

  // 睡眠时长影响醒来心情
  const getWakeMood = (minutes: number) => {
    if (minutes < 2) return { text: "嗯...人家还没睡够...再让人家睡会儿嘛...🥱", mood: "sleepy" };
    if (minutes < 5) return { text: "早安呀主人～人家醒啦！今天也要一起玩哦！😊", mood: "happy" };
    if (minutes < 30) return { text: "哇～睡得好香好香！人家现在精神超好！✨", mood: "happy" };
    return { text: "人家睡了好久好久...做了好长好长的梦...伸个懒腰～💫", mood: "relaxed" };
  };

  // 关闭梦境卡片并返回
  const closeDreamCard = () => {
    const mood = getWakeMood(sleepMinutes);
    triggerToast(`${petName}：${mood.text}`);
    setDreamCard(null);
    onClose();
  };

  if (!isOpen) return null;

  const pose = currentPose ?? getPoses()[0];
  const poseEmoji = pose.emoji || baseEmoji;

  return (
    <div
      className="fixed inset-0 z-[80] flex flex-col relative overflow-hidden"
      style={{ background: "linear-gradient(180deg, #0c0824 0%, #181038 45%, #251550 100%)" }}
    >
      <DreamBackground />

      {/* 顶部栏 */}
      <div className="relative z-10 flex items-center justify-between px-4 py-4">
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full flex items-center justify-center text-white/70 hover:text-white transition-colors"
          style={{ background: "rgba(255,255,255,0.08)" }}
          title="返回"
        >
          ←
        </button>
        <div className="flex items-center gap-2">
          <span className="text-xl">💤</span>
          <h1 className="text-white font-bold text-lg">陪它做个好梦</h1>
        </div>
        <div className="w-10" />
      </div>

      {/* 陪睡遮罩 */}
      <AnimatePresence>
        {isAccompanying && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-20 flex items-center justify-center"
            style={{ background: "rgba(0,0,0,0.65)" }}
          >
            <div className="text-center">
              <motion.div animate={{ scale: [1, 1.12, 1] }} transition={{ duration: 3, repeat: Infinity }} className="text-6xl mb-4">
                💤
              </motion.div>
              <p className="text-purple-200 text-sm">你也睡着了...</p>
              <p className="text-purple-400 text-xs mt-1">梦里有它，也有星星</p>
              {sleepCountdown !== null && (
                <div className="text-purple-300 text-xs mt-2">
                  还有 {Math.floor(sleepCountdown / 60)}:{String(sleepCountdown % 60).padStart(2, "0")} 醒来
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 陪睡时长选择弹窗 */}
      <AnimatePresence>
        {showSleepOptions && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-30 flex items-center justify-center p-6"
            style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
            onClick={() => setShowSleepOptions(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-xs rounded-3xl p-5 text-center"
              style={{ background: "linear-gradient(180deg, #2a1a4e, #1e143c)", border: "1px solid rgba(168,85,247,0.3)" }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-white font-bold text-base mb-4">要陪它睡多久呀？</div>
              <div className="space-y-2.5">
                <button onClick={() => startSleep(1)} className="w-full py-3 rounded-2xl text-white text-sm" style={{ background: "rgba(168,85,247,0.2)", border: "1px solid rgba(168,85,247,0.4)" }}>
                  🌙 小憩一会儿（1分钟）
                </button>
                <button onClick={() => startSleep(5)} className="w-full py-3 rounded-2xl text-white text-sm" style={{ background: "rgba(168,85,247,0.2)", border: "1px solid rgba(168,85,247,0.4)" }}>
                  💤 好好睡一觉（5分钟）
                </button>
                <button onClick={() => startSleep(null)} className="w-full py-3 rounded-2xl text-white text-sm" style={{ background: "rgba(168,85,247,0.2)", border: "1px solid rgba(168,85,247,0.4)" }}>
                  ⭐ 睡到自然醒（不限时）
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 宠物睡觉区域 */}
      <div className="flex-1 flex flex-col items-center justify-center relative z-10 px-6">
        <motion.div
          className="absolute top-6 right-8 text-5xl"
          animate={{ y: [0, -8, 0], opacity: [0.85, 1, 0.85] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        >
          🌙
        </motion.div>

        <div className="relative mb-8">
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{ background: "radial-gradient(circle, rgba(168,85,247,0.28) 0%, transparent 70%)", scale: 2 }}
            animate={{ opacity: [0.5, 0.85, 0.5] }}
            transition={{ duration: 4, repeat: Infinity }}
          />

          {/* 宠物本体（可点击/长按，呼吸 + 抽动 + 翻身 + 唤醒） */}
          <motion.div
            animate={
              wakeStage === 3
                ? { scale: 1.15, filter: "brightness(1)" }
                : wakeStage === 2
                  ? { rotate: [0, 5, -5, 0], scale: 1.08 }
                  : wakeStage === 1
                    ? { scale: 1.05 }
                    : isTurning
                      ? { rotate: [0, 15, -15, 0], scale: [1, 1.1, 1] }
                      : petTwitch
                        ? { scale: [1, 1.06, 0.99, 1], rotate: [0, -2, 2, 0] }
                        : { scale: [1, 1.05, 1] }
            }
            transition={{ duration: isTurning ? 0.8 : petTwitch ? 0.45 : 3.5, repeat: Infinity, ease: "easeInOut" }}
            className="text-[120px] relative select-none cursor-pointer"
            style={{ filter: wakeStage === 3 ? "brightness(1)" : "brightness(0.9) drop-shadow(0 10px 20px rgba(0,0,0,0.4))" }}
            onClick={handlePetClick}
            onPointerDown={handlePressStart}
            onPointerUp={handlePressEnd}
            onPointerLeave={handlePressEnd}
          >
            {wakeStage === 3 ? "😺" : poseEmoji}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-5xl opacity-80">🛏️</div>
          </motion.div>

          {/* Zzz */}
          <div className="absolute -top-4 -right-8">
            {["Z", "z", "z"].map((letter, i) => (
              <motion.span
                key={i}
                className="absolute text-purple-300 font-bold"
                style={{ fontSize: 24 - i * 6 }}
                animate={{ y: [0, -30 - i * 10], x: [0, 10 + i * 5], opacity: [0, 1, 0] }}
                transition={{ duration: 2.5, repeat: Infinity, delay: i * 0.6, ease: "easeOut" }}
              >
                {letter}
              </motion.span>
            ))}
          </div>

          {/* 梦境泡泡 */}
          {bubbles.map((bubble) => (
            <motion.div
              key={bubble.id}
              className="absolute text-2xl pointer-events-none"
              style={{ left: `${50 + bubble.x / 3}%`, bottom: "65%" }}
              initial={{ opacity: 0, y: 0, scale: 0.5 }}
              animate={{ opacity: [0, 1, 1, 0], y: -60, scale: [0.5, 1, 1, 0.8] }}
              transition={{ duration: 4, ease: "easeOut" }}
            >
              {bubble.emoji}
            </motion.div>
          ))}

          {/* 摸头爱心粒子 */}
          {isPetting && (
            <div className="absolute inset-0 pointer-events-none">
              {[0, 1, 2, 3, 4].map((i) => (
                <motion.div
                  key={i}
                  className="absolute text-lg"
                  style={{ left: `${40 + Math.random() * 20}%`, top: "40%" }}
                  initial={{ opacity: 0, y: 0, scale: 0.5 }}
                  animate={{ opacity: [0, 1, 0], y: -50, scale: [0.5, 1.2, 0.8] }}
                  transition={{ duration: 1.5, delay: i * 0.15 }}
                >
                  💕
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* 梦话气泡 */}
        <AnimatePresence>
          {currentTalk && wakeStage === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.9 }}
              className="relative max-w-xs mb-8"
            >
              <div
                className="px-5 py-3 rounded-3xl text-sm text-purple-100 text-center"
                style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(168,85,247,0.3)", backdropFilter: "blur(10px)" }}
              >
                {currentTalk}
              </div>
              <div
                className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 rotate-45"
                style={{ background: "rgba(255,255,255,0.1)", borderRight: "1px solid rgba(168,85,247,0.3)", borderBottom: "1px solid rgba(168,85,247,0.3)" }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* 渐进唤醒提示 */}
        <AnimatePresence>
          {wakeStage === 1 && <motion.div className="text-purple-300 text-sm mb-4">你轻轻叫它的名字...</motion.div>}
          {wakeStage === 2 && <motion.div className="text-purple-300 text-sm mb-4">它动了动耳朵，翻了个身...</motion.div>}
          {wakeStage === 3 && <motion.div className="text-purple-300 text-sm mb-4">它慢慢睁开了眼睛... ☀️</motion.div>}
        </AnimatePresence>

        {/* 睡姿提示小字 */}
        <div className="text-purple-400/60 text-xs mb-4">睡姿：{pose.name} · {pose.desc}</div>
      </div>

      {/* 底部操作区（只有2个按钮） */}
      <div className="relative z-10 px-6 pb-6">
        <div className="flex gap-3 mb-4">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleAccompany}
            disabled={isAccompanying || wakeStage > 0}
            className="flex-1 py-4 rounded-2xl text-white font-medium flex items-center justify-center gap-2 disabled:opacity-50"
            style={{ background: "rgba(168,85,247,0.2)", border: "1px solid rgba(168,85,247,0.4)" }}
          >
            <span className="text-xl">💤</span>
            <span>陪它睡</span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleWake}
            disabled={wakeStage > 0}
            className="flex-1 py-4 rounded-2xl text-white font-medium flex items-center justify-center gap-2 disabled:opacity-50"
            style={{ background: "linear-gradient(135deg, #f59e0b, #ec4899)", boxShadow: "0 4px 20px rgba(245,158,11,0.3)" }}
          >
            <span className="text-xl">☀️</span>
            <span>唤醒它</span>
          </motion.button>
        </div>

        <div className="text-center text-purple-400 text-xs">
          它已经睡了 {sleepMinutes} 分钟啦，做了 {dreamCount} 个好梦
        </div>
      </div>

      {/* 梦境卡片弹窗 */}
      <AnimatePresence>
        {dreamCard && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={closeDreamCard}
          >
            <motion.div
              initial={{ scale: 0.8, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 30 }}
              className="w-full max-w-sm rounded-3xl p-6 text-center"
              style={{ background: "linear-gradient(180deg, #2a1a4e, #1e143c)", border: "1px solid rgba(168,85,247,0.3)", boxShadow: "0 0 50px rgba(168,85,247,0.25)" }}
              onClick={(e) => e.stopPropagation()}
            >
              <motion.div animate={{ rotate: [0, -10, 10, 0] }} transition={{ duration: 1, repeat: 2 }} className="text-5xl mb-3">
                {dreamCard.icon}
              </motion.div>
              <div className="text-purple-300 text-xs mb-1">它刚才做了一个...</div>
              <div className="text-white font-bold text-lg mb-3">{dreamCard.name}</div>
              <div className="bg-black/30 rounded-2xl p-4 mb-4">
                <p className="text-purple-100 text-sm leading-relaxed">{dreamCard.desc}</p>
              </div>
              <button
                onClick={closeDreamCard}
                className="w-full py-3 rounded-full text-white text-sm"
                style={{ background: "linear-gradient(135deg, #a855f7, #ec4899)" }}
              >
                带它回家 →
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
