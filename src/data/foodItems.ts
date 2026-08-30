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
  price: number;         // 星尘币
  rarity: "common" | "rare" | "epic";
  description: string;
  animation: "eat_normal" | "eat_happy" | "eat_special";
}

export const foodItems: FoodItem[] = [
  {
    id: "dust_cookie",
    name: "星尘饼干",
    icon: "🍪",
    hungerRestore: 20,
    energyRestore: 5,
    moodRestore: 5,
    price: 5,
    rarity: "common",
    description: "用星尘烘焙的小饼干，宠物的最爱",
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
    description: "凝结了时光的珍贵结晶，恢复满状态",
    animation: "eat_special",
  },
];

const INVENTORY_KEY = "starpuff_food_inventory";

export type FoodInventory = Record<string, number>;

/** 读取背包数量（含首次进入赠送星尘饼干 x5） */
export function readFoodInventory(): FoodInventory {
  try {
    const raw = localStorage.getItem(INVENTORY_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") return parsed as FoodInventory;
    }
  } catch {
    /* 忽略损坏数据 */
  }
  // 首次进入赠送：星尘饼干 x5
  const initial: FoodInventory = { dust_cookie: 5 };
  try {
    localStorage.setItem(INVENTORY_KEY, JSON.stringify(initial));
  } catch {
    /* 忽略存储失败 */
  }
  return initial;
}

/** 写入背包数量 */
export function writeFoodInventory(inventory: FoodInventory): void {
  try {
    localStorage.setItem(INVENTORY_KEY, JSON.stringify(inventory));
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
