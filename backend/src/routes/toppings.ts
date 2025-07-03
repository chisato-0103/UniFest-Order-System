import { Router } from "express";
import {
  getToppings,
  getAllToppings,
  getToppingsForProduct,
  getToppingById,
  createTopping,
  updateTopping,
  deleteTopping,
} from "../controllers/toppingController";

const router = Router();

/**
 * トッピング管理API ルーター
 */

// お客様向け - 有効なトッピングのみ取得
router.get("/", getToppings);

// 管理者向け - 全トッピング取得（無効含む）
router.get("/admin/all", getAllToppings);

// 特定商品で利用可能なトッピング取得
router.get("/product/:productId", getToppingsForProduct);

// 特定トッピングの詳細取得
router.get("/:id", getToppingById);

// 管理者向け - 新トッピング作成
router.post("/admin", createTopping);

// 管理者向け - トッピング情報更新
router.put("/admin/:id", updateTopping);

// 管理者向け - トッピング削除
router.delete("/admin/:id", deleteTopping);

export default router;
