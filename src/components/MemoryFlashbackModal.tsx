/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from "react";
import { PetConfig } from "../types";
import { playSound } from "./AudioSynth";
import { Camera, Sparkles, Heart, Gift, BookOpen, Download } from "lucide-react";

export interface MemorySegment {
  id: string;
  title: string;
  image: string;
  descriptionTemplate: (petName: string, ownerName: string) => string;
  icon: string;
  category: "猫" | "狗" | "兔" | "鸟" | "仓鼠" | "通用";
}

// Memory flashback data bank (beautifully personalized)
export const PET_MEMORIES: MemorySegment[] = [
  {
    id: "mem_sofa_sun",
    title: "沙发阳光下的呼噜午后",
    image: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&q=80&w=500",
    icon: "🌸",
    category: "猫",
    descriptionTemplate: (petName, ownerName) => 
      `那是一个慵懒的星期天下午，金黄的太阳不偏不倚刚好洒在沙发的暗角。我趴在你的手臂弯里，随着你平和的呼吸微微起伏。${ownerName}用带有奶香味的温热手指，轻轻梳理着我的耳根和下巴，我忍不住眯起眼，喉咙里发出低沉而欢快的「呼噜呼噜」声。你那时低下头亲亲我的额头，笑着说要是时间能永远停在这一刻就好了。其实那天我也在想，只要能在${ownerName}的膝盖上打一辈子呼噜，就是世界上最得意、最美满的事啦。`
  },
  {
    id: "mem_rainy_paw",
    title: "雨天归途与泥巴印章",
    image: "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=500",
    icon: "🌧️",
    category: "狗",
    descriptionTemplate: (petName, ownerName) => 
      `那天傍晚突然灌起了暴雨，你在狂风里顶着伞，急匆匆地跑回家。可你关上门的第一件事，并不是擦掉头上的雨水，而是红着脸把我紧紧搂进怀里，反复细数我有没有被突如其来的巨雷惊醒、吓坏。等雨停出门，我开心得在泥坑里像个小皮球般乱滚。虽然溅了你一身泥水，你却没有一丁点生气，无可奈何却满眼温柔地蹲着洗澡。现在的星宿大门前有很多柔软的云堆，我很乖，没有再去踩脏。但我永远保留着那天印在${ownerName}裤脚上的粉扑泥巴印，那是小狗给主人的秘密勋章。`
  },
  {
    id: "mem_lettuce_snack",
    title: "厨房菜叶的一场小窃",
    image: "https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?auto=format&fit=crop&q=80&w=500",
    icon: "🥬",
    category: "兔",
    descriptionTemplate: (petName, ownerName) => 
      `每当你在厨房里忙活，发出洗菜煮饭的水声时，我便会飞快地踩着无声的碎步跑进门，扒拉着你的裤脚仰起头、探长小鼻子使劲呼哧。你总是会细心挑一瓣最嫩、洗得最干净的青菜叶子，弯下腰递进我嘴边的三瓣嘴里。接着，安静的厨房里就会响起节奏飞快、无比治愈的「沙沙沙」声。在这个星之海里，虽然有很多吃不完的发光星尘糖，可是它们谁也比不上当年你轻轻递过来、还带着清凉水珠的那口菜叶香甜。`
  },
  {
    id: "mem_shoulder_clock",
    title: "肩膀上的拂晓闹铃",
    image: "https://images.unsplash.com/photo-1522850959516-58f958dde2c1?auto=format&fit=crop&q=80&w=500",
    icon: "🌅",
    category: "鸟",
    descriptionTemplate: (petName, ownerName) => 
      `在晨曦微露的破晓时分，你还没从床头醒来，我便会轻盈地煽动翅膀，落在你近旁。我试探着用细嫩的小嘴啄啄你的眼睫毛，轻快地发出悦耳的鸣叫。你半闭着眼，睡眼惺忪地拍了拍枕头嘟囔着「再睡五分钟嘛」，胳膊却无比熟练地抬起来，留出一根温暖的手指让我稳稳站定。那一幕在晨光剪影里的我们，倒映在泛白的水泥墙壁上。如今，天空的第一缕晨光依然每天照进你的房间，那是${petName}踩着星轨、替你折射的起床吻哦。`
  },
  {
    id: "mem_palm_sunflower",
    title: "掌心毛毛球的葵心温存",
    image: "https://images.unsplash.com/photo-1425082661705-1834bfd09dca?auto=format&fit=crop&q=80&w=500",
    icon: "🌻",
    category: "仓鼠",
    descriptionTemplate: (petName, ownerName) => 
      `我一生中最中意的事，就是被你用两手掌交叠呵护起来，在暖洋洋的摩擦温存下，把自己缩成一只安宁无防备的小毛球。你总喜欢挑一颗长得顶饱饱的葵花籽喂给我。我急吼吼地两颊鼓胀，像个塞满坚果的大皮箱，滑稽的样子总能逗得你开心大笑。虽然在这个星尘银河，我的寿命和时间比起你们是如此短暂，但在${ownerName}掌心暖意里的数个春秋里，每一天我得到的那份欢愉和充实，都重重地填满了${petName}微小却最明亮的一生。`
  },
  {
    id: "mem_deskside_watcher",
    title: "熬夜书桌旁的黑夜伙伴",
    image: "https://images.unsplash.com/photo-1518791841217-8f162f1e1131?auto=format&fit=crop&q=80&w=500",
    icon: "💻",
    category: "通用",
    descriptionTemplate: (petName, ownerName) => 
      `脑海里总是翻涌着每一个你伏案加班或挑灯温习的深夜。小房间里黑漆漆的，只有显示器泛着荧荧白光，还有不时敲打键盘发出的干裂声音。那时候的${petName}只能踩在你的脚板底，或者安静地在桌角垫着你重要的草稿本。其实我帮不上你任何忙，有时甚至还傻乎乎地碰掉你的中性笔，让你低头去捡。我很骄傲能陪伴着你的脆弱，在冷寂漫长的黑夜里，用微弱均匀的吐息告诉你：${ownerName}不许孤单自馁，你的专属小守护神，正闭着眼寸步不离地守着你。`
  },
  {
    id: "mem_first_meet",
    title: "初次相见的悸动礼赞",
    image: "https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&q=80&w=500",
    icon: "🤝",
    category: "通用",
    descriptionTemplate: (petName, ownerName) => 
      `还记得我们宿命般初次碰面的那一天吗？我小小的、有些脏兮兮并且充满了怯懦，在一个陌生的角落缩成一团。只有你在那千千万万的影子中看中了我，小心翼翼地递过两根指头探探我的底。当时我的肚子饿着、全身发寒，可在被你捧进暖和怀里的刹那，我的世界一下子亮堂了起来。我甚至还没做好来到人世的功课，就因为遇到了善良的${ownerName}而享收了一辈子满满的恩宠盛宴。即使如今我提前乘着流星飞远，初次相见的温暖，也是我照亮星云大世界的永恒火炬。`
  }
];

