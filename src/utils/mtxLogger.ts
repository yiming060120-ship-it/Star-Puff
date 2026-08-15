/**
 * mtxLogger - 微交易前端日志模块
 *
 * 与购买库（useMicrotransaction）联合，负责记录每一次购买流程的日志，
 * 便于开发/测试时观察「模拟购买」的完整链路。
 *
 * 特性：
 * - 内存日志列表（当前会话），带时间戳与级别
 * - 可选持久化到 localStorage（starpuff_mtx_logs），跨会话查看
 * - 简单订阅机制，UI 可实时刷新
 * - 单例，全局共享（避免多处实例状态不同步）
 */

export type MtxLogLevel = "info" | "success" | "warn" | "error";

export interface MtxLogEntry {
  /** 日志唯一 id */
  id: string;
  /** 时间戳（毫秒） */
  timestamp: number;
  /** 级别 */
  level: MtxLogLevel;
  /** 阶段标签，如 verify / init / check / finalize / grant */
  stage: string;
  /** 日志正文 */
  message: string;
  /** 附加数据（可选，如订单号、商品 id 等） */
  data?: Record<string, unknown>;
}

const STORAGE_KEY = "starpuff_mtx_logs";
const MAX_LOGS = 200; // 最多保留 200 条，避免无限膨胀

type Listener = () => void;

class MtxLogger {
  private logs: MtxLogEntry[] = [];
  private listeners: Set<Listener> = new Set();
  private persistEnabled: boolean;

  constructor() {
    this.persistEnabled = typeof localStorage !== "undefined";
    this.logs = this.loadPersisted();
  }

  /** 记录一条日志 */
  log(level: MtxLogLevel, stage: string, message: string, data?: Record<string, unknown>): MtxLogEntry {
    const entry: MtxLogEntry = {
      id: `mtx_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      timestamp: Date.now(),
      level,
      stage,
      message,
      data,
    };

    this.logs = [entry, ...this.logs].slice(0, MAX_LOGS);
    this.persist();
    this.emit();
    return entry;
  }

  /** 便捷方法 */
  info(stage: string, message: string, data?: Record<string, unknown>) {
    return this.log("info", stage, message, data);
  }
  success(stage: string, message: string, data?: Record<string, unknown>) {
    return this.log("success", stage, message, data);
  }
  warn(stage: string, message: string, data?: Record<string, unknown>) {
    return this.log("warn", stage, message, data);
  }
  error(stage: string, message: string, data?: Record<string, unknown>) {
    return this.log("error", stage, message, data);
  }

  /** 获取所有日志（最新在前） */
  getLogs(): MtxLogEntry[] {
    return this.logs;
  }

  /** 清空日志 */
  clear(): void {
    this.logs = [];
    this.persist();
    this.emit();
  }

  /** 订阅变化 */
  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private emit(): void {
    this.listeners.forEach((l) => l());
  }

  private persist(): void {
    if (!this.persistEnabled) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.logs.slice(0, MAX_LOGS)));
    } catch {
      // 忽略存储失败（隐私模式等）
    }
  }

  private loadPersisted(): MtxLogEntry[] {
    if (!this.persistEnabled) return [];
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
}

/** 全局单例 */
export const mtxLogger = new MtxLogger();
