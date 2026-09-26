/**
 * microtransaction-api - Steam 微交易桥接 API
 * 核心服务层：处理 Steam Web API 调用
 *
 * 基于 jasielmacedo/steam-microtransaction-api (MIT License)
 * 依据 Steamworks 官方文档 ISteamMicroTxn Interface 校正
 */

import type {
  InitPurchaseRequest,
  FinalizePurchaseRequest,
  CheckPurchaseStatusRequest,
  GetReliableUserInfoRequest,
  InitPurchaseResult,
  PurchaseStatusResult,
  ReliableUserInfo,
  Product,
  ApiResponse,
} from "./types";

import products from "./products.json" with { type: "json" };
import crypto from "crypto";
import { hasOrder, registerOrder, markOrderFinalized } from "./orders";

// ---- 配置 ----

interface SteamApiConfig {
  /** Steam Web API Key */
  webApiKey: string;
  /** 应用 ID */
  appId: number;
  /** 是否使用沙盒环境（开发/测试） */
  sandbox: boolean;
  /** 是否启用模拟模式（无 Steam Key 时使用） */
  mockMode: boolean;
}

function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}

function resolveMockMode(): boolean {
  // 生产环境严禁 mock 模式，防止"假发货/假扣款"资损
  if (isProduction()) {
    if (!process.env.STEAM_WEB_API_KEY) {
      console.warn(
        "[microtransaction-api] 生产环境未配置 STEAM_WEB_API_KEY，微交易接口将直接报错而非静默 mock。"
      );
    }
    return false;
  }
  // 开发环境：无 Key 或显式开启 mock 时使用模拟模式
  return !process.env.STEAM_WEB_API_KEY || process.env.STEAM_MOCK_MODE === "true";
}

let config: SteamApiConfig = {
  webApiKey: process.env.STEAM_WEB_API_KEY || "",
  appId: Number(process.env.STEAM_APP_ID) || 480,
  sandbox: process.env.STEAM_SANDBOX === "true",
  mockMode: resolveMockMode(),
};

/** 更新配置 */
export function updateConfig(partial: Partial<SteamApiConfig>): void {
  config = { ...config, ...partial };
}

export function getConfig(): Readonly<SteamApiConfig> {
  return config;
}

// ---- Steam Web API 底层调用 ----

const STEAM_API_BASE = "https://partner.steam-api.com";
/** [BUG-FIX] Steam 调用超时（毫秒）：原实现无超时，连接挂起时请求永不返回，
 *  定时对账任务会不断堆积悬挂请求（内存泄漏 + 接口不可用）。 */
const STEAM_API_TIMEOUT_MS = 15_000;

/** 单个毫秒时间片内的随机空间（2^20 ≈ 104 万，保证 64 位内可长期使用） */
const ORDER_RAND_SPACE = 1_048_576n;
/** 单笔订单允许的最大数量，避免超大值撑爆金额/库存 */
const MAX_ORDER_QUANTITY = 100;

/** 生成 64 位唯一订单号（Steam 要求由服务端分配） */
export function generateOrderId(): string {
  // [BUG-FIX] 原实现仅用 Math.random()*1e6，同一毫秒内两笔订单有 1/10^6 概率碰撞。
  // orderId 是发放幂等键，一旦碰撞，第二笔真实付款会被判为「已发放」而拿不到货。
  // 改用加密随机数扩大随机空间，并与订单注册表比对，保证进程内绝对唯一。
  const timestamp = BigInt(Date.now());
  let seq = BigInt(crypto.randomInt(0, Number(ORDER_RAND_SPACE)));
  for (let i = 0; i < 200; i++) {
    const id = (timestamp * ORDER_RAND_SPACE + seq).toString();
    if (!hasOrder(id)) return id;
    seq = (seq + 1n) % ORDER_RAND_SPACE;
  }
  // 理论上不可达（同一毫秒内产生 200 笔订单）；兜底也保持纯数字
  return (timestamp * ORDER_RAND_SPACE + seq).toString();
}

async function callSteamApi<T>(
  endpoint: string,
  method: "GET" | "POST" = "POST",
  body?: Record<string, unknown>
): Promise<T> {
  // Build URL and parameters. For GET requests we must append params to the URL;
  // for POST requests send as application/x-www-form-urlencoded body.
  let url = `${STEAM_API_BASE}${endpoint}`;

  const params = new URLSearchParams();
  if (config.webApiKey) {
    params.append("key", config.webApiKey);
  }

  if (body) {
    for (const [key, value] of Object.entries(body)) {
      params.append(key, String(value));
    }
  }

  const options: RequestInit = { method };

  if (method === "GET") {
    const q = params.toString();
    if (q) url += `?${q}`;
  } else {
    // POST
    options.headers = { "Content-Type": "application/x-www-form-urlencoded" };
    options.body = params.toString();
  }

  const response = await fetch(url, { ...options, signal: AbortSignal.timeout(STEAM_API_TIMEOUT_MS) });
  const text = await response.text();

  if (!response.ok) {
    // [BUG-FIX] 不把 Steam 响应体拼进异常消息：它会经 error.message 一路透传到前端 JSON，
    // 可能泄露内部请求细节。详细内容只写服务端日志。
    console.error(`[steam] HTTP ${response.status} 响应体:`, text);
    throw new Error(`Steam API HTTP error (${response.status})`);
  }

  const json = JSON.parse(text);
  // Steam API 通过 result 字段返回状态，而非 HTTP 状态码
  if (json.result === "Failure" || json.error) {
    const code = json.error?.errorcode ?? "unknown";
    const desc = json.error?.errordesc ?? "未知错误";
    throw new Error(`Steam API failure (code ${code}): ${desc}`);
  }
  return json as T;
}

