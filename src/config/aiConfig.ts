/**
 * AI 大模型配置（OpenAI 兼容接口，默认 DeepSeek）
 * 通过 .env 配置：VITE_AI_API_BASE / VITE_AI_API_KEY / VITE_AI_MODEL 等
 */

const env = (import.meta as any).env ?? {};

export const AI_CONFIG = {
  apiBase: env.VITE_AI_API_BASE || "https://api.deepseek.com/v1",
  apiKey: env.VITE_AI_API_KEY || "",
  model: env.VITE_AI_MODEL || "deepseek-chat",
  maxTokens: parseInt(env.VITE_AI_MAX_TOKENS || "500", 10) || 500,
  temperature: parseFloat(env.VITE_AI_TEMPERATURE || "0.9"),
};

/** 是否已配置可用的 AI Key（未配置时走本地降级回复） */
export const AI_READY = !!AI_CONFIG.apiKey;
