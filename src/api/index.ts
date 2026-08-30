/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * API 层：封装所有后端 HTTP 调用。
 * 不依赖任何 UI 组件，只依赖 types.ts 中的契约类型。
 */

import type { PetConfig, Pet3DModelConfig } from "../types";
import { NetworkError, ApiError, toAppError } from "../core/errors";

/**
 * API 基址。默认同源：Electron 内嵌 Express / Vite 代理均为当前源。
 * 正式上架若迁移到自有托管后端（客户端零密钥），把此常量改为后端根 URL 即可，如 "https://api.starpuff.example.com"。
 */
export const API_BASE = "";

/**
 * 统一请求底层：封装 fetch，把网络错误 / HTTP 错误 / JSON 解析失败
 * 收敛为「带 success 字段的结构化结果」，绝不向上层抛出未捕获异常。
 *
 * 这样组件层无需在每次调用处重复写 try-catch，
 * 也避免「fetch 因断网抛异常导致按钮点了没反应」的隐患。
 */
async function request<T>(
  path: string,
  options?: { method?: string; body?: unknown }
): Promise<{ success: boolean; data?: T; error?: string }> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method: options?.method ?? "GET",
      headers: options?.body !== undefined ? { "Content-Type": "application/json" } : undefined,
      body: options?.body !== undefined ? JSON.stringify(options.body) : undefined,
    });
  } catch (err) {
    const e = toAppError(err, "NETWORK_ERROR");
    const appErr = e instanceof NetworkError ? e : new NetworkError(undefined, e);
    return { success: false, error: appErr.message };
  }

  if (!res.ok) {
    const apiErr = new ApiError(`服务返回异常状态码 ${res.status}`, { status: res.status });
    return { success: false, error: apiErr.message };
  }

  try {
    const data = (await res.json()) as T;
    return { success: true, data };
  } catch (err) {
    const e = toAppError(err, "PARSE_ERROR");
    return { success: false, error: `响应解析失败：${e.message}` };
  }
}

// ---- 耳语生成 ----

export interface WhisperResponse {
  success: boolean;
  provider: string;
  whispers: string[];
  error?: string;
}

export async function generateWhispers(params: {
  ownerName: string;
  petName: string;
  petType: string;
  activeLevel: number;
  recentEvents: string[];
  isVip: boolean;
}): Promise<WhisperResponse> {
  const result = await request<WhisperResponse>("/api/whisper", {
    method: "POST",
    body: params,
  });
  if (!result.success) return { success: false, provider: "Offline", whispers: [], error: result.error };
  return result.data!;
}

// ---- AI 聊天 ----

export interface ChatResponse {
  success: boolean;
  provider: string;
  text: string;
  error?: string;
}

export async function sendChatMessage(params: {
  message: string;
  chatHistory: Array<{ sender: string; text: string }>;
  ownerName: string;
  petName: string;
  petType: string;
  breed: string;
  lore: string;
  personality: string;
}): Promise<ChatResponse> {
  const result = await request<ChatResponse>("/api/chat", {
    method: "POST",
    body: params,
  });
  if (!result.success) return { success: false, provider: "Offline", text: "", error: result.error };
  return result.data!;
}

// ---- 3D 重建 ----

export interface Reconstruct3DResponse {
  success: boolean;
  provider: string;
  model: Pet3DModelConfig;
  warning?: string;
}

export async function reconstruct3D(params: {
  petName: string;
  petType: string;
  primaryColor: string;
  base64Image: string;
}): Promise<Reconstruct3DResponse> {
  const result = await request<Reconstruct3DResponse>("/api/reconstruct-3d", {
    method: "POST",
    body: params,
  });
  // 失败时返回一个可被调用方安全消费的空响应（不含模型字段，success=false 驱动兜底）
  if (!result.success) {
    return { success: false, provider: "Offline", model: null as unknown as Pet3DModelConfig, warning: result.error };
  }
  return result.data!;
}

// ---- 成长故事 ----

export interface GrowthStoryResponse {
  success: boolean;
  provider: string;
  story: string;
  error?: string;
}

