/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Steam 桥封装：经 preload 暴露的 window.starPuff.steam 访问 Steamworks。
 * 非 Electron / Steam 未运行 / 浏览器模式一律降级为离线态，游戏仍可完整游玩。
 */

import { useEffect, useState } from "react";

export interface SteamStatus {
  available: boolean;
  steamId: string | null;
  appId: number | null;
}

const OFFLINE: SteamStatus = { available: false, steamId: null, appId: null };

/** 获取 Steam 登录状态（SteamID、是否可用） */
export function useSteam(): SteamStatus {
  const [status, setStatus] = useState<SteamStatus>(OFFLINE);
  useEffect(() => {
    let mounted = true;
    window.starPuff?.steam
      ?.status()
      .then((s) => {
        if (mounted) setStatus(s);
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);
  return status;
}

/** 解锁成就（按 Steam 后台 API 名） */
export async function activateAchievement(name: string): Promise<boolean> {
  const bridge = window.starPuff?.steam;
  if (!bridge) return false;
  try {
    return await bridge.achievement(name);
  } catch {
    return false;
  }
}

/** 写入 Steam 云存档文件 */
export async function cloudWrite(name: string, content: string): Promise<boolean> {
  const bridge = window.starPuff?.steam;
  if (!bridge) return false;
  try {
    return await bridge.cloudWrite(name, content);
  } catch {
    return false;
  }
}

/** 读取 Steam 云存档文件（不存在返回 null） */
export async function cloudRead(name: string): Promise<string | null> {
  const bridge = window.starPuff?.steam;
  if (!bridge) return null;
  try {
    return await bridge.cloudRead(name);
  } catch {
    return null;
  }
}
