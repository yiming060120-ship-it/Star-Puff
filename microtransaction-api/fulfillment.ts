/**
 * microtransaction-api - 订单与发放服务
 *
 * 职责：
 * 1. 记录已完成 Finalize 的订单，防止重复发货（幂等）
 * 2. 将商品映射为可发放的权益（星尘币 / VIP 会员）
 * 3. 提供对账（GetReport）与退款回收的骨架
 *
 * ⚠️ 注意：当前 StarPuff 用户经济数据存储在前端 localStorage，
 * 尚无后端用户数据库。本模块提供发放规则定义与订单账本，
 * 后续接入真实数据库后，将 grant() 的持久化部分替换即可。
 */

import type { Product, ApiResponse } from "./types";
import { findProduct } from "./service";
import fs from "fs";
import path from "path";
import * as db from "./db";

// ---- 发放权益定义 ----

export type GrantKind = "stardust_coins" | "membership";

export interface GrantPayload {
  /** 发放类型 */
  kind: GrantKind;
  /** 发放数量（星尘币为数量；会员为天数） */
  amount: number;
  /** 会员等级（仅 membership 时有效） */
  membershipLevel?: "vip_month" | "vip_year";
}

export interface GrantResult {
  orderId: string;
  steamId: string;
  itemId: number;
  payload: GrantPayload;
  grantedAt: string;
}

/**
 * 将商品映射为可发放的权益。
 * 星尘币数量取自商品的 coins 字段；会员等级取自 tier 字段。
 */
export function mapProductToGrant(itemId: number, quantity: number): GrantPayload | null {
  const product = findProduct(itemId);
  if (!product) return null;

  switch (product.category) {
    case "stardust_coins": {
      // 优先使用商品上显式声明的 coins 字段，否则回退到从名称解析
      const coins = (product as Product & { coins?: number }).coins ?? resolveStardustCoins(product);
      return {
        kind: "stardust_coins",
        amount: coins * quantity,
      };
    }
    case "membership":
      return {
        kind: "membership",
        amount: quantity,
        membershipLevel: resolveMembershipLevel(product),
      };
    default:
      return null;
  }
}

function resolveStardustCoins(product: Product): number {
  // 回退方案：从商品名解析数字，如 "星尘币 ×600"
  const match = product.name.match(/(\d+)/);
  return match ? Number(match[1]) : 0;
}

function resolveMembershipLevel(product: Product): "vip_month" | "vip_year" {
  const tier = (product as Product & { tier?: string }).tier;
  return tier === "vip_year" ? "vip_year" : "vip_month";
}

// ---- 订单账本（内存实现 + 可选持久化，防重复发货）----

/** 已发放订单记录（内存） */
const grantedOrders = new Map<string, GrantResult>();

// 持久化路径：microtransaction-api/data/grants.json
const GRANTS_DIR = path.join(__dirname, "data");
const GRANTS_FILE = path.join(GRANTS_DIR, "grants.json");

function loadPersistedGrants(): void {
  try {
    if (!fs.existsSync(GRANTS_FILE)) return;
    const raw = fs.readFileSync(GRANTS_FILE, { encoding: "utf8" });
    const arr = JSON.parse(raw) as GrantResult[];
    for (const g of arr) {
      grantedOrders.set(g.orderId, g);
    }
  } catch (err) {
    console.warn("[fulfillment] 无法加载持久化发放账本：", err);
  }
}

