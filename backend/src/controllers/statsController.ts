import { Request, Response } from "express";
import { db } from "../database/connection";
import { Server } from "socket.io";

/**
 * 統計・監視コントローラー
 * リアルタイム統計、ダッシュボードデータ、監視情報を管理
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

// リアルタイム統計を取得
export const getRealtimeStats = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // 本日の注文統計
    const orderStatsQuery = `
      SELECT
        COUNT(*) as total_orders,
        COUNT(CASE WHEN status IN ('pending', 'preparing') THEN 1 END) as pending_orders,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_orders,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_orders,
        COALESCE(SUM(CASE WHEN payment_status = 'completed' THEN total_amount ELSE 0 END), 0) as total_revenue,
        COALESCE(AVG(CASE WHEN status = 'completed' THEN total_amount END), 0) as average_order_value
      FROM orders
      WHERE DATE(created_at) = CURRENT_DATE
    `;

    // 商品別売上統計
    const productStatsQuery = `
      SELECT
        p.product_name,
        COUNT(oi.order_item_id) as orders_count,
        SUM(oi.quantity) as total_quantity,
        SUM(oi.total_price) as total_revenue
      FROM order_items oi
      JOIN products p ON oi.product_id = p.product_id
      JOIN orders o ON oi.order_id = o.order_id
      WHERE DATE(o.created_at) = CURRENT_DATE
        AND o.payment_status = 'completed'
      GROUP BY p.product_id, p.product_name
      ORDER BY total_revenue DESC
      LIMIT 10
    `;

    // 在庫アラート統計
    const stockAlertsQuery = `
      SELECT
        COUNT(CASE WHEN stock_quantity = 0 THEN 1 END) as out_of_stock,
        COUNT(CASE WHEN stock_quantity > 0 AND stock_quantity <= low_stock_threshold THEN 1 END) as low_stock,
        COUNT(CASE WHEN stock_quantity > low_stock_threshold THEN 1 END) as normal_stock
      FROM products
      WHERE deleted_flag = false
    `;

    // 時間別注文統計（今日）
    const hourlyStatsQuery = `
      SELECT
        EXTRACT(HOUR FROM created_at) as hour,
        COUNT(*) as order_count,
        COALESCE(SUM(CASE WHEN payment_status = 'completed' THEN total_amount ELSE 0 END), 0) as revenue
      FROM orders
      WHERE DATE(created_at) = CURRENT_DATE
      GROUP BY EXTRACT(HOUR FROM created_at)
      ORDER BY hour
    `;

    // 調理パフォーマンス統計
    const cookingStatsQuery = `
      SELECT
        COUNT(*) as cooking_sessions,
        COALESCE(AVG(actual_time), 0) as average_cooking_time,
        COALESCE(MIN(actual_time), 0) as min_cooking_time,
        COALESCE(MAX(actual_time), 0) as max_cooking_time,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_count
      FROM cooking_logs
      WHERE DATE(created_at) = CURRENT_DATE
        AND actual_time IS NOT NULL
    `;

    const [orderStats, productStats, stockAlerts, hourlyStats, cookingStats] =
      await Promise.all([
        db.query(orderStatsQuery),
        db.query(productStatsQuery),
        db.query(stockAlertsQuery),
        db.query(hourlyStatsQuery),
        db.query(cookingStatsQuery),
      ]);

    const stats = {
      orders: orderStats.rows[0],
      products: productStats.rows,
      stock: stockAlerts.rows[0],
      hourly: hourlyStats.rows,
      cooking: cookingStats.rows[0],
      last_updated: new Date().toISOString(),
    };

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("リアルタイム統計取得エラー:", error);
    res.status(500).json({
      success: false,
      message: "統計データの取得に失敗しました",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// 監視ダッシュボード用データを取得
export const getDashboardData = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // 注文キュー状況
    const queueStatusQuery = `
      SELECT
        status,
        COUNT(*) as count,
        COALESCE(AVG(EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - created_at))/60), 0) as avg_wait_time
      FROM orders
      WHERE status IN ('pending', 'preparing', 'ready')
      GROUP BY status
    `;

    // 厨房の調理状況
    const kitchenStatusQuery = `
      SELECT
        COUNT(CASE WHEN status = 'started' THEN 1 END) as cooking_count,
        COUNT(CASE WHEN status = 'completed' AND DATE(created_at) = CURRENT_DATE THEN 1 END) as completed_today,
        COALESCE(AVG(CASE WHEN actual_time IS NOT NULL THEN actual_time END), 0) as avg_cooking_time
      FROM cooking_logs
      WHERE DATE(created_at) = CURRENT_DATE
    `;

    // 緊急アラート
    const emergencyAlertsQuery = `
      SELECT
        event_type,
        severity,
        description,
        status,
        created_at
      FROM emergency_logs
      WHERE status = 'active'
      ORDER BY severity DESC, created_at DESC
      LIMIT 5
    `;

    // システム設定
    const systemSettingsQuery = `
      SELECT
        setting_name,
        setting_value,
        data_type
      FROM system_settings
      WHERE setting_name IN ('emergency_mode', 'store_open', 'max_orders_per_hour')
    `;

    const [queueStatus, kitchenStatus, emergencyAlerts, systemSettings] =
      await Promise.all([
        db.query(queueStatusQuery),
        db.query(kitchenStatusQuery),
        db.query(emergencyAlertsQuery),
        db.query(systemSettingsQuery),
      ]);

    const dashboardData = {
      queue: queueStatus.rows,
      kitchen: kitchenStatus.rows[0] || {},
      alerts: emergencyAlerts.rows,
      settings: systemSettings.rows.reduce(
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
        {} as Record<string, any>
      ),
      last_updated: new Date().toISOString(),
    };

    res.json({
      success: true,
      data: dashboardData,
    });
  } catch (error) {
    console.error("ダッシュボードデータ取得エラー:", error);
    res.status(500).json({
      success: false,
      message: "ダッシュボードデータの取得に失敗しました",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// 売上レポートを取得
export const getSalesReport = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { start_date, end_date, group_by = "day" } = req.query;

    let dateFilter = "DATE(o.created_at) = CURRENT_DATE";
    const params: any[] = [];

    if (start_date && end_date) {
      dateFilter = "DATE(o.created_at) BETWEEN $1 AND $2";
      params.push(start_date, end_date);
    }

    let groupByClause = "DATE(o.created_at)";
    let selectClause = "DATE(o.created_at) as date";

    if (group_by === "hour") {
      groupByClause = "DATE(o.created_at), EXTRACT(HOUR FROM o.created_at)";
      selectClause =
        "DATE(o.created_at) as date, EXTRACT(HOUR FROM o.created_at) as hour";
    } else if (group_by === "week") {
      groupByClause = "DATE_TRUNC('week', o.created_at)";
      selectClause = "DATE_TRUNC('week', o.created_at) as week";
    } else if (group_by === "month") {
      groupByClause = "DATE_TRUNC('month', o.created_at)";
      selectClause = "DATE_TRUNC('month', o.created_at) as month";
    }

    const salesQuery = `
      SELECT
        ${selectClause},
        COUNT(*) as total_orders,
        COUNT(CASE WHEN o.payment_status = 'completed' THEN 1 END) as paid_orders,
        COALESCE(SUM(CASE WHEN o.payment_status = 'completed' THEN o.total_amount ELSE 0 END), 0) as total_revenue,
        COALESCE(AVG(CASE WHEN o.payment_status = 'completed' THEN o.total_amount END), 0) as average_order_value,
        COUNT(CASE WHEN o.status = 'cancelled' THEN 1 END) as cancelled_orders
      FROM orders o
      WHERE ${dateFilter}
      GROUP BY ${groupByClause}
      ORDER BY ${groupByClause}
    `;

    const result = await db.query(salesQuery, params);

    res.json({
      success: true,
      data: result.rows,
      filters: {
        start_date,
        end_date,
        group_by,
      },
    });
  } catch (error) {
    console.error("売上レポート取得エラー:", error);
    res.status(500).json({
      success: false,
      message: "売上レポートの取得に失敗しました",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// 商品パフォーマンスレポートを取得
export const getProductPerformance = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { start_date, end_date, limit = 20 } = req.query;

    let dateFilter = "DATE(o.created_at) = CURRENT_DATE";
    const params: any[] = [];

    if (start_date && end_date) {
      dateFilter = "DATE(o.created_at) BETWEEN $1 AND $2";
      params.push(start_date, end_date);
    }

    params.push(Number(limit));
    const limitIndex = params.length;

    const performanceQuery = `
      SELECT
        p.product_id,
        p.product_name,
        c.category_name,
        COUNT(oi.order_item_id) as order_count,
        SUM(oi.quantity) as total_quantity_sold,
        COALESCE(SUM(CASE WHEN o.payment_status = 'completed' THEN oi.subtotal ELSE 0 END), 0) as total_revenue,
        COALESCE(AVG(CASE WHEN o.payment_status = 'completed' THEN oi.subtotal / oi.quantity END), 0) as avg_unit_price,
        p.stock_quantity as current_stock,
        p.initial_stock - p.stock_quantity as stock_consumed,
        ROUND(
          (p.initial_stock - p.stock_quantity)::DECIMAL / NULLIF(p.initial_stock, 0) * 100,
          2
        ) as stock_consumption_rate
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.category_id
      LEFT JOIN order_items oi ON p.product_id = oi.product_id
      LEFT JOIN orders o ON oi.order_id = o.order_id AND ${dateFilter}
      WHERE p.deleted_flag = false
      GROUP BY p.product_id, p.product_name, c.category_name, p.stock_quantity, p.initial_stock
      ORDER BY total_revenue DESC, total_quantity_sold DESC
      LIMIT $${limitIndex}
    `;

    const result = await db.query(performanceQuery, params);

    res.json({
      success: true,
      data: result.rows,
      filters: {
        start_date,
        end_date,
        limit,
      },
    });
  } catch (error) {
    console.error("商品パフォーマンス取得エラー:", error);
    res.status(500).json({
      success: false,
      message: "商品パフォーマンスの取得に失敗しました",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// 調理パフォーマンスレポートを取得
export const getCookingPerformance = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { start_date, end_date } = req.query;

    let dateFilter = "DATE(cl.created_at) = CURRENT_DATE";
    const params: any[] = [];

    if (start_date && end_date) {
      dateFilter = "DATE(cl.created_at) BETWEEN $1 AND $2";
      params.push(start_date, end_date);
    }

    const performanceQuery = `
      SELECT
        cl.staff_name,
        COUNT(*) as total_sessions,
        COUNT(CASE WHEN cl.status = 'completed' THEN 1 END) as completed_sessions,
        COALESCE(AVG(cl.actual_time), 0) as avg_cooking_time,
        COALESCE(MIN(cl.actual_time), 0) as min_cooking_time,
        COALESCE(MAX(cl.actual_time), 0) as max_cooking_time,
        ROUND(
          COUNT(CASE WHEN cl.status = 'completed' THEN 1 END)::DECIMAL / COUNT(*) * 100,
          2
        ) as completion_rate
      FROM cooking_logs cl
      WHERE ${dateFilter}
        AND cl.staff_name IS NOT NULL
      GROUP BY cl.staff_name
      ORDER BY completion_rate DESC, avg_cooking_time ASC
    `;

    const result = await db.query(performanceQuery, params);

    res.json({
      success: true,
      data: result.rows,
      filters: {
        start_date,
        end_date,
      },
    });
  } catch (error) {
    console.error("調理パフォーマンス取得エラー:", error);
    res.status(500).json({
      success: false,
      message: "調理パフォーマンスの取得に失敗しました",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// 統計データを定期的にブロードキャスト
export const broadcastStats = async () => {
  try {
    // リアルタイム統計を取得
    const orderStatsQuery = `
      SELECT
        COUNT(*) as total_orders,
        COUNT(CASE WHEN status IN ('pending', 'preparing') THEN 1 END) as pending_orders,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_orders,
        COALESCE(SUM(CASE WHEN payment_status = 'completed' THEN total_amount ELSE 0 END), 0) as total_revenue
      FROM orders
      WHERE DATE(created_at) = CURRENT_DATE
    `;

    const result = await db.query(orderStatsQuery);
    const stats = result.rows[0];

    // Socket.ioで統計をブロードキャスト
    emitSocketNotification("stats-broadcast", {
      ...stats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("統計ブロードキャストエラー:", error);
  }
};

// 定期的な統計ブロードキャストを開始
let statsInterval: NodeJS.Timeout | null = null;

export const startStatsPolling = (intervalMs: number = 30000) => {
  if (statsInterval) {
    clearInterval(statsInterval);
  }

  statsInterval = setInterval(broadcastStats, intervalMs);
  console.log(`📊 Stats polling started (interval: ${intervalMs}ms)`);
};

export const stopStatsPolling = () => {
  if (statsInterval) {
    clearInterval(statsInterval);
    statsInterval = null;
    console.log("📊 Stats polling stopped");
  }
};
