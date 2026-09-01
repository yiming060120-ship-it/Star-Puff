/**
 * 虚拟星友运行时状态机：友好度 / 打招呼冷却 / 星门偶遇标记
 *
 * 静态数据在 src/data/virtualFriends.ts，这里只维护"每个好友的运行时状态"覆盖层，
 * 全部持久化到 localStorage（starpuff_ 前缀自动纳入存档快照）。
 */

import { useCallback, useEffect, useState } from "react";
import { VIRTUAL_FRIENDS } from "../data/virtualFriends";

export interface FriendRuntime {
  id: string;
  friendship: number; // 0-100
  lastGreetAt: number | null; // 打招呼冷却（1 小时/位）
  metVia?: "cluster"; // 是否经星门偶遇认识
}

const STORAGE_KEY = "starpuff_virtual_friends";
const GREET_COOLDOWN_MS = 60 * 60 * 1000; // 1 小时

function loadRuntimes(): Record<string, FriendRuntime> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) return parsed as Record<string, FriendRuntime>;
  } catch {
    /* 存档损坏时回退空表 */
  }
  return {};
}

/** 友好度档位 */
export function tierLabel(friendship: number): string {
  if (friendship >= 80) return "星魂知己";
  if (friendship >= 50) return "挚友星伴";
  if (friendship >= 20) return "熟识星友";
  return "初识星友";
}

export function useVirtualFriends() {
  const [runtimes, setRuntimes] = useState<Record<string, FriendRuntime>>(loadRuntimes);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(runtimes));
    } catch {
      /* localStorage 满/禁用时忽略 */
    }
  }, [runtimes]);

  const getFriend = useCallback(
    (id: string): FriendRuntime => runtimes[id] ?? { id, friendship: 0, lastGreetAt: null },
    [runtimes]
  );

  /** 增减友好度（0-100 封顶） */
  const bumpFriendship = useCallback((id: string, delta: number) => {
    setRuntimes(prev => {
      const cur = prev[id] ?? { id, friendship: 0, lastGreetAt: null };
      return { ...prev, [id]: { ...cur, friendship: Math.max(0, Math.min(100, cur.friendship + delta)) } };
    });
  }, []);

  /**
   * 打招呼。冷却期内返回 null（UI 应显示"已打招呼"）；成功返回该好友的回应文案。
   */
  const greetFriend = useCallback(
    (id: string): string | null => {
      const cur = getFriend(id);
      const now = Date.now();
      if (cur.lastGreetAt && now - cur.lastGreetAt < GREET_COOLDOWN_MS) return null;
      const friend = VIRTUAL_FRIENDS.find(f => f.id === id);
      const reply = friend
        ? friend.greetingPool[Math.floor(Math.random() * friend.greetingPool.length)]
        : "你好呀！很高兴认识你！";
      setRuntimes(prev => {
        const prevCur = prev[id] ?? { id, friendship: 0, lastGreetAt: null };
        return {
          ...prev,
          [id]: { ...prevCur, friendship: Math.min(100, prevCur.friendship + 3), lastGreetAt: now },
        };
      });
      return reply;
    },
    [getFriend]
  );

  /** 星门偶遇后标记"已认识" */
  const upsertMet = useCallback((id: string, via: "cluster") => {
    setRuntimes(prev => {
      const cur = prev[id] ?? { id, friendship: 0, lastGreetAt: null };
      return { ...prev, [id]: { ...cur, metVia: via } };
    });
  }, []);

  return { runtimes, getFriend, bumpFriendship, greetFriend, upsertMet, tierLabel };
}