export async function generateGrowthStory(params: {
  petName: string;
  breed: string;
  petType: string;
}): Promise<GrowthStoryResponse> {
  const result = await request<GrowthStoryResponse>("/api/growth-story", {
    method: "POST",
    body: params,
  });
  if (!result.success) return { success: false, provider: "Offline", story: "", error: result.error };
  return result.data!;
}

// ---- AI 模式配置 ----

export interface AiConfigStatus {
  success: boolean;
  aiEnabled: boolean;
  providerMode: "Gemini" | "Offline";
}

/** 查询当前 AI 状态（离线模板 / Gemini 在线） */
export async function getAiConfigStatus(): Promise<AiConfigStatus> {
  const result = await request<AiConfigStatus>("/api/config/status");
  if (!result.success) return { success: false, aiEnabled: false, providerMode: "Offline" };
  return result.data!;
}

/** 设置 Gemini key（空串 = 关闭在线 AI 回离线模式） */
export async function setGeminiKey(key: string): Promise<AiConfigStatus> {
  const result = await request<AiConfigStatus>("/api/config/gemini-key", {
    method: "POST",
    body: { key },
  });
  if (!result.success) return { success: false, aiEnabled: false, providerMode: "Offline" };
  return result.data!;
}

// ---- 微交易 API (microtransaction-api) ----

export interface ProductItem {
  id: number;
  name: string;
  description: string;
  priceInCents: number;
  currency?: string;
  category?: string;
  coins?: number;
  tier?: "vip_month" | "vip_year";
}

export interface MtxApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

/** 获取所有商品列表 */
export async function getProducts(): Promise<MtxApiResponse<ProductItem[]>> {
  return request<ProductItem[]>("/api/mtx/products");
}

/** 初始化购买 */
export async function initPurchase(params: {
  steamId: string;
  itemId: number;
  quantity?: number;
  description?: string;
  language?: string;
  currency?: string;
}): Promise<MtxApiResponse<{ orderId: string; requiresSteamOverlay: boolean; status: string }>> {
  return request<{ orderId: string; requiresSteamOverlay: boolean; status: string }>("/api/mtx/init-purchase", {
    method: "POST",
    body: params,
  });
}

/** 完成购买 */
export async function finalizePurchase(params: {
  steamId: string;
  orderId: string;
}): Promise<MtxApiResponse<{ status: string }>> {
  return request<{ status: string }>("/api/mtx/finalize-purchase", {
    method: "POST",
    body: params,
  });
}

/** 查询购买状态 */
export async function checkPurchaseStatus(params: {
  steamId: string;
  orderId?: string;
}): Promise<MtxApiResponse<{ orderId: string; status: string; itemId?: number; amountInCents?: number }>> {
  return request<{ orderId: string; status: string; itemId?: number; amountInCents?: number }>("/api/mtx/check-purchase", {
    method: "POST",
    body: params,
  });
}

/** 验证用户可靠性 */
export async function verifyUser(steamId: string): Promise<MtxApiResponse<{ isReliable: boolean; steamId: string }>> {
  return request<{ isReliable: boolean; steamId: string }>("/api/mtx/verify-user", {
    method: "POST",
    body: { steamId },
  });
}

// ---- 发放与对账 ----

export interface GrantPayload {
  kind: "stardust_coins" | "membership";
  amount: number;
  membershipLevel?: "vip_month" | "vip_year";
}

export interface GrantResult {
  orderId: string;
  steamId: string;
  itemId: number;
  payload: GrantPayload;
  grantedAt: string;
}

/** 发放权益（Finalize 成功后调用） */
export async function grantItems(params: {
  orderId: string;
  steamId: string;
  itemId: number;
  quantity?: number;
}): Promise<MtxApiResponse<GrantResult>> {
  return request<GrantResult>("/api/mtx/grant", {
    method: "POST",
    body: params,
  });
}

/** 回收权益（退款/拒付时调用） */
export async function revokeGrant(orderId: string): Promise<MtxApiResponse<{ orderId: string; type: string; payload: GrantPayload }>> {
  return request<{ orderId: string; type: string; payload: GrantPayload }>("/api/mtx/revoke", {
    method: "POST",
    body: { orderId },
  });
}
