/**
 * useGenerateHistory - 生成历史记录 hook
 * 保存在 localStorage，最多 30 张。
 */

import { useState, useEffect, useCallback } from "react";
import type { GenerateResult } from "../services/stardustApi";

// [BUG-FIX] 键名必须是 starpuff_ 前缀，否则不会被 saveManager 纳入存档快照，
// 换机/云同步恢复后生成历史会丢失。旧键在读取时兼容并自动迁移。
const HISTORY_KEY = "starpuff_history";
const LEGACY_HISTORY_KEY = "stardust_history";

export function useGenerateHistory() {
  const [history, setHistory] = useState<GenerateResult[]>([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(HISTORY_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) setHistory(parsed);
        return;
      }
      // 旧键迁移：读到旧数据后写入新键
      const legacy = localStorage.getItem(LEGACY_HISTORY_KEY);
      if (legacy) {
        const parsed = JSON.parse(legacy);
        if (Array.isArray(parsed)) {
          setHistory(parsed);
          localStorage.setItem(HISTORY_KEY, JSON.stringify(parsed));
        }
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
