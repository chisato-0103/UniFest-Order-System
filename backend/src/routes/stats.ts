import express from "express";
import {
  getRealtimeStats,
  getDashboardData,
  getSalesReport,
  getProductPerformance,
  getCookingPerformance,
  startStatsPolling,
  stopStatsPolling,
} from "../controllers/statsController";

const router = express.Router();

/**
 * 統計・監視ルーター
 * リアルタイム統計、ダッシュボード、レポート機能
 */

// リアルタイム統計を取得
router.get("/realtime", getRealtimeStats);

// 監視ダッシュボード用データを取得
router.get("/dashboard", getDashboardData);

// 売上レポートを取得
router.get("/sales", getSalesReport);

// 商品パフォーマンスレポートを取得
router.get("/products", getProductPerformance);

// 調理パフォーマンスレポートを取得
router.get("/cooking", getCookingPerformance);

// 統計ポーリングを開始
router.post("/polling/start", (req, res) => {
  const { interval = 30000 } = req.body;
  startStatsPolling(interval);
  res.json({
    success: true,
    message: "統計ポーリングを開始しました",
    interval: interval,
  });
});

// 統計ポーリングを停止
router.post("/polling/stop", (req, res) => {
  stopStatsPolling();
  res.json({
    success: true,
    message: "統計ポーリングを停止しました",
  });
});

export default router;