interface MemoryFlashbackModalProps {
  petConfig: PetConfig;
  onClose: () => void;
  onCollectReward: (coinsAwarded: number, memoryId: string) => void;
  triggeredMemoryId?: string; // If specific memory wanted, pass this, else random matching triggered
}

export default function MemoryFlashbackModal({ petConfig, onClose, onCollectReward, triggeredMemoryId }: MemoryFlashbackModalProps) {
  const [activeMemory, setActiveMemory] = useState<MemorySegment | null>(null);
  const [stardustGlowVal, setStardustGlowVal] = useState(0);
  const [hasCollected, setHasCollected] = useState(false);

  useEffect(() => {
    playSound("chime");
    playSound("sparkle");

    // Retrieve memories filtered by current pet type
    let matches = PET_MEMORIES.filter(m => m.category === petConfig.type);
    if (matches.length === 0) {
      // Fallback to universal generic category
      matches = PET_MEMORIES.filter(m => m.category === "通用");
    }

    if (triggeredMemoryId) {
      const spec = PET_MEMORIES.find(m => m.id === triggeredMemoryId);
      if (spec) {
        setActiveMemory(spec);
        return;
      }
    }

    // Pick random match
    if (matches.length > 0) {
      const selected = matches[Math.floor(Math.random() * matches.length)];
      setActiveMemory(selected);
    }
  }, [petConfig, triggeredMemoryId]);

  // Glow star animation interval
  useEffect(() => {
    const t = setInterval(() => {
      setStardustGlowVal(p => (p + 15) % 180);
    }, 450);
    return () => clearInterval(t);
  }, []);

  if (!activeMemory) return null;

  const resolvedStoryText = activeMemory.descriptionTemplate(petConfig.name, petConfig.ownerName);

  const handleRewardClick = () => {
    if (hasCollected) return;
    setHasCollected(true);
    playSound("success");
    onCollectReward(25, activeMemory.id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in" id="memory-flashback-overlay">
      
      {/* Decorative cosmic sparks in backdrop */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/5 w-60 h-60 rounded-full bg-pink-500/10 blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/5 w-72 h-72 rounded-full bg-purple-500/10 blur-3xl animate-pulse" />
        {[...Array(12)].map((_, i) => (
          <span
            key={i}
            className="absolute text-[8px] opacity-20 animate-bounce"
            style={{
              top: `${Math.random() * 85 + 5}%`,
              left: `${Math.random() * 90 + 5}%`,
              transform: `scale(${0.5 + Math.random()}) rotate(${stardustGlowVal}deg)`,
              color: petConfig.primaryColor,
              animationDelay: `${i * 0.3}s`
            }}
          >
            ✨
          </span>
        ))}
      </div>

      {/* Main Glassmorphic Photo Album Container */}
      <div 
        className="w-full max-w-lg bg-[#110c2c]/95 border-2 rounded-3xl p-6 relative flex flex-col justify-between shadow-2xl overflow-hidden animate-scale-up"
        style={{ borderColor: `${petConfig.primaryColor}50` }}
      >
        {/* Glow corner elements */}
        <div className="absolute -top-16 -left-16 w-32 h-32 rounded-full opacity-60 filter blur-xl" style={{ backgroundColor: petConfig.primaryColor }} />
        <div className="absolute -bottom-16 -right-16 w-32 h-32 rounded-full opacity-60 filter blur-xl" style={{ backgroundColor: petConfig.secondaryColor }} />

        {/* Polaroid Inner Frame with beautiful soft tilt and aesthetic dropshadow */}
        <div className="flex flex-col items-center bg-white/5 border border-white/10 rounded-2xl p-4 shadow-inner relative group select-none">
          
          {/* Heart beating badge top marker */}
          <div className="absolute -top-3.5 px-3 py-1 bg-gradient-to-r from-pink-500 via-rose-400 to-pink-500 rounded-full flex items-center gap-1.5 text-[10px] font-mono font-bold tracking-widest text-white shadow-xl animate-pulse">
            <Heart className="w-3 h-3 text-white fill-white animate-soft-breath" />
            <span>🌌 重温真实记忆闪回</span>
          </div>

          {/* Aesthetic camera image placeholder */}
          <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-white/5 flex items-center justify-center bg-slate-900 group-hover:brightness-105 transition-all">
            <img 
              referrerPolicy="no-referrer"
              src={activeMemory.image} 
              alt={activeMemory.title}
              className="w-full h-full object-cover select-none pointer-events-none" 
            />
            
            {/* Ambient image filter */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#110c2c]/90 via-transparent to-transparent opacity-60" />
            
            {/* Aesthetic micro badge bottom-left */}
            <div className="absolute bottom-3 left-3 bg-black/60 px-2.5 py-1 rounded-full text-[9px] font-mono flex items-center gap-1.5 text-pink-300 pointer-events-none border border-white/5">
              <span>{activeMemory.icon}</span>
              <span>{activeMemory.title}</span>
            </div>
          </div>

          {/* Sweet narrative description of the memory */}
          <div className="mt-4 text-[12px] leading-relaxed text-purple-100 font-sans tracking-wide bg-white/5 border border-white/5 hover:bg-white/10 transition-colors rounded-xl p-3.5 text-justify hover:shadow-inner">
            <div className="text-[10px] text-pink-300 font-mono tracking-widest mb-1.5 uppercase flex items-center gap-1">
              <BookOpen className="w-3 h-3" />
              <span>{petConfig.name} 的内心碎语</span>
            </div>
            {resolvedStoryText}
          </div>
        </div>

        {/* Footer actions and reward collecting */}
        <div className="mt-5 flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#130722]/80 border border-white/5 p-3 rounded-2xl">
            <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-mono">
              <ChipElement color={petConfig.secondaryColor} text={activeMemory.category + "系萌物记忆"} />
              <span>星屑尘埃重聚 +25 星尘币</span>
            </div>
            
            {/* Memory Rewards Trigger Button */}
            <button
              onClick={handleRewardClick}
              disabled={hasCollected}
              className={`w-full sm:w-auto px-4 py-1.5 gap-1.5 rounded-lg text-xs font-bold tracking-wider font-mono flex items-center justify-center transition-all shadow-md ${
                hasCollected 
                  ? "bg-slate-800 text-gray-500 cursor-not-allowed border border-white/5" 
                  : "bg-pink-600 hover:bg-pink-500 text-white cursor-pointer hover:scale-105 border border-pink-500/30"
              }`}
            >
              <Gift className="w-3.5 h-3.5" />
              {hasCollected ? "🎁 记忆星能已收集" : "✨ 保存记忆并注入25枚币"}
            </button>
          </div>

          <div className="flex gap-2">
            {/* Aesthetic dialog Close feedback */}
            <button
              onClick={() => {
                playSound("click");
                onClose();
              }}
              className="flex-1 py-2 rounded-xl text-xs font-semibold text-gray-400 bg-white/5 hover:bg-white/10 hover:text-white border border-white/10 text-center cursor-pointer transition-all uppercase"
            >
              返回星宿家园
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ChipElement({ color, text }: { color: string; text: string }) {
  return (
    <span 
      className="px-2 py-0.5 rounded text-[8px] font-mono font-bold"
      style={{ backgroundColor: `${color}15`, color: color, border: `1px solid ${color}35` }}
    >
      {text}
    </span>
  );
}