// ---- 产品管理 ----

/** 获取所有产品列表 */
export function getProducts(): Product[] {
  return products as Product[];
}

/** 根据 ID 查找产品 */
export function findProduct(itemId: number): Product | undefined {
  return (products as Product[]).find((p) => p.id === itemId);
}

// ---- 业务 API ----

/**
 * 验证用户是否可信（防欺诈）
 * 官方接口：ISteamMicroTxn/GetUserInfo/v2/
 * 返回 status: "Active" | "Trusted" | "Locked from purchasing"
 */
export async function getReliableUserInfo(
  req: GetReliableUserInfoRequest
): Promise<ApiResponse<ReliableUserInfo>> {
  if (config.mockMode) {
    return {
      success: true,
      data: {
        isReliable: true,
        steamId: req.steamId,
        accountCreatedAt: Math.floor(Date.now() / 1000) - 86400 * 365,
        hasVacBan: false,
      },
    };
  }

  try {
    const result = await callSteamApi<{ params?: { status?: string; country?: string; currency?: string } }>(
      "/ISteamMicroTxn/GetUserInfo/v2/",
      "GET",
      { steamid: req.steamId, appid: config.appId }
    );
    const status = result.params?.status || "";
    // "Active" 或 "Trusted" 均可购买，"Locked from purchasing" 则拒绝
    const isReliable = status === "Active" || status === "Trusted";
    return {
      success: true,
      data: {
        isReliable,
        steamId: req.steamId,
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * 初始化购买（触发 Steam 叠加层授权）
 * 官方接口：ISteamMicroTxn/InitTxn/v3/
 * 关键：orderid 必须由服务端生成；itemid/qty/amount/description 使用数组下标格式
 */
export async function initPurchase(
  req: InitPurchaseRequest
): Promise<ApiResponse<InitPurchaseResult>> {
  const product = findProduct(req.itemId);
  if (!product) {
    return { success: false, error: `商品 ID ${req.itemId} 不存在` };
  }

  // [BUG-FIX] 数量必须为正整数且有上限：原实现只判 >0，
  // quantity=0.5 会产生分数美分/分数件数，quantity=1e12 无上限。
  const rawQuantity = Number(req.quantity);
  const quantity =
    Number.isInteger(rawQuantity) && rawQuantity > 0
      ? Math.min(rawQuantity, MAX_ORDER_QUANTITY)
      : 1;
  const orderId = generateOrderId();
  // 金额单位：分；多数量时 amount 为总价
  const totalAmount = product.priceInCents * quantity;

  if (config.mockMode) {
    console.log(`[MOCK] InitPurchase: ${product.name} x${quantity} → ${orderId}`);
    // [BUG-FIX] 登记订单，供 /grant 校验订单真实性（防止伪造 orderId 凭空领取）
    registerOrder({ orderId, steamId: req.steamId, itemId: req.itemId, quantity, createdAt: Date.now() });
    return {
      success: true,
      data: {
        orderId,
        requiresSteamOverlay: false,
        status: "Init",
      },
    };
  }

  try {
    const endpoint = config.sandbox
      ? "/ISteamMicroTxnSandbox/InitTxn/v3/"
      : "/ISteamMicroTxn/InitTxn/v3/";

    // Steam 要求 currency 必须匹配用户钱包货币，否则报错误码 8
    // 若客户端未显式传入货币，先查询用户钱包货币
    let currency = req.currency;
    if (!currency) {
      const userInfo = await callSteamApi<{ params?: { currency?: string } }>(
        "/ISteamMicroTxn/GetUserInfo/v2/",
        "GET",
        { steamid: req.steamId, appid: req.appId }
      );
      currency = userInfo.params?.currency || "USD";
    }

    await callSteamApi(endpoint, "POST", {
      orderid: orderId,
      steamid: req.steamId,
      appid: req.appId,
      itemcount: 1, // 购物车物品种类数（此处单商品 = 1）
      language: req.language || "schinese",
      currency,
      "itemid[0]": req.itemId,
      "qty[0]": quantity,
      "amount[0]": totalAmount,
      "description[0]": req.description || product.name,
      "category[0]": product.category || "",
      usersession: "client",
    });

    // [BUG-FIX] Steam 侧下单成功后才登记，供 /grant 校验订单真实性
    registerOrder({ orderId, steamId: req.steamId, itemId: req.itemId, quantity, createdAt: Date.now() });

    return {
      success: true,
      data: {
        orderId,
        requiresSteamOverlay: true,
        status: "Init",
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * 完成购买（用户授权后调用，此时才真正扣款）
 * 官方接口：ISteamMicroTxn/FinalizeTxn/v2/
 * 参数：orderid + appid
 */
export async function finalizePurchase(
  req: FinalizePurchaseRequest
): Promise<ApiResponse<{ status: string }>> {
  if (config.mockMode) {
    console.log(`[MOCK] FinalizePurchase: order ${req.orderId} completed`);
    // [BUG-FIX] 标记订单已支付，只有 Finalized 的订单才允许发放权益
    if (!markOrderFinalized(req.orderId)) {
      console.warn(`[MOCK] FinalizePurchase: 订单 ${req.orderId} 不在注册表中（可能已过期或伪造）`);
    }
    return { success: true, data: { status: "Succeeded" } };
  }

  try {
    const endpoint = config.sandbox
      ? "/ISteamMicroTxnSandbox/FinalizeTxn/v2/"
      : "/ISteamMicroTxn/FinalizeTxn/v2/";

    await callSteamApi(endpoint, "POST", {
      orderid: req.orderId,
      appid: req.appId,
    });
    // [BUG-FIX] 标记订单已支付，只有 Finalized 的订单才允许发放权益
    if (!markOrderFinalized(req.orderId)) {
      console.warn(`[finalize] 订单 ${req.orderId} 不在注册表中（可能服务重启或订单已过期）`);
    }
    return { success: true, data: { status: "Succeeded" } };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * 查询购买状态
 * 官方接口：ISteamMicroTxn/QueryTxn/v3/
 */
export async function checkPurchaseStatus(
  req: CheckPurchaseStatusRequest
): Promise<ApiResponse<PurchaseStatusResult>> {
  if (config.mockMode) {
    return {
      success: true,
      data: {
        orderId: req.orderId || "mock_order",
        status: "Succeeded",
        itemId: 100,
        amountInCents: 600,
      },
    };
  }

  try {
    const endpoint = config.sandbox
      ? "/ISteamMicroTxnSandbox/QueryTxn/v3/"
      : "/ISteamMicroTxn/QueryTxn/v3/";

    const body: Record<string, unknown> = { appid: req.appId };
    if (req.orderId) {
      body.orderid = req.orderId;
    }

    const result = await callSteamApi<{
      response?: {
        params?: {
          orderid?: string;
          status?: string;
          items?: Array<{ itemid?: number; amount?: number }>;
        };
      };
    }>(endpoint, "GET", body);

    const params = result.response?.params;
    const item = params?.items?.[0];

    return {
      success: true,
      data: {
        orderId: params?.orderid || req.orderId || "",
        status: params?.status || "Init",
        itemId: item?.itemid,
        amountInCents: item?.amount,
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * 检查用户是否拥有该应用
 * 注意：该方法属于 ISteamUser 接口，而非 ISteamMicroTxn
 * 官方接口：ISteamUser/CheckAppOwnership/v2/
 */
export async function checkAppOwnership(
  steamId: string
): Promise<ApiResponse<{ ownsApp: boolean }>> {
  if (config.mockMode) {
    return { success: true, data: { ownsApp: true } };
  }

  try {
    const result = await callSteamApi<{ appownership?: { ownsapp?: boolean } }>(
      "/ISteamUser/CheckAppOwnership/v2/",
      "GET",
      { steamid: steamId, appid: config.appId }
    );
    return {
      success: true,
      data: { ownsApp: result.appownership?.ownsapp || false },
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ---- 对账 ----

export interface SettlementRecord {
  orderid: string;
  transid: string;
  steamid: string;
  status: string;
  time: string;
  items?: Array<{ itemid?: number; qty?: number; amount?: number; itemstatus?: string }>;
}

/**
 * 获取交易对账报告
 * 官方接口：ISteamMicroTxn/GetReport/v5/
 * 用于发现退款/拒付等状态变更，驱动物品回收。
 * 建议生产环境定时（至少每日一次）调用。
 *
 * type: "GAMESALES" | "SETTLEMENT" | "CHARGEBACK" | "SUBSCRIPTION" 等
 */
export async function getReport(params?: {
  type?: string;
  time?: string;
  maxResults?: number;
}): Promise<ApiResponse<SettlementRecord[]>> {
  if (config.mockMode) {
    return { success: true, data: [] };
  }

  try {
    const endpoint = config.sandbox
      ? "/ISteamMicroTxnSandbox/GetReport/v5/"
      : "/ISteamMicroTxn/GetReport/v5/";

    const body: Record<string, unknown> = {
      appid: config.appId,
      type: params?.type || "GAMESALES",
      time: params?.time || new Date(Date.now() - 86400 * 1000).toISOString(),
      maxresults: params?.maxResults || 1000,
    };

    const result = await callSteamApi<{
      response?: { params?: { orders?: SettlementRecord[] } };
    }>(endpoint, "GET", body);

    return {
      success: true,
      data: result.response?.params?.orders || [],
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
