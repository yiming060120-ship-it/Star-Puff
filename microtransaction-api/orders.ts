/**
 * microtransaction-api - 服务端订单注册表
 *
 * 职责：记录由本服务 InitTxn 创建、并已成功 FinalizeTxn 的订单，
 * 作为 /grant 发放接口的权威校验依据。
 *
 * 背景（安全修复）：原 /grant 接口不校验订单是否真实存在，
 * 任何人 POST 一个伪造 orderId 即可凭空领取星尘币/会员（资损）。
 * 现要求发放必须命中「本服务初始化且已完成支付」的订单，且归属用户/商品一致。
 */

import fs from "fs";
import path from "path";

export interface RegisteredOrder {
  orderId: string;
  steamId: string;
  itemId: number;
  quantity: number;
  /** Init：已初始化但未完成支付；Finalized：已完成支付，可发放 */
  status: "Init" | "Finalized";
  createdAt: number;
  finalizedAt?: number;
}

const DATA_ROOT = process.env.STARPUFF_DATA_DIR || path.join(process.cwd(), "microtransaction-data");
const ORDERS_DIR = path.join(DATA_ROOT, "data");
const ORDERS_FILE = path.join(ORDERS_DIR, "orders.json");

/** 未完成支付订单的保留时长：超过后自动清理，避免文件无限增长 */
const ORDER_TTL_MS = 7 * 24 * 3600 * 1000;

const orders = new Map<string, RegisteredOrder>();

function load(): void {
  try {
    if (!fs.existsSync(ORDERS_FILE)) return;
    const raw = fs.readFileSync(ORDERS_FILE, { encoding: "utf8" });
    const arr = JSON.parse(raw) as RegisteredOrder[];
    const now = Date.now();
    for (const o of arr) {
      if (!o || typeof o.orderId !== "string" || !o.orderId) continue;
      // 丢弃过期的未完成订单（已 Finalize 的订单永久保留，用于幂等与对账）
      if (o.status !== "Finalized" && now - (o.createdAt || 0) > ORDER_TTL_MS) continue;
      orders.set(o.orderId, o);
    }
  } catch (err) {
    console.warn("[orders] 无法加载订单注册表：", err);
  }
}

function persist(): void {
  try {
    if (!fs.existsSync(ORDERS_DIR)) fs.mkdirSync(ORDERS_DIR, { recursive: true });
    const tmp = `${ORDERS_FILE}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(Array.from(orders.values()), null, 2), { encoding: "utf8" });
    fs.renameSync(tmp, ORDERS_FILE);
  } catch (err) {
    console.error("[orders] 无法持久化订单注册表：", err);
  }
}

load();

/** 订单号是否已被占用（供生成器保证唯一） */
export function hasOrder(orderId: string): boolean {
  return orders.has(orderId);
}

/** 登记一笔新初始化的订单 */
export function registerOrder(order: {
  orderId: string;
  steamId: string;
  itemId: number;
  quantity: number;
  createdAt: number;
}): void {
  orders.set(order.orderId, { ...order, status: "Init" });
  persist();
}

/** 标记订单已完成支付；返回是否存在该订单 */
export function markOrderFinalized(orderId: string): boolean {
  const o = orders.get(orderId);
  if (!o) return false;
  o.status = "Finalized";
  o.finalizedAt = Date.now();
  persist();
  return true;
}

/** 查询订单（发放校验用） */
export function getOrder(orderId: string): RegisteredOrder | undefined {
  return orders.get(orderId);
}
