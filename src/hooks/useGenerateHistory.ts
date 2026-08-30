/**
 * useGenerateHistory - 生成历史记录 hook
 * 保存在 localStorage，最多 30 张。
 */

import { useState, useEffect, useCallback } from "react";
import type { GenerateResult } from "../services/stardustApi";

const HISTORY_KEY = "stardust_history";

export function useGenerateHistory() {
  const [history, setHistory] = useState<GenerateResult[]>([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(HISTORY_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) setHistory(parsed);
      }
    } catch {
      setHistory([]);
    }
  }, []);

  const addToHistory = useCallback((item: GenerateResult) => {
    setHistory((prev) => {
      const next = [item, ...prev].slice(0, 30);
      try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
      } catch {
        /* 忽略存储失败 */
      }
      return next;
    });
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    try {
      localStorage.removeItem(HISTORY_KEY);
    } catch {
      /* 忽略 */
    }
  }, []);

  return { history, addToHistory, clearHistory };
}
