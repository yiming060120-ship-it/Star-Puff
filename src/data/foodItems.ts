/**
 * 喂食食物数据（任务三）
 *
 * 每种食物定义恢复数值、价格、稀有度、触发的宠物动画。
 * 背包数量存 localStorage（key: starpuff_food_inventory）。
 */

export interface FoodItem {
  id: string;
  name: string;
  icon: string;          // emoji
  hungerRestore: number; // 饥饿值恢复
  energyRestore: number; // 能量值恢复
  moodRestore: number;   // 心情值恢复
  price: number;         // 星辰币
  rarity: "common" | "rare" | "epic";
  category: "basic" | "snack" | "premium" | "special"; // 分类：主食/零食/高级食物/特殊能量
  description: string;
  animation: "eat_normal" | "eat_happy" | "eat_special";
}

export const FOOD_CATEGORY_NAMES: Record<FoodItem["category"], string> = {
  basic: "主食",
  snack: "零食",
  premium: "高级食物",
  special: "特殊能量",
};

export const foodItems: FoodItem[] = [
  {
    id: "dust_cookie",
    name: "星辰饼干",
    icon: "🍪",
    hungerRestore: 20,
    energyRestore: 5,
    moodRestore: 5,
    price: 5,
    rarity: "common",
    category: "basic",
    description: "用星辰烘焙的小饼干，宠物的最爱",
    animation: "eat_normal",
  },
  {
    id: "star_fish",
    name: "星光小鱼干",
    icon: "🐟",
    hungerRestore: 35,
    energyRestore: 10,
    moodRestore: 10,
    price: 12,
    rarity: "common",
    category: "snack",
    description: "猫咪的最爱，狗狗也爱吃",
    animation: "eat_happy",
  },
  {
    id: "cloud_milk",
    name: "云朵牛奶",
    icon: "🥛",
    hungerRestore: 15,
    energyRestore: 20,
    moodRestore: 8,
    price: 8,
    rarity: "common",
    category: "basic",
    description: "软绵绵的云朵酿成的牛奶",
    animation: "eat_normal",
  },
  {
    id: "nebula_cake",
    name: "星云蛋糕",
    icon: "🍰",
    hungerRestore: 50,
    energyRestore: 15,
    moodRestore: 15,
    price: 20,
    rarity: "rare",
    category: "premium",
    description: "采集星云精华制作的蛋糕，香甜软糯",
    animation: "eat_happy",
  },
  {
    id: "time_crystal",
    name: "时光结晶",
    icon: "💎",
    hungerRestore: 100,
    energyRestore: 50,
    moodRestore: 30,
    price: 50,
    rarity: "epic",
    category: "special",
    description: "凝结了时光的珍贵结晶，恢复满状态",
    animation: "eat_special",
  },
  // [整合] 商店「治愈小零食」全部并入喂食面板（id 与商店 SNACK_ITEMS 一致，库存互通）
  {
    id: "snack_candy", name: "星云霜糖", icon: "🍬",
    hungerRestore: 18, energyRestore: 6, moodRestore: 8,
    price: 12, rarity: "common", category: "snack",
    description: "香甜软糯的彩色气体糖球", animation: "eat_normal",
  },
  {
    id: "snack_biscuit", name: "冰晶星心饼", icon: "🍪",
    hungerRestore: 22, energyRestore: 6, moodRestore: 10,
    price: 18, rarity: "common", category: "snack",
    description: "咬起来咯嘣脆的零下恒星碎冰屑", animation: "eat_normal",
  },
  {
    id: "snack_canned", name: "月夜深海鱼罐", icon: "🥫",
    hungerRestore: 28, energyRestore: 8, moodRestore: 10,
    price: 25, rarity: "common", category: "snack",
    description: "富含纯净月光藻成分的珍稀鱼罐", animation: "eat_happy",
  },
  {
    id: "snack_bone", name: "彩虹矿石骨头", icon: "🦴",
    hungerRestore: 32, energyRestore: 10, moodRestore: 12,
    price: 30, rarity: "common", category: "snack",
    description: "硬度适中的可咬像素矿石骨，磨牙最爱", animation: "eat_happy",
  },
  {
    id: "snack_milk", name: "星辰脱脂奶", icon: "🥛",
    hungerRestore: 25, energyRestore: 22, moodRestore: 12,
    price: 40, rarity: "rare", category: "snack",
    description: "提炼自银河系中冷气体云，暖体舒骨", animation: "eat_normal",
  },
  {
    id: "snack_truffle", name: "仙女座黑松露", icon: "🍄",
    hungerRestore: 38, energyRestore: 16, moodRestore: 16,
    price: 55, rarity: "rare", category: "premium",
    description: "重组仙女座深空沉积真菌，入口即化", animation: "eat_happy",
  },
  {
    id: "snack_chips", name: "超新星曲奇饼", icon: "🥨",
    hungerRestore: 45, energyRestore: 18, moodRestore: 18,
    price: 70, rarity: "rare", category: "premium",
    description: "烤制于炙热白矮星边缘的松脆酥饼", animation: "eat_happy",
  },
  {
    id: "snack_fish", name: "银河极光小鱼干", icon: "🐟",
    hungerRestore: 50, energyRestore: 22, moodRestore: 20,
    price: 85, rarity: "rare", category: "premium",
    description: "带有电离极光波的烘焙深海冷鱼，猫咪狂喜", animation: "eat_happy",
  },
  {
    id: "snack_jelly", name: "暗物质软浆果冻", icon: "🍮",
    hungerRestore: 55, energyRestore: 26, moodRestore: 22,
    price: 100, rarity: "epic", category: "premium",
    description: "完全透明的水溶态高维空间软滑果冻", animation: "eat_special",
  },
  {
    id: "snack_bar", name: "太空能核补棒", icon: "🍫",
    hungerRestore: 65, energyRestore: 32, moodRestore: 25,
    price: 120, rarity: "epic", category: "premium",
    description: "百分百无杂质的太空能量聚合压缩饼", animation: "eat_special",
  },
];

