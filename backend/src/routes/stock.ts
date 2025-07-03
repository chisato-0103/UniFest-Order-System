import express from "express";
import {
  getStockStatus,
  updateStock,
  getStockLogs,
  getStockAlerts,
  bulkUpdateStock,
  getStockStatistics,
} from "../controllers/stockController";

const router = express.Router();

/**
 * 在庫管理ルーター
 * 在庫の取得、更新、ログ、アラート管理
 */

// 全商品の在庫状況を取得
router.get("/status", getStockStatus);

// 在庫統計を取得
router.get("/statistics", getStockStatistics);

// 在庫アラートを取得
router.get("/alerts", getStockAlerts);

// 在庫ログを取得（全体）
router.get("/logs", getStockLogs);

// 特定商品の在庫ログを取得
router.get("/logs/:product_id", getStockLogs);

// 在庫を更新
router.patch("/:product_id", updateStock);

// 在庫を一括更新
router.patch("/", bulkUpdateStock);

export default router;
