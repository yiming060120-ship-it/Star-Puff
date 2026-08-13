/**
 * microtransaction-api - Steam 微交易桥接 API
 * 核心服务层：处理 Steam Web API 调用
 *
 * 基于 jasielmacedo/steam-microtransaction-api (MIT License)
 * 为 StarPuff 项目定制
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

// ---- 配置 ----

interface SteamApiConfig {
  /** Steam Web API Key */
  webApiKey: string;
  /** 应用 ID */
  appId: number;
  /** 是否启用模拟模式（开发环境无 Steam Key 时使用） */
  mockMode: boolean;
}

let config: SteamApiConfig = {
  webApiKey: process.env.STEAM_WEB_API_KEY || "",
  appId: Number(process.env.STEAM_APP_ID) || 480,
  mockMode: !process.env.STEAM_WEB_API_KEY || process.env.STEAM_MOCK_MODE === "true",
};

/** 更新配置（方便你朋友后续改命名时调整） */
export function updateConfig(partial: Partial<SteamApiConfig>): void {
  config = { ...config, ...partial };
}

export function getConfig(): Readonly<SteamApiConfig> {
  return config;
}

// ---- Steam Web API 底层调用 ----

const STEAM_API_BASE = "https://partner.steam-api.com";

async function callSteamApi<T>(
  endpoint: string,
  method: "GET" | "POST" = "POST",
  body?: Record<string, unknown>
): Promise<T> {
  const url = `${STEAM_API_BASE}${endpoint}?key=${config.webApiKey}`;

  const options: RequestInit = {
    method,
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  };

  if (body) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(body)) {
      params.append(key, String(value));
    }
    if (method === "POST") {
      options.body = params.toString();
    }
  }

  const response = await fetch(url, options);
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Steam API error (${response.status}): ${text}`);
  }
  return response.json();
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

/** 验证用户是否可信 */
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
    const result = await callSteamApi<{ params: { steamauth: string } }>(
      "/ISteamMicroTxnSandbox/GetReliableUserInfo/v1/",
      "POST",
      { steamid: req.steamId }
    );
    return {
      success: true,
      data: {
        isReliable: result.params?.steamauth === "trusted",
        steamId: req.steamId,
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/** 初始化购买（触发 Steam 叠加层） */
export async function initPurchase(
  req: InitPurchaseRequest
): Promise<ApiResponse<InitPurchaseResult>> {
  const product = findProduct(req.itemId);
  if (!product) {
    return { success: false, error: `商品 ID ${req.itemId} 不存在` };
  }

  if (config.mockMode) {
    const mockOrderId = `mock_order_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    console.log(`[MOCK] InitPurchase: ${product.name} x${req.quantity} → ${mockOrderId}`);
    return {
      success: true,
      data: {
        orderId: mockOrderId,
        requiresSteamOverlay: false,
        status: "pending",
      },
    };
  }

  try {
    const result = await callSteamApi<{
      response?: { params?: { orderid?: string; transid?: string } };
    }>(
      "/ISteamMicroTxnSandbox/InitTxn/v3/",
      "POST",
      {
        steamid: req.steamId,
        appid: req.appId,
        itemcount: req.quantity,
        itemid: [req.itemId],
        itemamount: [product.priceInCents],
        itemdescription: [req.description || product.name],
        language: req.language || "zh-CN",
        currency: req.currency || "CNY",
        usersession: "client",
      }
    );

    const orderId = result.response?.params?.orderid || "";
    return {
      success: true,
      data: {
        orderId,
        requiresSteamOverlay: true,
        status: "pending",
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/** 完成购买（用户支付后调用） */
export async function finalizePurchase(
  req: FinalizePurchaseRequest
): Promise<ApiResponse<{ status: string }>> {
  if (config.mockMode) {
    console.log(`[MOCK] FinalizePurchase: order ${req.orderId} completed`);
    return { success: true, data: { status: "completed" } };
  }

  try {
    await callSteamApi("/ISteamMicroTxnSandbox/FinalizeTxn/v2/", "POST", {
      steamid: req.steamId,
      appid: req.appId,
      orderid: req.orderId,
    });
    return { success: true, data: { status: "completed" } };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/** 查询购买状态 */
export async function checkPurchaseStatus(
  req: CheckPurchaseStatusRequest
): Promise<ApiResponse<PurchaseStatusResult>> {
  if (config.mockMode) {
    return {
      success: true,
      data: {
        orderId: req.orderId || "mock_order",
        status: "completed",
        itemId: 100,
        amountInCents: 600,
      },
    };
  }

  try {
    const result = await callSteamApi<{
      response?: { params?: { status?: string; orderid?: string } };
    }>("/ISteamMicroTxnSandbox/QueryTxn/v2/", "POST", {
      steamid: req.steamId,
      appid: req.appId,
      orderid: req.orderId || "",
    });

    const status = result.response?.params?.status || "unknown";
    return {
      success: true,
      data: {
        orderId: result.response?.params?.orderid || "",
        status: status as PurchaseStatusResult["status"],
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/** 检查用户是否拥有该应用 */
export async function checkAppOwnership(
  steamId: string
): Promise<ApiResponse<{ ownsApp: boolean }>> {
  if (config.mockMode) {
    return { success: true, data: { ownsApp: true } };
  }

  try {
    const result = await callSteamApi<{ response?: { appownership?: { ownsapp?: boolean } } }>(
      "/ISteamMicroTxn/CheckAppOwnership/v1/",
      "GET"
    );
    return {
      success: true,
      data: { ownsApp: result.response?.appownership?.ownsapp || false },
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
