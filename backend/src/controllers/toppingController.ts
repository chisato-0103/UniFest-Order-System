import { Request, Response } from "express";
import { db } from "../database/connection";
import { Topping } from "../types/index";
import { Server } from "socket.io";

/**
 * トッピング管理コントローラー
 * トッピングの取得、作成、更新、削除を管理
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

// 全トッピングを取得（有効なもののみ）
export const getToppings = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const query = `
      SELECT *
      FROM toppings
      WHERE is_active = true
      ORDER BY display_order, topping_id
    `;

    const result = await db.query(query);
    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error("トッピング取得エラー:", error);
    res.status(500).json({
      success: false,
      message: "トッピングデータの取得に失敗しました",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// 管理者向け - 全トッピングを取得（無効含む）
export const getAllToppings = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const query = `
      SELECT
        t.*,
        ARRAY(
          SELECT product_name
          FROM products p
          WHERE p.product_id = ANY(t.target_product_ids)
          AND p.deleted_flag = false
        ) as target_product_names
      FROM toppings t
      ORDER BY t.display_order, t.topping_id
    `;

    const result = await db.query(query);
    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error("管理者トッピング取得エラー:", error);
    res.status(500).json({
      success: false,
      message: "トッピングデータの取得に失敗しました",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// 特定商品で利用可能なトッピングを取得
export const getToppingsForProduct = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { productId } = req.params;

    const query = `
      SELECT *
      FROM toppings
      WHERE is_active = true
      AND $1 = ANY(target_product_ids)
      ORDER BY display_order, topping_id
    `;

    const result = await db.query(query, [parseInt(productId)]);
    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error("商品別トッピング取得エラー:", error);
    res.status(500).json({
      success: false,
      message: "トッピングデータの取得に失敗しました",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// 特定トッピングの詳細を取得
export const getToppingById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    const query = `
      SELECT
        t.*,
        ARRAY(
          SELECT product_name
          FROM products p
          WHERE p.product_id = ANY(t.target_product_ids)
          AND p.deleted_flag = false
        ) as target_product_names
      FROM toppings t
      WHERE t.topping_id = $1
    `;

    const result = await db.query(query, [id]);

    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: "トッピングが見つかりません",
      });
      return;
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error("トッピング詳細取得エラー:", error);
    res.status(500).json({
      success: false,
      message: "トッピング詳細の取得に失敗しました",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// 新トッピングを作成
export const createTopping = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const {
      topping_name,
      price = 0,
      is_active = true,
      target_product_ids = [],
      display_order = 0,
    } = req.body;

    // バリデーション
    if (!topping_name) {
      res.status(400).json({
        success: false,
        message: "トッピング名が必要です",
      });
      return;
    }

    if (price < 0) {
      res.status(400).json({
        success: false,
        message: "価格は0以上である必要があります",
      });
      return;
    }

    // 対象商品IDの存在確認
    if (target_product_ids.length > 0) {
      const productQuery = `
        SELECT COUNT(*) as count FROM products
        WHERE product_id = ANY($1) AND deleted_flag = false
      `;
      const productResult = await db.query(productQuery, [target_product_ids]);

      if (parseInt(productResult.rows[0].count) !== target_product_ids.length) {
        res.status(400).json({
          success: false,
          message: "指定された商品の一部が存在しません",
        });
        return;
      }
    }

    const query = `
      INSERT INTO toppings (
        topping_name, price, is_active, target_product_ids, display_order
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;

    const result = await db.query(query, [
      topping_name,
      price,
      is_active,
      target_product_ids,
      display_order,
    ]);

    // Socket.io通知
    emitSocketNotification("toppingCreated", result.rows[0]);

    res.status(201).json({
      success: true,
      message: "トッピングが正常に作成されました",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("トッピング作成エラー:", error);
    res.status(500).json({
      success: false,
      message: "トッピングの作成に失敗しました",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// トッピング情報を更新
export const updateTopping = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const updateFields = req.body;

    // 更新可能なフィールドのホワイトリスト
    const allowedFields = [
      "topping_name",
      "price",
      "is_active",
      "target_product_ids",
      "display_order",
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

    // 価格のバリデーション
    if (updateFields.price !== undefined && updateFields.price < 0) {
      res.status(400).json({
        success: false,
        message: "価格は0以上である必要があります",
      });
      return;
    }

    // 対象商品IDの存在確認
    if (
      updateFields.target_product_ids &&
      updateFields.target_product_ids.length > 0
    ) {
      const productQuery = `
        SELECT COUNT(*) as count FROM products
        WHERE product_id = ANY($1) AND deleted_flag = false
      `;
      const productResult = await db.query(productQuery, [
        updateFields.target_product_ids,
      ]);

      if (
        parseInt(productResult.rows[0].count) !==
        updateFields.target_product_ids.length
      ) {
        res.status(400).json({
          success: false,
          message: "指定された商品の一部が存在しません",
        });
        return;
      }
    }

    const values = [
      id,
      ...Object.keys(updateFields)
        .filter((key) => allowedFields.includes(key))
        .map((key) => updateFields[key]),
    ];

    const query = `
      UPDATE toppings
      SET ${updates}, updated_at = CURRENT_TIMESTAMP
      WHERE topping_id = $1
      RETURNING *
    `;

    const result = await db.query(query, values);

    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: "トッピングが見つかりません",
      });
      return;
    }

    // Socket.io通知
    emitSocketNotification("toppingUpdated", result.rows[0]);

    res.json({
      success: true,
      message: "トッピングが正常に更新されました",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("トッピング更新エラー:", error);
    res.status(500).json({
      success: false,
      message: "トッピングの更新に失敗しました",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// トッピングを削除
export const deleteTopping = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    const query = `
      DELETE FROM toppings WHERE topping_id = $1
      RETURNING *
    `;

    const result = await db.query(query, [id]);

    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: "トッピングが見つかりません",
      });
      return;
    }

    // Socket.io通知
    emitSocketNotification("toppingDeleted", result.rows[0]);

    res.json({
      success: true,
      message: "トッピングが正常に削除されました",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("トッピング削除エラー:", error);
    res.status(500).json({
      success: false,
      message: "トッピングの削除に失敗しました",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
