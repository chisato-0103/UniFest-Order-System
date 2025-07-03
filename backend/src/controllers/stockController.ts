import { Request, Response } from "express";
import { db } from "../database/connection";
import { Server } from "socket.io";

/**
 * 在庫管理コントローラー
 * 在庫の更新、アラート、ログ管理を行う
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

// 全商品の在庫状況を取得
export const getStockStatus = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const query = `
      SELECT
        p.product_id,
        p.product_name,
        p.stock_quantity,
        p.initial_stock,
        p.low_stock_threshold,
        p.auto_disable_on_zero,
        c.category_name,
        CASE
          WHEN p.stock_quantity = 0 THEN '在庫なし'
          WHEN p.stock_quantity <= p.low_stock_threshold THEN '在庫少'
          ELSE '在庫あり'
        END as status,
        ROUND((p.stock_quantity::DECIMAL / NULLIF(p.initial_stock, 0)) * 100, 2) as stock_percentage
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.category_id
      WHERE p.deleted_flag = false
      ORDER BY
        CASE
          WHEN p.stock_quantity = 0 THEN 1
          WHEN p.stock_quantity <= p.low_stock_threshold THEN 2
          ELSE 3
        END,
        c.display_order,
        p.display_order
    `;

    const result = await db.query(query);

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error("在庫状況取得エラー:", error);
    res.status(500).json({
      success: false,
      message: "在庫状況の取得に失敗しました",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// 在庫を更新
export const updateStock = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { product_id } = req.params;
    const { change_type, quantity, reason, staff_name } = req.body;

    // バリデーション
    if (!change_type || quantity === undefined) {
      res.status(400).json({
        success: false,
        message: "変更タイプと数量は必須です",
      });
      return;
    }

    if (!["increase", "decrease", "set", "adjust"].includes(change_type)) {
      res.status(400).json({
        success: false,
        message: "無効な変更タイプです",
      });
      return;
    }

    // 現在の在庫を取得
    const currentStockQuery = `
      SELECT stock_quantity, product_name, low_stock_threshold, auto_disable_on_zero
      FROM products
      WHERE product_id = $1 AND deleted_flag = false
    `;
    const currentStockResult = await db.query(currentStockQuery, [product_id]);

    if (currentStockResult.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: "商品が見つかりません",
      });
      return;
    }

    const currentStock = currentStockResult.rows[0];
    let newQuantity: number;

    // 新しい在庫数を計算
    switch (change_type) {
      case "increase":
        newQuantity = currentStock.stock_quantity + quantity;
        break;
      case "decrease":
        newQuantity = Math.max(0, currentStock.stock_quantity - quantity);
        break;
      case "set":
        newQuantity = Math.max(0, quantity);
        break;
      case "adjust":
        newQuantity = Math.max(0, currentStock.stock_quantity + quantity);
        break;
      default:
        newQuantity = currentStock.stock_quantity;
    }

    // トランザクション開始
    await db.query("BEGIN");

    try {
      // 在庫を更新
      const updateQuery = `
        UPDATE products
        SET
          stock_quantity = $1,
          updated_at = CURRENT_TIMESTAMP
        WHERE product_id = $2
        RETURNING *
      `;
      const updateResult = await db.query(updateQuery, [
        newQuantity,
        product_id,
      ]);

      // 在庫ログを記録
      const logQuery = `
        INSERT INTO stock_logs (
          product_id,
          change_type,
          quantity_before,
          quantity_change,
          quantity_after,
          reason,
          staff_name
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `;

      const quantityChange = newQuantity - currentStock.stock_quantity;
      const logResult = await db.query(logQuery, [
        product_id,
        change_type,
        currentStock.stock_quantity,
        quantityChange,
        newQuantity,
        reason || "手動更新",
        staff_name || "システム",
      ]);

      // 在庫がゼロになった場合の自動無効化
      if (newQuantity === 0 && currentStock.auto_disable_on_zero) {
        await db.query(
          `UPDATE products SET status = '売り切れ' WHERE product_id = $1`,
          [product_id]
        );
      }

      // 在庫が復活した場合の自動有効化
      if (newQuantity > 0 && currentStock.stock_quantity === 0) {
        await db.query(
          `UPDATE products SET status = '有効' WHERE product_id = $1`,
          [product_id]
        );
      }

      await db.query("COMMIT");

      // Socket.ioで在庫更新を通知
      emitSocketNotification("stock-updated", {
        product_id: parseInt(product_id),
        product_name: currentStock.product_name,
        previous_quantity: currentStock.stock_quantity,
        new_quantity: newQuantity,
        change_type,
        quantity_change: quantityChange,
        reason,
        staff_name,
      });

      // 在庫アラートチェック
      if (newQuantity <= currentStock.low_stock_threshold) {
        const alertSeverity = newQuantity === 0 ? "critical" : "warning";

        emitSocketNotification("stock-alert", {
          product_id: parseInt(product_id),
          product_name: currentStock.product_name,
          current_quantity: newQuantity,
          threshold: currentStock.low_stock_threshold,
          severity: alertSeverity,
          message:
            newQuantity === 0
              ? `${currentStock.product_name}の在庫が切れました`
              : `${currentStock.product_name}の在庫が少なくなっています（残り${newQuantity}個）`,
        });
      }

      res.json({
        success: true,
        message: "在庫が正常に更新されました",
        data: {
          product: updateResult.rows[0],
          stock_log: logResult.rows[0],
          alert: newQuantity <= currentStock.low_stock_threshold,
        },
      });
    } catch (error) {
      await db.query("ROLLBACK");
      throw error;
    }
  } catch (error) {
    console.error("在庫更新エラー:", error);
    res.status(500).json({
      success: false,
      message: "在庫の更新に失敗しました",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// 在庫ログを取得
export const getStockLogs = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { product_id } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    let whereClause = "";
    const params: any[] = [];

    if (product_id) {
      whereClause = "WHERE sl.product_id = $1";
      params.push(product_id);
    }

    params.push(Number(limit), Number(offset));
    const limitIndex = params.length - 1;
    const offsetIndex = params.length;

    const query = `
      SELECT
        sl.*,
        p.product_name,
        c.category_name
      FROM stock_logs sl
      LEFT JOIN products p ON sl.product_id = p.product_id
      LEFT JOIN categories c ON p.category_id = c.category_id
      ${whereClause}
      ORDER BY sl.created_at DESC
      LIMIT $${limitIndex} OFFSET $${offsetIndex}
    `;

    const result = await db.query(query, params);

    // 総件数も取得
    const countQuery = `
      SELECT COUNT(*) as total
      FROM stock_logs sl
      LEFT JOIN products p ON sl.product_id = p.product_id
      ${whereClause}
    `;
    const countParams = product_id ? [product_id] : [];
    const countResult = await db.query(countQuery, countParams);

    res.json({
      success: true,
      data: result.rows,
      pagination: {
        total: parseInt(countResult.rows[0].total),
        limit: Number(limit),
        offset: Number(offset),
      },
    });
  } catch (error) {
    console.error("在庫ログ取得エラー:", error);
    res.status(500).json({
      success: false,
      message: "在庫ログの取得に失敗しました",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// 在庫アラートを取得
export const getStockAlerts = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const query = `
      SELECT
        p.product_id,
        p.product_name,
        p.stock_quantity,
        p.low_stock_threshold,
        c.category_name,
        CASE
          WHEN p.stock_quantity = 0 THEN 'critical'
          WHEN p.stock_quantity <= p.low_stock_threshold THEN 'warning'
          ELSE 'normal'
        END as severity
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.category_id
      WHERE p.deleted_flag = false
        AND p.stock_quantity <= p.low_stock_threshold
      ORDER BY
        CASE
          WHEN p.stock_quantity = 0 THEN 1
          ELSE 2
        END,
        p.stock_quantity ASC
    `;

    const result = await db.query(query);

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error("在庫アラート取得エラー:", error);
    res.status(500).json({
      success: false,
      message: "在庫アラートの取得に失敗しました",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// 在庫を一括設定
export const bulkUpdateStock = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { updates, staff_name } = req.body;

    if (!Array.isArray(updates) || updates.length === 0) {
      res.status(400).json({
        success: false,
        message: "更新データが必要です",
      });
      return;
    }

    await db.query("BEGIN");

    try {
      const results = [];

      for (const update of updates) {
        const { product_id, stock_quantity, reason } = update;

        // 現在の在庫を取得
        const currentResult = await db.query(
          `SELECT stock_quantity, product_name FROM products WHERE product_id = $1`,
          [product_id]
        );

        if (currentResult.rows.length === 0) {
          continue; // 商品が見つからない場合はスキップ
        }

        const previousQuantity = currentResult.rows[0].stock_quantity;
        const newQuantity = Math.max(0, stock_quantity);

        // 在庫を更新
        await db.query(
          `UPDATE products SET stock_quantity = $1, updated_at = CURRENT_TIMESTAMP WHERE product_id = $2`,
          [newQuantity, product_id]
        );

        // ログを記録
        await db.query(
          `INSERT INTO stock_logs (product_id, change_type, quantity_before, quantity_change, quantity_after, reason, staff_name)
           VALUES ($1, 'set', $2, $3, $4, $5, $6)`,
          [
            product_id,
            previousQuantity,
            newQuantity - previousQuantity,
            newQuantity,
            reason || "一括更新",
            staff_name || "システム",
          ]
        );

        results.push({
          product_id,
          product_name: currentResult.rows[0].product_name,
          previous_quantity: previousQuantity,
          new_quantity: newQuantity,
        });
      }

      await db.query("COMMIT");

      // Socket.ioで一括在庫更新を通知
      emitSocketNotification("bulk-stock-updated", {
        updates: results,
        staff_name,
        count: results.length,
      });

      res.json({
        success: true,
        message: `${results.length}件の商品在庫が更新されました`,
        data: results,
      });
    } catch (error) {
      await db.query("ROLLBACK");
      throw error;
    }
  } catch (error) {
    console.error("一括在庫更新エラー:", error);
    res.status(500).json({
      success: false,
      message: "一括在庫更新に失敗しました",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// 在庫統計を取得
export const getStockStatistics = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const query = `
      SELECT
        COUNT(*) as total_products,
        COUNT(CASE WHEN stock_quantity = 0 THEN 1 END) as out_of_stock,
        COUNT(CASE WHEN stock_quantity > 0 AND stock_quantity <= low_stock_threshold THEN 1 END) as low_stock,
        COUNT(CASE WHEN stock_quantity > low_stock_threshold THEN 1 END) as normal_stock,
        ROUND(AVG(stock_quantity), 2) as average_stock,
        SUM(stock_quantity) as total_stock_quantity,
        SUM(initial_stock) as total_initial_stock
      FROM products
      WHERE deleted_flag = false
    `;

    const result = await db.query(query);
    const stats = result.rows[0];

    // 最近の在庫変動も取得
    const recentChangesQuery = `
      SELECT
        sl.change_type,
        COUNT(*) as count,
        SUM(ABS(sl.quantity_change)) as total_change
      FROM stock_logs sl
      WHERE sl.created_at >= CURRENT_DATE
      GROUP BY sl.change_type
    `;

    const recentChangesResult = await db.query(recentChangesQuery);

    res.json({
      success: true,
      data: {
        overview: stats,
        recent_changes: recentChangesResult.rows,
      },
    });
  } catch (error) {
    console.error("在庫統計取得エラー:", error);
    res.status(500).json({
      success: false,
      message: "在庫統計の取得に失敗しました",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
