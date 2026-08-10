/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * 返回本地时区的 YYYY-MM-DD 日期字符串。
 * 注意：禁止使用 new Date().toISOString().split("T")[0]（UTC 日期），
 * 否则 UTC+8 用户在早 8 点前会被判定为"昨天"，导致签到/耳语日期错乱。
 */
export function localDateString(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
