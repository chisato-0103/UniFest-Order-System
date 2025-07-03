import { Request, Response } from "express";
import { db } from "../database/connection";
import { Product, Category, Topping } from "../types/index";
import { Server } from "socket.io";

/**
 * 商品管理コントローラー
 * 商品の取得、作成、更新、削除を管理
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

// 全商品を取得（お客様向け - 有効な商品のみ）
export const getProducts = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const query = `
      SELECT
        p.*,
        c.category_name,
        c.display_order as category_display_order,
        COALESCE(
          JSON_AGG(
            JSON_BUILD_OBJECT(
              'topping_id', t.topping_id,
              'topping_name', t.topping_name,
              'price', t.price
            )
          ) FILTER (WHERE t.topping_id IS NOT NULL),
          '[]'::json
        ) as available_toppings
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.category_id
      LEFT JOIN toppings t ON t.is_active = true
        AND p.product_id = ANY(t.target_product_ids)
      WHERE p.status = '有効'
        AND p.deleted_flag = false
        AND c.is_active = true
      GROUP BY p.product_id, c.category_name, c.display_order
      ORDER BY c.display_order, p.display_order
    `;

    const result = await db.query(query);
    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error("商品取得エラー:", error);
    res.status(500).json({
      success: false,
      message: "商品データの取得に失敗しました",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// 管理者向け - 全商品を取得（無効・削除済み含む）
export const getAllProducts = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const query = `
      SELECT
        p.*,
        c.category_name,
        COALESCE(
          JSON_AGG(
            JSON_BUILD_OBJECT(
              'topping_id', t.topping_id,
              'topping_name', t.topping_name,
              'price', t.price,
              'is_active', t.is_active
            )
          ) FILTER (WHERE t.topping_id IS NOT NULL),
          '[]'::json
        ) as available_toppings
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.category_id
      LEFT JOIN toppings t ON p.product_id = ANY(t.target_product_ids)
      GROUP BY p.product_id, c.category_name, c.display_order
      ORDER BY p.deleted_flag, c.display_order, p.display_order
    `;

    const result = await db.query(query);
    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error("管理者商品取得エラー:", error);
    res.status(500).json({
      success: false,
      message: "商品データの取得に失敗しました",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// 特定商品の詳細を取得
export const getProductById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const query = `
      SELECT
        p.*,
        c.category_name,
        COALESCE(
          JSON_AGG(
            JSON_BUILD_OBJECT(
              'topping_id', t.topping_id,
              'topping_name', t.topping_name,
              'price', t.price
            )
          ) FILTER (WHERE t.topping_id IS NOT NULL AND t.is_active = true),
          '[]'::json
        ) as available_toppings
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.category_id
      LEFT JOIN toppings t ON p.product_id = ANY(t.target_product_ids)
      WHERE p.product_id = $1
      GROUP BY p.product_id, c.category_name, c.display_order
    `;

    const result = await db.query(query, [id]);

    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: "商品が見つかりません",
      });
      return;
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error("商品詳細取得エラー:", error);
    res.status(500).json({
      success: false,
      message: "商品詳細の取得に失敗しました",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// 新商品を作成
export const createProduct = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const {
      product_name,
      price,
      category_id,
      status = "有効",
      image_url,
      description,
      allergy_info,
      cooking_time,
      max_simultaneous_cooking = 1,
      display_order = 0,
      stock_quantity = 0,
      initial_stock = 0,
      low_stock_threshold = 0,
      auto_disable_on_zero = false,
    } = req.body;

    // バリデーション
    if (!product_name || !price || !category_id || !cooking_time) {
      res.status(400).json({
        success: false,
        message: "必須項目が不足しています（商品名、価格、カテゴリ、調理時間）",
      });
      return;
    }

    const query = `
      INSERT INTO products (
        product_name, price, category_id, status, image_url, description,
        allergy_info, cooking_time, max_simultaneous_cooking, display_order,
        stock_quantity, initial_stock, low_stock_threshold, auto_disable_on_zero
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *
    `;

    const values = [
      product_name,
      price,
      category_id,
      status,
      image_url,
      description,
      allergy_info,
      cooking_time,
      max_simultaneous_cooking,
      display_order,
      stock_quantity,
      initial_stock,
      low_stock_threshold,
      auto_disable_on_zero,
    ];

    const result = await db.query(query, values);

    res.status(201).json({
      success: true,
      message: "商品が正常に作成されました",
      data: result.rows[0],
    });

    // 商品作成の通知をSocket.ioで送信
    emitSocketNotification("product_created", result.rows[0]);
  } catch (error) {
    console.error("商品作成エラー:", error);
    res.status(500).json({
      success: false,
      message: "商品の作成に失敗しました",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// 商品情報を更新
export const updateProduct = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const updateFields = req.body;

    // 更新可能なフィールドのホワイトリスト
    const allowedFields = [
      "product_name",
      "price",
      "category_id",
      "status",
      "image_url",
      "description",
      "allergy_info",
      "cooking_time",
      "max_simultaneous_cooking",
      "display_order",
      "stock_quantity",
      "initial_stock",
      "low_stock_threshold",
      "auto_disable_on_zero",
    ];

    const updates = Object.keys(updateFields)
      .filter((key) => allowedFields.includes(key))
      .map((key, index) => `${key} = $${index + 2}`)
      .join(", ");

    if (!updates) {
      res.status(400).json({
        success: false,
        message: "更新する項目がありません",
      });
      return;
    }

    const values = [
      id,
      ...Object.keys(updateFields)
        .filter((key) => allowedFields.includes(key))
        .map((key) => updateFields[key]),
    ];

    const query = `
      UPDATE products
      SET ${updates}, updated_at = CURRENT_TIMESTAMP
      WHERE product_id = $1 AND deleted_flag = false
      RETURNING *
    `;

    const result = await db.query(query, values);

    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: "商品が見つかりません",
      });
      return;
    }

    res.json({
      success: true,
      message: "商品が正常に更新されました",
      data: result.rows[0],
    });

    // 商品更新の通知をSocket.ioで送信
    emitSocketNotification("product_updated", result.rows[0]);
  } catch (error) {
    console.error("商品更新エラー:", error);
    res.status(500).json({
      success: false,
      message: "商品の更新に失敗しました",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// 商品を削除（論理削除）
export const deleteProduct = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    // 注文履歴がある場合は論理削除のみ
    const query = `
      UPDATE products
      SET deleted_flag = true, status = '無効', updated_at = CURRENT_TIMESTAMP
      WHERE product_id = $1
      RETURNING *
    `;

    const result = await db.query(query, [id]);

    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: "商品が見つかりません",
      });
      return;
    }

    res.json({
      success: true,
      message: "商品が正常に削除されました",
      data: result.rows[0],
    });

    // 商品削除の通知をSocket.ioで送信
    emitSocketNotification("product_deleted", result.rows[0]);
  } catch (error) {
    console.error("商品削除エラー:", error);
    res.status(500).json({
      success: false,
      message: "商品の削除に失敗しました",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// 在庫更新
export const updateStock = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { stock_quantity, operation } = req.body; // operation: 'set', 'add', 'subtract'

    let query: string;
    let values: any[];

    switch (operation) {
      case "set":
        query = `
          UPDATE products
          SET stock_quantity = $2, updated_at = CURRENT_TIMESTAMP
          WHERE product_id = $1 AND deleted_flag = false
          RETURNING *
        `;
        values = [id, stock_quantity];
        break;
      case "add":
        query = `
          UPDATE products
          SET stock_quantity = stock_quantity + $2, updated_at = CURRENT_TIMESTAMP
          WHERE product_id = $1 AND deleted_flag = false
          RETURNING *
        `;
        values = [id, stock_quantity];
        break;
      case "subtract":
        query = `
          UPDATE products
          SET stock_quantity = GREATEST(0, stock_quantity - $2), updated_at = CURRENT_TIMESTAMP
          WHERE product_id = $1 AND deleted_flag = false
          RETURNING *
        `;
        values = [id, stock_quantity];
        break;
      default:
        res.status(400).json({
          success: false,
          message:
            "無効な操作です（set, add, subtract のいずれかを指定してください）",
        });
        return;
    }

    const result = await db.query(query, values);

    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: "商品が見つかりません",
      });
      return;
    }

    const product = result.rows[0];

    // 在庫が閾値を下回った場合の自動無効化チェック
    if (
      product.auto_disable_on_zero &&
      product.stock_quantity <= product.low_stock_threshold
    ) {
      await db.query(
        `UPDATE products SET status = '売り切れ' WHERE product_id = $1`,
        [id]
      );
      product.status = "売り切れ";
    }

    res.json({
      success: true,
      message: "在庫が正常に更新されました",
      data: product,
    });
  } catch (error) {
    console.error("在庫更新エラー:", error);
    res.status(500).json({
      success: false,
      message: "在庫の更新に失敗しました",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// 商品の一括価格更新
export const bulkUpdatePrices = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { updates } = req.body; // [{ product_id, price }, ...]

    if (!Array.isArray(updates) || updates.length === 0) {
      res.status(400).json({
        success: false,
        message: "更新データが正しくありません",
      });
      return;
    }

    const client = await db.getClient();
    try {
      await client.query("BEGIN");

      const results = [];
      for (const update of updates) {
        const { product_id, price } = update;
        const result = await client.query(
          `UPDATE products SET price = $2, updated_at = CURRENT_TIMESTAMP
           WHERE product_id = $1 AND deleted_flag = false RETURNING *`,
          [product_id, price]
        );
        if (result.rows.length > 0) {
          results.push(result.rows[0]);
        }
      }

      await client.query("COMMIT");

      res.json({
        success: true,
        message: `${results.length}件の商品価格が更新されました`,
        data: results,
      });
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("一括価格更新エラー:", error);
    res.status(500).json({
      success: false,
      message: "価格の一括更新に失敗しました",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
