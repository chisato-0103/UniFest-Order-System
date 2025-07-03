import express from "express";
import {
  triggerEmergencyStop,
  resolveEmergencyStop,
  getActiveEmergencies,
  createNotification,
  markNotificationAsConfirmed,
  getUnconfirmedNotifications,
  getSystemStatus,
  triggerTemperatureAlert,
} from "../controllers/emergencyController";

const router = express.Router();

/**
 * 緊急対応・通知管理ルーター
 * 緊急停止、アラート、通知、システム状態管理
 */

// システム状態を取得
router.get("/status", getSystemStatus);

// アクティブな緊急対応を取得
router.get("/active", getActiveEmergencies);

// 緊急停止を発動
router.post("/stop", triggerEmergencyStop);

// 緊急停止を解除
router.post("/resolve", resolveEmergencyStop);

// 温度管理アラートを発送
router.post("/temperature-alert", triggerTemperatureAlert);

// 通知を作成・送信
router.post("/notifications", createNotification);

// 未確認通知を取得
router.get("/notifications/unconfirmed", getUnconfirmedNotifications);

// 通知を確認済みにマーク
router.patch(
  "/notifications/:notification_id/confirm",
  markNotificationAsConfirmed
);

export default router;
