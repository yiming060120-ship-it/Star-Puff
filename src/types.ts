/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type PetType = "猫" | "狗" | "兔" | "鸟" | "仓鼠" | "其他";

export interface Pet3DModelConfig {
  sourceImage: string; // The base64 or URL source image
  verticesCount: number; // Number of structural mesh vertices modeled (e.g. 180)
  shapeNodes: Array<{ x: number; y: number; z: number; label: string; color: string }>; // 3D anatomical anchor points
  depthMapColors: string[]; // Grayscale/hologram depth shader values
  dimensions: { depth: number; height: number; width: number }; // Relative 3D sizing offsets
  physicsBounciness: number; // Interactive mechanical bounce resonance
  glowIntensity: number; // Photonic emission value
  reconstructionDate: string; // Timestamp
  breathingRate: number; // Chest expansion cycle period (seconds)
  loreParagraph: string; // Beautiful personalized AI story of their pet's celestial physics reconstruction
}

export interface PetConfig {
  id?: string; // Stable unique id (e.g. "pet_1723..."); used as storage key. Falls back to name for legacy data.
  name: string;
  type: PetType;
  ownerName: string;
  breed: string;
  passingDate: string;
  primaryColor: string; // hex
  secondaryColor: string; // hex
  stardustMatrixHex: string[]; // extracted dominant pixel colors
  model3d?: Pet3DModelConfig; // Optional custom quantum 3D model configuration
  personalityTags?: string[]; // Presets like: ["傲娇小主子", "贴心小棉袄", "温柔精灵"]
  hobbies?: string[]; // Custom hobbies: e.g. ["追逐星光", "捕蝴蝶", "呼噜踩奶"]
  favoriteThings?: string[]; // Favorite things: e.g. ["草莓干", "主人的摸腹", "夜空发呆"]
  birthDay?: string; // Birthday string
  memorialDay?: string; // Anniversary or general memory date
  moodLevel?: number; // 0 to 100
  happiness?: number; // 0 to 100
  favoriteSnacks?: string[]; // custom typed or filled list of food
  anniversariesList?: Array<{ id: string; date: string; title: string; desc: string }>; // custom anniversaries listed
  memoryTimelineList?: Array<{ id: string; date: string; title: string; content: string; image?: string }>; // chronologically rendered memories
  
  // V2 Status System
  statusMood?: number; // 0-100
  statusHunger?: number; // 0-100
  statusCleanliness?: number; // 0-100
  statusEnergy?: number; // 0-100
  level?: number;
  exp?: number;

  // V3 陪伴能量系统（心寒话术）
  /** 陪伴能量值 0-100 */
  companionEnergy?: number;
  /** 上次能量更新时间戳（毫秒），用于计算衰减 */
  companionEnergyUpdatedAt?: number;
  /** 能量免疫截止时间戳（毫秒），时光结晶效果：此时间前不衰减 */
  companionEnergyImmuneUntil?: number;
  /** 是否已陷入沉睡 */
  isSleeping?: boolean;
  /** 是否已领取每日登录能量 */
  lastEnergyLoginBonusDate?: string;
  /** 是否已领取月卡每日自动恢复 */
  lastVipRecoveryDate?: string;

  // V4 宠物种类/模型选择
  /** 选中的 3D 模型文件名（相对 public/models/species/），如 species_01.glb */
  modelFile?: string;
}

export interface StarPuffUser {
  ownerName: string;
  membership: "free" | "vip_month" | "vip_year";
  stardustCoins: number;
  unlimitedTalks: boolean;
  dialogsRemaining: number;
  dialogsMax: number;
  streakDays: number;
  activePet: PetConfig | null;
  allPets?: PetConfig[]; // Multi-pet management list support
  historyLogs: string[]; // yesterday logs in text format
  outfitsUnlocked: string[]; // list of itemIds
  outfitsEquipped: {
    halo: string | null;  // e.g. "halo_golden"
    trail: string | null; // e.g. "trail_neon"
    orbit: string | null; // e.g. "orbit_stars"
    cape: string | null;  // e.g. "cape_aurora"
  };
  onboardingCompleted?: boolean; // guide walkthrough flag
  checkInCalendar?: string[]; // Dates users checked in e.g. ["2026-05-22"]
  lastCheckInDate?: string; // last checked date string
}

export interface StoreItem {
  id: string;
  name: string;
  type: "outfit" | "snack" | "gift";
  price: number;
  description: string;
  effect?: string;
  astrocadePrompt: string; // prompt generated for Astrocade
  icon?: string;
}

export interface TaskItem {
  id: string;
  name: string;
  reward: number;
  maxTimes: number;
  completedTimes: number;
  description: string;
}

export interface Landmark {
  id: string;
  name: string;
  description: string;
  chineseDesc: string;
  x: number; // canvas percentage x 0-100
  y: number; // canvas percentage y 0-100
  symbol: string; // emoji or drawing representation
  accentColor: string;
}

export interface PetWhisper {
  id: string;
  date: string;
  content: string;
  coverImage: string; // pixel art cover style
  likes: number;
  hasLiked: boolean;
  slotLabel?: string; // 来信时段标签（如 ☀️ 晨光来信 / 🌙 暮色来信）
  // [集群来信] 社交交集锚点：宠物与另一只宠物在同一场景同点停留较久时触发
  // [星友来信] type==="friend"：虚拟 AI 好友主动来信（单机版离线模拟）
  type?: "daily" | "cluster" | "friend";
  relatedPetName?: string; // 集群来信关联的另一只宠物名
  relatedOwnerName?: string; // 关联宠物的家长名
  friendId?: string; // 星友来信：发信好友 id（virtualFriends）
  scene?: string; // 触发集群来信的场景名
  friendRequested?: boolean; // 是否已向对方家长发出好友申请
  comments: Array<{
    id: string;
    authorName: string;
    text: string;
    date: string;
  }>;
}

export interface CommunityPost {
  id: string;
  authorName: string;
  petName: string;
  petType: PetType;
  primaryColor: string;
  message: string;
  date: string;
  likes: number;
  hasLiked: boolean;
  giftReceived?: string;
  comments: Array<{
    id: string;
    authorName: string;
    text: string;
    date: string;
  }>;
}
