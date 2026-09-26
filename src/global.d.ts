/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * 全局类型声明：Electron preload 桥 window.starPuff。
 * 浏览器环境（window.starPuff 不存在）下游戏以纯 web 模式运行，相关调用自动降级。
 */
export {};

export interface StarPuffSaveFile {
  version: number;
  updatedAt: number;
  data: Record<string, string>;
}

declare global {
  interface Window {
    starPuff?: {
      app: { version: string; isElectron: boolean };
      quit: () => void;
      save: {
        /** 读取 userData/save.json，不存在时返回 null */
        load: () => Promise<StarPuffSaveFile | null>;
        /** 写入 userData/save.json（自动保留 .bak 兜底） */
        write: (save: StarPuffSaveFile) => Promise<boolean>;
      };
      config: {
        /** 读取 userData/config.json 中的 GEMINI_API_KEY（空串表示未配置） */
        getGeminiKey: () => Promise<string>;
        /** 持久化并应用到运行中的服务；传空串关闭在线 AI */
        setGeminiKey: (key: string) => Promise<boolean>;
      };
      steam: {
        /** 查询 Steam 登录状态与 SteamID */
        status: () => Promise<{ available: boolean; steamId: string | null; appId: number | null }>;
        /** 解锁成就（Steam 后台 API 名） */
        achievement: (name: string) => Promise<boolean>;
        /** 写入 Steam 云存档 */
        cloudWrite: (name: string, content: string) => Promise<boolean>;
        /** 读取 Steam 云存档（不存在返回 null） */
        cloudRead: (name: string) => Promise<string | null>;
      };
    };
  }
}
