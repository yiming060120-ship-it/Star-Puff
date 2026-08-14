/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * API 层：封装所有后端 HTTP 调用。
 * 不依赖任何 UI 组件，只依赖 types.ts 中的契约类型。
 */

import type { PetConfig, Pet3DModelConfig } from "../types";

/**
 * API 基址。默认同源：Electron 内嵌 Express / Vite 代理均为当前源。
 * 正式上架若迁移到自有托管后端（客户端零密钥），把此常量改为后端根 URL 即可，如 "https://api.starpuff.example.com"。
 */
export const API_BASE = "";

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
  const res = await fetch(`${API_BASE}/api/whisper`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  return res.json();
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
  const res = await fetch(`${API_BASE}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  return res.json();
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
  const res = await fetch(`${API_BASE}/api/reconstruct-3d`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  return res.json();
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
  const res = await fetch(`${API_BASE}/api/growth-story`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  return res.json();
}

// ---- AI 模式配置 ----

export interface AiConfigStatus {
  success: boolean;
  aiEnabled: boolean;
  providerMode: "Gemini" | "Offline";
}

/** 查询当前 AI 状态（离线模板 / Gemini 在线） */
export async function getAiConfigStatus(): Promise<AiConfigStatus> {
  const res = await fetch(`${API_BASE}/api/config/status`);
  return res.json();
}

/** 设置 Gemini key（空串 = 关闭在线 AI 回离线模式） */
export async function setGeminiKey(key: string): Promise<AiConfigStatus> {
  const res = await fetch(`${API_BASE}/api/config/gemini-key`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ key }),
  });
  return res.json();
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
  const res = await fetch(`${API_BASE}/api/mtx/products`);
  return res.json();
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
  const res = await fetch(`${API_BASE}/api/mtx/init-purchase`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  return res.json();
}

/** 完成购买 */
export async function finalizePurchase(params: {
  steamId: string;
  orderId: string;
}): Promise<MtxApiResponse<{ status: string }>> {
  const res = await fetch(`${API_BASE}/api/mtx/finalize-purchase`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  return res.json();
}

/** 查询购买状态 */
export async function checkPurchaseStatus(params: {
  steamId: string;
  orderId?: string;
}): Promise<MtxApiResponse<{ orderId: string; status: string; itemId?: number; amountInCents?: number }>> {
  const res = await fetch(`${API_BASE}/api/mtx/check-purchase`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  return res.json();
}

/** 验证用户可靠性 */
export async function verifyUser(steamId: string): Promise<MtxApiResponse<{ isReliable: boolean; steamId: string }>> {
  const res = await fetch(`${API_BASE}/api/mtx/verify-user`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ steamId }),
  });
  return res.json();
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
  const res = await fetch(`${API_BASE}/api/mtx/grant`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  return res.json();
}

/** 回收权益（退款/拒付时调用） */
export async function revokeGrant(orderId: string): Promise<MtxApiResponse<{ orderId: string; type: string; payload: GrantPayload }>> {
  const res = await fetch(`${API_BASE}/api/mtx/revoke`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ orderId }),
  });
  return res.json();
}
