/**
 * microtransaction-api
 * 入口文件 - 导出路由和配置方法
 */

export { default as microtransactionRoutes } from "./routes";
export {
  updateConfig,
  getConfig,
  getProducts,
  findProduct,
  generateOrderId,
  getReport,
} from "./service";
export {
  grantItems,
  revokeGrant,
  listGrantedOrders,
  isOrderGranted,
  mapProductToGrant,
} from "./fulfillment";
export type {
  InitPurchaseRequest,
  FinalizePurchaseRequest,
  CheckPurchaseStatusRequest,
  GetReliableUserInfoRequest,
  InitPurchaseResult,
  PurchaseStatusResult,
  ReliableUserInfo,
  Product,
  ApiResponse,
} from "./types";
export type {
  GrantKind,
  GrantPayload,
  GrantResult,
  GrantRequest,
} from "./fulfillment";
