import { Request, Response } from "express";
import { db } from "../database/connection";
import { Server } from "socket.io";

/**
 * システム設定管理コントローラー
 * システムの各種設定値の取得・更新を管理
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

// 全システム設定を取得
export const getSystemSettings = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const query = `
      SELECT *
      FROM system_settings
      ORDER BY setting_name
    `;

    const result = await db.query(query);

    // データ型に応じて値を変換
    const settings = result.rows.map((setting: any) => {
      let parsed_value: any = setting.setting_value;

      try {
        switch (setting.data_type) {
          case "number":
            parsed_value = parseFloat(setting.setting_value);
            break;
          case "boolean":
            parsed_value = setting.setting_value === "true";
            break;
          case "json":
            parsed_value = JSON.parse(setting.setting_value);
            break;
          default: // string
            parsed_value = setting.setting_value;
        }
      } catch (error) {
        console.warn(`設定値の変換エラー (${setting.setting_name}):`, error);
      }

      return {
        ...setting,
        parsed_value,
      };
    });

    res.json({
      success: true,
      data: settings,
    });
  } catch (error) {
    console.error("システム設定取得エラー:", error);
    res.status(500).json({
      success: false,
      message: "システム設定の取得に失敗しました",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// 特定の設定値を取得
export const getSettingByName = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { name } = req.params;

    const query = `
      SELECT * FROM system_settings WHERE setting_name = $1
    `;

    const result = await db.query(query, [name]);

    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: "設定が見つかりません",
      });
      return;
    }

    const setting = result.rows[0];
    let parsed_value: any = setting.setting_value;

    try {
      switch (setting.data_type) {
        case "number":
          parsed_value = parseFloat(setting.setting_value);
          break;
        case "boolean":
          parsed_value = setting.setting_value === "true";
          break;
        case "json":
          parsed_value = JSON.parse(setting.setting_value);
          break;
        default: // string
          parsed_value = setting.setting_value;
      }
    } catch (error) {
      console.warn(`設定値の変換エラー (${setting.setting_name}):`, error);
    }

    res.json({
      success: true,
      data: {
        ...setting,
        parsed_value,
      },
    });
  } catch (error) {
    console.error("システム設定取得エラー:", error);
    res.status(500).json({
      success: false,
      message: "システム設定の取得に失敗しました",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// システム設定を更新
export const updateSystemSetting = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { name } = req.params;
    const { setting_value, data_type, description } = req.body;

    if (setting_value === undefined) {
      res.status(400).json({
        success: false,
        message: "設定値が必要です",
      });
      return;
    }

    // データ型のバリデーション
    const validDataTypes = ["string", "number", "boolean", "json"];
    if (data_type && !validDataTypes.includes(data_type)) {
      res.status(400).json({
        success: false,
        message: "無効なデータ型です",
      });
      return;
    }

    // 値の検証とフォーマット
    let formattedValue = setting_value;
    if (data_type) {
      try {
        switch (data_type) {
          case "number":
            if (isNaN(parseFloat(setting_value))) {
              throw new Error("数値が必要です");
            }
            formattedValue = setting_value.toString();
            break;
          case "boolean":
            if (
              typeof setting_value !== "boolean" &&
              setting_value !== "true" &&
              setting_value !== "false"
            ) {
              throw new Error("真偽値が必要です");
            }
            formattedValue = setting_value.toString();
            break;
          case "json":
            if (typeof setting_value === "object") {
              formattedValue = JSON.stringify(setting_value);
            } else {
              JSON.parse(setting_value); // バリデーション
              formattedValue = setting_value;
            }
            break;
          default: // string
            formattedValue = setting_value.toString();
        }
      } catch (error) {
        res.status(400).json({
          success: false,
          message: `設定値の形式が正しくありません: ${error}`,
        });
        return;
      }
    }

    // 設定の存在確認と更新
    const checkQuery = `SELECT setting_id FROM system_settings WHERE setting_name = $1`;
    const checkResult = await db.query(checkQuery, [name]);

    let query: string;
    let values: any[];

    if (checkResult.rows.length === 0) {
      // 新規作成
      query = `
        INSERT INTO system_settings (setting_name, setting_value, data_type, description)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `;
      values = [
        name,
        formattedValue,
        data_type || "string",
        description || null,
      ];
    } else {
      // 既存更新
      const updateFields = ["setting_value = $2"];
      values = [name, formattedValue];
      let paramCount = 2;

      if (data_type) {
        paramCount++;
        updateFields.push(`data_type = $${paramCount}`);
        values.push(data_type);
      }

      if (description !== undefined) {
        paramCount++;
        updateFields.push(`description = $${paramCount}`);
        values.push(description);
      }

      paramCount++;
      updateFields.push(`updated_at = $${paramCount}`);
      values.push(new Date());

      query = `
        UPDATE system_settings
        SET ${updateFields.join(", ")}
        WHERE setting_name = $1
        RETURNING *
      `;
    }

    const result = await db.query(query, values);

    res.json({
      success: true,
      message: "システム設定が正常に更新されました",
      data: result.rows[0],
    });

    // Socket.io通知: システム設定更新
    emitSocketNotification("system_setting_updated", {
      setting_name: name,
      setting_value: formattedValue,
      data_type: data_type || "string",
      description: description || null,
    });
  } catch (error) {
    console.error("システム設定更新エラー:", error);
    res.status(500).json({
      success: false,
      message: "システム設定の更新に失敗しました",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// 複数の設定を一括更新
export const updateMultipleSettings = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { settings } = req.body; // [{ setting_name, setting_value, data_type, description }, ...]

    if (!Array.isArray(settings) || settings.length === 0) {
      res.status(400).json({
        success: false,
        message: "設定データが正しくありません",
      });
      return;
    }

    const client = await db.getClient();
    try {
      await client.query("BEGIN");

      const results = [];
      for (const setting of settings) {
        const { setting_name, setting_value, data_type, description } = setting;

        if (!setting_name || setting_value === undefined) {
          throw new Error(`設定名と設定値が必要です: ${setting_name}`);
        }

        // 値のフォーマット処理（updateSystemSettingと同様）
        let formattedValue = setting_value;
        if (data_type) {
          switch (data_type) {
            case "number":
              if (isNaN(parseFloat(setting_value))) {
                throw new Error(`${setting_name}: 数値が必要です`);
              }
              formattedValue = setting_value.toString();
              break;
            case "boolean":
              if (
                typeof setting_value !== "boolean" &&
                setting_value !== "true" &&
                setting_value !== "false"
              ) {
                throw new Error(`${setting_name}: 真偽値が必要です`);
              }
              formattedValue = setting_value.toString();
              break;
            case "json":
              if (typeof setting_value === "object") {
                formattedValue = JSON.stringify(setting_value);
              } else {
                JSON.parse(setting_value); // バリデーション
                formattedValue = setting_value;
              }
              break;
            default: // string
              formattedValue = setting_value.toString();
          }
        }

        // UPSERT実行
        const upsertQuery = `
          INSERT INTO system_settings (setting_name, setting_value, data_type, description)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (setting_name)
          DO UPDATE SET
            setting_value = EXCLUDED.setting_value,
            data_type = EXCLUDED.data_type,
            description = EXCLUDED.description,
            updated_at = CURRENT_TIMESTAMP
          RETURNING *
        `;

        const result = await client.query(upsertQuery, [
          setting_name,
          formattedValue,
          data_type || "string",
          description || null,
        ]);

        if (result.rows.length > 0) {
          results.push(result.rows[0]);
        }
      }

      await client.query("COMMIT");

      res.json({
        success: true,
        message: `${results.length}件のシステム設定が更新されました`,
        data: results,
      });

      // Socket.io通知: システム設定一括更新
      emitSocketNotification("system_settings_updated", {
        updated_settings: results,
      });
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("システム設定一括更新エラー:", error);
    res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "システム設定の一括更新に失敗しました",
    });
  }
};

// システム設定を削除
export const deleteSystemSetting = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { name } = req.params;

    const query = `
      DELETE FROM system_settings WHERE setting_name = $1
      RETURNING *
    `;

    const result = await db.query(query, [name]);

    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: "設定が見つかりません",
      });
      return;
    }

    res.json({
      success: true,
      message: "システム設定が正常に削除されました",
      data: result.rows[0],
    });

    // Socket.io通知: システム設定削除
    emitSocketNotification("system_setting_deleted", {
      setting_name: name,
    });
  } catch (error) {
    console.error("システム設定削除エラー:", error);
    res.status(500).json({
      success: false,
      message: "システム設定の削除に失敗しました",
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
    // 重要な設定値を取得
    const importantSettings = [
      "store_name",
      "operating_hours_start",
      "operating_hours_end",
      "emergency_mode",
      "sound_notifications",
      "max_cooking_devices",
      "auto_refresh_interval",
    ];

    const query = `
      SELECT setting_name, setting_value, data_type
      FROM system_settings
      WHERE setting_name = ANY($1)
    `;

    const result = await db.query(query, [importantSettings]);

    // 設定値を整理
    const settings: Record<string, any> = {};
    result.rows.forEach((setting: any) => {
      let parsed_value: any = setting.setting_value;

      try {
        switch (setting.data_type) {
          case "number":
            parsed_value = parseFloat(setting.setting_value);
            break;
          case "boolean":
            parsed_value = setting.setting_value === "true";
            break;
          case "json":
            parsed_value = JSON.parse(setting.setting_value);
            break;
          default: // string
            parsed_value = setting.setting_value;
        }
      } catch (error) {
        console.warn(`設定値の変換エラー (${setting.setting_name}):`, error);
      }

      settings[setting.setting_name] = parsed_value;
    });

    // システム統計を取得
    const statsQuery = `
      SELECT
        (SELECT COUNT(*) FROM orders WHERE status IN ('調理待ち', '調理中')) as active_orders,
        (SELECT COUNT(*) FROM orders WHERE status = '調理完了') as ready_orders,
        (SELECT COUNT(*) FROM products WHERE status = '有効' AND deleted_flag = false) as active_products,
        (SELECT COUNT(*) FROM products WHERE status = '売り切れ') as out_of_stock_products
    `;

    const statsResult = await db.query(statsQuery);

    res.json({
      success: true,
      data: {
        settings,
        stats: statsResult.rows[0],
        server_time: new Date().toISOString(),
        uptime: process.uptime(),
      },
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

// 営業状態を切り替え（営業中/準備中/終了）
export const toggleStoreStatus = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { status, staff_name } = req.body;

    if (!["open", "preparing", "closed"].includes(status)) {
      res.status(400).json({
        success: false,
        message: "有効な営業状態を指定してください (open/preparing/closed)",
      });
      return;
    }

    // 営業状態を更新
    await db.query(
      `INSERT INTO system_settings (setting_name, setting_value, data_type, description)
       VALUES ('store_status', $1, 'string', '店舗営業状態')
       ON CONFLICT (setting_name)
       DO UPDATE SET setting_value = $1, updated_at = CURRENT_TIMESTAMP`,
      [status]
    );

    // 注文受付状態も連動して更新
    const acceptOrders = status === "open";
    await db.query(
      `INSERT INTO system_settings (setting_name, setting_value, data_type, description)
       VALUES ('accept_orders', $1, 'boolean', '注文受付状態')
       ON CONFLICT (setting_name)
       DO UPDATE SET setting_value = $1, updated_at = CURRENT_TIMESTAMP`,
      [acceptOrders.toString()]
    );

    // アクティビティログに記録
    await db.query(
      `INSERT INTO activity_logs (action_type, details)
       VALUES ('store_status_change', $1)`,
      [
        JSON.stringify({
          new_status: status,
          staff_name,
          timestamp: new Date(),
        }),
      ]
    );

    // Socket.ioで営業状態変更を通知
    emitSocketNotification("store-status-changed", {
      status,
      accept_orders: acceptOrders,
      staff_name,
      message: getStatusMessage(status),
    });

    res.json({
      success: true,
      message: `営業状態が「${getStatusDisplayName(status)}」に変更されました`,
      data: {
        store_status: status,
        accept_orders: acceptOrders,
      },
    });
  } catch (error) {
    console.error("営業状態切り替えエラー:", error);
    res.status(500).json({
      success: false,
      message: "営業状態の切り替えに失敗しました",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// 調理設定を更新
export const updateCookingSettings = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const {
      kitchen_capacity,
      max_simultaneous_cooking,
      default_cooking_time,
      temperature_alert_time,
      staff_name,
    } = req.body;

    const settings = [
      {
        name: "kitchen_capacity",
        value: kitchen_capacity,
        type: "number",
        desc: "たこ焼き器の台数",
      },
      {
        name: "max_simultaneous_cooking",
        value: max_simultaneous_cooking,
        type: "number",
        desc: "同時調理可能数",
      },
      {
        name: "default_cooking_time",
        value: default_cooking_time,
        type: "number",
        desc: "標準調理時間（分）",
      },
      {
        name: "temperature_alert_time",
        value: temperature_alert_time,
        type: "number",
        desc: "温度管理アラート時間（分）",
      },
    ].filter((setting) => setting.value !== undefined);

    if (settings.length === 0) {
      res.status(400).json({
        success: false,
        message: "更新する設定項目が指定されていません",
      });
      return;
    }

    // 各設定を更新
    for (const setting of settings) {
      await db.query(
        `INSERT INTO system_settings (setting_name, setting_value, data_type, description)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (setting_name)
         DO UPDATE SET setting_value = $2, updated_at = CURRENT_TIMESTAMP`,
        [setting.name, setting.value.toString(), setting.type, setting.desc]
      );
    }

    // アクティビティログに記録
    await db.query(
      `INSERT INTO activity_logs (action_type, details)
       VALUES ('cooking_settings_update', $1)`,
      [
        JSON.stringify({
          updated_settings: settings,
          staff_name,
          timestamp: new Date(),
        }),
      ]
    );

    // Socket.ioで調理設定変更を通知
    emitSocketNotification("cooking-settings-updated", {
      settings,
      staff_name,
      message: "調理設定が更新されました",
    });

    res.json({
      success: true,
      message: "調理設定が正常に更新されました",
      data: settings,
    });
  } catch (error) {
    console.error("調理設定更新エラー:", error);
    res.status(500).json({
      success: false,
      message: "調理設定の更新に失敗しました",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// 通知設定を更新
export const updateNotificationSettings = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const {
      audio_notifications_enabled,
      notification_volume,
      auto_notifications,
      notification_language,
      staff_name,
    } = req.body;

    const settings = [
      {
        name: "audio_notifications_enabled",
        value: audio_notifications_enabled,
        type: "boolean",
        desc: "音声通知の有効/無効",
      },
      {
        name: "notification_volume",
        value: notification_volume,
        type: "number",
        desc: "通知音量（0-100）",
      },
      {
        name: "auto_notifications",
        value: auto_notifications,
        type: "boolean",
        desc: "自動通知の有効/無効",
      },
      {
        name: "notification_language",
        value: notification_language,
        type: "string",
        desc: "通知言語",
      },
    ].filter((setting) => setting.value !== undefined);

    if (settings.length === 0) {
      res.status(400).json({
        success: false,
        message: "更新する通知設定が指定されていません",
      });
      return;
    }

    // 各設定を更新
    for (const setting of settings) {
      await db.query(
        `INSERT INTO system_settings (setting_name, setting_value, data_type, description)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (setting_name)
         DO UPDATE SET setting_value = $2, updated_at = CURRENT_TIMESTAMP`,
        [setting.name, setting.value.toString(), setting.type, setting.desc]
      );
    }

    // Socket.ioで通知設定変更を通知
    emitSocketNotification("notification-settings-updated", {
      settings,
      staff_name,
      message: "通知設定が更新されました",
    });

    res.json({
      success: true,
      message: "通知設定が正常に更新されました",
      data: settings,
    });
  } catch (error) {
    console.error("通知設定更新エラー:", error);
    res.status(500).json({
      success: false,
      message: "通知設定の更新に失敗しました",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// 日次データリセット
export const resetDailyData = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { confirm_reset, staff_name } = req.body;

    if (!confirm_reset) {
      res.status(400).json({
        success: false,
        message: "データリセットの確認が必要です",
      });
      return;
    }

    await db.query("BEGIN");

    try {
      // 本日の統計情報を保存
      const statsQuery = `
        INSERT INTO activity_logs (action_type, details)
        SELECT
          'daily_stats_backup' as action_type,
          json_build_object(
            'date', CURRENT_DATE,
            'total_orders', COUNT(*),
            'total_revenue', COALESCE(SUM(CASE WHEN payment_status = 'completed' THEN total_amount ELSE 0 END), 0),
            'completed_orders', COUNT(CASE WHEN status = 'completed' THEN 1 END),
            'reset_by', $1,
            'reset_at', CURRENT_TIMESTAMP
          ) as details
        FROM orders
        WHERE DATE(created_at) = CURRENT_DATE
      `;
      await db.query(statsQuery, [staff_name]);

      // 注文データの状態リセット（履歴は保持）
      await db.query(
        `UPDATE orders
         SET status = 'archived'
         WHERE DATE(created_at) = CURRENT_DATE
           AND status IN ('pending', 'preparing', 'ready')`
      );

      // 未確認通知をクリア
      await db.query(
        `UPDATE notifications
         SET is_confirmed = true
         WHERE is_confirmed = false
           AND notification_type NOT IN ('emergency_stop')`
      );

      // 日次カウンターをリセット
      await db.query(
        `UPDATE system_settings
         SET setting_value = '0'
         WHERE setting_name = 'daily_order_count'`
      );

      await db.query("COMMIT");

      // Socket.ioでリセット完了を通知
      emitSocketNotification("daily-data-reset", {
        reset_by: staff_name,
        reset_date: new Date().toISOString().split("T")[0],
        message: "日次データがリセットされました",
      });

      res.json({
        success: true,
        message: "日次データが正常にリセットされました",
        reset_date: new Date().toISOString().split("T")[0],
      });
    } catch (error) {
      await db.query("ROLLBACK");
      throw error;
    }
  } catch (error) {
    console.error("日次データリセットエラー:", error);
    res.status(500).json({
      success: false,
      message: "日次データリセットに失敗しました",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// システムバックアップ用データエクスポート
export const exportSystemData = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { export_type = "daily", staff_name } = req.body;

    let dateFilter = "DATE(created_at) = CURRENT_DATE";
    if (export_type === "weekly") {
      dateFilter = "created_at >= CURRENT_DATE - INTERVAL '7 days'";
    } else if (export_type === "monthly") {
      dateFilter = "created_at >= CURRENT_DATE - INTERVAL '30 days'";
    }

    // 注文データ
    const ordersQuery = `
      SELECT
        o.*,
        json_agg(
          json_build_object(
            'product_name', p.product_name,
            'quantity', oi.quantity,
            'unit_price', oi.unit_price,
            'subtotal', oi.subtotal
          )
        ) as items
      FROM orders o
      LEFT JOIN order_items oi ON o.order_id = oi.order_id
      LEFT JOIN products p ON oi.product_id = p.product_id
      WHERE ${dateFilter}
      GROUP BY o.order_id
      ORDER BY o.created_at
    `;

    // システム設定
    const settingsQuery = `
      SELECT * FROM system_settings
      ORDER BY setting_name
    `;

    // 在庫ログ
    const stockLogsQuery = `
      SELECT sl.*, p.product_name
      FROM stock_logs sl
      LEFT JOIN products p ON sl.product_id = p.product_id
      WHERE ${dateFilter}
      ORDER BY sl.created_at
    `;

    const [ordersResult, settingsResult, stockLogsResult] = await Promise.all([
      db.query(ordersQuery),
      db.query(settingsQuery),
      db.query(stockLogsQuery),
    ]);

    const exportData = {
      export_info: {
        type: export_type,
        generated_at: new Date().toISOString(),
        generated_by: staff_name,
        period: export_type,
      },
      orders: ordersResult.rows,
      settings: settingsResult.rows,
      stock_logs: stockLogsResult.rows,
      summary: {
        total_orders: ordersResult.rows.length,
        total_settings: settingsResult.rows.length,
        total_stock_changes: stockLogsResult.rows.length,
      },
    };

    // エクスポートログを記録
    await db.query(
      `INSERT INTO activity_logs (action_type, details)
       VALUES ('data_export', $1)`,
      [
        JSON.stringify({
          export_type,
          record_count: exportData.summary,
          staff_name,
          timestamp: new Date(),
        }),
      ]
    );

    res.json({
      success: true,
      message: "データエクスポートが完了しました",
      data: exportData,
    });
  } catch (error) {
    console.error("データエクスポートエラー:", error);
    res.status(500).json({
      success: false,
      message: "データエクスポートに失敗しました",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// ヘルパー関数
function getStatusDisplayName(status: string): string {
  const statusMap: Record<string, string> = {
    open: "営業中",
    preparing: "準備中",
    closed: "営業終了",
  };
  return statusMap[status] || status;
}

function getStatusMessage(status: string): string {
  const messageMap: Record<string, string> = {
    open: "営業を開始しました。注文の受付を行います。",
    preparing: "準備中です。少々お待ちください。",
    closed: "本日の営業は終了しました。ありがとうございました。",
  };
  return messageMap[status] || `営業状態が${status}に変更されました。`;
}
