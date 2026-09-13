/**
 * AI 对话核心服务：真实大模型流式输出 + 上下文记忆
 * - 前端直连 OpenAI 兼容接口（DeepSeek 等）
 * - 流式逐字输出（fetch stream + SSE 解析）
 * - 按宠物 id 隔离对话历史与长期记忆
 * - 未配置 API Key 时返回 null，由调用方降级到本地回复
 */

import { AI_CONFIG, AI_READY } from "../config/aiConfig";
import { buildSystemPrompt, type PetPersona } from "./petPersona";
import { MemoryService } from "./memoryService";

export interface StreamCallbacks {
  onThinking: () => void; // 开始思考
  onToken: (token: string) => void; // 每收到一个字
  onComplete: (fullText: string) => void; // 完成
  onError: (error: Error) => void; // 出错
}

interface HistoryMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

const MAX_HISTORY = 20; // 保留最近 20 条对话（约 10 轮）

class AIChatServiceClass {
  private historyCache: Record<string, HistoryMessage[]> = {};
  private abortController: AbortController | null = null;

  private key(petId: string) {
    return `pet_chat_history_ai_${petId}`;
  }

  private loadHistory(petId: string): HistoryMessage[] {
    if (this.historyCache[petId]) return this.historyCache[petId];
    try {
      const saved = localStorage.getItem(this.key(petId));
      const parsed = saved ? JSON.parse(saved) : [];
      this.historyCache[petId] = Array.isArray(parsed) ? parsed : [];
    } catch {
      this.historyCache[petId] = [];
    }
    return this.historyCache[petId];
  }

  private saveHistory(petId: string) {
    try {
      const arr = this.historyCache[petId] || [];
      localStorage.setItem(this.key(petId), JSON.stringify(arr.slice(-50)));
    } catch {
      /* 忽略存储失败 */
    }
  }

  private pushHistory(petId: string, msg: HistoryMessage) {
    const arr = this.loadHistory(petId);
    arr.push(msg);
    if (arr.length > MAX_HISTORY) arr.splice(0, arr.length - MAX_HISTORY);
    this.historyCache[petId] = arr;
    this.saveHistory(petId);
  }

  /** 中断当前生成 */
  abort() {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }

  /**
   * 发送消息并流式接收回复。
   * @returns 完整回复文本；若未配置 AI Key，返回 null（调用方降级）。
   */
  async sendMessage(
    petId: string,
    userMessage: string,
    persona: PetPersona,
    callbacks: StreamCallbacks
  ): Promise<string | null> {
    if (!AI_READY) return null;

    this.abort();
    this.abortController = new AbortController();

    try {
      // 1. 提取并保存记忆
      const newMemories = MemoryService.extractMemoriesFromMessage(userMessage);
      newMemories.forEach((m) => MemoryService.addMemory(petId, m, "fact", 4));

      // 2. 记录用户消息
      this.pushHistory(petId, {
        id: `user_${Date.now()}`,
        role: "user",
        content: userMessage,
        timestamp: Date.now(),
      });

      // 3. 构建请求消息
      const systemPrompt = buildSystemPrompt(persona, MemoryService.getMemoriesForPrompt(petId));
      const messages = [
        { role: "system", content: systemPrompt },
        ...this.loadHistory(petId).map((m) => ({ role: m.role, content: m.content })),
      ];

      // 4. 触发思考状态
      callbacks.onThinking();

      // 5. 调用 API（流式）
      const response = await fetch(`${AI_CONFIG.apiBase}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${AI_CONFIG.apiKey}`,
        },
        body: JSON.stringify({
          model: AI_CONFIG.model,
          messages,
          temperature: AI_CONFIG.temperature,
          max_tokens: AI_CONFIG.maxTokens,
          stream: true,
        }),
        signal: this.abortController.signal,
      });

      if (!response.ok) {
        throw new Error(`API请求失败: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("无法读取响应流");

      const decoder = new TextDecoder();
      let fullText = "";
      let buffer = "";

      // 6. 解析 SSE 流
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data:")) continue;
          const data = trimmed.slice(5).trim();
          if (data === "[DONE]") continue;

          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              fullText += content;
              callbacks.onToken(content);
            }
          } catch {
            /* 忽略单行解析错误 */
          }
        }
      }

      // 7. 记录 AI 回复
      this.pushHistory(petId, {
        id: `assistant_${Date.now()}`,
        role: "assistant",
        content: fullText,
        timestamp: Date.now(),
      });

      callbacks.onComplete(fullText);
      return fullText;
    } catch (error: any) {
      if (error.name === "AbortError") {
        return null; // 用户主动中断
      }
      callbacks.onError(error);
      throw error;
    } finally {
      this.abortController = null;
    }
  }

  clearHistory(petId: string) {
    this.historyCache[petId] = [];
    localStorage.removeItem(this.key(petId));
  }
}

export const AIChatService = new AIChatServiceClass();
