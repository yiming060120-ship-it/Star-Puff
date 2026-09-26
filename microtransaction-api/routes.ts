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

import { Router, type Request, type Response, type NextFunction } from "express";
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

// [BUG-FIX] Express 4 不捕获 async 处理器抛出的异常：异常会变成 unhandledRejection 让进程退出（远程 DoS）。
// 这里统一包装 handler，把错误交给 Express 错误中间件返回 500 而不是打崩服务。
type RouteFn = (req: Request, res: Response, next: NextFunction) => unknown | Promise<unknown>;
const handle =
  (fn: RouteFn) =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
// 用 route.* 替代 router.*，注册时自动套上错误捕获。
// 注意：此处用 router["post"] 下标写法，避免被全局替换成 route.post 造成自递归。
const route = {
  post: (path: string, fn: RouteFn) => router["post"](path, handle(fn)),
  get: (path: string, fn: RouteFn) => router["get"](path, handle(fn)),
};

/** [BUG-FIX] 把不可信输入收敛为字符串 */
function asString(v: unknown): string {
  return typeof v === "string" ? v : "";
}

// ---- 商品列表 ----

route.get("/products", (_req: Request, res: Response) => {
  const products = getProducts();
  res.json({ success: true, data: products });
});

// ---- 用户验证 ----

route.post("/verify-user", async (req: Request, res: Response) => {
  // [BUG-FIX] 入参类型校验：steamId 非字符串时原实现会原样透传
  const steamId = asString((req.body ?? {}).steamId);
  if (!steamId) {
    return res.status(400).json({ success: false, error: "缺少 steamId" });
  }
  const result = await getReliableUserInfo({ steamId });
  res.json(result);
});

// ---- 应用所有权 ----

route.post("/check-ownership", async (req: Request, res: Response) => {
  const steamId = asString((req.body ?? {}).steamId);
  if (!steamId) {
    return res.status(400).json({ success: false, error: "缺少 steamId" });
  }
  const result = await checkAppOwnership(steamId);
  res.json(result);
});

// ---- 初始化购买 ----

route.post("/init-purchase", async (req: Request, res: Response) => {
  const body = req.body ?? {};
  const steamId = asString(body.steamId);
  const itemId = Number(body.itemId);

  // [BUG-FIX] itemId 必须是正整数：原实现只判真假，itemId="abc" 会得到 NaN 一路传到 Steam
  if (!steamId || !Number.isInteger(itemId) || itemId <= 0) {
    return res.status(400).json({ success: false, error: "缺少或非法的 steamId / itemId" });
  }

  const config = getConfig();

  const result = await initPurchase({
    steamId,
    appId: config.appId,
    itemId,
    quantity: Number(body.quantity) || 1,
    description: typeof body.description === "string" ? body.description : undefined,
    language: asString(body.language) || "zh-CN",
    currency: asString(body.currency) || "CNY",
  });

  res.json(result);
});

// ---- 完成购买 ----

route.post("/finalize-purchase", async (req: Request, res: Response) => {
  const body = req.body ?? {};
  const steamId = asString(body.steamId);
  const orderId = asString(body.orderId);

  if (!steamId || !orderId) {
    return res.status(400).json({ success: false, error: "缺少 steamId 或 orderId" });
  }

  const config = getConfig();
  const result = await finalizePurchase({ steamId, appId: config.appId, orderId });
  res.json(result);
});

// ---- 查询购买状态 ----

route.post("/check-purchase", async (req: Request, res: Response) => {
  const body = req.body ?? {};
  const steamId = asString(body.steamId);
  const orderId = asString(body.orderId) || undefined;

  if (!steamId) {
    return res.status(400).json({ success: false, error: "缺少 steamId" });
  }

  const config = getConfig();
  const result = await checkPurchaseStatus({ steamId, appId: config.appId, orderId });
  res.json(result);
});

// ---- 发放权益（Finalize 成功后调用）----

route.post("/grant", async (req: Request, res: Response) => {
  // [BUG-FIX] 入参类型校验：原实现把 req.body 原样透传，且不校验订单真实性。
  // 现在 grantItems 会校验「本服务初始化且已完成支付」的订单，数量以服务端记录为准。
  const body = req.body ?? {};
  const orderId = asString(body.orderId);
  const steamId = asString(body.steamId);
  const itemId = Number(body.itemId);

  if (!orderId || !steamId || !Number.isInteger(itemId)) {
    return res.status(400).json({ success: false, error: "缺少或非法的 orderId / steamId / itemId" });
  }

  const result = await grantItems({ orderId, steamId, itemId });
  res.json(result);
});

// ---- 回收权益（退款/拒付时调用）----

route.post("/revoke", (req: Request, res: Response) => {
  const orderId = asString((req.body ?? {}).orderId);
  if (!orderId) {
    return res.status(400).json({ success: false, error: "缺少 orderId" });
  }
  const result = revokeGrant(orderId);
  res.json(result);
});

// ---- 已发放订单列表（对账/调试用）----

route.get("/granted-orders", (_req: Request, res: Response) => {
  res.json({ success: true, data: listGrantedOrders() });
});

// ---- 交易对账报告（GetReport）----

route.get("/report", async (req: Request, res: Response) => {
  const { type, time, maxResults } = req.query;
  const result = await getReport({
    type: typeof type === "string" ? type : undefined,
    time: typeof time === "string" ? time : undefined,
    maxResults: typeof maxResults === "string" ? Number(maxResults) : undefined,
  });
  res.json(result);
});

// ---- 配置状态（调试用） ----

route.get("/config-status", (_req: Request, res: Response) => {
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