function persistGrants(): void {
  try {
    if (!fs.existsSync(GRANTS_DIR)) {
      fs.mkdirSync(GRANTS_DIR, { recursive: true });
    }
    const arr = Array.from(grantedOrders.values());
    const tmp = `${GRANTS_FILE}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(arr, null, 2), { encoding: "utf8" });
    fs.renameSync(tmp, GRANTS_FILE);
  } catch (err) {
    console.error("[fulfillment] 无法持久化发放账本：", err);
  }
}

// 初始化时加载已有持久化发放记录（保留兼容文件方案，优先使用 SQLite）
loadPersistedGrants();
// 将现有文件内的数据迁移到 SQLite（若尚未迁移）
try {
  const existing = listGrantedOrders();
  for (const g of existing) {
    const found = db.getGrant(g.orderId);
    if (!found) {
      db.insertGrant(g);
    }
  }
  // 将用户文件迁移
  // (users.json -> users table)
  try {
    const usersFile = path.join(GRANTS_DIR, "users.json");
    if (fs.existsSync(usersFile)) {
      const raw = fs.readFileSync(usersFile, "utf8");
      const arr = JSON.parse(raw) as any[];
      for (const u of arr) db.upsertUser(u.steamId, u.coins || 0, u.membershipExpires ?? null);
    }
  } catch (e) {
    console.warn("[migration] users.json -> sqlite migration failed:", e?.message ?? e);
  }
} catch (e) {
  console.warn("[migration] grants file -> sqlite migration failed:", e?.message ?? e);
}

// ---- 用户账户（轻量持久化，作为权威余额起点）----
interface UserAccount {
  steamId: string;
  coins: number;
  membershipExpires?: string | null; // ISO 日期字符串
}

const USERS_FILE = path.join(GRANTS_DIR, "users.json");
const users = new Map<string, UserAccount>();

function loadPersistedUsers(): void {
  try {
    if (!fs.existsSync(USERS_FILE)) return;
    const raw = fs.readFileSync(USERS_FILE, { encoding: "utf8" });
    const arr = JSON.parse(raw) as UserAccount[];
    for (const u of arr) users.set(u.steamId, u);
  } catch (err) {
    console.warn("[fulfillment] 无法加载持久化用户帐户：", err);
  }
}

function persistUsers(): void {
  try {
    if (!fs.existsSync(GRANTS_DIR)) fs.mkdirSync(GRANTS_DIR, { recursive: true });
    const arr = Array.from(users.values());
    const tmp = `${USERS_FILE}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(arr, null, 2), { encoding: "utf8" });
    fs.renameSync(tmp, USERS_FILE);
  } catch (err) {
    console.error("[fulfillment] 无法持久化用户账本：", err);
  }
}

loadPersistedUsers();

function getOrCreateUser(steamId: string): UserAccount {
  let u = users.get(steamId);
  if (!u) {
    u = { steamId, coins: 0, membershipExpires: null };
    users.set(steamId, u);
  }
  return u;
}

function applyGrantToUser(grant: GrantResult): void {
  try {
    const u = getOrCreateUser(grant.steamId);
    if (grant.payload.kind === "stardust_coins") {
      u.coins = (u.coins || 0) + grant.payload.amount;
    } else if (grant.payload.kind === "membership") {
      // membership.amount denotes quantity (months or years depending on membershipLevel)
      const days = grant.payload.membershipLevel === "vip_year" ? 365 * grant.payload.amount : 30 * grant.payload.amount;
      const now = new Date();
      const currentExpiry = u.membershipExpires ? new Date(u.membershipExpires) : null;
      const base = currentExpiry && currentExpiry > now ? currentExpiry : now;
      const newExpiry = new Date(base.getTime() + days * 24 * 3600 * 1000);
      u.membershipExpires = newExpiry.toISOString();
    }
    persistUsers();
  } catch (err) {
    console.error("[fulfillment] applyGrantToUser failed:", err);
  }
}

function revertGrantForUser(grant: GrantResult): void {
  try {
    const u = users.get(grant.steamId);
    if (!u) return;
    if (grant.payload.kind === "stardust_coins") {
      u.coins = Math.max(0, (u.coins || 0) - grant.payload.amount);
    } else if (grant.payload.kind === "membership") {
      // Best-effort: if membershipExpires exists, subtract days from expiry
      if (u.membershipExpires) {
        const days = grant.payload.membershipLevel === "vip_year" ? 365 * grant.payload.amount : 30 * grant.payload.amount;
        const expiry = new Date(u.membershipExpires);
        const newExpiry = new Date(expiry.getTime() - days * 24 * 3600 * 1000);
        u.membershipExpires = newExpiry > new Date() ? newExpiry.toISOString() : null;
      }
    }
    persistUsers();
  } catch (err) {
    console.error("[fulfillment] revertGrantForUser failed:", err);
  }
}

