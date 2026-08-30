/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * core/validators.ts — 数据校验工具（框架无关）
 *
 * 依赖规则：只依赖 core/errors.ts 与 types.ts（契约层），不得依赖任何组件/网络/浏览器 API。
 *
 * 用途：在写入用户数据前做轻量校验，把「脏数据」挡在持久化之前；
 * 失败时抛出结构化 ValidationError，供 UI 层统一处理。
 */

import { ValidationError } from "./errors";
import type { PetConfig, StarPuffUser } from "../types";

/** 断言值非空（null/undefined/空字符串均视为空） */
export function assertNonEmpty(value: unknown, fieldLabel: string): void {
  if (value === null || value === undefined || (typeof value === "string" && value.trim() === "")) {
    throw new ValidationError(`${fieldLabel} 不能为空`, { field: fieldLabel });
  }
}

/** 校验数字是否在 [min, max] 区间内（含边界） */
export function assertNumberRange(value: number, fieldLabel: string, min: number, max: number): void {
  if (typeof value !== "number" || Number.isNaN(value)) {
    throw new ValidationError(`${fieldLabel} 必须是有效数字`, { field: fieldLabel, value });
  }
  if (value < min || value > max) {
    throw new ValidationError(`${fieldLabel} 必须在 ${min}~${max} 之间`, {
      field: fieldLabel,
      value,
      min,
      max,
    });
  }
}

/**
 * 校验宠物配置的关键字段。
 * 只校验「必需且不可为空」的字段，其余可选字段不强制。
 */
export function validatePetConfig(pet: PetConfig): void {
  if (!pet) {
    throw new ValidationError("宠物配置不能为空", { field: "pet" });
  }
  assertNonEmpty(pet.name, "宠物名字");
  assertNonEmpty(pet.type, "宠物种类");
  assertNonEmpty(pet.primaryColor, "宠物主色");
}

/**
 * 校验用户对象的最小完整性（用于从 localStorage 反序列化后兜底）。
 * 返回 true 表示可用；字段缺失或类型错误返回 false（调用方应回退到默认值）。
 * 注意：此函数为「宽松校验」，只判断能否安全进入应用，不抛出异常。
 */
export function isUsableUser(user: unknown): user is StarPuffUser {
  if (!user || typeof user !== "object") return false;
  const u = user as Record<string, unknown>;
  if (typeof u.stardustCoins !== "number" || Number.isNaN(u.stardustCoins)) return false;
  if (typeof u.dialogsRemaining !== "number" || Number.isNaN(u.dialogsRemaining)) return false;
  if (u.membership !== "free" && u.membership !== "vip_month" && u.membership !== "vip_year") return false;
  return true;
}
