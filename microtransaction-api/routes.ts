/**
 * microtransaction-api - Steam 微交易桥接 API
 * Express 路由层
 *
 * 基于 jasielmacedo/steam-microtransaction-api (MIT License)
 * 为 StarPuff 项目定制
 *
 * 提供以下端点：
 *   POST /api/mtx/init-purchase        - 初始化购买
 *   POST /api/mtx/finalize-purchase    - 完成购买
 *   POST /api/mtx/check-purchase       - 查询购买状态
 *   POST /api/mtx/verify-user          - 验证用户可靠性
 *   GET  /api/mtx/products             - 获取商品列表
 *   POST /api/mtx/check-ownership      - 检查应用所有权
 */

import { Router, type Request, type Response } from "express";
import {
  initPurchase,
  finalizePurchase,
  checkPurchaseStatus,
  getReliableUserInfo,
  checkAppOwnership,
  getProducts,
  getConfig,
  getReport,
} from "./service";
import {
  grantItems,
  revokeGrant,
  listGrantedOrders,
  isOrderGranted,
} from "./fulfillment";

const router = Router();

// ---- 商品列表 ----

router.get("/products", (_req: Request, res: Response) => {
  const products = getProducts();
  res.json({ success: true, data: products });
});

// ---- 用户验证 ----

router.post("/verify-user", async (req: Request, res: Response) => {
  const { steamId } = req.body;
  if (!steamId) {
    return res.status(400).json({ success: false, error: "缺少 steamId" });
  }
  const result = await getReliableUserInfo({ steamId });
  res.json(result);
});

// ---- 应用所有权 ----

router.post("/check-ownership", async (req: Request, res: Response) => {
  const { steamId } = req.body;
  if (!steamId) {
    return res.status(400).json({ success: false, error: "缺少 steamId" });
  }
  const result = await checkAppOwnership(steamId);
  res.json(result);
});

// ---- 初始化购买 ----

router.post("/init-purchase", async (req: Request, res: Response) => {
  const { steamId, itemId, quantity, description, language, currency } = req.body;

  if (!steamId || !itemId) {
    return res.status(400).json({ success: false, error: "缺少 steamId 或 itemId" });
  }

  const config = getConfig();

  const result = await initPurchase({
    steamId,
    appId: config.appId,
    itemId: Number(itemId),
    quantity: Number(quantity) || 1,
    description,
    language: language || "zh-CN",
    currency: currency || "CNY",
  });

  res.json(result);
});

// ---- 完成购买 ----

router.post("/finalize-purchase", async (req: Request, res: Response) => {
  const { steamId, orderId } = req.body;

  if (!steamId || !orderId) {
    return res.status(400).json({ success: false, error: "缺少 steamId 或 orderId" });
  }

  const config = getConfig();
  const result = await finalizePurchase({ steamId, appId: config.appId, orderId });
  res.json(result);
});

// ---- 查询购买状态 ----

router.post("/check-purchase", async (req: Request, res: Response) => {
  const { steamId, orderId } = req.body;

  if (!steamId) {
    return res.status(400).json({ success: false, error: "缺少 steamId" });
  }

  const config = getConfig();
  const result = await checkPurchaseStatus({ steamId, appId: config.appId, orderId });
  res.json(result);
});

// ---- 发放权益（Finalize 成功后调用）----

router.post("/grant", async (req: Request, res: Response) => {
  const { orderId, steamId, itemId, quantity } = req.body;
  const result = await grantItems({ orderId, steamId, itemId, quantity });
  res.json(result);
});

// ---- 回收权益（退款/拒付时调用）----

router.post("/revoke", (req: Request, res: Response) => {
  const { orderId } = req.body;
  if (!orderId) {
    return res.status(400).json({ success: false, error: "缺少 orderId" });
  }
  const result = revokeGrant(orderId);
  res.json(result);
});

// ---- 已发放订单列表（对账/调试用）----

router.get("/granted-orders", (_req: Request, res: Response) => {
  res.json({ success: true, data: listGrantedOrders() });
});

// ---- 交易对账报告（GetReport）----

router.get("/report", async (req: Request, res: Response) => {
  const { type, time, maxResults } = req.query;
  const result = await getReport({
    type: typeof type === "string" ? type : undefined,
    time: typeof time === "string" ? time : undefined,
    maxResults: typeof maxResults === "string" ? Number(maxResults) : undefined,
  });
  res.json(result);
});

// ---- 配置状态（调试用） ----

router.get("/config-status", (_req: Request, res: Response) => {
  const config = getConfig();
  res.json({
    success: true,
    data: {
      mockMode: config.mockMode,
      appId: config.appId,
      hasApiKey: !!config.webApiKey,
    },
  });
});

export default router;
