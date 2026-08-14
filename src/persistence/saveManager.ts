/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * 快照桥：localStorage（唯一事实来源）↔ userData/save.json（Electron 本地存档）。
 * 浏览器环境（window.starPuff 不存在）下所有函数为 no-op，保持原 web 流程可跑。
 * 阶段 3 接入 Steam Cloud 时，这里即云存档的本地镜像层。
 */

import type { StarPuffSaveFile } from "../global";

const PREFIXES = ["starpuff_", "star_puff_"];
const UPDATED_AT_KEY = "starpuff_updated_at";

function isGameKey(key: string): boolean {
  return PREFIXES.some((p) => key.startsWith(p));
}

/** 收集全部游戏数据为键值快照 */
export function snapshotAll(): Record<string, string> {
  const data: Record<string, string> = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && isGameKey(key)) data[key] = localStorage.getItem(key) ?? "";
  }
  return data;
}

/** 将快照写回 localStorage（仅覆盖键值，不删除本地多余 key） */
export function hydrate(data: Record<string, string>): void {
  for (const [key, value] of Object.entries(data)) {
    localStorage.setItem(key, value);
  }
}

/** 读取存档并合并回 localStorage：候选源 = 本地磁盘 + Steam 云存档，取时间戳最新者采用 */
export async function loadSaveFromDisk(): Promise<void> {
  const bridge = window.starPuff?.save;
  if (!bridge) return; // 浏览器模式：无本地存档桥
  const steam = window.starPuff?.steam;
  const candidates: Array<StarPuffSaveFile | null> = [await bridge.load()];
  if (steam?.cloudRead) {
    try {
      const raw = await steam.cloudRead("save.json");
      if (raw) candidates.push(JSON.parse(raw) as StarPuffSaveFile);
    } catch {
      /* 云档损坏/不存在则忽略 */
    }
  }
  const valid = candidates.filter((s): s is StarPuffSaveFile => Boolean(s?.data));
  valid.sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0));
  const best = valid[0];
  if (!best) return;
  const localUpdatedAt = Number(localStorage.getItem(UPDATED_AT_KEY) ?? 0);
  if ((best.updatedAt ?? 0) > localUpdatedAt) {
    hydrate(best.data);
    localStorage.setItem(UPDATED_AT_KEY, String((best.updatedAt ?? 0)));
  }
}

/** 全量快照写入：本地磁盘 + Steam 云存档双写（含更新时间戳） */
export async function flushSaveToDisk(): Promise<void> {
  const bridge = window.starPuff?.save;
  if (!bridge) return; // 浏览器模式
  const updatedAt = Date.now();
  const data = snapshotAll();
  data[UPDATED_AT_KEY] = String(updatedAt);
  localStorage.setItem(UPDATED_AT_KEY, String(updatedAt));
  const saveFile: StarPuffSaveFile = { version: 1, updatedAt, data };
  await bridge.write(saveFile);
  const steam = window.starPuff?.steam;
  if (steam?.cloudWrite) {
    try {
      await steam.cloudWrite("save.json", JSON.stringify(saveFile));
    } catch {
      /* 云存档失败不影响本地存档 */
    }
  }
}
