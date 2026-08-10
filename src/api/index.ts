/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * API 层：封装所有后端 HTTP 调用。
 * 不依赖任何 UI 组件，只依赖 types.ts 中的契约类型。
 */

import type { PetConfig, Pet3DModelConfig } from "../types";

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
  const res = await fetch("/api/whisper", {
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
  const res = await fetch("/api/chat", {
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
  const res = await fetch("/api/reconstruct-3d", {
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
  const res = await fetch("/api/growth-story", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  return res.json();
}
