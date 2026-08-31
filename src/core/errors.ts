/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * core/errors.ts — 结构化错误体系（框架无关，纯 TypeScript）
 *
 * 依赖规则：本文件不依赖任何其他模块（零内部依赖），可被任意上层安全引用。
 *
 * 设计目标（见 docs/01-architecture.md §4）：
 *   - 每个错误携带 code / message / suggestedAction / context
 *   - UI 层永远不直接消费 Error.message，而是消费 AppError 的结构化字段
 *   - 网络/AI 调用失败返回结构化错误对象，便于 UI 给出针对性提示与降级
 */

export type SuggestedAction =
  | "retry"        // 建议重试（临时性网络/服务端故障）
  | "offline"      // 建议切换到离线模式
  | "use_fallback" // 建议使用本地兜底（离线模板等）
  | "fix_input"    // 建议用户修正输入
  | "reset"        // 建议重置损坏的数据
  | "ignore"       // 可忽略的非致命错误
  | "fallback_2d"  // 建议降级到 2D 渲染
  | "none";        // 无需特殊建议

/** 结构化错误的统一序列化形态（跨模块/持久化边界时使用） */
export interface AppErrorShape {
  name: string;
  code: string;
  message: string;
  suggestedAction: SuggestedAction;
  context?: unknown;
}

/**
 * 应用统一错误基类。
 *
 * 约定：所有可预期错误（网络失败、服务端错误、校验失败、数据损坏、WebGL 失败）
 * 都应抛出/返回 AppError 子类，而不是裸 Error。UI 层据此决定提示文案与降级策略。
 */
export class AppError extends Error {
  readonly code: string;
  readonly suggestedAction: SuggestedAction;
  readonly context?: unknown;

  constructor(
    code: string,
    message: string,
    suggestedAction: SuggestedAction = "none",
    context?: unknown
  ) {
    super(message);
    this.name = new.target.name;
    this.code = code;
    this.suggestedAction = suggestedAction;
    this.context = context;
    // 保持 instanceof 在 ES5+ 目标下可用（Error 子类的原型链修复）
    Object.setPrototypeOf(this, new.target.prototype);
  }

  /** 序列化为可安全 JSON 化的形态（用于日志/持久化/IPC 边界） */
  toJSON(): AppErrorShape {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      suggestedAction: this.suggestedAction,
      context: this.context,
    };
  }
}

/** 网络请求失败（超时、断网、DNS 失败等） */
export class NetworkError extends AppError {
  constructor(message = "网络连接不稳定，请检查网络后重试", context?: unknown) {
    super("NETWORK_ERROR", message, "retry", context);
  }
}

/** 服务端返回非 2xx 或业务失败 */
export class ApiError extends AppError {
  constructor(message = "星尘感应服务暂时不可用，请稍后重试", context?: unknown) {
    super("API_ERROR", message, "use_fallback", context);
  }
}

/** 客户端校验失败 */
export class ValidationError extends AppError {
  constructor(message = "输入内容有误，请检查后重试", context?: unknown) {
    super("VALIDATION_ERROR", message, "fix_input", context);
  }
}

/** 持久化数据损坏 */
export class StateCorruptionError extends AppError {
  constructor(message = "存档数据损坏，已恢复默认状态", context?: unknown) {
    super("STATE_CORRUPTION", message, "reset", context);
  }
}

/** WebGL 初始化/渲染失败 */
export class WebGLError extends AppError {
  constructor(message = "您的设备不支持 3D 渲染，已切换到 2D 模式", context?: unknown) {
    super("WEBGL_ERROR", message, "fallback_2d", context);
  }
}

/**
 * 将任意未知异常规整为 AppError：
 *   - 已是 AppError 则原样返回
 *   - 普通 Error 包装为 AppError（保留 message，建议动作 retry）
 *   - 非 Error 值（字符串/对象等）包装为 AppError
 *
 * 用于 catch 块内的统一收敛，避免上层被迫消费 unknown。
 */
export function toAppError(err: unknown, fallbackCode = "UNKNOWN_ERROR"): AppError {
  if (err instanceof AppError) return err;
  if (err instanceof Error) {
    return new AppError(fallbackCode, err.message, "retry", { cause: err });
  }
  return new AppError(fallbackCode, String(err), "retry", { raw: err });
}
