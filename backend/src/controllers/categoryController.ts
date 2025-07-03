import { Request, Response } from "express";
import { db } from "../database/connection";
import { Category } from "../types/index";
import { Server } from "socket.io";

/**
 * カテゴリ管理コントローラー
 * 商品カテゴリの取得、作成、更新、削除を管理
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

// 全カテゴリを取得（有効なもののみ）
export const getCategories = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const query = `
      SELECT *
      FROM categories
      WHERE is_active = true
      ORDER BY display_order, category_id
    `;

    const result = await db.query(query);
    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error("カテゴリ取得エラー:", error);
    res.status(500).json({
      success: false,
      message: "カテゴリデータの取得に失敗しました",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// 管理者向け - 全カテゴリを取得（無効含む）
export const getAllCategories = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const query = `
      SELECT
        c.*,
        COUNT(p.product_id) as product_count
      FROM categories c
      LEFT JOIN products p ON c.category_id = p.category_id AND p.deleted_flag = false
      GROUP BY c.category_id
      ORDER BY c.display_order, c.category_id
    `;

    const result = await db.query(query);
    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error("管理者カテゴリ取得エラー:", error);
    res.status(500).json({
      success: false,
      message: "カテゴリデータの取得に失敗しました",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// 特定カテゴリの詳細を取得
export const getCategoryById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    const query = `
      SELECT
        c.*,
        COUNT(p.product_id) as product_count
      FROM categories c
      LEFT JOIN products p ON c.category_id = p.category_id AND p.deleted_flag = false
      WHERE c.category_id = $1
      GROUP BY c.category_id
    `;

    const result = await db.query(query, [id]);

    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: "カテゴリが見つかりません",
      });
      return;
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error("カテゴリ詳細取得エラー:", error);
    res.status(500).json({
      success: false,
      message: "カテゴリ詳細の取得に失敗しました",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// 新カテゴリを作成
export const createCategory = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { category_name, display_order = 0, is_active = true } = req.body;

    // バリデーション
    if (!category_name) {
      res.status(400).json({
        success: false,
        message: "カテゴリ名が必要です",
      });
      return;
    }

    // 重複チェック
    const existingQuery = `
      SELECT category_id FROM categories WHERE category_name = $1
    `;
    const existingResult = await db.query(existingQuery, [category_name]);

    if (existingResult.rows.length > 0) {
      res.status(400).json({
        success: false,
        message: "同じ名前のカテゴリが既に存在します",
      });
      return;
    }

    const query = `
      INSERT INTO categories (category_name, display_order, is_active)
      VALUES ($1, $2, $3)
      RETURNING *
    `;

    const result = await db.query(query, [
      category_name,
      display_order,
      is_active,
    ]);

    res.status(201).json({
      success: true,
      message: "カテゴリが正常に作成されました",
      data: result.rows[0],
    });

    // カテゴリ作成の通知を送信
    emitSocketNotification("categoryCreated", result.rows[0]);
  } catch (error) {
    console.error("カテゴリ作成エラー:", error);
    res.status(500).json({
      success: false,
      message: "カテゴリの作成に失敗しました",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// カテゴリ情報を更新
export const updateCategory = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const updateFields = req.body;

    // 更新可能なフィールドのホワイトリスト
    const allowedFields = ["category_name", "display_order", "is_active"];

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

    // 名前の重複チェック（自分以外）
    if (updateFields.category_name) {
      const duplicateQuery = `
        SELECT category_id FROM categories
        WHERE category_name = $1 AND category_id != $2
      `;
      const duplicateResult = await db.query(duplicateQuery, [
        updateFields.category_name,
        id,
      ]);

      if (duplicateResult.rows.length > 0) {
        res.status(400).json({
          success: false,
          message: "同じ名前のカテゴリが既に存在します",
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
      UPDATE categories
      SET ${updates}, updated_at = CURRENT_TIMESTAMP
      WHERE category_id = $1
      RETURNING *
    `;

    const result = await db.query(query, values);

    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: "カテゴリが見つかりません",
      });
      return;
    }

    res.json({
      success: true,
      message: "カテゴリが正常に更新されました",
      data: result.rows[0],
    });

    // カテゴリ更新の通知を送信
    emitSocketNotification("categoryUpdated", result.rows[0]);
  } catch (error) {
    console.error("カテゴリ更新エラー:", error);
    res.status(500).json({
      success: false,
      message: "カテゴリの更新に失敗しました",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// カテゴリを削除
export const deleteCategory = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    // 関連商品があるかチェック
    const productCountQuery = `
      SELECT COUNT(*) as count FROM products
      WHERE category_id = $1 AND deleted_flag = false
    `;
    const productCountResult = await db.query(productCountQuery, [id]);

    if (parseInt(productCountResult.rows[0].count) > 0) {
      res.status(400).json({
        success: false,
        message: "このカテゴリには商品が登録されているため削除できません",
      });
      return;
    }

    const query = `
      DELETE FROM categories WHERE category_id = $1
      RETURNING *
    `;

    const result = await db.query(query, [id]);

    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: "カテゴリが見つかりません",
      });
      return;
    }

    res.json({
      success: true,
      message: "カテゴリが正常に削除されました",
      data: result.rows[0],
    });

    // カテゴリ削除の通知を送信
    emitSocketNotification("categoryDeleted", result.rows[0]);
  } catch (error) {
    console.error("カテゴリ削除エラー:", error);
    res.status(500).json({
      success: false,
      message: "カテゴリの削除に失敗しました",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// カテゴリ表示順を一括更新
export const updateCategoryOrder = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { categories } = req.body; // [{ category_id, display_order }, ...]

    if (!Array.isArray(categories) || categories.length === 0) {
      res.status(400).json({
        success: false,
        message: "カテゴリの並び順データが正しくありません",
      });
      return;
    }

    const client = await db.getClient();
    try {
      await client.query("BEGIN");

      const results = [];
      for (const category of categories) {
        const { category_id, display_order } = category;
        const result = await client.query(
          `UPDATE categories SET display_order = $2, updated_at = CURRENT_TIMESTAMP
           WHERE category_id = $1 RETURNING *`,
          [category_id, display_order]
        );
        if (result.rows.length > 0) {
          results.push(result.rows[0]);
        }
      }

      await client.query("COMMIT");

      res.json({
        success: true,
        message: `${results.length}件のカテゴリ表示順が更新されました`,
        data: results,
      });

      // カテゴリ表示順更新の通知を送信
      for (const category of results) {
        emitSocketNotification("categoryOrderUpdated", category);
      }
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("カテゴリ表示順更新エラー:", error);
    res.status(500).json({
      success: false,
      message: "カテゴリ表示順の更新に失敗しました",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
