/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import {
  PetConfig,
  PetType,
  StarPuffUser,
  StoreItem,
  TaskItem,
  PetWhisper,
  CommunityPost
} from "./types";
import StardustCeremony from "./features/memorial/StardustCeremony";
import HomeCanvas from "./scenes/HomeCanvas";
// @ts-ignore
import puffCatImage from "./assets/images/puff_cat_1779553092843.png";
import NebulaGateCanvas from "./scenes/NebulaGateCanvas";
import MemoryFlashbackModal, { PET_MEMORIES } from "./features/memorial/MemoryFlashbackModal";
import MemoryAlbum from "./features/memorial/MemoryAlbum";
import Pet3DReconstruction from "./pet3d/Pet3DReconstruction";
import OnboardingGuide from "./features/system/OnboardingGuide";
import CheckInCalendar from "./features/system/CheckInCalendar";
import AnniversaryManager from "./features/memorial/AnniversaryManager";
import PetMemoryTimeline from "./features/memorial/PetMemoryTimeline";
import MultiPetSelector from "./features/system/MultiPetSelector";
import ArCameraSimulation from "./pet3d/ArCameraSimulation";
import WishingWell from "./features/social/WishingWell";
import CelestialV26Suite from "./scenes/CelestialV26Suite";
import MemorialZone from "./features/memorial/MemorialZone";
import ResonanceSystem from "./features/social/ResonanceSystem";
import NotificationSettings from "./features/system/NotificationSettings";
import AiSettings from "./features/system/AiSettings";
import { playSound } from "./audio/AudioSynth";
import { localDateString } from "./utils/date";
import { sendChatMessage, generateWhispers } from "./api";
import { useMicrotransaction, applyGrantToUser, type PurchaseFlowState } from "./hooks/useMicrotransaction";
import { useSteam } from "./hooks/useSteam";
import { ACHIEVEMENTS, unlock } from "./steam/achievements";
import type { GrantPayload } from "./api";
import {
  getCompanionState,
  calcCurrentEnergy,
  pickPhrase,
  getPhrasesForState,
  findEnergyFood,
  PHRASES,
  ENERGY_FOODS,
  VIP_DAILY_RECOVERY,
  LOGIN_DAILY_BONUS,
} from "./data/companionEnergy";
import ErrorBoundary from "./components/ErrorBoundary";
import { flushSaveToDisk } from "./persistence/saveManager";
import {
  Sparkles,
  Heart,
  Calendar,
  Layers,
  Crown,
  Coins,
  Send,
  MessageSquare,
  Compass,
  BookOpen,
  Share2
} from "lucide-react";

// Seed constant items
export const DEFAULT_KITTEN: PetConfig = {
  id: "pet_tianle_default",
  name: "天乐",
  type: "猫",
  ownerName: "守护者",
  breed: "英短乳白 (Cream Kitten)",
  passingDate: "2025-04-12",
  primaryColor: "#fad0a3", // warm gold/cream kitten
  secondaryColor: "#ffffff",
  stardustMatrixHex: ["#fad0a3", "#ffffff", "#8fa4b3", "#ff8ba7"],
  personalityTags: ["温柔精灵", "贴心小棉袄", "温柔粘人"],
  moodLevel: 98,
  happiness: 95,
  birthDay: "2023-05-18",
  memorialDay: "2025-04-12",
  statusMood: 75,
  statusHunger: 80,
  statusCleanliness: 95,
  statusEnergy: 90,
  companionEnergy: 90,
  companionEnergyUpdatedAt: Date.now(),
  isSleeping: false,
  level: 1,
  exp: 0,
  favoriteSnacks: ["猫条", "冻干生肉", "星光小鱼干"],
  anniversariesList: [
    { id: "a_1", date: "2026-05-18", title: "天乐的三岁冥诞 🎂", desc: "我们在星宿天空城为你买了一块永不熄灭的繁星蛋糕。" },
    { id: "a_2", date: "2026-04-12", title: "踏上彩虹桥一周年 🌸", desc: "一年了，你在星尘彼端也一定交到了很多好伙伴对不对？" }
  ],
  memoryTimelineList: [
    { id: "m_1", date: "2023-07-20", title: "初次相遇那天 🏠", content: "你缩在猫包角落，带着那对灰蓝色的大眼睛，怯生生地看着我。那一刻，我就知道你要成为我的挚爱宝贝了。" },
    { id: "m_2", date: "2024-12-25", title: "第一个暖洋洋的冬天 ❄️", content: "窗外下起了小雪，你揣着雪白的小手爪，趴在我胸口呼噜呼噜地睡了整个下午，像一个特大号的暖手宝。" }
  ],
  model3d: {
    sourceImage: puffCatImage, // High-fidelity cream cream kitten with grey-blue eyes
    verticesCount: 240,
    shapeNodes: [
      { x: 0.0, y: 0.45, z: 0.5, label: "粉嫩小湿润鼻子 Nose", color: "#ff8ba7" },
      { x: -0.16, y: 0.52, z: 0.4, label: "灰蓝色大眼睛 L-Eye", color: "#7e95a5" },
      { x: 0.16, y: 0.52, z: 0.4, label: "灰蓝色大眼睛 R-Eye", color: "#7e95a5" },
      { x: -0.28, y: 0.75, z: 0.25, label: "毛茸左耳 L-Ear", color: "#fad0a3" },
      { x: 0.28, y: 0.75, z: 0.25, label: "毛茸右耳 R-Ear", color: "#fad0a3" },
      { x: 0.0, y: 0.0, z: -0.1, label: "温暖毛茸胴体 Main Body", color: "#fad0a3" },
      { x: -0.18, y: -0.55, z: 0.25, label: "雪山雪地左手掌 L-Paw", color: "#ffffff" },
      { x: 0.18, y: -0.55, z: 0.25, label: "雪山雪地右手掌 R-Paw", color: "#ffffff" },
      { x: -0.15, y: -0.58, z: -0.25, label: "左后肢侧骨架 L-Leg", color: "#fad0a3" },
      { x: 0.15, y: -0.58, z: -0.25, label: "右后肢侧骨架 R-Leg", color: "#fad0a3" },
      { x: -0.25, y: -0.1, z: -0.6, label: "灵巧小尾端 Tail tip", color: "#fad0a3" }
    ],
    depthMapColors: ["#fad0a3", "#fbe2c5", "#ffffff", "#7e95a5", "#ff8ba7", "#ffb3c1"],
    dimensions: { depth: 0.9, height: 1.15, width: 0.95 },
    physicsBounciness: 0.75,
    glowIntensity: 0.85,
    reconstructionDate: "2026-05-23",
    breathingRate: 2.6,
    loreParagraph: "根据小喵咪“天乐”的照片透视特征重建。圆融的英短头部几何模型，经典的黄金比例瞳距对焦机制，胸肺部呼吸微位移在 2.6 秒/周期振荡。天乐化作永恒的温暖粒子束，以 3D 偏振姿态，生动守护在您的身侧。"
  }
};

const OUT_ITEMS: StoreItem[] = [
  {
    id: "halo_golden",
    name: "星愿光环",
    type: "outfit",
    price: 200,
    description: "漂浮在小脑壳上的金色微光圈，象征着重生的天使祝福",
    effect: "头顶散发神圣的金黄色粒子光圈",
    astrocadePrompt: "Minimal pixel art golden halo ring with amber sparks, pure gold glitter"
  },
  {
    id: "trail_neon",
    name: "超新星尾迹",
    type: "outfit",
    price: 320,
    description: "运动时随尾羽荡漾开的七彩重离子尾轨，美轮美奂",
    effect: "漂浮飞行时自动向下流泻繁星粒子",
    astrocadePrompt: "Pixel particle nebula trailing sparks, neon teal cyan purple space tail"
  },
  {
    id: "orbit_stars",
    name: "群星环绕",
    type: "outfit",
    price: 520,
    description: "三颗小恒星围绕身体作3D交替轨道旋转，如同宇宙中心",
    effect: "身上环绕旋转三颗五角像素星轨",
    astrocadePrompt: "Cosmic solar orbit planetary matrix 2d canvas pixel art stars"
  },
  {
    id: "cape_aurora",
    name: "梦幻极光披风",
    type: "outfit",
    price: 750,
    description: "在后肩披上用流光编织的半透明彩带，流淌极光渐变色",
    effect: "身后渲染起伏波浪状渐变色织带",
    astrocadePrompt: "Translucent northern lights silk cape flowing, high tech retro cyber gradient"
  },
  {
    id: "outfit_combo",
    name: "永结星缘礼包",
    type: "outfit",
    price: 1314,
    description: "一生一世专属纪念！融合光环与披风，全身转化为流线炫彩彩虹态",
    effect: "全像素粒子解锁彩虹色动态色相轮转效果",
    astrocadePrompt: "Rainbow constellation ultimate bundle pixel glowing aura and crest"
  }
];

const SNACK_ITEMS: StoreItem[] = [
  { id: "snack_candy", name: "星云霜糖", type: "snack", price: 12, description: "香甜软糯的彩色气体糖球。喂食恢复 1 轮主页对话次数。", astrocadePrompt: "sugar cookie puff" },
  { id: "snack_biscuit", name: "冰晶星心饼", type: "snack", price: 18, description: "咬起来咯嘣脆的零下恒星碎冰屑。喂食恢复 1 轮主页对话次数。", astrocadePrompt: "star shape icing cookie" },
  { id: "snack_canned", name: "月夜深海鱼罐", type: "snack", price: 25, description: "富含纯净月光藻成分的珍稀鱼罐。喂食恢复 1 轮主页对话次数。", astrocadePrompt: "cyberpunk luxury tuna feed" },
  { id: "snack_bone", name: "彩虹矿石骨头", type: "snack", price: 30, description: "硬度适中的可咬像素矿石骨，小狗磨牙最爱。恢复 1 轮对话数。", astrocadePrompt: "rainbow glowing dog bone" },
  { id: "snack_milk", name: "星尘脱脂奶", type: "snack", price: 40, description: "提炼自银河系中冷气体云，暖体舒骨。恢复 1 轮对话数。", astrocadePrompt: "retro milk bottle with purple space liquid" },
  { id: "snack_truffle", name: "仙女座黑松露", type: "snack", price: 55, description: "重组仙女座深空沉积真菌，入口即化。恢复 1 轮对话数。", astrocadePrompt: "black mushroom stellar crystal" },
  { id: "snack_chips", name: "超新星曲奇饼", type: "snack", price: 70, description: "烤制于炙热白矮星边缘的松脆酥饼。恢复 1 轮对话数。", astrocadePrompt: "galaxy chocolate chips waffle" },
  { id: "snack_fish", name: "银河极光小鱼干", type: "snack", price: 85, description: "带有电离极光波的烘焙深海冷鱼，猫咪狂喜。恢复 1 轮对话数。", astrocadePrompt: "crispy glowing electric fish dried snack" },
  { id: "snack_jelly", name: "暗物质软浆果冻", type: "snack", price: 100, description: "完全透明的水溶态高维空间软滑果冻。恢复 1 轮对话数。", astrocadePrompt: "neon magenta jelly puddle bouncing item" },
  { id: "snack_bar", name: "太空能核补棒", type: "snack", price: 120, description: "百分百无杂质的太空能量聚合压缩饼，吃完充满动力。恢复 1 轮对话数。", astrocadePrompt: "glow power core bar slot" }
];

const GIFT_ITEMS: StoreItem[] = [
  { id: "gift_dust", name: "一颗星尘", type: "gift", price: 50, description: "赠予别的家长！对方家园将燃起绚丽的 stardust 粒子闪光特效", effect: "受赠方宠物瞬间触发5秒粒子爆发", astrocadePrompt: "magical twinkling pixel dust pouch" },
  { id: "gift_beam", name: "一束星光", type: "gift", price: 300, description: "赠予别家宝贝！对方宠物变大发光10秒，行为自动存档于耳语游记日志中", effect: "宠物变亮发光，触发系统高亮广播", astrocadePrompt: "gold radiant starlight beam column vector" }
];

const COMM_PRES_POSTS: CommunityPost[] = [
  {
    id: "post_1",
    authorName: "美短桃子妈",
    petName: "桃桃",
    petType: "猫",
    primaryColor: "#ffccd5",
    message: "昨天桃桃在大世界跑进了猎户座森林，听系统提示它在那里爬上了极光参天树。它以前在家里就最喜欢爬纱窗让我头疼。看着日志里写它爬树抓红色毛球的样子，眼泪一下子就止不住了，但我知道它现在没有疾病束缚，可以玩得很高兴。❤️",
    date: "2026-05-20 18:22",
    likes: 18,
    hasLiked: false,
    comments: [
      { id: "c_1", authorName: "拉布拉多皮皮爸", text: "摸摸家长。大森林里有很多新伙伴，我家皮皮肯定在下面陪桃桃一起玩毛球呢！", date: "2026-05-20 19:00" },
      { id: "c_2", authorName: "金毛嘟嘟", text: "泪目，像素小猫一定很可爱，我们一起看星。", date: "2026-05-20 20:15" }
    ]
  },
  {
    id: "post_2",
    authorName: "小柴犬福宝的老爸",
    petName: "福宝",
    petType: "狗",
    primaryColor: "#deb887",
    message: "今天起床收到了福宝寄录的每日耳语。它说它昨天穿过彗尾跑道跑得像风一样快，还说身上最亮的斑点是我在想它时它亮起的灯！这设计真的太治愈了。我给它买了星愿光环，装扮上之后在主页飞的好漂亮。谢谢开发组，谢谢 Astrocade 设计。",
    date: "2026-05-21 08:14",
    likes: 24,
    hasLiked: true,
    comments: [
      { id: "c_3", authorName: "喵呜", text: "我也刚刚给咪咪配了群星环绕，小动物们都在看它，太骄傲啦！", date: "2026-05-21 09:12" }
    ]
  }
];

