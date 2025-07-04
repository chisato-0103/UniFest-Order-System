import { pool } from "./connection";
import fs from "fs";
import path from "path";

/**
 * データベーススキーマを初期化する関数
 */
export const initializeDatabase = async (): Promise<boolean> => {
  let client;

  try {
    console.log("🔄 データベーススキーマを確認中...");
    client = await pool.connect();

    // ordersテーブルの存在確認
    const tablesCheck = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN ('orders', 'order_items', 'products', 'categories', 'toppings');
    `);

    const existingTables = tablesCheck.rows.map((row) => row.table_name);
    console.log(`📋 既存テーブル: ${existingTables.join(", ") || "なし"}`);

    // 必要なテーブルが不足している場合はスキーマを作成
    const requiredTables = [
      "orders",
      "order_items",
      "products",
      "categories",
      "toppings",
    ];
    const missingTables = requiredTables.filter(
      (table) => !existingTables.includes(table)
    );

    if (missingTables.length > 0) {
      console.log(`⚠️  不足テーブル: ${missingTables.join(", ")}`);
      console.log("🔄 データベーススキーマを作成中...");

      // スキーマファイルを読み込み
      const schemaPath = path.join(__dirname, "schema.sql");
      const schemaSql = fs.readFileSync(schemaPath, "utf8");

      // SQLを安全に分割して実行順序を制御
      const statements = schemaSql
        .split(";")
        .map((stmt) => stmt.trim())
        .filter((stmt) => stmt.length > 0 && !stmt.startsWith("--"));

      // 実行順序を制御：テーブル作成→インデックス→その他の順序で実行
      const tableStatements = statements.filter(
        (stmt) =>
          stmt.toUpperCase().includes("CREATE TABLE") ||
          stmt.toUpperCase().includes("CREATE EXTENSION")
      );

      const indexStatements = statements.filter((stmt) =>
        stmt.toUpperCase().includes("CREATE INDEX")
      );

      const functionAndTriggerStatements = statements.filter(
        (stmt) =>
          stmt.toUpperCase().includes("CREATE OR REPLACE FUNCTION") ||
          stmt.toUpperCase().includes("CREATE TRIGGER")
      );

      const insertStatements = statements.filter((stmt) =>
        stmt.toUpperCase().includes("INSERT INTO")
      );

      const otherStatements = statements.filter(
        (stmt) =>
          !tableStatements.includes(stmt) &&
          !indexStatements.includes(stmt) &&
          !functionAndTriggerStatements.includes(stmt) &&
          !insertStatements.includes(stmt)
      );

      let successCount = 0;
      let skipCount = 0;

      // 順序立てて実行
      const orderedStatements = [
        ...tableStatements,
        ...indexStatements,
        ...functionAndTriggerStatements,
        ...insertStatements,
        ...otherStatements,
      ];

      for (const statement of orderedStatements) {
        if (statement.trim()) {
          try {
            await client.query(statement);
            successCount++;
          } catch (error: any) {
            // 既に存在するテーブルやインデックスのエラーは無視
            if (
              error.code === "42P07" ||
              error.code === "42P06" ||
              error.code === "42P16" ||
              error.code === "42710"
            ) {
              skipCount++;
              console.log(`⚠️  スキップ: ${error.message.split("\n")[0]}`);
            } else {
              console.error(
                `❌ SQL実行エラー: ${statement.substring(0, 100)}...`
              );
              console.error(error.message);
              throw error;
            }
          }
        }
      }

      console.log(
        `✅ スキーマ作成完了 (実行: ${successCount}, スキップ: ${skipCount})`
      );
    } else {
      console.log("✅ 必要なテーブルは既に存在します");
    }

    // 最終確認
    const finalCheck = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);

    console.log("\n📋 現在のテーブル一覧:");
    finalCheck.rows.forEach((row) => {
      console.log(`  - ${row.table_name}`);
    });

    // ordersテーブルの存在を最終確認
    const ordersExists = finalCheck.rows.some(
      (row) => row.table_name === "orders"
    );
    if (ordersExists) {
      console.log("✅ ordersテーブルが利用可能です");
      return true;
    } else {
      console.log("❌ ordersテーブルが見つかりません");
      return false;
    }
  } catch (error) {
    console.error("❌ データベース初期化エラー:", error);
    return false;
  } finally {
    if (client) {
      client.release();
    }
  }
};

/**
 * テーブルの行数を確認する関数（デバッグ用）
 */
export const checkTableCounts = async (): Promise<void> => {
  const client = await pool.connect();

  try {
    const tables = [
      "categories",
      "products",
      "toppings",
      "orders",
      "order_items",
    ];

    console.log("\n📊 テーブル行数:");
    for (const table of tables) {
      try {
        const result = await client.query(`SELECT COUNT(*) FROM ${table}`);
        console.log(`  - ${table}: ${result.rows[0].count}行`);
      } catch (error: any) {
        console.log(`  - ${table}: テーブルが存在しません`);
      }
    }
  } finally {
    client.release();
  }
};
