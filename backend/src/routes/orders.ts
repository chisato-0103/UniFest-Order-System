// 🛣️ 注文管理APIルーター
// 目的: 注文に関するAPIのURL設定を行う「道路標識」
// 機能: どのURLにアクセスすると、どの処理が実行されるかを定義
// 初心者向け解説: このファイルは「APIの地図」のようなもので、
//                フロントエンドからのリクエストを適切な処理に振り分けます

import { Router } from "express"; // Express.jsのルーター機能
import {
  getAllOrders,      // 全注文取得処理
  getOrderById,      // 注文ID検索処理
  getOrderByNumber,  // 注文番号検索処理
  createOrder,       // 新規注文作成処理
  updateOrderStatus, // 注文状態更新処理
  getCookingOrders,  // 調理中注文取得処理
  getReadyOrders,    // 受け渡し待ち注文取得処理
  getSalesStats,     // 売上統計取得処理
  resetOrderHistory, // 注文履歴リセット処理
} from "../controllers/orderController";

// 🛣️ ルーター作成（道路を作る）
const router = Router();

/**
 * 📋 注文管理API ルーター設定
 * 各URLパターンと対応する処理を関連付けます
 */

// 👨‍💼 管理者向けAPI（/api/orders/admin/...）
// 目的: 管理者だけが使える特別な機能
router.get("/admin", getAllOrders);           // GET /api/orders/admin → 全注文一覧
router.get("/admin/stats", getSalesStats);    // GET /api/orders/admin/stats → 売上統計
router.post("/admin/reset", resetOrderHistory); // POST /api/orders/admin/reset → 履歴削除

// 📊 基本的な注文取得API
router.get("/", getAllOrders);                 // GET /api/orders → 全注文取得

// 👨‍🍳 厨房向けAPI（調理担当者が使用）
// 目的: 厨房で「今何を作るべきか」を確認するため
router.get("/cooking", getCookingOrders);      // GET /api/orders/cooking → 調理中注文
router.get("/ready", getReadyOrders);         // GET /api/orders/ready → 受け渡し待ち

// 📱 お客様向けAPI（注文番号で状況確認）
// 目的: QRコードから注文状況を確認するため
router.get("/number/:orderNumber", getOrderByNumber); // GET /api/orders/number/A001 → 注文検索

// 🆕 新規注文作成API
// 目的: お客さんが「注文確定」ボタンを押した時に呼び出される
router.post("/", createOrder);                // POST /api/orders → 新規注文

// 🔄 注文状態更新API（スタッフ向け）
// 目的: 「調理開始」「調理完了」ボタンを押した時の処理
router.patch("/:id/status", updateOrderStatus); // PATCH /api/orders/123/status → 状態更新

// 💳 支払い処理API
// 目的: 「支払い完了」ボタンを押した時の処理
import { processOrderPayment } from "../controllers/orderController";
router.post("/:id/payment", processOrderPayment); // POST /api/orders/123/payment → 支払い処理

// 🔍 特定注文詳細取得API（ID指定）
// 目的: 1つの注文の詳細情報を取得（管理者・トラブル対応用）
// 注意: 最後に定義する（他のパターンとの競合を避けるため）
router.get("/:id", getOrderById);             // GET /api/orders/123 → 注文詳細

export default router;
