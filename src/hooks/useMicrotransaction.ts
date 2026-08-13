/**
 * useMicrotransaction - 内购流程 Hook
 *
 * 封装完整的 Steam 微交易购买闭环：
 *   1. verify-user   验证用户可信
 *   2. init-purchase 初始化订单（触发 Steam 叠加层）
 *   3. finalize-purchase 完成扣款
 *   4. grant         发放权益（幂等）
 *
 * 同时提供"模拟模式"回退：当后端返回 mock 订单（requiresSteamOverlay=false）
 * 时，直接走本地发放，便于开发联调。
 *
 * 说明：当前用户经济数据存储于前端 localStorage（starpuff_user），
 * 本 Hook 的 applyGrant 负责把发放权益写回 localStorage。
 */

import { useCallback } from "react";
import type { StarPuffUser } from "../types";
import {
  initPurchase,
  finalizePurchase,
  grantItems,
  verifyUser,
  type GrantPayload,
} from "../api";

export type PurchaseStatus = "idle" | "verifying" | "purchasing" | "finalizing" | "granting" | "success" | "error";

export interface PurchaseFlowState {
  status: PurchaseStatus;
  orderId: string | null;
  error: string | null;
}

/**
 * 将发放权益写回 localStorage 中的用户经济数据。
 * 返回更新后的用户对象。
 */
export function applyGrantToUser(currentUser: StarPuffUser, payload: GrantPayload): StarPuffUser {
  if (payload.kind === "stardust_coins") {
    return {
      ...currentUser,
      stardustCoins: currentUser.stardustCoins + payload.amount,
    };
  }

  if (payload.kind === "membership") {
    const isYear = payload.membershipLevel === "vip_year";
    const outfitsUnlocked = isYear && !currentUser.outfitsUnlocked.includes("cape_aurora")
      ? [...currentUser.outfitsUnlocked, "cape_aurora"]
      : currentUser.outfitsUnlocked;

    return {
      ...currentUser,
      membership: payload.membershipLevel || "vip_month",
      unlimitedTalks: true,
      dialogsRemaining: 999999,
      outfitsUnlocked,
    };
  }

  return currentUser;
}

/**
 * 内购 Hook。
 *
 * @param steamId 当前 Steam 用户 ID（64 位）。测试环境可传任意字符串。
 * @param onGranted 发放成功回调，用于更新 React 状态并持久化。
 */
export function useMicrotransaction(
  steamId: string,
  onGranted: (payload: GrantPayload, orderId: string) => void
) {
  const runPurchase = useCallback(
    async (itemId: number, quantity = 1): Promise<PurchaseFlowState> => {
      try {
        // 1. 验证用户
        const verify = await verifyUser(steamId);
        if (!verify.success || !verify.data?.isReliable) {
          return { status: "error", orderId: null, error: "用户验证未通过，无法发起购买" };
        }

        // 2. 初始化订单
        const init = await initPurchase({ steamId, itemId, quantity });
        if (!init.success || !init.data) {
          return { status: "error", orderId: null, error: init.error || "初始化订单失败" };
        }
        const { orderId, requiresSteamOverlay } = init.data;

        // 3. 完成扣款（真实环境需等待 Steam 叠加层授权回调；
        //    此处由前端在授权完成后调用 finalize）
        const finalize = await finalizePurchase({ steamId, orderId });
        if (!finalize.success) {
          return { status: "error", orderId, error: finalize.error || "完成购买失败" };
        }

        // 4. 发放权益（幂等，后端会去重）
        const grant = await grantItems({ orderId, steamId, itemId, quantity });
        if (!grant.success || !grant.data) {
          return { status: "error", orderId, error: grant.error || "发放权益失败" };
        }

        // 5. 通知上层更新用户状态
        onGranted(grant.data.payload, orderId);
        return { status: "success", orderId, error: null };
      } catch (error: any) {
        return { status: "error", orderId: null, error: error.message || "购买流程异常" };
      }
    },
    [steamId, onGranted]
  );

  return { runPurchase };
}
