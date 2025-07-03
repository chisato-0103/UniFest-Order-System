import { Router } from "express";
import {
  getCategories,
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  updateCategoryOrder,
} from "../controllers/categoryController";

const router = Router();

/**
 * カテゴリ管理API ルーター
 */

// お客様向け - 有効なカテゴリのみ取得
router.get("/", getCategories);

// 管理者向け - 全カテゴリ取得（無効含む）
router.get("/admin/all", getAllCategories);

// 特定カテゴリの詳細取得
router.get("/:id", getCategoryById);

// 管理者向け - 新カテゴリ作成
router.post("/admin", createCategory);

// 管理者向け - カテゴリ情報更新
router.put("/admin/:id", updateCategory);

// 管理者向け - カテゴリ削除
router.delete("/admin/:id", deleteCategory);

// 管理者向け - カテゴリ表示順一括更新
router.patch("/admin/order", updateCategoryOrder);

export default router;
