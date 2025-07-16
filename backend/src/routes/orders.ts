import { Router } from "express";
import {
  getAllOrders,
  getOrderById,
  getOrderByNumber,
  createOrder,
  updateOrderStatus,
  getCookingOrders,
  getReadyOrders,
  getSalesStats,
  resetOrderHistory,
} from "../controllers/orderController";

const router = Router();

/**
 * 注文管理API ルーター
 */

// 注文一覧取得（管理者向け）
router.get("/admin", getAllOrders);

// 全注文取得（基本エンドポイント）
router.get("/", getAllOrders);

// 売上統計取得（管理者向け）
router.get("/admin/stats", getSalesStats);

// 注文履歴リセット（管理者専用）
router.post("/admin/reset", resetOrderHistory);

// 調理中の注文一覧（厨房向け）
router.get("/cooking", getCookingOrders);

// 受け渡し待ちの注文一覧
router.get("/ready", getReadyOrders);

// 注文番号で注文取得（お客様向け）- より具体的なパスを先に定義
router.get("/number/:orderNumber", getOrderByNumber);

// 新規注文作成
router.post("/", createOrder);

// 注文ステータス更新（管理者・スタッフ向け）
router.patch("/:id/status", updateOrderStatus);

// 支払い処理API（新規追加）
import { processOrderPayment } from "../controllers/orderController";
router.post("/:id/payment", processOrderPayment);

// 特定注文の詳細取得（ID）- 最後に定義
router.get("/:id", getOrderById);

export default router;
