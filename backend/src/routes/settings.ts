import express from "express";
import {
  getSystemSettings,
  getSettingByName,
  updateSystemSetting,
  deleteSystemSetting,
  toggleStoreStatus,
  updateCookingSettings,
  updateNotificationSettings,
  resetDailyData,
  exportSystemData,
} from "../controllers/settingsController";

const router = express.Router();

/**
 * システム設定管理ルーター
 * 営業状態、調理設定、通知設定、データ管理
 */

// 全システム設定を取得
router.get("/", getSystemSettings);

// 特定の設定値を取得
router.get("/:name", getSettingByName);

// 設定値を作成または更新
router.put("/:name", updateSystemSetting);

// 設定値を削除
router.delete("/:name", deleteSystemSetting);

// 営業状態を切り替え（営業中/準備中/終了）
router.post("/store/status", toggleStoreStatus);

// 調理設定を更新
router.patch("/cooking", updateCookingSettings);

// 通知設定を更新
router.patch("/notifications", updateNotificationSettings);

// 日次データリセット
router.post("/reset/daily", resetDailyData);

// システムデータエクスポート
router.post("/export", exportSystemData);

export default router;
