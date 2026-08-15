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
  checkPurchaseStatus,
  grantItems,
  verifyUser,
  type GrantPayload,
} from "../api";
import { mtxLogger } from "../utils/mtxLogger";

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
      mtxLogger.info("purchase", `开始购买流程：itemId=${itemId}, quantity=${quantity}`, { itemId, quantity });
      try {
        // 1. 验证用户
        mtxLogger.info("verify", `验证用户 ${steamId}`);
        const verify = await verifyUser(steamId);
        if (!verify.success || !verify.data?.isReliable) {
          mtxLogger.error("verify", "用户验证未通过", { steamId, verify });
          return { status: "error", orderId: null, error: "用户验证未通过，无法发起购买" };
        }
        mtxLogger.success("verify", "用户验证通过");

        // 2. 初始化订单
        mtxLogger.info("init", `初始化订单：itemId=${itemId}`);
        const init = await initPurchase({ steamId, itemId, quantity });
        if (!init.success || !init.data) {
          mtxLogger.error("init", `初始化订单失败：${init.error}`, { init });
          return { status: "error", orderId: null, error: init.error || "初始化订单失败" };
        }
        const { orderId } = init.data;
        mtxLogger.success("init", `订单已创建：orderId=${orderId}`, { orderId, ...init.data });

        // 3. 查询交易状态（等待 Steam 授权；家长控制等场景下回调可能不触发）
        mtxLogger.info("check", `查询交易状态：orderId=${orderId}`);
        const status = await checkPurchaseStatus({ steamId, orderId });
        if (!status.success) {
          mtxLogger.error("check", `查询交易状态失败：${status.error}`, { orderId, status });
          return { status: "error", orderId, error: status.error || "查询交易状态失败" };
        }
        mtxLogger.success("check", `交易状态：${status.data?.status}`, { orderId, ...status.data });

        // 4. 完成扣款（真实环境需等待 Steam 叠加层授权回调后调用 finalize）
        mtxLogger.info("finalize", `完成扣款：orderId=${orderId}`);
        const finalize = await finalizePurchase({ steamId, orderId });
        if (!finalize.success) {
          mtxLogger.error("finalize", `完成购买失败：${finalize.error}`, { orderId, finalize });
          return { status: "error", orderId, error: finalize.error || "完成购买失败" };
        }
        mtxLogger.success("finalize", "扣款完成");

        // 5. 发放权益（幂等，后端会去重）
        mtxLogger.info("grant", `发放权益：orderId=${orderId}, itemId=${itemId}`);
        const grant = await grantItems({ orderId, steamId, itemId, quantity });
        if (!grant.success || !grant.data) {
          mtxLogger.error("grant", `发放权益失败：${grant.error}`, { orderId, grant });
          return { status: "error", orderId, error: grant.error || "发放权益失败" };
        }
        mtxLogger.success("grant", `权益已发放：${grant.data.payload.kind}=${grant.data.payload.amount}`, {
          orderId,
          payload: grant.data.payload,
        });

        // 6. 通知上层更新用户状态
        onGranted(grant.data.payload, orderId);
        mtxLogger.success("purchase", "购买流程全部完成");
        return { status: "success", orderId, error: null };
      } catch (error: any) {
        mtxLogger.error("purchase", `购买流程异常：${error?.message ?? error}`, { error });
        return { status: "error", orderId: null, error: error.message || "购买流程异常" };
      }
    },
    [steamId, onGranted]
  );

  return { runPurchase };
}
