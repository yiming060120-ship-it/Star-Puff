/**
 * microtransaction-api - Steam 微交易桥接 API
 * 类型定义
 *
 * 基于 jasielmacedo/steam-microtransaction-api (MIT License)
 * 为 StarPuff 项目定制
 */

/** Steam 初始化购买请求参数 */
export interface InitPurchaseRequest {
  /** Steam 用户 SteamID64 */
  steamId: string;
  /** 应用 ID */
  appId: number;
  /** 商品 ID（对应 products.json 中的 id） */
  itemId: number;
  /** 购买数量 */
  quantity: number;
  /** 购买描述（可选） */
  description?: string;
  /** 订单语言 */
  language?: string;
  /** 货币代码，默认 CNY */
  currency?: string;
}

/** Steam 完成购买请求参数 */
export interface FinalizePurchaseRequest {
  /** Steam 用户 SteamID64 */
  steamId: string;
  /** 应用 ID */
  appId: number;
  /** Steam 订单 ID */
  orderId: string;
}

/** Steam 查询购买状态请求参数 */
export interface CheckPurchaseStatusRequest {
  /** Steam 用户 SteamID64 */
  steamId: string;
  /** 应用 ID */
  appId: number;
  /** Steam 订单 ID（可选） */
  orderId?: string;
}

/** Steam 可靠用户验证请求参数 */
export interface GetReliableUserInfoRequest {
  /** Steam 用户 SteamID64 */
  steamId: string;
}

/** 商品定义 */
export interface Product {
  /** 商品唯一 ID */
  id: number;
  /** 商品名称 */
  name: string;
  /** 商品描述 */
  description: string;
  /** 价格（分为单位，如 99 = $0.99） */
  priceInCents: number;
  /** 货币代码 */
  currency?: string;
  /** 商品分类 */
  category?: "stardust_coins" | "membership" | "outfit" | "snack" | "gift";
  /** 星尘币数量（仅 stardust_coins 类商品） */
  coins?: number;
  /** 会员等级（仅 membership 类商品） */
  tier?: "vip_month" | "vip_year";
}

/** API 统一响应 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Steam 交易状态（官方附录 A）
 * Init            已创建未授权
 * Approved        用户已批准（可 Finalize）
 * Succeeded       处理成功（已扣款，可发放物品）
 * Failed          失败/拒绝
 * Refunded        已退款（需回收物品）
 * PartialRefund   部分退款
 * Chargedback     拒付/争议（需回收物品）
 */
export type SteamTxnStatus =
  | "Init"
  | "Approved"
  | "Succeeded"
  | "Failed"
  | "Refunded"
  | "PartialRefund"
  | "Chargedback"
  | "RefundedSuspectedFraud"
  | "RefundedFriendlyFraud"
  | string;

/** 购买初始化结果 */
export interface InitPurchaseResult {
  /** Steam 订单 ID（服务端生成） */
  orderId: string;
  /** 是否需要 Steam 叠加层确认 */
  requiresSteamOverlay: boolean;
  /** 交易状态 */
  status: SteamTxnStatus;
}

/** 购买状态查询结果 */
export interface PurchaseStatusResult {
  /** Steam 订单 ID */
  orderId: string;
  /** 购买状态 */
  status: SteamTxnStatus;
  /** 商品 ID */
  itemId?: number;
  /** 支付金额（分） */
  amountInCents?: number;
}

/** 用户可靠性信息 */
export interface ReliableUserInfo {
  /** 是否可信用户 */
  isReliable: boolean;
  /** Steam 用户 SteamID64 */
  steamId: string;
  /** 账户创建时间（Unix 时间戳） */
  accountCreatedAt?: number;
  /** 是否有 VAC 封禁 */
  hasVacBan?: boolean;
}