const INVENTORY_KEY = "starpuff_food_inventory";
// [整合] 商店零食库存 key：snack_* 前缀的食物历史库存存在这里，需与喂食面板互通
const SNACK_INVENTORY_KEY = "starpuff_food";

export type FoodInventory = Record<string, number>;

/** 判断是否为「商店治愈小零食」id（snack_ 前缀） */
const isSnackItem = (id: string) => id.startsWith("snack_");

/** 读取背包数量（合并喂食食物库存 + 商店零食库存，含首次进入赠送） */
export function readFoodInventory(): FoodInventory {
  let food: FoodInventory = {};
  let snack: FoodInventory = {};

  try {
    const raw = localStorage.getItem(INVENTORY_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") food = parsed as FoodInventory;
    }
  } catch {
    /* 忽略损坏数据 */
  }
  try {
    const raw = localStorage.getItem(SNACK_INVENTORY_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") snack = parsed as FoodInventory;
    }
  } catch {
    /* 忽略损坏数据 */
  }

  // 首次进入赠送：星辰饼干 x5 + 商店零食各给一点（若都为空才初始化）
  if (Object.keys(food).length === 0 && Object.keys(snack).length === 0) {
    food = { dust_cookie: 5 };
    try {
      localStorage.setItem(INVENTORY_KEY, JSON.stringify(food));
    } catch {
      /* 忽略存储失败 */
    }
  }

  // 合并：snack_* 以商店零食库存为准，其余以喂食库存为准
  return { ...food, ...snack };
}

/** 写入背包数量：snack_* 写回商店零食库存，其余写回喂食库存（两套互通） */
export function writeFoodInventory(inventory: FoodInventory): void {
  const food: FoodInventory = {};
  const snack: FoodInventory = {};
  for (const [id, count] of Object.entries(inventory)) {
    if (isSnackItem(id)) snack[id] = count;
    else food[id] = count;
  }
  try {
    localStorage.setItem(INVENTORY_KEY, JSON.stringify(food));
  } catch {
    /* 忽略存储失败 */
  }
  try {
    localStorage.setItem(SNACK_INVENTORY_KEY, JSON.stringify(snack));
  } catch {
    /* 忽略存储失败 */
  }
}

/** 获取某食物的拥有数量 */
export function getFoodCount(inventory: FoodInventory, foodId: string): number {
  return inventory[foodId] ?? 0;
}

/** 根据 id 查找食物 */
export function findFoodById(foodId: string): FoodItem | undefined {
  return foodItems.find((f) => f.id === foodId);
}
