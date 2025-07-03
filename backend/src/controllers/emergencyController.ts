import { Request, Response } from "express";
import { db } from "../database/connection";
import { Server } from "socket.io";

/**
 * 緊急対応・通知管理コントローラー
 * システムの緊急停止、アラート、通知機能を管理
 * Socket.io リアルタイム通信と連携
 */

// Socket.ioインスタンスを保持
let socketInstance: Server | null = null;

export const setSocketInstance = (io: Server) => {
  socketInstance = io;
};

// Socket.io通知を送信するヘルパー関数
const emitSocketNotification = (event: string, data: any) => {
  if (socketInstance) {
    socketInstance.emit(event, {
      ...data,
      timestamp: new Date().toISOString(),
    });
  }
};

// 緊急停止を発動
export const triggerEmergencyStop = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { reason, initiated_by, severity = "critical" } = req.body;

    if (!reason || !initiated_by) {
      res.status(400).json({
        success: false,
        message: "緊急停止の理由と実行者が必要です",
      });
      return;
    }

    // 緊急対応ログを記録
    const logQuery = `
      INSERT INTO emergency_logs (
        event_type,
        severity,
        description,
        initiated_by,
        status
      ) VALUES ($1, $2, $3, $4, 'active')
      RETURNING *
    `;

    const logResult = await db.query(logQuery, [
      "emergency_stop",
      severity,
      reason,
      initiated_by,
    ]);

    // システム設定で緊急モードを有効化
    await db.query(
      `INSERT INTO system_settings (setting_name, setting_value, data_type)
       VALUES ('emergency_mode', 'true', 'boolean')
       ON CONFLICT (setting_name)
       DO UPDATE SET setting_value = 'true', updated_at = CURRENT_TIMESTAMP`
    );

    // 注文受付を停止
    await db.query(
      `INSERT INTO system_settings (setting_name, setting_value, data_type)
       VALUES ('accept_orders', 'false', 'boolean')
       ON CONFLICT (setting_name)
       DO UPDATE SET setting_value = 'false', updated_at = CURRENT_TIMESTAMP`
    );

    // 全画面に緊急停止を通知
    emitSocketNotification("emergency-stop-activated", {
      emergency_id: logResult.rows[0].log_id,
      reason,
      initiated_by,
      severity,
      message: "緊急停止が発動されました。新規注文の受付を停止します。",
      actions_required: [
        "現在調理中の注文は完了まで継続してください",
        "新規注文の受付は停止されました",
        "管理者による解除まで待機してください",
      ],
    });

    // 音声アラート
    emitSocketNotification("audio-alert", {
      type: "emergency",
      message: `緊急停止が発動されました。理由：${reason}`,
      severity: "critical",
      repeat: 3,
    });

    res.json({
      success: true,
      message: "緊急停止が正常に発動されました",
      data: logResult.rows[0],
    });
  } catch (error) {
    console.error("緊急停止エラー:", error);
    res.status(500).json({
      success: false,
      message: "緊急停止の実行に失敗しました",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// 緊急停止を解除
export const resolveEmergencyStop = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { emergency_id, resolved_by, resolution_notes } = req.body;

    if (!emergency_id || !resolved_by) {
      res.status(400).json({
        success: false,
        message: "緊急ID と解除実行者が必要です",
      });
      return;
    }

    // 緊急対応を解決済みに更新
    const updateQuery = `
      UPDATE emergency_logs
      SET
        status = 'resolved',
        resolved_by = $1,
        resolution_notes = $2,
        resolved_at = CURRENT_TIMESTAMP
      WHERE log_id = $3 AND status = 'active'
      RETURNING *
    `;

    const updateResult = await db.query(updateQuery, [
      resolved_by,
      resolution_notes || "緊急停止解除",
      emergency_id,
    ]);

    if (updateResult.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: "アクティブな緊急対応が見つかりません",
      });
      return;
    }

    // システム設定で緊急モードを無効化
    await db.query(
      `UPDATE system_settings
       SET setting_value = 'false', updated_at = CURRENT_TIMESTAMP
       WHERE setting_name = 'emergency_mode'`
    );

    // 注文受付を再開
    await db.query(
      `UPDATE system_settings
       SET setting_value = 'true', updated_at = CURRENT_TIMESTAMP
       WHERE setting_name = 'accept_orders'`
    );

    // 全画面に緊急停止解除を通知
    emitSocketNotification("emergency-stop-resolved", {
      emergency_id,
      resolved_by,
      resolution_notes,
      message: "緊急停止が解除されました。通常営業を再開します。",
    });

    // 音声通知
    emitSocketNotification("audio-notification", {
      type: "emergency-resolved",
      message: "緊急停止が解除されました。通常営業を再開します。",
      severity: "normal",
    });

    res.json({
      success: true,
      message: "緊急停止が正常に解除されました",
      data: updateResult.rows[0],
    });
  } catch (error) {
    console.error("緊急停止解除エラー:", error);
    res.status(500).json({
      success: false,
      message: "緊急停止の解除に失敗しました",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// アクティブな緊急対応を取得
export const getActiveEmergencies = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const query = `
      SELECT *
      FROM emergency_logs
      WHERE status = 'active'
      ORDER BY created_at DESC
    `;

    const result = await db.query(query);

    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length,
    });
  } catch (error) {
    console.error("アクティブ緊急対応取得エラー:", error);
    res.status(500).json({
      success: false,
      message: "緊急対応情報の取得に失敗しました",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// 通知を作成・送信
export const createNotification = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const {
      notification_type,
      target_order_number,
      content,
      priority = "通常",
      target_rooms = [],
    } = req.body;

    if (!notification_type || !content) {
      res.status(400).json({
        success: false,
        message: "通知タイプと内容が必要です",
      });
      return;
    }

    // 通知をDBに保存
    const query = `
      INSERT INTO notifications (
        notification_type,
        target_order_number,
        content,
        priority
      ) VALUES ($1, $2, $3, $4)
      RETURNING *
    `;

    const result = await db.query(query, [
      notification_type,
      target_order_number,
      content,
      priority,
    ]);

    const notification = result.rows[0];

    // Socket.ioで通知を送信
    const notificationData = {
      notification_id: notification.notification_id,
      type: notification_type,
      content,
      priority,
      target_order_number,
      created_at: notification.created_at,
    };

    if (target_rooms.length > 0) {
      // 特定のルームに送信
      target_rooms.forEach((room: string) => {
        if (socketInstance) {
          socketInstance.to(room).emit("notification", notificationData);
        }
      });
    } else {
      // 全体に送信
      emitSocketNotification("notification", notificationData);
    }

    // 優先度が高い場合は音声通知も送信
    if (priority === "緊急") {
      emitSocketNotification("audio-notification", {
        type: notification_type,
        message: content,
        priority: "high",
      });
    }

    res.status(201).json({
      success: true,
      message: "通知が正常に送信されました",
      data: notification,
    });
  } catch (error) {
    console.error("通知作成エラー:", error);
    res.status(500).json({
      success: false,
      message: "通知の作成に失敗しました",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// 通知を確認済みにマーク
export const markNotificationAsConfirmed = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { notification_id } = req.params;

    const query = `
      UPDATE notifications
      SET is_confirmed = true
      WHERE notification_id = $1
      RETURNING *
    `;

    const result = await db.query(query, [notification_id]);

    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: "通知が見つかりません",
      });
      return;
    }

    // Socket.ioで確認済み状態を通知
    emitSocketNotification("notification-confirmed", {
      notification_id: parseInt(notification_id),
      confirmed_at: new Date().toISOString(),
    });

    res.json({
      success: true,
      message: "通知が確認済みにマークされました",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("通知確認エラー:", error);
    res.status(500).json({
      success: false,
      message: "通知の確認処理に失敗しました",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// 未確認通知を取得
export const getUnconfirmedNotifications = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { limit = 50 } = req.query;

    const query = `
      SELECT *
      FROM notifications
      WHERE is_confirmed = false
      ORDER BY
        CASE priority
          WHEN '緊急' THEN 1
          WHEN '通常' THEN 2
          WHEN '情報' THEN 3
          ELSE 4
        END,
        created_at DESC
      LIMIT $1
    `;

    const result = await db.query(query, [Number(limit)]);

    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length,
    });
  } catch (error) {
    console.error("未確認通知取得エラー:", error);
    res.status(500).json({
      success: false,
      message: "未確認通知の取得に失敗しました",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// システム状態を取得
export const getSystemStatus = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // システム設定を取得
    const settingsQuery = `
      SELECT setting_name, setting_value, data_type
      FROM system_settings
      WHERE setting_name IN (
        'emergency_mode', 'store_open', 'accept_orders',
        'kitchen_capacity', 'max_orders_per_hour'
      )
    `;

    // アクティブな緊急対応を取得
    const emergencyQuery = `
      SELECT COUNT(*) as active_emergencies
      FROM emergency_logs
      WHERE status = 'active'
    `;

    // 未確認通知を取得
    const notificationQuery = `
      SELECT COUNT(*) as unconfirmed_notifications
      FROM notifications
      WHERE is_confirmed = false
    `;

    const [settingsResult, emergencyResult, notificationResult] =
      await Promise.all([
        db.query(settingsQuery),
        db.query(emergencyQuery),
        db.query(notificationQuery),
      ]);

    // 設定を変換
    const settings = settingsResult.rows.reduce(
      (acc: Record<string, any>, setting: any) => {
        let value = setting.setting_value;
        if (setting.data_type === "boolean") {
          value = value === "true";
        } else if (setting.data_type === "number") {
          value = parseFloat(value);
        }
        acc[setting.setting_name] = value;
        return acc;
      },
      {}
    );

    const systemStatus = {
      settings,
      active_emergencies: parseInt(emergencyResult.rows[0].active_emergencies),
      unconfirmed_notifications: parseInt(
        notificationResult.rows[0].unconfirmed_notifications
      ),
      status: settings.emergency_mode
        ? "emergency"
        : settings.store_open
        ? "open"
        : "closed",
      last_checked: new Date().toISOString(),
    };

    res.json({
      success: true,
      data: systemStatus,
    });
  } catch (error) {
    console.error("システム状態取得エラー:", error);
    res.status(500).json({
      success: false,
      message: "システム状態の取得に失敗しました",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// 温度管理アラートを発送
export const triggerTemperatureAlert = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const {
      order_id,
      order_number,
      elapsed_minutes,
      threshold_minutes = 15,
    } = req.body;

    if (!order_id || !order_number) {
      res.status(400).json({
        success: false,
        message: "注文IDと注文番号が必要です",
      });
      return;
    }

    // 温度管理アラート通知を作成
    const content = `注文番号 ${order_number} が調理完了から${elapsed_minutes}分経過しました。温度管理にご注意ください。`;

    await db.query(
      `INSERT INTO notifications (notification_type, target_order_number, content, priority)
       VALUES ('temperature_alert', $1, $2, '緊急')`,
      [order_number, content]
    );

    // Socket.ioで緊急アラート送信
    emitSocketNotification("temperature-alert", {
      order_id,
      order_number,
      elapsed_minutes,
      threshold_minutes,
      message: content,
      severity: "high",
    });

    // 音声アラート
    emitSocketNotification("audio-alert", {
      type: "temperature",
      message: `温度管理アラート。注文番号${order_number}`,
      severity: "high",
    });

    res.json({
      success: true,
      message: "温度管理アラートが送信されました",
    });
  } catch (error) {
    console.error("温度管理アラートエラー:", error);
    res.status(500).json({
      success: false,
      message: "温度管理アラートの送信に失敗しました",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