/** 检查订单是否已发放 */
export function isOrderGranted(orderId: string): boolean {
  return grantedOrders.has(orderId);
}

/** 记录发放结果 */
export function recordGrant(result: GrantResult): void {
  grantedOrders.set(result.orderId, result);
  // 持久化到磁盘，确保重启后账本不丢失
  try {
    persistGrants();
    // 同步到 SQLite（事务化）
    db.applyGrantTransaction(result);
  } catch (err) {
    console.error("[fulfillment] persistGrants failed:", err);
  }
}

/** 获取所有已发放订单（对账用） */
export function listGrantedOrders(): GrantResult[] {
  // If SQLite has authoritative data, prefer that
  try {
    const rows = db.listGrants();
    return rows as GrantResult[];
  } catch (e) {
    return Array.from(grantedOrders.values());
  }
}

// ---- 发放接口 ----

export interface GrantRequest {
  orderId: string;
  steamId: string;
  itemId: number;
  quantity?: number;
}

/**
 * 执行发放（幂等：同一订单不会重复发放）
 *
 * 说明：当前仅返回"应发放的权益"，实际写入用户余额需由
 * 前端调用方根据 payload 更新 localStorage。接入后端数据库后，
 * 此处应改为服务端直接扣减/累加用户余额。
 */
export async function grantItems(
  req: GrantRequest
): Promise<ApiResponse<GrantResult>> {
  const { orderId, steamId, itemId, quantity = 1 } = req;

  if (!orderId || !steamId || !itemId) {
    return { success: false, error: "缺少 orderId / steamId / itemId" };
  }

  // 幂等：已发放则直接返回，避免重复发货
  if (isOrderGranted(orderId)) {
    return {
      success: true,
      data: grantedOrders.get(orderId),
      message: "订单已发放，跳过重复处理",
    };
  }

  const payload = mapProductToGrant(itemId, quantity);
  if (!payload) {
    return { success: false, error: `商品 ${itemId} 无法映射为可发放权益` };
  }

  const result: GrantResult = {
    orderId,
    steamId,
    itemId,
    payload,
    grantedAt: new Date().toISOString(),
  };

  recordGrant(result);
  console.log(`[GRANT] 订单 ${orderId} 发放成功:`, payload);
  return { success: true, data: result };
}

// ---- 对账（退款回收骨架）----

export interface RefundAction {
  orderId: string;
  /** 退款/拒付类型 */
  type: "Refunded" | "Chargedback" | "RefundedSuspectedFraud" | "RefundedFriendlyFraud";
  /** 需要回收的权益 */
  payload: GrantPayload;
}

/**
 * 处理退款/拒付回收。
 * 生产环境应由 GetReport 定时任务驱动，此处提供手动触发接口。
 */
export function revokeGrant(orderId: string): ApiResponse<RefundAction | null> {
  // 优先以 SQLite 为准
  const granted = db.getGrant(orderId) || grantedOrders.get(orderId);
  if (!granted) {
    return { success: false, error: `订单 ${orderId} 无发放记录，无法回收` };
  }

  // 从账本移除
  // 从 SQLite 与内存账本中删除并回退用户权益
  try {
    db.revertGrantTransaction(granted);
  } catch (e) {
    console.warn("[fulfillment] revertGrantTransaction failed:", e?.message ?? e);
  }
  grantedOrders.delete(orderId);
  console.log(`[REVOKE] 订单 ${orderId} 已回收权益:`, granted.payload);
  return {
    success: true,
    data: {
      orderId,
      type: "Refunded",
      payload: granted.payload,
    },
  };
}
