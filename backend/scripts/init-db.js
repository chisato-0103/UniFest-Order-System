#!/usr/bin/env node
/**
 * データベース初期化スクリプト
 * RenderのPostgreSQLデータベースにテーブルを作成します
 */

const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

// データベース接続設定
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : false,
});

async function initializeDatabase() {
  let client;

  try {
    console.log("🔄 データベースに接続中...");
    client = await pool.connect();
    console.log("✅ データベース接続成功");

    // SQLファイルを読み込み
    const schemaPath = path.join(__dirname, "../src/database/schema.sql");
    const schemaSql = fs.readFileSync(schemaPath, "utf8");

    console.log("🔄 データベーススキーマを作成中...");

    // スキーマを実行（複数のステートメントを分割して実行）
    const statements = schemaSql
      .split(";")
      .map((stmt) => stmt.trim())
      .filter((stmt) => stmt.length > 0 && !stmt.startsWith("--"));

    for (const statement of statements) {
      if (statement.trim()) {
        try {
          await client.query(statement);
        } catch (error) {
          // 既に存在するテーブルやインデックスのエラーは無視
          if (
            error.code === "42P07" ||
            error.code === "42P06" ||
            error.code === "42P16"
          ) {
            console.log(`⚠️  スキップ: ${error.message}`);
          } else {
            console.error(
              `❌ SQL実行エラー: ${statement.substring(0, 100)}...`
            );
            console.error(error.message);
          }
        }
      }
    }

    console.log("✅ データベーススキーマ作成完了");

    // テーブル一覧を確認
    const tablesResult = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);

    console.log("\n📋 作成されたテーブル:");
    tablesResult.rows.forEach((row) => {
      console.log(`  - ${row.table_name}`);
    });

    // ordersテーブルの存在確認
    const ordersCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'orders'
      );
    `);

    if (ordersCheck.rows[0].exists) {
      console.log("✅ ordersテーブルが正常に作成されました");
    } else {
      console.log("❌ ordersテーブルの作成に失敗しました");
    }
  } catch (error) {
    console.error("❌ データベース初期化エラー:", error);
    process.exit(1);
  } finally {
    if (client) {
      client.release();
    }
    await pool.end();
  }
}

// スクリプト実行
if (require.main === module) {
  initializeDatabase()
    .then(() => {
      console.log("🎉 データベース初期化が完了しました");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 初期化失敗:", error);
      process.exit(1);
    });
}

module.exports = { initializeDatabase };