export default function App() {
  // Tabs: "home" (Stardust Home), "galaxy" (Nebula Gate), "community" (See Star People), "store" (Base Shop), "profile" (VIP/Dossier/Inventory)
  const [activeTab, setActiveTab] = useState<"home" | "galaxy" | "community" | "store" | "profile" | "v26_suite">("home");

  // 持久化：周期全量快照 → userData/save.json；窗口关闭/卸载前立即 flush，防崩档丢进度
  useEffect(() => {
    const flush = () => {
      void flushSaveToDisk();
    };
    const timer = setInterval(flush, 5000);
    window.addEventListener("beforeunload", flush);
    window.addEventListener("pagehide", flush);
    return () => {
      clearInterval(timer);
      window.removeEventListener("beforeunload", flush);
      window.removeEventListener("pagehide", flush);
    };
  }, []);

  // User details with localStorage persistence
  const [user, setUser] = useState<StarPuffUser>(() => {
    const local = localStorage.getItem("starpuff_user");
    let parsed: any = null;
    if (local) {
      try {
        parsed = JSON.parse(local);
      } catch (e) {
        // use default empty
      }
    }
    const defaultVal: StarPuffUser = {
      ownerName: "星之守护者",
      membership: "free",
      stardustCoins: 520, // free starter budget
      unlimitedTalks: false,
      dialogsRemaining: 5,
      dialogsMax: 5,
      streakDays: 1,
      activePet: DEFAULT_KITTEN,
      historyLogs: [
        "在星云之门地标【玫瑰星云公园】停留了极久。",
        "在大世界漫步时，受到了斑斑的摩擦问候。",
        "吃到了主人亲切投喂的冰晶星心饼。"
      ],
      outfitsUnlocked: [],
      outfitsEquipped: {
        halo: null,
        trail: null,
        orbit: null,
        cape: null
      },
      allPets: [DEFAULT_KITTEN],
      onboardingCompleted: false,
      checkInCalendar: [],
      lastCheckInDate: ""
    };

    if (parsed) {
      // 若上次会话中断于上帝演示模式，优先恢复被覆盖前的真实经济字段
      let ecoBackup: Partial<StarPuffUser> = {};
      try {
        const rawBackup = localStorage.getItem("starpuff_economy_backup");
        if (rawBackup) ecoBackup = JSON.parse(rawBackup);
      } catch (e) {}
      return {
        ...defaultVal,
        ...parsed,
        ...ecoBackup,
        allPets: parsed.allPets || (parsed.activePet ? [parsed.activePet] : []),
        checkInCalendar: parsed.checkInCalendar || [],
        onboardingCompleted: parsed.onboardingCompleted ?? false
      };
    }
    return defaultVal;
  });

  // Steam 用户 ID（内购用）。优先取 Steamworks 登录态的真实 ID，离线时用本地稳定占位 ID 便于联调。
  const steamStatus = useSteam();
  const [steamId, setSteamId] = useState<string>(() => {
    const local = localStorage.getItem("starpuff_steam_id");
    if (local) return local;
    // 生成一个稳定的本地测试 ID，便于开发联调
    const generated = "76561198000000000";
    localStorage.setItem("starpuff_steam_id", generated);
    return generated;
  });
  useEffect(() => {
    if (steamStatus.steamId && steamStatus.steamId !== steamId) {
      setSteamId(steamStatus.steamId);
      localStorage.setItem("starpuff_steam_id", steamStatus.steamId);
    }
  }, [steamStatus.steamId]);

  // Steam 成就：累计型条件检查（幂等，Steam 不可用时静默跳过）
  useEffect(() => {
    if (!steamStatus.available) return;
    const coins = user.stardustCoins ?? 0;
    if (coins >= 1000) void unlock(ACHIEVEMENTS.coins1000);
    if ((user.streakDays ?? 0) >= 7) void unlock(ACHIEVEMENTS.sevenDayStreak);
    const maxLevel = Math.max(1, ...(user.allPets ?? []).map((p) => p.level ?? 1));
    if (maxLevel >= 10) void unlock(ACHIEVEMENTS.petLevel10);
    if ((user.allPets ?? []).length >= 2) void unlock(ACHIEVEMENTS.multiPets);
  }, [user, steamStatus.available]);

  // 内购流程状态（用于 UI 反馈）
  const [purchaseState, setPurchaseState] = useState<PurchaseFlowState>({
    status: "idle",
    orderId: null,
    error: null,
  });

  // 发放回调：把后端返回的权益写回用户状态
  const handleGranted = (payload: GrantPayload, orderId: string) => {
    setUser(prev => applyGrantToUser(prev, payload));
    if (payload.kind === "stardust_coins") {
      triggerToast(`💎 购买成功！星尘币 +${payload.amount}（订单 ${orderId}）`);
    } else {
      triggerToast(`👑 会员开通成功！${payload.membershipLevel === "vip_year" ? "年卡" : "月卡"}权益即刻生效`);
    }
    void unlock(ACHIEVEMENTS.firstPurchase);
    playSound("success");
  };

  const { runPurchase } = useMicrotransaction(steamId, handleGranted);

  // ---- 陪伴能量系统（心寒话术）----

  // 当前活跃宠物的陪伴能量快照（从 user.activePet 派生，用于 UI 即时刷新）
  const [energyTick, setEnergyTick] = useState(0); // 用于周期性触发重算
  // 累计喂食次数（用于触发「深度羁绊」暖心文案），按宠物 id 分 key 存储
  const activePetId = user.activePet?.id ?? user.activePet?.name ?? "default";
  const [feedCount, setFeedCount] = useState<number>(() => {
    const local = localStorage.getItem(`starpuff_feed_count_${activePetId}`);
    return local ? Number(local) : 0;
  });
  /** 触发深度羁绊文案所需的累计喂食次数阈值 */
  const DEEP_BOND_THRESHOLD = 10;
  // 首睡免费唤醒标记（每个宠物独立，首次沉睡可免费唤醒一次）
  const [freeReviveUsed, setFreeReviveUsed] = useState<boolean>(() => {
    return localStorage.getItem(`starpuff_free_revive_${activePetId}`) === "1";
  });

  // 切换宠物时，重新加载该宠物的喂食次数与首睡免费标记
  useEffect(() => {
    const localCount = localStorage.getItem(`starpuff_feed_count_${activePetId}`);
    setFeedCount(localCount ? Number(localCount) : 0);
    setFreeReviveUsed(localStorage.getItem(`starpuff_free_revive_${activePetId}`) === "1");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePetId]);

  /** 从 user.activePet 计算当前陪伴能量（应用衰减） */
  const currentCompanionEnergy = (() => {
    const pet = user.activePet;
    if (!pet) return 100;
    const base = pet.companionEnergy ?? pet.statusEnergy ?? 90;
    const updatedAt = pet.companionEnergyUpdatedAt ?? Date.now();
    // 免疫期内不衰减
    const immuneUntil = pet.companionEnergyImmuneUntil ?? 0;
    if (Date.now() < immuneUntil) return Math.max(0, base);
    return calcCurrentEnergy(base, updatedAt);
  })();

  const companionState = getCompanionState(currentCompanionEnergy);

  /** 更新活跃宠物的陪伴能量（写回 user 状态并刷新时间戳） */
  const updateCompanionEnergy = (nextEnergy: number, opts?: { immuneUntil?: number }) => {
    setUser(prev => {
      if (!prev.activePet) return prev;
      const updatedPet: PetConfig = {
        ...prev.activePet,
        companionEnergy: Math.max(0, Math.min(100, nextEnergy)),
        companionEnergyUpdatedAt: Date.now(),
        companionEnergyImmuneUntil: opts?.immuneUntil ?? prev.activePet.companionEnergyImmuneUntil ?? 0,
        isSleeping: nextEnergy <= 0,
      };
      // 同步 allPets 列表中的该宠物
      const allPets = prev.allPets?.map(p =>
        p.id === updatedPet.id ? updatedPet : p
      ) ?? (prev.activePet ? [updatedPet] : []);
      return { ...prev, activePet: updatedPet, allPets };
    });
  };

  /** 喂食恢复能量（使用星尘币购买的能量道具） */
  const handleFeedEnergy = (foodId: string) => {
    const food = findEnergyFood(foodId);
    if (!food) return;

    // 满能量拦截：避免误扣币（唤醒剂除外，唤醒剂即使满能量也用于解除沉睡态）
    if (food.id !== "energy_revive" && currentCompanionEnergy >= 100) {
      triggerToast("🌟 陪伴能量已经满格啦，暂时不需要喂食哦～");
      playSound("beep");
      return;
    }

    // 沉睡状态只能用唤醒剂
    if (companionState.state === "sleeping" && food.id !== "energy_revive") {
      triggerToast("😴 星宠正在沉睡，只能用「星尘唤醒剂」唤醒它哦。");
      playSound("beep");
      return;
    }

    // 首睡免费唤醒：首次沉睡的宠物可免费使用一次唤醒剂
    const isFreeRevive = food.id === "energy_revive" && !freeReviveUsed;
    if (!isFreeRevive && user.stardustCoins < food.price) {
      triggerToast(`⚠️【星尘币不足】${food.name} 需要 ${food.price} 星尘币，您当前只有 ${user.stardustCoins} 币。`);
      playSound("beep");
      return;
    }

    // 扣币（免费唤醒不扣币）
    if (!isFreeRevive) {
      setUser(prev => ({ ...prev, stardustCoins: prev.stardustCoins - food.price }));
    } else {
      setFreeReviveUsed(true);
      try { localStorage.setItem(`starpuff_free_revive_${activePetId}`, "1"); } catch (e) {}
    }

    // 恢复能量
    const nextEnergy = Math.min(100, currentCompanionEnergy + food.energyRestore);
    updateCompanionEnergy(nextEnergy, {
      immuneUntil: food.decayImmuneDays
        ? Date.now() + food.decayImmuneDays * 24 * 60 * 60 * 1000
        : 0,
    });

    // 累计喂食次数并持久化（按宠物 id 分 key）
    const nextFeedCount = feedCount + 1;
    setFeedCount(nextFeedCount);
    try {
      localStorage.setItem(`starpuff_feed_count_${activePetId}`, String(nextFeedCount));
    } catch (e) {}

    // 反馈文案
    if (food.id === "energy_revive") {
      const revivePhrase = pickPhrase(PHRASES.revive);
      if (isFreeRevive) {
        triggerToast(`💝 第一次陷入沉睡，免费唤醒！✨ ${user.activePet?.name} 睁开了眼睛：「${revivePhrase}」`);
      } else {
        triggerToast(`✨ 星尘唤醒剂生效！${user.activePet?.name} 睁开了眼睛：「${revivePhrase}」`);
      }
    } else if (nextFeedCount >= DEEP_BOND_THRESHOLD && nextFeedCount % 5 === 0) {
      // 深度羁绊：喂食很多次后，触发更深情暖心的文案（每 5 次触发一次，避免过频）
      const deepPhrase = pickPhrase(PHRASES.deepBond);
      triggerToast(`${food.icon} ${user.activePet?.name} 依偎着你，轻声说：「${deepPhrase}」`);
      playSound("chime");
      setConfettiTrigger(prev => prev + 2);
      return;
    } else {
      const recoverPhrase = pickPhrase(PHRASES.recovery);
      triggerToast(`${food.icon} 喂食了【${food.name}】，${user.activePet?.name}：「${recoverPhrase}」`);
    }
    playSound("success");
    setConfettiTrigger(prev => prev + 1);
  };

  // 周期性刷新能量（每 30 秒重算一次，让 UI 反映时间流逝），并把实时衰减值写回 activePet，
  // 使 HomeCanvas 等下游组件能通过 petConfig.companionEnergy 拿到最新能量
  useEffect(() => {
    const timer = setInterval(() => {
      setEnergyTick(t => t + 1);
      // 同步实时能量到 activePet（画布/情绪系统依赖此字段）
      setUser(prev => {
        if (!prev.activePet) return prev;
        const pet = prev.activePet;
        const base = pet.companionEnergy ?? pet.statusEnergy ?? 90;
        const updatedAt = pet.companionEnergyUpdatedAt ?? Date.now();
        const immuneUntil = pet.companionEnergyImmuneUntil ?? 0;
        const liveEnergy = Date.now() < immuneUntil
          ? Math.max(0, base)
          : calcCurrentEnergy(base, updatedAt);
        if (Math.round(liveEnergy) === Math.round(base)) return prev; // 无变化则跳过，避免无效渲染
        const updatedPet = { ...pet, companionEnergy: liveEnergy };
        const allPets = prev.allPets?.map(p => p.id === updatedPet.id ? updatedPet : p) ?? [updatedPet];
        return { ...prev, activePet: updatedPet, allPets };
      });
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  // 每日登录能量奖励 & 月卡自动恢复（挂载时结算一次）
  useEffect(() => {
    if (!user.activePet) return;
    const today = localDateString();
    let bonus = 0;

    // 首次迁移：旧存档没有 companionEnergyUpdatedAt 时初始化时间戳（否则永不衰减）
    if (!user.activePet.companionEnergyUpdatedAt) {
      setUser(prev => {
        if (!prev.activePet) return prev;
        const updatedPet: PetConfig = {
          ...prev.activePet,
          companionEnergy: prev.activePet.companionEnergy ?? prev.activePet.statusEnergy ?? 90,
          companionEnergyUpdatedAt: Date.now(),
        };
        const allPets = prev.allPets?.map(p => p.id === updatedPet.id ? updatedPet : p) ?? [updatedPet];
        return { ...prev, activePet: updatedPet, allPets };
      });
      return;
    }

    // 每日登录送 10 点
    if (user.activePet.lastEnergyLoginBonusDate !== today) {
      bonus += LOGIN_DAILY_BONUS;
    }
    // 月卡自动恢复 30 点
    if (user.membership !== "free" && user.activePet.lastVipRecoveryDate !== today) {
      bonus += VIP_DAILY_RECOVERY;
    }

    if (bonus > 0) {
      const next = Math.min(100, currentCompanionEnergy + bonus);
      setUser(prev => {
        if (!prev.activePet) return prev;
        const updatedPet: PetConfig = {
          ...prev.activePet,
          companionEnergy: next,
          companionEnergyUpdatedAt: Date.now(),
          lastEnergyLoginBonusDate: today,
          lastVipRecoveryDate: prev.membership !== "free" ? today : prev.activePet?.lastVipRecoveryDate,
        };
        const allPets = prev.allPets?.map(p => p.id === updatedPet.id ? updatedPet : p) ?? [updatedPet];
        return { ...prev, activePet: updatedPet, allPets };
      });
      if (user.membership !== "free") {
        triggerToast(`🌅 每日登录 +${LOGIN_DAILY_BONUS} 能量，月卡自动恢复 +${VIP_DAILY_RECOVERY} 能量！`);
      } else {
        triggerToast(`🌅 每日登录赠送 +${LOGIN_DAILY_BONUS} 陪伴能量！`);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 监测能量状态：沉睡弹沉睡窗、心寒告别(<20)弹低能量窗、委屈(20-50)弹委屈窗
  useEffect(() => {
    if (!user.activePet) return;
    if (companionState.state === "sleeping" && !isSleepModalOpen) {
      // 进入沉睡时标记宠物 isSleeping
      if (!user.activePet.isSleeping) {
        updateCompanionEnergy(0);
      }
      setIsSleepModalOpen(true);
      setIsLowEnergyModalOpen(false);
      setIsHurtModalOpen(false);
    } else if (companionState.state === "farewell" && !isSleepModalOpen && !isLowEnergyModalOpen) {
      // 心寒告别（0-19）弹低能量提醒
      setIsLowEnergyModalOpen(true);
      setIsHurtModalOpen(false);
    } else if (companionState.state === "distant" && !isSleepModalOpen && !isLowEnergyModalOpen && !isHurtModalOpen) {
      // 失落疏离（20-49）弹委屈提醒（女性向：好虚弱，连尾巴都摇不动）
      setIsHurtModalOpen(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companionState.state, energyTick]);

  // V2.0 God mode vs Guest mode control states
  // 默认访客模式（上线游玩版本）；上帝模式仅供开发/测试临时启用，需持久化避免刷新回退
  const [systemPlayMode, setSystemPlayMode] = useState<"god" | "guest">(() => {
    return localStorage.getItem("starpuff_system_play_mode") === "god" ? "god" : "guest";
  });
  const [isArCameraOpen, setIsArCameraOpen] = useState(false);

  // 持久化运行模式
  useEffect(() => {
    localStorage.setItem("starpuff_system_play_mode", systemPlayMode);
  }, [systemPlayMode]);

  // 演示模式（上帝/访客）的真实经济快照，防止演示覆盖写穿持久存档
  const economyBackupRef = useRef<Partial<StarPuffUser> | null>(null);
  const ECONOMY_BACKUP_KEY = "starpuff_economy_backup";

  const loadEconomyBackup = (): Partial<StarPuffUser> | null => {
    if (economyBackupRef.current) return economyBackupRef.current;
    try {
      const raw = localStorage.getItem(ECONOMY_BACKUP_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  };

  // Sync state override on playMode modification
  useEffect(() => {
    if (systemPlayMode === "god") {
      setUser(prev => {
        // 已有备份（上次会话中断于上帝模式）则沿用，否则快照当前真实经济字段
        let backup = loadEconomyBackup();
        if (!backup) {
          backup = {
            membership: prev.membership,
            unlimitedTalks: prev.unlimitedTalks,
            dialogsRemaining: prev.dialogsRemaining,
            dialogsMax: prev.dialogsMax,
            stardustCoins: prev.stardustCoins
          };
          try { localStorage.setItem(ECONOMY_BACKUP_KEY, JSON.stringify(backup)); } catch (e) {}
        }
        economyBackupRef.current = backup;
        // 上帝模式：临时授予无限对话 + 大量星尘币 + 年卡，便于开发测试
        return {
          ...prev,
          membership: "vip_year",
          unlimitedTalks: true,
          dialogsRemaining: 999999,
          dialogsMax: 999999,
          stardustCoins: Math.max(prev.stardustCoins, 99999)
        };
      });
    } else {
      setUser(prev => {
        const backup = loadEconomyBackup();
        // 若有备份则恢复真实经济字段；否则回退到访客默认态（免费 + 少量对话 + 初始币）
        const restored = backup
          ? { ...prev, ...backup }
          : {
              ...prev,
              membership: "free" as const,
              unlimitedTalks: false,
              dialogsRemaining: 3,
              dialogsMax: 5,
              stardustCoins: 15
            };
        economyBackupRef.current = null;
        try { localStorage.removeItem(ECONOMY_BACKUP_KEY); } catch (e) {}
        // 恢复真实经济/会员字段，保留演示期间获得的其他进度（宠物、装扮等）
        return restored;
      });
    }
  }, [systemPlayMode]);

  // Whisper log lists from pet
  const [whispers, setWhispers] = useState<PetWhisper[]>(() => {
    const local = localStorage.getItem("starpuff_whispers");
    if (local) {
      try {
        const parsed = JSON.parse(local);
        if (parsed.length > 0) return parsed;
      } catch (e) {}
    }
    // Seed initial welcome whisper
    return [
      {
        id: "w_seed",
        date: "2026-05-21",
        content: "主人，昨天我漫步到了织女星小镇，找了个全是星光粒子的松软角落踩了很久。这里的温度刚刚好，像你以前抱我的胸口。虽然猫咪变成了星尘，但我还是会在你每次叹气的时候，悄悄用尾毛拂过你的指尖。要在人间好好生活，不许因为我偷哭哦。",
        coverImage: "/assets/images/unsplash/1543466835-00a7907e9de1.jpg",
        likes: 12,
        hasLiked: false,
        comments: [
          { id: "wc_1", authorName: "主人", text: "宝贝，我的天使，妈妈永远想你。", date: "2026-05-21 15:00" }
        ]
      }
    ];
  });

  // Community posts including seeded
  const [communityPosts, setCommunityPosts] = useState<CommunityPost[]>(() => {
    const local = localStorage.getItem("starpuff_comp_posts");
    if (local) {
      try {
        return JSON.parse(local);
      } catch (e) {}
    }
    return COMM_PRES_POSTS;
  });

  // Daily Tasks state tracker（按本地日期每日重置进度）
  const [tasks, setTasks] = useState<TaskItem[]>(() => {
    const seed: TaskItem[] = [
      { id: "task_login", name: "登录星宿家园", reward: 5, maxTimes: 1, completedTimes: 0, description: "每日首次打开程序" },
      { id: "task_interact", name: "点击默影互动", reward: 1, maxTimes: 3, completedTimes: 0, description: "点击家园主屏的2D像素宠物" },
      { id: "task_share", name: "分享治愈耳语给旁人", reward: 15, maxTimes: 1, completedTimes: 0, description: "一键分享耳语故事" },
      { id: "task_explore", name: "星云宇宙停留30秒", reward: 20, maxTimes: 1, completedTimes: 0, description: "漫游星云之门并触发碰撞事件" },
      { id: "task_like", name: "给他人耳语/社群点赞", reward: 1, maxTimes: 10, completedTimes: 0, description: "在看星的人社区浏览点赞" },
      { id: "task_receive_gift", name: "收到「一颗星尘」礼物", reward: 2, maxTimes: 5, completedTimes: 0, description: "模拟其他用户送给你装饰礼物" }
    ];
    try {
      const local = localStorage.getItem("starpuff_tasks");
      if (!local) return seed;
      const parsed = JSON.parse(local);
      if (!Array.isArray(parsed) || parsed.length === 0) return seed;
      const tasksDate = localStorage.getItem("starpuff_tasks_date");
      if (tasksDate === localDateString()) return parsed;
      // 跨天：重置所有每日任务进度（含历史无日期标记的旧存档）
      return parsed.map((t: TaskItem) => ({ ...t, completedTimes: 0 }));
    } catch (e) {
      return seed;
    }
  });

  // Food Inventory
  const [foodInventory, setFoodInventory] = useState<Record<string, number>>(() => {
    const local = localStorage.getItem("starpuff_food");
    if (local) {
      try { return JSON.parse(local); } catch (e) {}
    }
    return {
      snack_candy: 3,
      snack_biscuit: 2,
    };
  });

  // Selected snack for feeding detail
  const [selectedSnackForFeed, setSelectedSnackForFeed] = useState<StoreItem | null>(null);

  // VIP Dialog Modal
  const [isVipModalOpen, setIsVipModalOpen] = useState(false);
  // 沉睡弹窗 / 低能量弹窗 / 委屈提醒弹窗
  const [isSleepModalOpen, setIsSleepModalOpen] = useState(false);
  const [isLowEnergyModalOpen, setIsLowEnergyModalOpen] = useState(false);
  const [isHurtModalOpen, setIsHurtModalOpen] = useState(false);
  // Re-generate Whisper loading state
  const [isGeneratingWhisper, setIsGeneratingWhisper] = useState(false);
  
  // Sidebar tab tracker: "whispers" (心语信) or "chat" (AI实时聊天)
  const [sidebarMode, setSidebarMode] = useState<"whispers" | "chat">("whispers");
  const [chatInput, setChatInput] = useState("");
  const [isChatTyping, setIsChatTyping] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  const [chatMessages, setChatMessages] = useState<Array<{ id: string; sender: "user" | "pet"; text: string; timestamp: string }>>(() => {
    const local = localStorage.getItem("starpuff_chat_history_v2");
    if (local) {
      try {
        const parsed = JSON.parse(local);
        if (parsed && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return [
      {
        id: "chat_init",
        sender: "pet",
        text: `呼噜呼噜～ 主人，我是你的小宝贝天乐呀！我正在由粉色星能织成的彩虹草坪上踩奶呢，你想和我说点什么心里话吗？我都会一直倾听你的呼唤。`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ];
  });

  // Track and save chat history（防抖：避免长记录高频全量序列化阻塞主线程）
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        localStorage.setItem("starpuff_chat_history_v2", JSON.stringify(chatMessages));
      } catch (e) {}
    }, 400);
    return () => clearTimeout(timer);
  }, [chatMessages]);

  // Dynamic initialization for chat welcome when pet swaps
  useEffect(() => {
    if (user.activePet) {
      const pName = user.activePet.name;
      const greetTexts = [
        `呼噜呼噜～ ${user.ownerName}，我是你的小宝贝${pName}呀！我正在由粉色星能织成的彩虹草坪上踩奶呢，你想和我说点什么心里话吗？我都在听着哦。`,
        `汪汪！${user.ownerName}，我是你的小天使${pName}。听到遥远的星际共振连线了，我马上丢下玩具飞奔了过来，蹭蹭你！今天过得怎么样？`,
        `喵呜～ 守护者，看到星宿天空为你点亮的晨星了吗？我是${pName}。彩虹桥底下一片软绵绵的，但我还是最钟意你暖暖的手心，快来和我说说话吧！`
      ];
      const selectedGreet = user.activePet.type.includes("狗") ? greetTexts[1] : user.activePet.type.includes("猫") ? greetTexts[0] : greetTexts[2];
      
      setChatMessages(prev => {
        if (prev.length === 1 && prev[0].id === "chat_init") {
          return [{
            id: "chat_init",
            sender: "pet",
            text: selectedGreet,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }];
        }
        return prev;
      });
    }
  }, [user.activePet]);

  // Smooth auto-scroll for chat dialog
  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, isChatTyping, sidebarMode]);

  const handleSendChatMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!chatInput.trim() || isChatTyping) return;

    // 陪伴能量状态拦截：沉睡/低能量时无法正常对话
    if (companionState.state === "sleeping") {
      const userText = chatInput.trim();
      setChatMessages(prev => [
        ...prev,
        {
          id: `chat_${Date.now()}_u`,
          sender: "user" as const,
          text: userText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        },
        {
          id: `chat_${Date.now()}_sleep`,
          sender: "pet" as const,
          text: "......",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
      setChatInput(""); // 清空输入框，闭环完整
      triggerToast("😴 星宠正在沉睡，无法回应。请用「星尘唤醒剂」唤醒它。");
      playSound("beep");
      return;
    }

    if (!companionState.canInteract) {
      // 失落疏离/心寒告别：拒绝正常互动，只流露状态话术
      const userText = chatInput.trim();
      const phrase = pickPhrase(getPhrasesForState(companionState.state));
      setChatMessages(prev => [
        ...prev,
        {
          id: `chat_${Date.now()}_u`,
          sender: "user" as const,
          text: userText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        },
        {
          id: `chat_${Date.now()}_low`,
          sender: "pet" as const,
          text: phrase,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
      setChatInput(""); // 清空输入框，闭环完整
      triggerToast(`💔 ${user.activePet?.name} 陪伴能量不足，正在疏离中...喂食可以重新温暖它。`);
      playSound("chime");
      return;
    }

    // Bondi and budget locks
    if (!user.unlimitedTalks && user.dialogsRemaining <= 0) {
      triggerToast("⚠️ 今日星尘心灵连线次数已达上限，解锁VIP或等待明日刷新！");
      playSound("chime");
      return;
    }

    const userMsgText = chatInput.trim();
    setChatInput(""); // Clear field

    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg = {
      id: `chat_${Date.now()}_u`,
      sender: "user" as const,
      text: userMsgText,
      timestamp
    };

    // Update state
    const updatedMessages = [...chatMessages, userMsg];
    setChatMessages(updatedMessages);
    setIsChatTyping(true);
    playSound("click");

    // Reduce dialogue quota if not VIP
    if (!user.unlimitedTalks) {
      setUser(prev => ({
        ...prev,
        dialogsRemaining: Math.max(0, prev.dialogsRemaining - 1)
      }));
    }

    // Trigger interactive task completion check
    try {
      setTasks(prev => prev.map(t => {
        if (t.id === "task_interact" && t.completedTimes < t.maxTimes) {
          setTimeout(() => {
            triggerToast("🎉 日常互动 +1（与爱宠进行星尘AI对话）");
          }, 300);
          setUser(u => ({ ...u, stardustCoins: u.stardustCoins + t.reward }));
          return { ...t, completedTimes: t.completedTimes + 1 };
        }
        return t;
      }));
    } catch (err) {}

    // Invoke API call
    try {
      const data = await sendChatMessage({
        message: userMsgText,
        chatHistory: updatedMessages.map(msg => ({
          sender: msg.sender,
          text: msg.text
        })),
        ownerName: user.ownerName,
        petName: user.activePet?.name || "天乐",
        petType: user.activePet?.type || "猫",
        breed: user.activePet?.breed || "英短乳白",
        lore: user.activePet?.model3d?.loreParagraph || "",
        personality: user.activePet?.personalityTags?.join(",") || "温柔粘人",
      });

      if (data.success && data.text) {
        setChatMessages(prev => [
          ...prev,
          {
            id: `chat_${Date.now()}_p`,
            sender: "pet" as const,
            text: data.text,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
        playSound("success");
        incrementBondingCharge(5); // Dialogue is a high bonding activity (+5)
      } else {
        throw new Error(data.error || "获取回复失败");
      }
    } catch (error: any) {
      console.error("AI chat companion error:", error);
      triggerToast(`⚠️ 与星尘连接微弱: ${error.message || "请求超时"}`);
      // Fallback response inline
      setChatMessages(prev => [
        ...prev,
        {
          id: `chat_${Date.now()}_p_err`,
          sender: "pet" as const,
          text: `喵呜～ 感觉刚才有一阵强烈的太阳流风卷过了天空之城，无线电有一些波动。不过只要我们心意相连，你的爱我就能接收到。守护者，别太辛苦太劳累哦。`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsChatTyping(false);
    }
  };

  // Quick status announcements
  const [systemAlert, setSystemAlert] = useState<string | null>(null);

  // Community post input fields
  const [newPostText, setNewPostText] = useState("");
  // Stardust trigger for canvas spark burst
  const [confettiTrigger, setConfettiTrigger] = useState(0);

  // --- PET MEMORY FLASHBACK SYSTEM STATES ---
  const [unlockedMemoryIds, setUnlockedMemoryIds] = useState<string[]>(() => {
    const local = localStorage.getItem("starpuff_unlocked_memories");
    if (local) {
      try { return JSON.parse(local); } catch (e) {}
    }
    return ["mem_first_meet"]; // pre-unlock first meet to allow immediate exploration
  });

  const [bondingCharge, setBondingCharge] = useState<number>(() => {
    const local = localStorage.getItem("starpuff_bonding_charge");
    return local ? Number(local) : 30; // start with 30% progress
  });

  const [activeMemoryFlashbackId, setActiveMemoryFlashbackId] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem("starpuff_unlocked_memories", JSON.stringify(unlockedMemoryIds));
  }, [unlockedMemoryIds]);

  useEffect(() => {
    localStorage.setItem("starpuff_bonding_charge", bondingCharge.toString());
  }, [bondingCharge]);

  const incrementBondingCharge = (amount: number) => {
    if (!user.activePet) return;
    setBondingCharge(prev => {
      const next = prev + amount;
      if (next >= 100) {
        // Find matching memory templates for the pet
        let candidates = PET_MEMORIES.filter(m => m.category === user.activePet?.type || m.category === "通用");
        if (candidates.length === 0) {
          candidates = PET_MEMORIES;
        }

        // Prioritise unlocking currently locked matching memories if available
        const lockedCandidates = candidates.filter(m => !unlockedMemoryIds.includes(m.id));
        const finalSelectionList = lockedCandidates.length > 0 ? lockedCandidates : candidates;
        const selected = finalSelectionList[Math.floor(Math.random() * finalSelectionList.length)];

        if (selected) {
          setTimeout(() => {
            setActiveMemoryFlashbackId(selected.id);
            playSound("chime");
          }, 600);
        }
        return 0; // reset charge meter on triggering flashback
      }
      return next;
    });
  };
  // ------------------------------------------

  // Sync state to localStorage
  useEffect(() => {
    localStorage.setItem("starpuff_user", JSON.stringify(user));
  }, [user]);

  useEffect(() => {
    localStorage.setItem("starpuff_whispers", JSON.stringify(whispers));
  }, [whispers]);

  useEffect(() => {
    localStorage.setItem("starpuff_comp_posts", JSON.stringify(communityPosts));
  }, [communityPosts]);

  useEffect(() => {
    localStorage.setItem("starpuff_tasks", JSON.stringify(tasks));
    localStorage.setItem("starpuff_tasks_date", localDateString());
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem("starpuff_food", JSON.stringify(foodInventory));
  }, [foodInventory]);

  // Show a non-blocking temporary toast notice
  const triggerToast = (text: string) => {
    setSystemAlert(text);
    setTimeout(() => {
      setSystemAlert(null);
    }, 3800);
  };

  // Login coin award checking on mount
  useEffect(() => {
    // Automatically trigger login task if not already done
    const loginTask = tasks.find(t => t.id === "task_login");
    if (loginTask && loginTask.completedTimes === 0) {
      updateTaskProgress("task_login", 1);
      triggerToast("🌅 登录成功！首登奖励 +5 星尘币入账！");
    }
  }, []);

  // Update a task progress safely
  const updateTaskProgress = (taskId: string, increment = 1) => {
    setTasks(prev => {
      return prev.map(t => {
        if (t.id === taskId) {
          const original = t.completedTimes;
          const maxed = Math.min(t.maxTimes, original + increment);
          const diff = maxed - original;
          if (diff > 0) {
            const rewardCoin = diff * t.reward;
            setUser(u => ({ ...u, stardustCoins: u.stardustCoins + rewardCoin }));
            triggerToast(`🏅 任务【${t.name}】更新！获取星尘币 +${rewardCoin}`);
            playSound("success");
          }
          return { ...t, completedTimes: maxed };
        }
        return t;
      });
    });
  };

  // Complete Pet Ceremony Onboarding callback
  const handleCeremonyComplete = (config: PetConfig) => {
    setUser(prev => {
      const updatedPet = {
        ...config,
        id: config.id ?? `pet_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`, // 稳定 id 作为状态存储 key
        personalityTags: ["温柔精灵", "贴心小棉袄"],
        moodLevel: 95,
        happiness: 90,
        memoryTimelineList: [],
        anniversariesList: [],
        // 初始化陪伴能量系统字段，避免新宠物缺失能量数据
        companionEnergy: config.companionEnergy ?? 90,
        companionEnergyUpdatedAt: Date.now(),
        isSleeping: false
      };
      const nextPets = prev.allPets ? [...prev.allPets, updatedPet] : [updatedPet];
      return {
        ...prev,
        activePet: updatedPet,
        allPets: nextPets,
        dialogsRemaining: prev.membership === "free" ? 5 : 999999
      };
    });
    playSound("success");
    triggerToast(`✨【${config.name}】升星汇聚成功！常驻暖阳家宿。`);
  };

  const handleCheckIn = (coinsAwarded: number, todayString: string) => {
    setUser(prev => {
      const updatedCalendar = [...(prev.checkInCalendar || []), todayString];
      return {
        ...prev,
        stardustCoins: prev.stardustCoins + coinsAwarded,
        checkInCalendar: updatedCalendar,
        lastCheckInDate: todayString
      };
    });
    void unlock(ACHIEVEMENTS.firstCheckIn);
  };

  const handleSelectPet = (pet: PetConfig) => {
    setUser(prev => ({
      ...prev,
      activePet: pet
    }));
  };

  const handleAddPet = (newPet: PetConfig) => {
    setUser(prev => {
      const petWithId: PetConfig = {
        ...newPet,
        id: newPet.id ?? `pet_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        // 初始化陪伴能量系统字段
        companionEnergy: newPet.companionEnergy ?? 90,
        companionEnergyUpdatedAt: Date.now(),
        isSleeping: false
      };
      const nextPets = prev.allPets ? [...prev.allPets, petWithId] : [petWithId];
      return {
        ...prev,
        allPets: nextPets,
        activePet: petWithId
      };
    });
  };

  const handleUpdateAnniversaries = (updatedList: any[]) => {
    setUser(prev => {
      if (!prev.activePet) return prev;
      const updatedPet = {
        ...prev.activePet,
        anniversariesList: updatedList
      };
      const updatedAll = (prev.allPets || []).map(p => p.name === updatedPet.name ? updatedPet : p);
      return {
        ...prev,
        activePet: updatedPet,
        allPets: updatedAll
      };
    });
  };

  const handleUpdateTimeline = (updatedTimeline: any[]) => {
    setUser(prev => {
      if (!prev.activePet) return prev;
      const updatedPet = {
        ...prev.activePet,
        memoryTimelineList: updatedTimeline
      };
      const updatedAll = (prev.allPets || []).map(p => p.name === updatedPet.name ? updatedPet : p);
      return {
        ...prev,
        activePet: updatedPet,
        allPets: updatedAll
      };
    });
  };

  const handleUpdateTags = (newTags: string[]) => {
    setUser(prev => {
      if (!prev.activePet) return prev;
      const updatedPet = {
        ...prev.activePet,
        personalityTags: newTags
      };
      const updatedAll = (prev.allPets || []).map(p => p.name === updatedPet.name ? updatedPet : p);
      return {
        ...prev,
        activePet: updatedPet,
        allPets: updatedAll
      };
    });
  };

  // 通知偏好配置：从 localStorage 读取初始化，保存时同步更新，避免"只写不读"导致配置丢失
  const [notificationConfig, setNotificationConfig] = useState<any>(() => {
    try {
      const raw = localStorage.getItem("starpuff_notification_config");
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  });

  const handleSaveNotificationConfig = (cfg: any) => {
    setNotificationConfig(cfg);
    try {
      localStorage.setItem("starpuff_notification_config", JSON.stringify(cfg));
    } catch (e) {
      console.error(e);
    }
  };

  const handleOnboardingComplete = () => {
    setUser(prev => {
      const nextUser = {
        ...prev,
        onboardingCompleted: true,
        stardustCoins: prev.stardustCoins + 100 // award 100 coins for completing the guide!
      };
      localStorage.setItem("starpuff_user", JSON.stringify(nextUser));
      return nextUser;
    });
    triggerToast("🏅 恭喜！你完成了星轨引航新手训练！温存相伴，获赠 100星尘币与向导的祝福！");
    playSound("success");
  };

  // Simulated background whisper generation using server API
  const generateNewWhisper = async () => {
    if (!user.activePet) {
      triggerToast("❌ 抱歉，需要先在主页完成宠物升星仪式！");
      return;
    }

    // 低能量状态下，耳语变成「回忆杀」——不再调用 AI，直接用本地催泪文案
    if (companionState.memoryFlashback) {
      setIsGeneratingWhisper(true);
      const text = pickPhrase(PHRASES.lowEnergyWhispers);
      const whisper: PetWhisper = {
        id: `w_lowenergy_${Date.now()}`,
        date: localDateString(),
        content: text,
        coverImage: "/assets/images/unsplash/1514888286974-6c03e2ca1dba.jpg",
        likes: 0,
        hasLiked: false,
        comments: [],
      };
      setWhispers(prev => [whisper, ...prev]);
      triggerToast(`🥀 ${user.activePet.name} 的耳语变得微弱...这是一封带着伤感的心语信。`);
      playSound("chime");
      setIsGeneratingWhisper(false);
      return;
    }
    
    setIsGeneratingWhisper(true);
    triggerToast("💫 正在调用文心AI引擎生成陪伴耳语并抓取 Astrocade 像素插画...");
    playSound("bubble");

    try {
      const data = await generateWhispers({
        ownerName: user.ownerName,
        petName: user.activePet.name,
        petType: user.activePet.type,
        activeLevel: user.membership === "free" ? 6 : 12,
        recentEvents: user.historyLogs,
        isVip: user.membership !== "free",
      });

      if (data.success && data.whispers && data.whispers.length > 0) {
        void unlock(ACHIEVEMENTS.firstWhisper);
        // Mix custom illustration pixel cards depending on nature of event
        const presetCoverImages = [
          "/assets/images/unsplash/1579783900882-c0d3dad7b119.jpg",
          "/assets/images/unsplash/1544085311-11a028465b03.jpg",
          "/assets/images/unsplash/1620641788421-7a1c342ea42e.jpg",
        ];

        const newlyReceived: PetWhisper[] = data.whispers.map((txt: string, index: number) => ({
          id: `w_gen_${Date.now()}_${index}`,
          date: localDateString(),
          content: txt,
          coverImage: presetCoverImages[index % presetCoverImages.length],
          likes: 0,
          hasLiked: false,
          comments: []
        }));

        setWhispers(prev => [...newlyReceived, ...prev]);
        triggerToast(`📜 收获了【${user.activePet.name}】投递的 ${newlyReceived.length} 封星门信件！已存入回忆册。`);
        playSound("success");
        
        // Accumulate custom interactions logs
        setUser(u => ({
          ...u,
          historyLogs: [
            "在大世界彗星跑浪冲坡摔了个屁墩...",
            "极速撞到了别家帅气狗狗，摩擦出了漫天火光！",
            "在图书馆研读主人们写给小动物的信卷。"
          ]
        }));
      } else {
        throw new Error("No payload found");
      }
    } catch (e) {
      console.error(e);
      triggerToast("⚠️ 通信超时，启动本地柔和算法离线合成治愈耳语...");
      // Fallback
      const mockWhisper: PetWhisper = {
        id: `w_fallback_${Date.now()}`,
        date: localDateString(),
        content: `${user.ownerName}，不要为我难过。我昨天又在星尘小镇睡了个温暖的午觉，梦里满是你在夕阳下拉着我散步的香甜味道。我已经学会了在大世界踏波浪，所有的别的小动物都在羡慕我身上的微光呢。要替我好好吃饭、开心大笑！`,
        coverImage: "/assets/images/unsplash/1579783900882-c0d3dad7b119.jpg",
        likes: 3,
        hasLiked: false,
        comments: []
      };
      setWhispers(prev => [mockWhisper, ...prev]);
      playSound("chime");
    } finally {
      setIsGeneratingWhisper(false);
    }
  };

  // Home Screen interactive click Handler
  const handleHomePetClick = () => {
    if (!user.activePet) return;

    // 陪伴能量状态拦截
    if (companionState.state === "sleeping") {
      triggerToast("😴 星宠陷入沉睡，星尘正在飘散...请用「星尘唤醒剂」唤醒它。");
      playSound("beep");
      return;
    }
    if (!companionState.canInteract) {
      const phrase = pickPhrase(getPhrasesForState(companionState.state));
      triggerToast(`💔 ${phrase}`);
      playSound("chime");
      return;
    }

    // Check dialog availability
    if (user.membership === "free" && user.dialogsRemaining <= 0) {
      triggerToast("🐾【额度用尽】小宝贝精神有点疲惫在睡觉瞌睡。请到【储物包】喂食它零食补充精神能！");
      playSound("beep");
      return;
    }

    // Spend dialogue tick (or infinite if VIP)
    if (user.membership === "free") {
      setUser(prev => ({
        ...prev,
        dialogsRemaining: Math.max(0, prev.dialogsRemaining - 1)
      }));
    }

    // Charge memory flashback energy
    incrementBondingCharge(15);

    // Reward task points
    updateTaskProgress("task_interact", 1);
  };

  // Feeding action
  const handleFeedSnack = (snack: StoreItem) => {
    const qty = foodInventory[snack.id] || 0;
    if (qty <= 0) {
      triggerToast(`🍩【库存短缺】没有【${snack.name}】了！请到星尘商店购买。`);
      playSound("beep");
      return;
    }

    // Decrement inventory
    setFoodInventory(prev => ({
      ...prev,
      [snack.id]: qty - 1
    }));

    // Increment dialog ticks
    setUser(prev => {
      const updatedRemaining = prev.membership === "free"
        ? Math.min(prev.dialogsMax, prev.dialogsRemaining + 1)
        : prev.dialogsRemaining; // VIP is already infinite
        
      return {
        ...prev,
        dialogsRemaining: updatedRemaining
      };
    });

    triggerToast(`🌸 喂食了【${snack.name}】！${user.activePet?.name} 开心极了，嘴边飘着闪烁的霜气(+1 互动次数)`);
    playSound("success");
    setConfettiTrigger(prev => prev + 1); // explode sparkles!
    incrementBondingCharge(25); // Feeding gives high bonding energy
    setSelectedSnackForFeed(null);
  };

  // Buy Shop items
  const handleBuyItem = (item: StoreItem) => {
    // Discount calculations based on membership tier
    let multiplier = 1.0;
    if (user.membership === "vip_month") multiplier = 0.9;
    if (user.membership === "vip_year") multiplier = 0.8;
    const finalPrice = Math.round(item.price * multiplier);

    if (user.stardustCoins < finalPrice) {
      triggerToast(`⚠️【余额不足】购买【${item.name}】需要 ${finalPrice} 星尘币，您当前只有 ${user.stardustCoins} 币。`);
      playSound("beep");
      return;
    }

    // Deduct coins & record unlock
    if (item.type === "outfit") {
      setUser(prev => {
        const alreadyHas = prev.outfitsUnlocked.includes(item.id);
        const nextUnlocked = alreadyHas ? prev.outfitsUnlocked : [...prev.outfitsUnlocked, item.id];
        
        // Auto equip purchased item
        const nextEquipped = { ...prev.outfitsEquipped };
        if (item.id.includes("halo")) nextEquipped.halo = item.id;
        if (item.id.includes("trail")) nextEquipped.trail = item.id;
        if (item.id.includes("orbit")) nextEquipped.orbit = item.id;
        if (item.id.includes("cape")) nextEquipped.cape = item.id;
        if (item.id.includes("combo")) {
          // equips everything
          nextEquipped.halo = "halo_rainbow";
          nextEquipped.cape = "cape_rainbow";
        }

        return {
          ...prev,
          stardustCoins: prev.stardustCoins - finalPrice,
          outfitsUnlocked: nextUnlocked,
          outfitsEquipped: nextEquipped
        };
      });
      triggerToast(`🛍️ 成功换购专属外观：【${item.name}】并已立即穿戴！`);
      playSound("success");
      setConfettiTrigger(prev => prev + 1);
    } else if (item.type === "snack" || item.type === "gift") {
      // Snack replenishment
      setFoodInventory(prev => ({
        ...prev,
        [item.id]: (prev[item.id] || 0) + 1
      }));
      setUser(prev => ({
        ...prev,
        stardustCoins: prev.stardustCoins - finalPrice
      }));
      triggerToast(`🛍️ 成功换购零食：【${item.name}】x 1已存入包囊！`);
      playSound("success");
    }
  };

  // Toggle accessory equipped state
  const handleEquipToggle = (itemId: string) => {
    setUser(prev => {
      const nextEquipped = { ...prev.outfitsEquipped };
      
      if (itemId.includes("halo")) {
        nextEquipped.halo = nextEquipped.halo === itemId ? null : itemId;
      } else if (itemId.includes("trail")) {
        nextEquipped.trail = nextEquipped.trail === itemId ? null : itemId;
      } else if (itemId.includes("orbit")) {
        nextEquipped.orbit = nextEquipped.orbit === itemId ? null : itemId;
      } else if (itemId.includes("cape")) {
        nextEquipped.cape = nextEquipped.cape === itemId ? null : itemId;
      }
      
      return {
        ...prev,
        outfitsEquipped: nextEquipped
      };
    });
    triggerToast("✨ 配戴装饰配饰已调整！已即时渲染到默影身上。");
    playSound("click");
  };

  // Like system helper for whispers
  const handleLikeWhisper = (id: string) => {
    setWhispers(prev => {
      return prev.map(w => {
        if (w.id === id) {
          const delta = w.hasLiked ? -1 : 1;
          if (delta > 0) {
            updateTaskProgress("task_like", 1);
          }
          return { ...w, likes: w.likes + delta, hasLiked: !w.hasLiked };
        }
        return w;
      });
    });
    playSound("chime");
  };

  // Like community posts
  const handleLikePost = (id: string) => {
    setCommunityPosts(prev => {
      return prev.map(p => {
        if (p.id === id) {
          const delta = p.hasLiked ? -1 : 1;
          if (delta > 0) {
            updateTaskProgress("task_like", 1);
          }
          return { ...p, likes: p.likes + delta, hasLiked: !p.hasLiked };
        }
        return p;
      });
    });
    playSound("chime");
  };

  // Simulated gifts to other community posts
  const handleSendGiftToPost = (post: CommunityPost, gift: StoreItem) => {
    if (user.stardustCoins < gift.price) {
      triggerToast("⚠️ 换购礼物预算不够了，可以做做每日任务哦！");
      playSound("beep");
      return;
    }

    // Deduct coins
    setUser(prev => ({
      ...prev,
      stardustCoins: prev.stardustCoins - gift.price
    }));

    // Inject receive gift string
    setCommunityPosts(prev => {
      return prev.map(p => {
        if (p.id === post.id) {
          return {
            ...p,
            giftReceived: gift.name,
            message: `${p.message} \n\n🌌 [收到其他家长投喂礼物 【${gift.name}】，触发闪光鸣叫！]`
          };
        }
        return p;
      });
    });

    triggerToast(`🎁 成功买下【${gift.name}】并赠予了【${post.petName}】！事件已广播至整条星河。`);
    playSound("success");
  };

  // Create customized post to public Chat community ("看星的人")
  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostText.trim()) return;

    if (!user.activePet) {
      triggerToast("❌ 请先完成升星仪式创建默影，然后再给大伙发帖吧！");
      return;
    }

    const nextPost: CommunityPost = {
      id: `post_${Date.now()}`,
      authorName: user.ownerName || "神秘家长",
      petName: user.activePet.name,
      petType: user.activePet.type,
      primaryColor: user.activePet.primaryColor,
      message: newPostText,
      date: new Date().toISOString().replace("T", " ").substring(0, 16),
      likes: 0,
      hasLiked: false,
      comments: []
    };

    setCommunityPosts(prev => [nextPost, ...prev]);
    setNewPostText("");
    triggerToast("✨ 发帖发布成功！社区其他家长现在就能看到你的小动物了。");
    playSound("success");
  };

  // Simulation buying direct RMB items
  const handleBuyPremiumService = (title: string, cost: number) => {
    playSound("bubble");
    const confirmPay = window.confirm(`【微信支付模拟】\n确定支付 ￥${cost} 购买并启动：\n「${title}」吗？`);
    if (confirmPay) {
      playSound("success");
      triggerToast(`💎 支付成功！已经录入高级后台计算排程，服务「${title}」即刻生效。`);
      if (title.includes("视频")) {
        triggerToast("📹 正在混合渲染15秒像素视频片段...成品已寄送至您的预留邮箱！");
      } else {
        triggerToast("🏠 家园3D/2D像素同源高保真还原完成！已解锁高级暖风地插装扮。");
      }
    }
  };

  // 真实内购：购买星尘币（itemId 对应 products.json 中的星尘币商品）
  // pkg.itemId 由 UI 传入，对应后端商品 ID
  const handleTopupCoins = async (itemId: number) => {
    setPurchaseState({ status: "purchasing", orderId: null, error: null });
    const result = await runPurchase(itemId, 1);
    setPurchaseState(result);
    if (result.status === "error") {
      triggerToast(`⚠️ 购买失败：${result.error || "未知错误"}`);
      playSound("beep");
    }
  };

  // 真实内购：订阅会员（itemId 对应 products.json 中的会员商品）
  const handleSubscribeVip = async (tier: "month" | "year" | "trial") => {
    // itemId 映射：200=月卡 201=年卡；trial 暂用月卡商品
    const itemId = tier === "year" ? 201 : 200;
    setPurchaseState({ status: "purchasing", orderId: null, error: null });
    const result = await runPurchase(itemId, 1);
    setPurchaseState(result);
    if (result.status === "success") {
      setIsVipModalOpen(false);
    } else {
      triggerToast(`⚠️ 订阅失败：${result.error || "未知错误"}`);
      playSound("beep");
    }
  };

  const handleShareWhisperAction = (whisp: PetWhisper) => {
    playSound("chime");
    updateTaskProgress("task_share", 1);
    
    // Web Share API simulation or popup
    alert(`💌 【一键小程序分享】\n已复制以下文书并生成精美像素插图卡片：\n\n"${whisp.content}"\n\n可去社群、朋友圈或微信聊天展示，召唤更多看星人陪它玩！`);
  };

  return (
    <div
      className="w-full min-h-screen bg-[#05070A] text-slate-100 flex justify-center items-center overflow-x-hidden p-0 md:p-4 font-sans select-none relative"
      style={{
        backgroundImage: "radial-gradient(circle at 50% 50%, #170d2b 0%, #05070a 100%)"
      }}
      id="main-immersive-frame"
    >
      {/* SVG Noise filter texture overlay for pixelated film grain look */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2500/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          filter: "contrast(180%) brightness(95%)"
        }}
      />

      {/* Decorative Blur Spheres */}
      <div className="absolute top-20 left-40 w-80 h-80 rounded-full blur-[140px] bg-[#7B61FF]/10 pointer-events-none" />
      <div className="absolute bottom-10 right-20 w-80 h-80 rounded-full blur-[120px] bg-[#F27D26]/10 pointer-events-none" />

      {/* Main mockup device container */}
      <ErrorBoundary>
      <div className="w-full max-w-5xl bg-[#090715]/95 border border-white/10 rounded-2xl flex flex-col min-h-[780px] shadow-[0_0_50px_rgba(123,97,255,0.15)] relative overflow-hidden backdrop-blur-xl shrink-0">
        
        {/* TOP STATUS ROW */}
        {systemAlert && (
          <div className="absolute top-18 inset-x-0 mx-auto max-w-md z-50 bg-[#120b2d]/95 hover:bg-[#1a113a]/95 border border-purple-500/30 shadow-[0_0_15px_rgba(123,97,255,0.4)] text-xs text-indigo-200 px-4 py-2.5 rounded-full flex items-center justify-between gap-2 animate-bounce">
            <span className="flex items-center gap-1.5 font-mono">
              <Sparkles className="w-4 h-4 text-pink-400 animate-spin" />
              {systemAlert}
            </span>
            <button onClick={() => setSystemAlert(null)} className="text-[10px] text-gray-500 hover:text-white font-bold ml-2">×</button>
          </div>
        )}

        {/* HEADER BAR */}
        <header className="h-16 flex items-center justify-between px-6 border-b border-white/5 backdrop-blur-md z-30 bg-[#070314]/80">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 bg-gradient-to-tr from-purple-600 to-orange-400 rounded-lg shadow-[0_0_15px_rgba(123,97,255,0.3)] flex items-center justify-center p-0.5">
              <div className="w-full h-full bg-[#05070A] rounded-sm flex items-center justify-center font-mono text-xs font-bold leading-none text-purple-400">
                SP
              </div>
            </div>
            <div>
              <span className="text-sm md:text-md font-medium tracking-widest uppercase flex items-center gap-1.5 font-sans">
                喵汪星云 <span className="text-xs text-purple-400 font-mono">StarPuff</span>
              </span>
              <p className="text-[8px] text-gray-400 font-sans tracking-wide">星尘像素引擎 · 温柔守护中 ✨</p>
            </div>
          </div>

          <div className="flex items-center space-x-3 md:space-x-5">
            {/* Stardust coins counter (Clickable to trigger charge) */}
            <button
              onClick={() => setActiveTab("store")}
              className="flex items-center space-x-2 bg-white/5 border border-white/10 hover:border-orange-400/30 rounded-full px-3 py-1 transition-all"
              title="充值与任务商店"
            >
              <Coins className="w-3.5 h-3.5 text-orange-400" />
              <span className="text-xs font-mono tracking-tighter text-orange-300 font-bold">
                {user.stardustCoins} <span className="text-[8px] text-gray-400 font-normal">星尘币</span>
              </span>
            </button>

            {/* Level Indicator / Streak days */}
            <div className="hidden sm:flex items-center space-x-2 bg-white/5 border border-white/10 rounded-full px-3 py-1">
              <span className="text-[10px] font-mono text-pink-400">登岛{user.streakDays}天</span>
              <span className="text-[10px] text-gray-500 font-mono">|</span>
              <span className="text-[10px] font-mono text-indigo-300">羁绊 LV.8</span>
              <div className="w-16 h-1 w-16 bg-white/10 rounded-full overflow-hidden">
                <div className="w-3/4 h-full bg-gradient-to-r from-purple-500 to-orange-400"></div>
              </div>
            </div>

            {/* VIP Label Checkbox */}
            {user.membership !== "free" ? (
              <span className="px-2.5 py-0.5 bg-gradient-to-r from-yellow-500/20 to-amber-500/20 text-yellow-300 border border-yellow-500/40 rounded-full text-[9px] uppercase tracking-wider font-bold">
                👑 守护月卡
              </span>
            ) : (
              <button
                onClick={() => setIsVipModalOpen(true)}
                className="px-2.5 py-0.5 bg-white/10 hover:bg-purple-500/20 hover:text-purple-300 text-white/70 border border-white/10 rounded-full text-[9px] uppercase tracking-wider font-mono transition-colors"
              >
                开通会员
              </button>
            )}
          </div>
        </header>

        {/* TOP NAVIGATION TAB BAR */}
        <nav className="h-16 border-b border-white/5 backdrop-blur-xl z-20 flex items-center justify-around px-2 md:px-12 bg-[#070314]/90 shrink-0">
          
          <button
            onClick={() => {
              playSound("success");
              setUser(prev => ({ ...prev, onboardingCompleted: false }));
              triggerToast("💡 开启系统引航新手训练！");
            }}
            className={`flex flex-col items-center space-y-1 cursor-pointer outline-none transition-all ${
              !user.onboardingCompleted ? "text-yellow-400 scale-110" : "opacity-75 hover:opacity-100 text-white"
            }`}
          >
            <div className="w-6 h-6 flex items-center justify-center">
              <BookOpen className="w-4.5 h-4.5 text-yellow-400"       />
            </div>
            <span className="text-[10px] font-bold tracking-tighter font-sans">系统指引</span>
          </button>

          <button
            onClick={() => { playSound("click"); setActiveTab("home"); }}
            className={`flex flex-col items-center space-y-1 cursor-pointer outline-none transition-all ${
              activeTab === "home" ? "text-orange-400 scale-110" : "opacity-75 hover:opacity-100 text-white"
            }`}
          >
            <div className="w-6 h-6 flex items-center justify-center">
              <div className={`w-3.5 h-3.5 bg-orange-400 rounded-sm shadow-[0_0_10px_#F27D26] ${activeTab === "home" ? "scale-125 rotate-45" : ""}`}       />
            </div>
            <span className="text-[10px] font-bold tracking-tighter font-sans">星尘家园</span>
          </button>

          <button
            onClick={() => { playSound("click"); setActiveTab("galaxy"); }}
            className={`flex flex-col items-center space-y-1 cursor-pointer outline-none transition-all ${
              activeTab === "galaxy" ? "text-indigo-400 scale-110" : "opacity-75 hover:opacity-100 text-white"
            }`}
          >
            <div className="w-6 h-6 flex items-center justify-center">
              <div className={`w-4 h-4 flex items-center justify-center border-2 rotate-45 ${activeTab === "galaxy" ? "border-indigo-400 w-4 h-4 font-bold text-white bg-indigo-500/20" : "border-white/50"}`}       />
            </div>
            <span className="text-[10px] font-bold tracking-tighter font-sans">星云之门</span>
          </button>

          <button
            onClick={() => { playSound("click"); setActiveTab("community"); }}
            className={`flex flex-col items-center space-y-1 cursor-pointer outline-none transition-all ${
              activeTab === "community" ? "text-purple-400 scale-110" : "opacity-75 hover:opacity-100 text-white"
            }`}
          >
            <div className="w-6 h-6 flex items-center justify-center text-md">
              🪐
            </div>
            <span className="text-[10px] font-bold tracking-tighter font-sans">看星的人</span>
          </button>

          <button
            onClick={() => { playSound("click"); setActiveTab("store"); }}
            className={`flex flex-col items-center space-y-1 cursor-pointer outline-none transition-all ${
              activeTab === "store" ? "text-pink-400 scale-110" : "opacity-75 hover:opacity-100 text-white"
            }`}
          >
            <div className="w-6 h-6 flex items-center justify-center text-md">
              🛍️
            </div>
            <span className="text-[10px] font-bold tracking-tighter font-sans">星尘商店</span>
          </button>

          <button
            onClick={() => { playSound("click"); setActiveTab("profile"); }}
            className={`flex flex-col items-center space-y-1 cursor-pointer outline-none transition-all ${
              activeTab === "profile" ? "text-cyan-400 scale-110" : "opacity-75 hover:opacity-100 text-white"
            }`}
          >
            <div className="w-6 h-6 flex items-center justify-center rounded-full border border-white/50 overflow-hidden bg-gradient-to-b from-slate-500 to-slate-700 w-4 h-4" />
            <span className="text-[10px] font-bold tracking-tighter font-sans">个人档案</span>
          </button>

          <button
            onClick={() => { playSound("click"); setActiveTab("v26_suite"); }}
            className={`flex flex-col items-center space-y-1 cursor-pointer outline-none transition-all ${
              activeTab === "v26_suite" ? "text-pink-400 scale-110" : "opacity-75 hover:opacity-100 text-white"
            }`}
          >
            <div className="w-6 h-6 flex items-center justify-center text-xs animate-pulse">
              🔮
            </div>
            <span className="text-[10px] font-bold tracking-tighter font-sans">2.6梦境舱</span>
          </button>

        </nav>

        {/* --- V2.0 GOD MODE vs GUEST MODE COMPARISON HUB CONSOLE --- */}
        <div className="bg-[#120e36] border-b border-purple-500/20 px-6 py-2 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs z-20 shrink-0">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
            </span>
            <span className="font-semibold text-white tracking-wide font-sans">
              ✨ 星云守护模式
            </span>
            <span className="text-gray-400 text-[10px] hidden sm:inline">
              切换你的守护体验
            </span>
          </div>
          
          <div className="flex bg-black/50 p-1 rounded-full border border-white/10 shadow-lg shrink-0">
            <button
              onClick={() => {
                playSound("success");
                setSystemPlayMode("god");
                triggerToast("👑 上帝开发模式激活：无限对话 + 99,999 星尘币 + 年卡特权，仅供开发测试！");
              }}
              className={`px-3.5 py-1 rounded-full text-[10px] font-bold transition-all flex items-center gap-1 leading-none ${
                systemPlayMode === "god"
                  ? "bg-gradient-to-r from-cyan-500 to-indigo-500 text-white shadow-[0_0_12px_rgba(6,182,212,0.5)]"
                  : "text-gray-400 hover:text-indigo-200"
              }`}
            >
              👑 上帝开发模式
            </button>
            <button
              onClick={() => {
                playSound("click");
                setSystemPlayMode("guest");
                triggerToast("👥 访客模式（正式上线版）：按真实会员身份运行，免费用户对话与星尘币受限。");
              }}
              className={`px-3.5 py-1 rounded-full text-[10px] font-bold transition-all flex items-center gap-1 leading-none ${
                systemPlayMode === "guest"
                  ? "bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-[0_0_12px_rgba(244,63,94,0.5)]"
                  : "text-gray-400 hover:text-indigo-200"
              }`}
            >
              👥 访客模式 (正式版)
            </button>
          </div>
        </div>

        {/* CONTAINER FOR VIEWS */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative" id="tab-content-container">
          
          {/* LEFT/PRIMARY CONTENT VIEW PORT */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 flex flex-col custom-scrollbar bg-[#0d091f]/30">
            
            {/* IF USER HAS NOT CREATED PET YET - RITUAL FORCED FIRST */}
            {!user.activePet ? (
              <div className="flex-1 flex flex-col justify-center max-w-2xl mx-auto py-8">
                <div className="text-center mb-6">
                  <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-300">
                    🌌 星尘彼端，灵宿指引
                  </h2>
                  <p className="text-xs text-gray-400 mt-1.5 leading-relaxed">
                    在您开启喵汪星云漫游前，请先为您的小家犬/小宝贝举行“星尘升星仪式”
                    <br />通过色彩光谱降饱和剥离游戏化，构建唯一的2D像素默影粒子灵魂。
                  </p>
                </div>
                <StardustCeremony
                  onComplete={handleCeremonyComplete}
                  playSparkleSound={() => playSound("sparkle")}
                />
              </div>
            ) : (
              /* VIEW DEFINITIONS */
              <>
                {/* 1. HOME VIEW (STARDUST HOUSE) */}
                {activeTab === "home" && (
                  <div className="flex-1 flex flex-col items-center justify-between gap-6" id="view-home">
                    <div className="w-full flex items-center justify-between border-b border-white/5 pb-3">
                      <div>
                        <h3 className="text-sm font-semibold tracking-wide text-white">
                          默影家园 : 暖阳小窝 🏡
                        </h3>
                        <p className="text-[10px] text-gray-400">
                          守护小宠：{user.activePet.breed} · {user.activePet.name} 元气守护中
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {/* Feed trigger */}
                        <button
                          onClick={() => {
                            playSound("bubble");
                            setActiveTab("profile");
                          }}
                          className="bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 border border-purple-500/30 px-3 py-1 rounded-lg text-[10px] font-medium flex items-center gap-1.5"
                        >
                          🦴 储物道具包
                        </button>
                        <button
                          onClick={generateNewWhisper}
                          disabled={isGeneratingWhisper}
                          className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-800 text-white px-3 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 shadow-lg"
                        >
                          <Sparkles className="w-3 h-3 text-pink-300 animate-spin" />
                          {isGeneratingWhisper ? "AI演算寄信中..." : "立刻召令每日耳语"}
                        </button>
                      </div>
                    </div>

                    {/* Interactive pixel Canvas container */}
                    <div className="w-full max-w-lg flex flex-col items-center py-4 relative">
                      {/* Active status tags */}
                      <div className="absolute top-4 left-4 z-20 flex space-x-2">
                        <span className="px-2.5 py-0.5 bg-black/60 border border-white/5 rounded-full text-[9px] font-sans tracking-wide text-slate-300">
                          ✨ 星尘凝聚 99%
                        </span>
                        <span className="px-2.5 py-0.5 bg-pink-500/20 border border-pink-500/30 rounded-full text-[9px] font-sans tracking-wide text-pink-300 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-pink-400 animate-ping" />
                          暖心陪伴中
                        </span>
                      </div>

                      {/* Canvas Graphics component */}
                      <HomeCanvas
                        petConfig={user.activePet}
                        equipped={user.outfitsEquipped}
                        onClickPet={handleHomePetClick}
                        stardustSparkleTrigger={confettiTrigger}
                      />

                      {/* Display name plate and active info */}
                      <div className="mt-4 text-center">
                        <h4 className="text-xl font-bold tracking-widest text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.4)]">
                          {user.activePet.name}
                        </h4>
                        <div className="flex items-center justify-center gap-2 mt-1.5 text-xs text-indigo-300 font-sans">
                          <span>🎂 {user.activePet.passingDate} 踏彩虹桥</span>
                          <span>·</span>
                          <span>羁绊活跃 · {user.unlimitedTalks ? "无限次" : `${user.dialogsRemaining}/5 轮`}</span>
                        </div>
                      </div>
                    </div>

                    {/* --- MEMORY FLASHBACK CHARGING PROGRESS WIDGET --- */}
                    <div className="w-full bg-[#110c2c]/85 border border-[#fc407a]/20 rounded-2xl p-4 space-y-2 max-w-lg shadow-[inset_0_1px_3px_rgba(255,255,255,0.05),0_8px_20px_rgba(0,0,0,0.4)]">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-[#ff5c8a] font-sans font-bold flex items-center gap-1">
                          <Heart className="w-3.5 h-3.5 fill-[#ff5c8a] animate-pulse" />
                          星心连系蓄力 · {bondingCharge}%
                        </span>
                        <span className="text-purple-300 text-[9px] font-mono animate-pulse">
                          {bondingCharge >= 80 ? "💖 星能饱满：一触即发温情闪回！" : "💫 蓄满100%唤醒生前故事"}
                        </span>
                      </div>
                      <div className="relative w-full h-3 bg-black/50 rounded-full overflow-hidden p-0.5 border border-white/5">
                        <div 
                          className="h-full rounded-full bg-gradient-to-r from-pink-500 via-[#ef476f] to-amber-400 transition-all duration-300 relative"
                          style={{ width: `${bondingCharge}%` }}
                        >
                          <span className="absolute right-0.5 top-0.5 w-1 h-1 rounded-full bg-white animate-ping" />
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-[8.5px] text-gray-500 font-sans">
                        <span>💡 日常抚摸(+15) · 投喂小零食(+25) · 抛送爱心/红毛球(+10)级联蓄能</span>
                        {systemPlayMode === "god" && (
                          <button 
                            onClick={() => {
                              incrementBondingCharge(100);
                              playSound("chime");
                            }}
                            className="text-pink-300 hover:text-pink-100 underline decoration-pink-500/20 active:scale-95 transition-transform"
                            id="trigger-test-flashback"
                          >
                            [ 测试闪回 ]
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Interactive micro play panel */}
                    <div className="w-full bg-[#110c2d]/60 border border-white/10 rounded-xl p-4 flex justify-around max-w-lg">
                      <button
                        onClick={() => {
                          playSound("click");
                          setConfettiTrigger(p => p+1);
                          triggerToast(`喂食飞吻给 ${user.activePet?.name}！`);
                          incrementBondingCharge(10);
                        }}
                        className="flex flex-col items-center gap-1 group active:scale-95 transition-transform"
                      >
                        <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 group-hover:bg-pink-500/10 group-hover:border-pink-500/30 flex items-center justify-center text-sm transition-all">
                          ❤️
                        </div>
                        <span className="text-[10px] text-gray-400 group-hover:text-white">抛送爱心</span>
                      </button>

                      <button
                        onClick={() => {
                          playSound("sparkle");
                          setConfettiTrigger(p => p+1);
                          triggerToast(`${user.activePet?.name} 在星空草地扔了扔红毛球！`);
                          incrementBondingCharge(12);
                        }}
                        className="flex flex-col items-center gap-1 group active:scale-95 transition-transform"
                      >
                        <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 group-hover:bg-purple-500/10 group-hover:border-purple-500/30 flex items-center justify-center text-sm transition-all">
                          🥎
                        </div>
                        <span className="text-[10px] text-gray-400 group-hover:text-white">扔红毛球</span>
                      </button>

                      <button
                        onClick={() => {
                          playSound("click");
                          triggerToast(`${user.activePet?.name} 正在为您播放疗愈背景白噪音《星光海》...`);
                          incrementBondingCharge(8);
                        }}
                        className="flex flex-col items-center gap-1 group active:scale-95 transition-transform"
                      >
                        <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 group-hover:bg-cyan-500/10 group-hover:border-cyan-500/30 flex items-center justify-center text-sm transition-all">
                          🎵
                        </div>
                        <span className="text-[10px] text-gray-400 group-hover:text-white">疗愈音乐</span>
                      </button>
                    </div>

                    {/* --- V2.0 ADVANCED PORTALS SECTIONS --- */}
                    <div className="w-full max-w-lg space-y-4">
                      {/* 1. AR Mode Portal Button Card */}
                      <div className="bg-gradient-to-r from-purple-900/30 via-pink-900/20 to-black/40 border border-pink-500/30 rounded-2xl p-4 flex items-center justify-between shadow-lg relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-pink-500/[0.04] blur-xl pointer-events-none" />
                        <div>
                          <h4 className="text-xs font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-300 to-cyan-300 font-sans flex items-center gap-1.5 leading-none">
                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                            ✨ V2.0 AR 极客追忆模式
                          </h4>
                          <p className="text-[9px] text-gray-400 mt-1.5 leading-relaxed">
                            支持模拟微信小程序 AR 镜片叠层摄像，将爱宠投影拖拽于现实房屋内。支持 Polaroid 胶片及 10s 追忆小录像！
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            playSound("bubble");
                            setIsArCameraOpen(true);
                          }}
                          className="px-3.5 py-1.5 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-mono text-[9px] font-bold rounded-xl shadow-[0_3px_10px_rgba(239,71,111,0.3)] shrink-0 transition-transform active:scale-95"
                        >
                          📷 开启AR
                        </button>
                      </div>

                      {/* 2. Mystical Stardust Wishing Well */}
                      <WishingWell
                        stardustCoins={user.stardustCoins}
                        onUpdateCoins={(amt) => {
                          setUser(prev => ({ ...prev, stardustCoins: Math.max(0, prev.stardustCoins + amt) }));
                        }}
                        triggerToast={triggerToast}
                        isGodMode={systemPlayMode === "god"}
                      />
                    </div>

                    {/* --- HIGH QUALITY MEMORY ALBUM ALBUM PANEL --- */}
                    <div className="w-full max-w-lg mt-2">
                       <MemoryAlbum 
                        petConfig={user.activePet}
                        unlockedIds={unlockedMemoryIds}
                        onSelectMemory={(id) => {
                          setActiveMemoryFlashbackId(id);
                        }}
                      />
                    </div>

                    {/* Newbie system integrations (P0-2, P0-7) */}
                    <div className="w-full max-w-lg mt-4 space-y-4">
                      <CheckInCalendar
                        checkInCalendar={user.checkInCalendar || []}
                        onCheckIn={handleCheckIn}
                        triggerToast={triggerToast}
                        lastCheckInDate={user.lastCheckInDate}
                      />
                      <MultiPetSelector
                        user={user}
                        onSelectPet={handleSelectPet}
                        onAddPet={handleAddPet}
                        triggerToast={triggerToast}
                      />
                    </div>
                  </div>
                )}

                {/* 2. GALAXY探索 VIEW (NEBULA GATE) */}
                {activeTab === "galaxy" && (
                  <div className="flex-1 flex flex-col space-y-4" id="view-galaxy">
                    <div className="border-b border-white/5 pb-3">
                      <h3 className="text-sm font-semibold text-white flex items-center gap-1.5">
                        <Compass className="w-4 h-4 text-indigo-400 animate-spin-slow" />
                        星云之门 · 浩瀚星海自主探索游历
                      </h3>
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        基于 2D Canvas 高性能渲染的微粒大世界，包含玫瑰公园等七大星海地标。AI控制每名宠物无轨迹巡游与社交碰撞。
                      </p>
                    </div>

                    <NebulaGateCanvas
                      userPet={user.activePet}
                      onLoggedEvent={(text) => {
                        // Merge record into history log
                        setUser(prev => ({
                          ...prev,
                          historyLogs: [text, ...prev.historyLogs].slice(0, 10)
                        }));
                      }}
                      onGrantCoins={(amt) => {
                        setUser(prev => ({ ...prev, stardustCoins: prev.stardustCoins + amt }));
                      }}
                      isTaskAlreadyCompleted={tasks.find(t => t.id === "task_explore")?.completedTimes === 1}
                      onTaskCompleted={() => {
                        updateTaskProgress("task_explore", 1);
                      }}
                    />
                  </div>
                )}

                {/* 3. COMMUNITY VIEW (看星的人) */}
                {activeTab === "community" && (
                  <div className="flex-1 flex flex-col space-y-4" id="view-community">
                    <div className="border-b border-white/5 pb-3">
                      <h3 className="text-sm font-semibold text-white flex items-center gap-1.5">
                        🪐 社区：看星的人聊天板
                      </h3>
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        在这里，怀念家人们聚集于此，分享逝宠在星尘彼方的AI耳语信件，互赠礼物装扮对方。
                      </p>
                    </div>

                    {/* New Post Form */}
                    <form onSubmit={handleCreatePost} className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
                      <div className="flex gap-2">
                        <span className="text-xs p-1 bg-white/10 rounded text-purple-300 font-mono">
                          发送灵愿:
                        </span>
                        <span className="text-xs text-gray-400">登岛家长【{user.ownerName || "未登记"}】</span>
                      </div>
                      <textarea
                        required
                        value={newPostText}
                        onChange={(e) => setNewPostText(e.target.value)}
                        placeholder="在这里写下想对小宝贝说的心灵祈语或呼唤伙伴围观..."
                        rows={2}
                        className="w-full bg-slate-900/60 border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-purple-500"
                      />
                      <div className="flex justify-between items-center">
                        <p className="text-[10px] text-gray-400">发帖后，其他在线家长都将能在公告板中围观贴贴</p>
                        <button
                          type="submit"
                          className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-1.5 px-4 rounded-lg text-[10px] flex items-center gap-1 shadow-lg"
                        >
                          <Send className="w-3 h-3" />
                          发布灵愿广场
                        </button>
                      </div>
                    </form>

                    {/* Posts board list */}
                    <div className="space-y-4" id="posts-feed-board animate-fade-in">
                      {communityPosts.map((post) => (
                        <div key={post.id} className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <div
                                className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs"
                                style={{ backgroundColor: post.primaryColor, color: "#111" }}
                              >
                                {post.petName[0]}
                              </div>
                              <div>
                                <span className="text-xs font-semibold text-white">{post.authorName}</span>
                                <span className="text-[9px] text-gray-400 mx-1.5">|</span>
                                <span className="text-[9px] text-purple-300 font-mono">守护：{post.petType}【{post.petName}】</span>
                              </div>
                            </div>
                            <span className="text-[9px] text-gray-400">{post.date}</span>
                          </div>

                          <p className="text-xs leading-relaxed text-gray-300 whitespace-pre-line bg-black/30 p-2.5 rounded-lg border border-white/5">
                            {post.message}
                          </p>

                          {/* Post controls / Interact */}
                          <div className="flex items-center justify-between pt-2 border-t border-white/5">
                            <div className="flex space-x-3">
                              <button
                                onClick={() => handleLikePost(post.id)}
                                className={`text-[10px] flex items-center gap-1 ${post.hasLiked ? "text-pink-400" : "text-gray-400 hover:text-white"}`}
                              >
                                ❤️ {post.likes}赞
                              </button>
                              <span className="text-slate-700">|</span>
                              <span className="text-[10px] text-gray-400 flex items-center gap-1">
                                <MessageSquare className="w-3 h-3 text-slate-500" />
                                {post.comments.length} 评论板
                              </span>
                            </div>

                            {/* Simulation gifts buttons */}
                            <div className="flex gap-2.5">
                              <button
                                onClick={() => handleSendGiftToPost(post, GIFT_ITEMS[0])}
                                className="bg-white/5 hover:bg-orange-500/20 text-orange-300 border border-orange-500/20 rounded-md px-2 py-0.5 text-[8px] flex items-center gap-1"
                                title="赠送一颗星尘物，触发对方宠物闪星特效"
                              >
                                🎁 送星尘 (50币)
                              </button>
                              <button
                                onClick={() => handleSendGiftToPost(post, GIFT_ITEMS[1])}
                                className="bg-white/5 hover:bg-yellow-500/20 text-yellow-300 border border-yellow-500/20 rounded-md px-2 py-0.5 text-[8px] flex items-center gap-1 animate-pulse"
                                title="赠送一束星光，并在对方事件簿中留下纪念"
                              >
                                ✨ 照亮星光 (300币)
                              </button>
                            </div>
                          </div>

                          {/* Nested Comments list */}
                          {post.comments.length > 0 && (
                            <div className="bg-black/20 p-2.5 rounded-lg space-y-1.5 text-[10px]">
                              {post.comments.map(c => (
                                <div key={c.id} className="text-gray-400 leading-normal">
                                  <span className="text-gray-200 font-semibold">{c.authorName} : </span>
                                  <span>{c.text}</span>
                                  <span className="text-[8px] text-slate-600 block">{c.date}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 4. SHOP VIEW (星尘商店 & 充值中心) */}
                {activeTab === "store" && (
                  <div className="flex-1 flex flex-col space-y-6" id="view-store">
                    <div className="border-b border-white/5 pb-3">
                      <h3 className="text-sm font-semibold text-white flex items-center gap-1.5">
                        🛍️ 星尘百宝阁 · 灵装与零食小铺
                      </h3>
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        购买装扮将立即渲染在大世界和家园主屏的2D Canvas默影形象上。使用零食可以补充喂养对话额度。
                      </p>
                    </div>

                    {/* VIP Discount Announcement */}
                    <div className="bg-gradient-to-r from-purple-900/40 to-indigo-900/40 border border-purple-500/25 rounded-xl p-3 flex justify-between items-center">
                      <div>
                        <span className="text-xs font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-amber-200 flex items-center gap-1">
                          👑 会员全店阶梯特惠机制
                        </span>
                        <p className="text-[9.5px] text-purple-300 leading-normal">
                          非会员：按原价购买 | 订阅《星云月卡》专享全店商品 <span className="font-bold">9 折</span> | 《星云年卡》享 <span className="font-bold">8 折</span>！
                        </p>
                      </div>
                      <button
                        onClick={() => setIsVipModalOpen(true)}
                        className="bg-gradient-to-r from-amber-500 to-yellow-600 text-white font-bold text-[9px] px-3 py-1 rounded-lg uppercase tracking-wider"
                      >
                        特惠开通
                      </button>
                    </div>

                    {/* COMPANION ENERGY FEEDING SECTION (心寒话术商业化核心) */}
                    <div className="bg-gradient-to-b from-[#1c133a]/60 to-[#0d0a1f]/60 border border-[#ef476f]/25 rounded-xl p-4 space-y-3">
                      {/* 能量条 */}
                      <div className="flex items-center justify-between">
                        <h4 className="text-[11px] font-bold uppercase tracking-widest text-[#ff8fa3] flex items-center gap-1.5">
                          <Heart className="w-3.5 h-3.5 text-[#ef476f]" />
                          陪伴能量 · 喂食维持羁绊
                        </h4>
                        <span className="text-[10px] font-mono" style={{ color: companionState.color }}>
                          {companionState.uiText}
                        </span>
                      </div>
                      <div className="w-full h-3 bg-black/50 rounded-full overflow-hidden border border-white/10">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{
                            width: `${currentCompanionEnergy}%`,
                            background: companionState.color,
                            boxShadow: `0 0 12px ${companionState.color}`,
                          }}
                        />
                      </div>
                      <p className="text-[9px] text-gray-400 leading-relaxed">
                        当前能量 <span className="font-mono font-bold" style={{ color: companionState.color }}>{Math.round(currentCompanionEnergy)}/100</span>
                        {companionState.state === "sleeping"
                          ? " · 星宠已沉睡，必须用「星尘唤醒剂」唤醒"
                          : ` · ${companionState.label}（${companionState.description}）`}
                      </p>

                      {/* 喂食道具 */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {ENERGY_FOODS.map((food) => (
                          <button
                            key={food.id}
                            onClick={() => handleFeedEnergy(food.id)}
                            disabled={user.stardustCoins < food.price}
                            className={`bg-black/40 border rounded-lg p-2.5 text-center space-y-1 transition-all ${
                              food.id === "energy_revive"
                                ? "border-[#ef476f]/40 hover:border-[#ef476f]"
                                : "border-slate-800 hover:border-[#ff8fa3]/50"
                            } disabled:opacity-40 disabled:cursor-not-allowed`}
                          >
                            <div className="text-lg leading-none">{food.icon}</div>
                            <div className="text-[10px] font-bold text-white">{food.name}</div>
                            <div className="text-[8px] text-gray-400 leading-tight">{food.effect}</div>
                            <div className="text-[10px] font-mono text-orange-300 flex items-center justify-center gap-0.5">
                              <Coins className="w-3 h-3" />{food.price}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* OUTFITS SECTION */}
                    <div>
                      <h4 className="text-[11px] font-bold uppercase tracking-widest text-indigo-400 mb-3 flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-indigo-400" />
                        1、Astrocade 独家像素外观装扮 (装扮效果实时渲染)
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {OUT_ITEMS.map((item) => {
                          const alreadyPurchased = user.outfitsUnlocked.includes(item.id);
                          
                          // Discount price calculation
                          let mult = 1.0;
                          if (user.membership === "vip_month") mult = 0.9;
                          if (user.membership === "vip_year") mult = 0.8;
                          const finalPrice = Math.round(item.price * mult);

                          return (
                            <div key={item.id} className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col justify-between hover:border-indigo-500/25 transition-all">
                              <div className="space-y-1.5">
                                <div className="flex justify-between items-start">
                                  <span className="text-white text-xs font-semibold">{item.name}</span>
                                  <div className="flex items-center gap-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded px-1.5 py-0.5 text-[10px]">
                                    <Coins className="w-3 h-3 text-orange-400" />
                                    {mult < 1.0 ? (
                                      <span className="font-mono text-indigo-300 font-bold">
                                        {finalPrice} <span className="text-[8px] text-gray-500 line-through font-normal">{item.price}</span>
                                      </span>
                                    ) : (
                                      <span className="font-mono text-orange-300 font-bold">{item.price} 币</span>
                                    )}
                                  </div>
                                </div>
                                <p className="text-[10px] text-gray-400 leading-relaxed">{item.description}</p>
                                <span className="text-[9px] text-[#06d6a0] font-mono block">效果：{item.effect}</span>
                              </div>

                              <div className="mt-3 pt-2.5 border-t border-white/5 flex justify-end gap-2">
                                {alreadyPurchased ? (
                                  <button
                                    onClick={() => handleEquipToggle(item.id)}
                                    className={`px-3 py-1 rounded text-[10px] font-bold ${
                                      (user.outfitsEquipped.halo === item.id ||
                                       user.outfitsEquipped.trail === item.id ||
                                       user.outfitsEquipped.orbit === item.id ||
                                       user.outfitsEquipped.cape === item.id)
                                        ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                                        : "bg-slate-700 hover:bg-slate-600 text-slate-100"
                                    }`}
                                  >
                                    {(user.outfitsEquipped.halo === item.id ||
                                      user.outfitsEquipped.trail === item.id ||
                                      user.outfitsEquipped.orbit === item.id ||
                                      user.outfitsEquipped.cape === item.id)
                                        ? "🔋 正在穿戴中" : "🔌 闲置·点我穿戴"}
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleBuyItem(item)}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold px-4 py-1 rounded shadow"
                                  >
                                    🛒 即刻购买 ({finalPrice} 币)
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* SNACKS SECTION */}
                    <div>
                      <h4 className="text-[11px] font-bold uppercase tracking-widest text-[#06d6a0] mb-3 flex items-center gap-1.5">
                        🦴 2、治愈滋补零食能补仓
                      </h4>
                      <p className="text-[10px] text-gray-400 mb-3 block">
                        喂食零食能瞬间恢复<b>1轮</b>主页宠物的对话额度，并触发家园像素爆炸特效。每日最多共可喂食10次零食！
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                        {SNACK_ITEMS.map((item) => {
                          let mult = 1.0;
                          if (user.membership === "vip_month") mult = 0.9;
                          if (user.membership === "vip_year") mult = 0.8;
                          const finalPrice = Math.round(item.price * mult);
                          
                          const inventoryCount = foodInventory[item.id] || 0;

                          return (
                            <div key={item.id} className="bg-white/5 border border-white/5 rounded-lg p-2.5 flex flex-col justify-between hover:border-slate-800">
                              <div>
                                <div className="flex justify-between items-center">
                                  <span className="text-[11px] font-semibold text-white">{item.name}</span>
                                  <span className="text-[8px] bg-indigo-500/10 text-indigo-300 font-mono px-1 rounded">
                                    库存: {inventoryCount}
                                  </span>
                                </div>
                                <p className="text-[8.5px] text-slate-400 mt-1">{item.description}</p>
                              </div>

                              <div className="mt-2 pt-1 border-t border-white/5 flex items-center justify-between">
                                <span className="font-mono text-[9px] text-[#ffd166] font-bold flex items-center gap-0.5">
                                  <Coins className="w-2.5 h-2.5 text-orange-400" />
                                  {finalPrice}
                                </span>
                                <button
                                  onClick={() => handleBuyItem(item)}
                                  className="bg-white/10 hover:bg-white/20 text-white text-[8px] px-2 py-0.5 rounded transition-transform"
                                >
                                  🛒 换购
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* RECHARGE STARDUST COINS */}
                    <div className="bg-[#1c133a]/30 border border-purple-500/20 p-5 rounded-2xl space-y-4">
                      <div>
                        <h4 className="text-xs font-bold text-purple-400 flex items-center gap-1.5 uppercase font-sans">
                          💎 3、星尘币虚拟银行充能中心
                        </h4>
                        <p className="text-[10px] text-gray-400">
                          汇率: 1元人民币 = 50星尘币。首充任意档位，基础币数翻倍（赠送同额绑定币）！
                        </p>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                        {[
                          { itemId: 100, rmb: 6, coins: 600, rule: "首充特惠，充6元得600币！" },
                          { itemId: 101, rmb: 18, coins: 1000, rule: "+100加赠，充18元得1000币" },
                          { itemId: 102, rmb: 28, coins: 1750, rule: "+250加赠，极度合算" },
                          { itemId: 103, rmb: 68, coins: 4000, rule: "+600加赠，中额超值" },
                          { itemId: 104, rmb: 128, coins: 8000, rule: "赠多送多，尊享大满贯" }
                        ].map((pkg, idx) => (
                          <div
                            key={idx}
                            className="bg-black/40 border border-slate-800 hover:border-purple-500/40 p-3 rounded-xl text-center space-y-1.5 flex flex-col justify-between"
                          >
                            <div>
                              <span className="text-[10px] text-[#ffccd5] font-mono leading-none font-bold block">{pkg.rmb} 元人民币</span>
                              <div className="text-md font-extrabold text-amber-300 font-mono mt-1.5 flex items-center justify-center gap-0.5">
                                <Coins className="w-3.5 h-3.5 text-orange-400 animate-spin-slow" />
                                {pkg.coins}
                              </div>
                              <span className="text-[8px] text-gray-400 block mt-1 line-clamp-2 leading-tight">
                                {pkg.rule}
                              </span>
                            </div>

                            <button
                              onClick={() => handleTopupCoins(pkg.itemId)}
                              disabled={purchaseState.status === "purchasing"}
                              className="mt-2.5 w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-[9px] py-1 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {purchaseState.status === "purchasing" ? "支付中…" : `微信闪付 ￥${pkg.rmb}`}
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* 5. USER DOSSIER & MEMBERSHIP (个人档案 & 储物包) */}
                {activeTab === "profile" && (
                  <div className="flex-1 flex flex-col space-y-6" id="view-profile">
                    <div className="border-b border-white/5 pb-3">
                      <h3 className="text-sm font-semibold text-white flex items-center gap-1.5 animate-pulse">
                        🛡️ 家长档案储藏 & 付费增值服务
                      </h3>
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        在这里探看您的小家犬/小宝贝档案详情、管理已解锁外观。同时提供直购的高级AI数媒定制纪念包服务。
                      </p>
                    </div>

                    <AiSettings triggerToast={triggerToast} />

                    {/* Pet Details Panel */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Left: General metadata card */}
                      <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
                        <span className="text-[10px] uppercase tracking-widest text-[#ef476f] font-mono block">
                          ★ 默魂登记记录册
                        </span>

                        <div className="space-y-2 text-xs">
                          <div className="flex justify-between border-b border-white/5 pb-1">
                            <span className="text-gray-400">小天使昵称 :</span>
                            <span className="text-white font-semibold">{user.activePet.name}</span>
                          </div>
                          <div className="flex justify-between border-b border-white/5 pb-1">
                            <span className="text-gray-400">萌宠种属 :</span>
                            <span className="text-white font-mono">{user.activePet.type} ({user.activePet.breed})</span>
                          </div>
                          <div className="flex justify-between border-b border-white/5 pb-1">
                            <span className="text-gray-400">家长(你)的称呼 :</span>
                            <span className="text-white">{user.ownerName}</span>
                          </div>
                          <div className="flex justify-between border-b border-white/5 pb-1">
                            <span className="text-gray-400">离苏飞升日 :</span>
                            <span className="text-white font-mono">{user.activePet.passingDate}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">色彩主基底色 :</span>
                            <div className="flex items-center gap-1">
                              <span className="w-3.5 h-3.5 rounded border border-white/20" style={{ backgroundColor: user.activePet.primaryColor }} />
                              <span className="text-white font-mono text-[10px]">{user.activePet.primaryColor}</span>
                            </div>
                          </div>
                        </div>

                        {/* Reset profile simulation */}
                        <div className="pt-3 border-t border-white/5 flex justify-end">
                          <button
                            onClick={() => {
                              const proceed = window.confirm("⚠️【危险警告】\n您确定要抹除当前宠物的星谱档案吗？\n清除后，原2D粒子矩阵和历史日志都将彻底消逝，需要重新举行升星仪式。");
                              if (proceed) {
                                setUser(prev => ({ ...prev, activePet: null }));
                                playSound("success");
                                triggerToast("星尘已解体，默影重归天际，静待您再次召唤升星仪式。");
                              }
                            }}
                            className="text-red-400 hover:text-red-300 text-[9px] font-mono hover:underline"
                          >
                            × 抹除数据重新举行仪式
                          </button>
                        </div>
                      </div>

                      {/* Right: Premium RMB direct pay options */}
                      <div className="bg-indigo-950/20 border border-purple-500/20 rounded-xl p-4 flex flex-col justify-between">
                        <div className="space-y-2">
                          <span className="text-[10px] uppercase tracking-widest text-[#ffd166] font-mono block font-bold flex items-center gap-1">
                            💎 RMB 尊享特惠增资定制专区
                          </span>
                          <p className="text-[10px] text-gray-300 leading-normal">
                            以下功能属于高级线下数媒团队与服务器集群单独运算，采用实款直付渠道（不可使用星尘币折抵抵扣）。
                          </p>

                          <div className="space-y-2.5 pt-1">
                            <div className="bg-black/30 p-2.5 rounded-lg border border-white/5 flex gap-2 items-center justify-between">
                              <div>
                                <span className="text-xs font-semibold text-white">1. AI 纪念视频大礼包</span>
                                <p className="text-[9px] text-gray-400 leading-tight">
                                  整理宠物生前留影照片 + 星云像素专属场景，生成15秒微缩温暖像素纪念短片
                                </p>
                              </div>
                              <button
                                onClick={() => handleBuyPremiumService("AI 纪念视频包", 29.9)}
                                className="bg-[#f72585] hover:bg-[#b5179e] text-white font-bold text-[9px] px-2.5 py-1.5 rounded shrink-0"
                              >
                                ￥29.9/次
                              </button>
                            </div>

                            <div className="bg-black/30 p-2.5 rounded-lg border border-white/5 flex gap-2 items-center justify-between">
                              <div>
                                <span className="text-xs font-semibold text-white">2. 高级小窝同源数字孪主</span>
                                <p className="text-[9px] text-gray-400 leading-tight">
                                  支持上传多达5张生前生活小窝照片，由AI高保真智能绘制还原成暖洋小窝像素地插
                                </p>
                              </div>
                              <button
                                onClick={() => handleBuyPremiumService("高级小窝孪生", 19.9)}
                                className="bg-[#4cc9f0] hover:bg-[#4361ee] text-slate-900 font-bold text-[9px] px-2.5 py-1.5 rounded shrink-0"
                              >
                                ￥19.9/次
                              </button>
                            </div>
                          </div>
                        </div>

                        <p className="text-[8px] text-slate-500 font-mono mt-3 text-center">
                          * 均支持微信、支付宝全真机快捷拉起支付
                        </p>
                      </div>
                    </div>

                    {/* Section 2: AI 3D high-fidelity bone/voxel mesh modeling */}
                    {user.activePet && (
                      <div className="bg-gradient-to-tr from-purple-500/10 to-orange-400/15 border border-purple-500/20 rounded-2xl p-5" id="profile-reconstruct-3d-panel">
                        <span className="text-[10px] uppercase font-bold tracking-widest text-orange-400 font-mono block mb-1">
                          🎒 2、AI 3D高保真数字骨骼重构 (2D照片即刻还原)
                        </span>
                        <p className="text-[9px] text-gray-400 mb-4 font-sans max-w-xl leading-normal">
                          采用双目重建与像素外差插值，将宠物生前2D硬照/生活照，计算还原并生成高保真3D骨架点阵与器官节点。合成成功后将即刻作为3D拟态投射上传星谱，并可在【主页】控制台开启 🤖 3D全息 投影。
                        </p>
                        
                        <Pet3DReconstruction 
                          activePet={user.activePet} 
                          onSync3DModelToPet={(newModel) => {
                            setUser(prev => {
                              if (!prev.activePet) return prev;
                              const updatedPet = {
                                ...prev.activePet,
                                model3d: newModel
                              };
                              // 同步到 allPets 列表，避免切换宠物后 3D 模型丢失（原代码只写无效的独立 key，未同步列表）
                              const allPets = (prev.allPets ?? []).map(p =>
                                p.id === updatedPet.id ? updatedPet : p
                              );
                              return {
                                ...prev,
                                activePet: updatedPet,
                                allPets
                              };
                            });
                          }}
                          triggerToast={triggerToast}
                        />
                      </div>
                    )}

                    {/* Snacks interactive Feed bar */}
                    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                      <span className="text-[11px] font-bold text-gray-400 block mb-3 uppercase tracking-widest">
                        🎒 3、家长随身储物能补包袋 (零食喂养区)
                      </span>
                      
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                        {SNACK_ITEMS.slice(0, 5).map(snack => {
                          const quantity = foodInventory[snack.id] || 0;
                          return (
                            <div key={snack.id} className="bg-slate-950/40 p-3 rounded-lg border border-white/5 flex flex-col justify-between text-center">
                              <div>
                                <span className="text-[9px] text-slate-500 uppercase tracking-widest block font-mono">SNACK ITEM</span>
                                <span className="text-xs font-bold text-white block mt-1">{snack.name}</span>
                                <span className="text-xs font-mono text-purple-400 font-bold block mt-1">
                                  持有: {quantity} 个
                                </span>
                              </div>
                              <button
                                onClick={() => handleFeedSnack(snack)}
                                disabled={quantity <= 0}
                                className="mt-3 w-full bg-indigo-600/30 hover:bg-indigo-600 border border-indigo-500/30 hover:border-indigo-400 disabled:opacity-40 disabled:hover:bg-indigo-600/30 text-white font-bold text-[10px] py-1 rounded disabled:cursor-not-allowed"
                              >
                                🦴 喂食 1个
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Subsystem dashboards for personalized memorial experience (P0-3, P0-4, P0-8) */}
                    {user.activePet && (
                      <div className="space-y-6 pt-2">
                        <PetMemoryTimeline
                          petConfig={user.activePet}
                          onUpdateTimeline={handleUpdateTimeline}
                          onUpdateTags={handleUpdateTags}
                          triggerToast={triggerToast}
                        />
                        <AnniversaryManager
                          petConfig={user.activePet}
                          onUpdateAnniversaries={handleUpdateAnniversaries}
                          triggerToast={triggerToast}
                        />
                        <NotificationSettings
                          initialConfig={notificationConfig ?? undefined}
                          onSaveConfig={handleSaveNotificationConfig}
                          triggerToast={triggerToast}
                        />

                        {/* Reset guiding instrument box */}
                        <div className="bg-[#110c2c]/85 border border-white/10 rounded-3xl p-5 text-white flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xl">
                          <div>
                            <h4 className="text-xs font-bold text-white font-mono flex items-center gap-1.5">
                              ✨ 想要重新温习星轨训练引导?
                            </h4>
                            <p className="text-[10px] text-gray-400 mt-1">重置完毕后退出设置, 将立即拉起星云引航仪，重新展示灵魂照料流程。</p>
                          </div>
                           <button
                            onClick={() => {
                              setUser(prev => ({ ...prev, onboardingCompleted: false }));
                              triggerToast("💡 星轨引航仪已重置！退出设置后将立即拉起向导！");
                              playSound("success");
                            }}
                            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-xs rounded-xl shadow-md font-mono shrink-0 cursor-pointer hover:scale-105 active:scale-95 transition-all text-center"
                          >
                            ⚙️ 重置新手引航
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "v26_suite" && (
                  <div className="flex-1 flex flex-col space-y-6" id="view-v26-suite">
                    <CelestialV26Suite
                      user={user}
                      setUser={setUser}
                      triggerToast={triggerToast}
                      onUpdatePet={(updatedPet) => {
                        setUser(prev => {
                          const next = { ...prev, activePet: updatedPet };
                          localStorage.setItem("starpuff_user", JSON.stringify(next));
                          return next;
                        });
                      }}
                    />
                  </div>
                )}
              </>
            )}
          </div>

          {/* RIGHT SIDEBAR (DAILY AI WHISPER & TASKS PANEL with REAL-TIME AI CHAT) */}
          <aside className="w-full md:w-80 border-t md:border-t-0 md:border-l border-white/5 p-4 flex flex-col space-y-5 bg-[#090514]/65 shrink-0 select-none">
            
            {/* REAL-TIME TAB SWAP NAVIGATION */}
            <div className="flex bg-white/5 p-1 rounded-xl border border-white/5 shrink-0">
              <button
                onClick={() => { setSidebarMode("whispers"); playSound("click"); }}
                className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold tracking-wider transition-all flex items-center justify-center gap-1.5 ${sidebarMode === "whispers" ? "bg-gradient-to-r from-orange-500/80 to-pink-600/80 text-white shadow-md border border-white/10" : "text-gray-400 hover:text-white"}`}
              >
                📜 治愈心语信
              </button>
              <button
                onClick={() => { setSidebarMode("chat"); playSound("click"); }}
                className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold tracking-wider transition-all flex items-center justify-center gap-1.5 relative ${sidebarMode === "chat" ? "bg-gradient-to-r from-indigo-600/80 to-purple-600/80 text-white shadow-md border border-white/10" : "text-gray-400 hover:text-white"}`}
              >
                💬 智能AI对话
                <span className="absolute -top-1 -right-1 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-pink-500"></span>
                </span>
              </button>
            </div>

            {/* DYNAMIC SIDEBAR CONTENT */}
            {sidebarMode === "whispers" ? (
              /* 1. WHISPER SEGMENT */
              <div className="flex-1 flex flex-col overflow-hidden min-h-[340px]">
                <div className="flex items-center justify-between mb-3 border-b border-white/5 pb-2">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-widest text-orange-400 font-mono">
                      每日 AI 治愈心语信 📜
                    </h3>
                    <p className="text-[8px] text-slate-500 font-mono mt-0.5">DAILY AI PORT WHISPERS</p>
                  </div>
                  <span className="text-[9px] px-1.5 py-0.5 bg-orange-400/10 text-orange-400 border border-orange-400/20 rounded font-semibold animate-pulse">
                    每日上午10点
                  </span>
                </div>

                {/* WHISPER MAIN CARD VIEW */}
                <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
                  {whispers.map((whisper, idx) => (
                    <div key={whisper.id} className="p-4 bg-white/5 border border-white/10 rounded-xl space-y-3 relative group hover:border-purple-500/20 transition-all">
                      {/* Cover art display */}
                      <div className="relative h-20 w-full rounded-lg overflow-hidden bg-black/40 border border-white/5">
                        <img src={whisper.coverImage} alt="Cover pixel" className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity" referrerPolicy="no-referrer" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                        
                        <div className="absolute bottom-1.5 left-2 flex items-center gap-1.5 text-[10px] text-pink-300 font-mono">
                          <Calendar className="w-3 h-3" />
                          <span>{whisper.date} · 归档回忆信</span>
                        </div>
                      </div>

                      <p className="text-xs leading-relaxed text-slate-200 italic font-medium white-space-pre-line">
                        “{whisper.content}”
                      </p>

                      {/* Shared trigger */}
                      <div className="flex justify-between items-center pt-2 border-t border-white/5">
                        <span className="text-[9px] text-white/40">已送往家长信箱</span>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleLikeWhisper(whisper.id)}
                            className={`text-[9px] px-2 py-0.5 rounded border border-white/10 hover:bg-pink-500/10 ${whisper.hasLiked ? "text-pink-400" : "text-gray-400"}`}
                          >
                            ❤️ {whisper.likes}
                          </button>
                          <button
                            onClick={() => handleShareWhisperAction(whisper)}
                            className="text-[9px] px-2 py-0.5 rounded border border-white/10 hover:bg-slate-700 text-gray-300 flex items-center gap-1"
                          >
                            <Share2 className="w-2.5 h-2.5 text-indigo-400" />
                            分享
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              /* 2. REAL-TIME AI DIALOG CONVERSATION SEGMENT */
              <div className="flex-1 flex flex-col overflow-hidden bg-black/40 border border-white/5 rounded-2xl p-3 relative min-h-[340px]" id="pet-realtime-chat-viewport">
                
                {/* Header showing connect indicator */}
                <div className="flex items-center justify-between pb-2 border-b border-white/5 mb-2 text-[10px] text-gray-400 font-mono">
                  <div className="flex items-center gap-1.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${isChatTyping ? "bg-amber-400 animate-pulse" : "bg-emerald-400 animate-ping"}`} />
                    <span>星尘通路 ({user.activePet?.name || '天乐'})</span>
                  </div>
                  <span className="bg-white/5 px-2 py-0.5 rounded text-[8.5px] font-mono text-purple-300">
                    {user.unlimitedTalks ? "♾️ 无限次" : `剩 ${user.dialogsRemaining}/5 轮`}
                  </span>
                </div>

                {/* Messages list with styled scroll bar */}
                <div className="flex-1 overflow-y-auto space-y-3 pr-1 mb-2.5 custom-scrollbar text-xs">
                  {chatMessages.map((msg) => (
                    <div key={msg.id} className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}>
                      <div className="text-[8.5px] text-white/40 font-mono mb-1 px-1">
                        {msg.sender === "user" ? user.ownerName : user.activePet?.name} · {msg.timestamp}
                      </div>
                      <div className={`max-w-[90%] p-2.5 rounded-2xl leading-relaxed whitespace-pre-line text-[11px] shadow-sm ${
                        msg.sender === "user" 
                          ? "bg-indigo-600/90 text-white rounded-tr-none border border-indigo-500/30" 
                          : "bg-white/5 text-slate-100 rounded-tl-none border border-white/5"
                      }`}>
                        {msg.text}
                      </div>
                    </div>
                  ))}

                  {/* Typing pointer */}
                  {isChatTyping && (
                    <div className="flex flex-col items-start">
                      <div className="text-[8px] text-gray-500 font-mono mb-1">
                        {user.activePet?.name} 正在踩沙传音...
                      </div>
                      <div className="bg-white/5 border border-white/5 p-2 rounded-2xl rounded-tl-none flex items-center space-x-1 py-2 px-3">
                        <div className="w-1 h-1 bg-purple-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                        <div className="w-1 h-1 bg-pink-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                        <div className="w-1 h-1 bg-yellow-400 rounded-full animate-bounce" />
                      </div>
                    </div>
                  )}

                  {/* Scroll target */}
                  <div ref={chatBottomRef} />
                </div>

                {/* Send action desk */}
                <form onSubmit={handleSendChatMessage} className="flex gap-1.5 pt-2 border-t border-white/5 relative bg-[#090514]/10">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    disabled={isChatTyping}
                    placeholder={isChatTyping ? "正在等候回复中..." : `与 ${user.activePet?.name || '宝贝'} 细数日常...`}
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500/80 placeholder-gray-500 disabled:opacity-50 transition-all font-sans"
                  />
                  <button
                    type="submit"
                    disabled={isChatTyping || !chatInput.trim()}
                    className="bg-indigo-600 hover:bg-indigo-500 active:scale-95 disabled:opacity-30 disabled:pointer-events-none text-white w-8 h-8 rounded-xl flex items-center justify-center transition-all shadow-md shrink-0 border border-indigo-500/30 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
                
                {/* Hints footer */}
                <div className="text-[8px] text-gray-500 text-center mt-1.5 font-mono">
                  ✨ 连线一问一答，抚摸互动能给爱宠多充能哦
                </div>
              </div>
            )}

            {/* DAILY TASKS QUEST LIST */}
            <div className="h-56 bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col justify-between shrink-0">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-widest text-[#7B61FF] font-mono mb-2.5 flex justify-between items-center">
                  <span>🛠️ 星尘回忆每日任务板</span>
                  <span className="text-[9px] text-gray-500">日上限63币</span>
                </h3>

                <div className="space-y-2 max-h-40 overflow-y-auto pr-1 text-xs">
                  {tasks.map((task) => (
                    <div key={task.id} className="flex items-center justify-between py-1 border-b border-white/5 last:border-0 hover:bg-[#150a2e]/30 px-1 rounded transition-colors" title={task.description}>
                      <span className="text-slate-300 text-[11px] leading-tight flex-1">
                        {task.name} ({task.completedTimes}/{task.maxTimes})
                      </span>
                      
                      <div className="flex items-center gap-2">
                        {task.completedTimes >= task.maxTimes ? (
                          <span className="text-[#06d6a0] font-bold text-[10px] tracking-tight">已完成 完成</span>
                        ) : (
                          <button
                            onClick={() => {
                              playSound("click");
                              // trigger actions accordingly or help complete
                              if (task.id === "task_share") {
                                updateTaskProgress("task_share", 1);
                              } else {
                                updateTaskProgress(task.id, 1);
                              }
                            }}
                            className="text-[9px] text-purple-300 hover:text-white bg-purple-500/20 border border-purple-500/30 px-1.5 py-0.5 rounded tracking-tighter"
                          >
                            +{task.reward}币
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </aside>
        </div>


      </div>

      {/* MEMBERSHIP CHECKOUT SELECTION MODAL */}
      {isVipModalOpen && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-md animate-fade-in" id="vip-checkout-modal">
          <div className="bg-[#0f0a25] border border-purple-500/40 rounded-2xl p-6 w-full max-w-lg shadow-[0_0_50px_rgba(123,97,255,0.4)] space-y-5">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-md md:text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-amber-200 uppercase flex items-center gap-1.5">
                  <Crown className="w-5 h-5 text-yellow-400 animate-bounce" />
                  订阅《喵汪星云》星河永久守护证
                </h3>
                <p className="text-xs text-purple-200 mt-1">解锁AI无限伴眠、多条每日心语耳语及限定配饰礼遇</p>
              </div>
              <button
                onClick={() => setIsVipModalOpen(false)}
                className="text-gray-400 hover:text-white font-bold leading-none text-md bg-white/5 hover:bg-white/15 w-6 h-6 rounded-full flex items-center justify-center"
              >
                ×
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Option 1: Trial */}
              <div className="bg-black/40 border border-slate-800 rounded-xl p-4 text-center space-y-1 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] px-1.5 py-0.5 bg-[#ef476f]/20 text-[#ef476f] border border-[#ef476f]/20 rounded font-mono font-bold">限时尝鲜</span>
                  <p className="text-xs font-semibold text-white mt-1.5">新客首月特惠</p>
                  <div className="text-xl font-bold font-mono text-purple-300 mt-1">￥1.9/首月</div>
                  <p className="text-[9px] text-gray-400 leading-tight mt-1 pt-1.5 border-t border-slate-900">享完整月卡权益，次月自动续费可取消</p>
                </div>
                <button
                  onClick={() => handleSubscribeVip("trial")}
                  disabled={purchaseState.status === "purchasing"}
                  className="mt-2.5 w-full bg-[#ef476f] text-white text-[10px] font-bold py-1.5 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {purchaseState.status === "purchasing" ? "开通中…" : "￥1.9 立即开通"}
                </button>
              </div>

              {/* Option 2: Month Card */}
              <div className="bg-black/40 border border-purple-500/20 rounded-xl p-4 text-center space-y-1 flex flex-col justify-between scale-105 shadow-[0_0_15px_rgba(123,97,255,0.1)]">
                <div>
                  <span className="text-[10px] px-1.5 py-0.5 bg-yellow-500/20 text-yellow-300 border border-yellow-500/20 rounded font-mono font-bold">主打守护</span>
                  <p className="text-xs font-semibold text-white mt-1.5">星云守护月卡</p>
                  <div className="text-xl font-bold font-mono text-amber-300 mt-1">￥9.9/月</div>
                  <p className="text-[9px] text-gray-400 leading-tight mt-1 pt-1.5 border-t border-slate-900">
                    每日 3条 AI耳语<br />
                    主页对话无限次<br />
                    星尘商店购买 9折
                  </p>
                </div>
                <button
                  onClick={() => handleSubscribeVip("month")}
                  disabled={purchaseState.status === "purchasing"}
                  className="mt-2.5 w-full bg-gradient-to-r from-amber-500 to-yellow-600 text-white text-[10px] font-bold py-1.5 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {purchaseState.status === "purchasing" ? "订阅中…" : "￥9.9 订阅月卡"}
                </button>
              </div>

              {/* Option 3: Year Card */}
              <div className="bg-black/40 border border-slate-800 rounded-xl p-4 text-center space-y-1 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] px-1.5 py-0.5 bg-cyan-500/20 text-cyan-300 border border-cyan-500/20 rounded font-mono font-bold">至臻感恩</span>
                  <p className="text-xs font-semibold text-white mt-1.5">星云至尊年卡</p>
                  <div className="text-xl font-bold font-mono text-cyan-200 mt-1">￥79/年</div>
                  <p className="text-[9px] text-gray-400 leading-tight mt-1 pt-1.5 border-t border-slate-900">
                    月卡全部权益<br />
                    星尘商店 8折<br />
                    <b>专属限定星迹披风</b>
                  </p>
                </div>
                <button
                  onClick={() => handleSubscribeVip("year")}
                  disabled={purchaseState.status === "purchasing"}
                  className="mt-2.5 w-full bg-cyan-600 hover:bg-cyan-700 text-white text-[10px] font-bold py-1.5 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {purchaseState.status === "purchasing" ? "订购中…" : "￥79 订购年卡"}
                </button>
              </div>
            </div>

            <div className="bg-black/25 p-3 rounded-lg text-[9px] text-slate-400 leading-relaxed border border-white/5 font-mono">
              ★ 家长须知：开通所得均属于对逝宠数字灵谱常态化运算的维护基金支持，我们将把5%款项定向捐赠予流浪动物关怀救助机构，陪伴并温暖更多生灵。
            </div>
          </div>
        </div>
      )}

      {/* --- 沉睡弹窗（女性向版）--- */}
      {isSleepModalOpen && (
        <div className="fixed inset-0 bg-black/90 z-[60] flex items-center justify-center p-4 backdrop-blur-md animate-fade-in">
          <div className="bg-[#0a0718] border border-slate-700/60 rounded-2xl p-8 w-full max-w-md shadow-[0_0_60px_rgba(0,0,0,0.8)] text-center space-y-5">
            <div className="text-5xl animate-pulse">💫</div>
            <div>
              <h3 className="text-lg font-bold text-gray-300">星尘散尽，它陷入了沉睡</h3>
              <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                {user.activePet?.name} 缓缓闭上了眼睛，身体逐渐变得透明，星尘从身上慢慢飘散...最后一颗星尘飘起，它的轮廓越来越模糊了 🥺
              </p>
              <p className="text-[11px] text-[#ff8fa3] mt-3">用「星尘唤醒剂」，可以重新唤醒你们的羁绊哦 ✨</p>
            </div>
            <div className="space-y-2">
              <button
                onClick={() => {
                  setIsSleepModalOpen(false);
                  setActiveTab("store");
                }}
                className="w-full bg-gradient-to-r from-[#ef476f] to-[#b5179e] text-white font-bold text-sm py-2.5 rounded-lg hover:opacity-90 transition-opacity"
              >
                ✨ 唤醒它
              </button>
              <button
                onClick={() => setIsSleepModalOpen(false)}
                className="w-full bg-white/5 hover:bg-white/10 text-gray-400 text-xs py-2 rounded-lg transition-colors"
              >
                再等等
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- 低能量提醒弹窗（能量<20，女性向版）--- */}
      {isLowEnergyModalOpen && companionState.state === "farewell" && (
        <div className="fixed inset-0 bg-black/60 z-[55] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#0f0a25] border border-[#ef476f]/40 rounded-2xl p-6 w-full max-w-sm shadow-[0_0_50px_rgba(239,71,111,0.3)] text-center space-y-4">
            <div className="text-4xl">😿</div>
            <div>
              <h3 className="text-base font-bold text-white">你的星宠...快要没有能量了</h3>
              <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                它好虚弱好虚弱，连尾巴都摇不动了呢...它说...好想再多陪你一会儿...可是...
              </p>
            </div>
            <div className="space-y-2">
              <button
                onClick={() => {
                  setIsLowEnergyModalOpen(false);
                  setActiveTab("store");
                }}
                className="w-full bg-gradient-to-r from-[#ef476f] to-[#ff8fa3] text-white font-bold text-sm py-2.5 rounded-lg hover:opacity-90 transition-opacity"
              >
                🥹 立刻喂它
              </button>
              <button
                onClick={() => setIsLowEnergyModalOpen(false)}
                className="w-full bg-white/5 hover:bg-white/10 text-gray-500 text-xs py-2 rounded-lg transition-colors"
              >
                再等等
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- 委屈提醒弹窗（能量<50，女性向版）--- */}
      {isHurtModalOpen && companionState.state === "distant" && (
        <div className="fixed inset-0 bg-black/50 z-[54] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#0f0a25] border border-[#fca3cc]/40 rounded-2xl p-6 w-full max-w-sm shadow-[0_0_50px_rgba(252,163,204,0.25)] text-center space-y-4">
            <div className="text-4xl">🥺</div>
            <div>
              <h3 className="text-base font-bold text-white">你的星宠有点委屈了</h3>
              <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                它已经好久没有吃东西了呢...肚子咕噜咕噜叫，可是又不敢说...要不要喂它点什么呀？
              </p>
            </div>
            <div className="space-y-2">
              <button
                onClick={() => {
                  setIsHurtModalOpen(false);
                  setActiveTab("store");
                }}
                className="w-full bg-gradient-to-r from-[#fca3cc] to-[#ff8fa3] text-white font-bold text-sm py-2.5 rounded-lg hover:opacity-90 transition-opacity"
              >
                ✨ 去喂食
              </button>
              <button
                onClick={() => setIsHurtModalOpen(false)}
                className="w-full bg-white/5 hover:bg-white/10 text-gray-500 text-xs py-2 rounded-lg transition-colors"
              >
                再等等
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- PET MEMORY FLASHBACK OVERLAY MODAL --- */}
      {activeMemoryFlashbackId && user.activePet && (
        <MemoryFlashbackModal
          petConfig={user.activePet}
          onClose={() => setActiveMemoryFlashbackId(null)}
          onCollectReward={(coinsAwarded, memoryId) => {
            // Reward coins
            setUser(prev => ({
              ...prev,
              stardustCoins: prev.stardustCoins + coinsAwarded
            }));
            // Save to unlocked memories list
            setUnlockedMemoryIds(prev => {
              if (prev.includes(memoryId)) return prev;
              const next = [...prev, memoryId];
              triggerToast(`🏅 【星尘记忆】已存入回忆相册并转化为星尘币 +${coinsAwarded}！`);
              return next;
            });
          }}
          triggeredMemoryId={activeMemoryFlashbackId}
        />
      )}

      {/* --- AR 相机模拟 --- */}
      {isArCameraOpen && user.activePet && (
        <ArCameraSimulation
          isOpen={isArCameraOpen}
          onClose={() => setIsArCameraOpen(false)}
          pet={user.activePet}
          triggerToast={triggerToast}
          isGodMode={systemPlayMode === "god"}
        />
      )}

      {/* --- ONBOARDING GUIDE OVERLAY DIALOGUE (P0-1) --- */}
      <OnboardingGuide
        isOpen={!user.onboardingCompleted}
        onComplete={handleOnboardingComplete}
        onNavigateTab={(tab) => {
          setActiveTab(tab);
        }}
      />
      </ErrorBoundary>

    </div>
  );
}
