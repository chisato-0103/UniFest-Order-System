import { Router } from "express";
import {
  getProducts,
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  updateStock,
  bulkUpdatePrices,
} from "../controllers/productController";

const router = Router();

/**
 * 商品管理API ルーター
 */

// お客様向け - 有効な商品のみ取得
router.get("/", getProducts);

// 管理者向け - 全商品取得（無効・削除済み含む）
router.get("/admin/all", getAllProducts);

// 特定商品の詳細取得
router.get("/:id", getProductById);

// 管理者向け - 新商品作成
router.post("/admin", createProduct);

// 管理者向け - 商品情報更新
router.put("/admin/:id", updateProduct);

// 管理者向け - 商品削除（論理削除）
router.delete("/admin/:id", deleteProduct);

// 管理者向け - 在庫更新
router.patch("/admin/:id/stock", updateStock);

// 管理者向け - 一括価格更新
router.patch("/admin/bulk/prices", bulkUpdatePrices);

export default router;
