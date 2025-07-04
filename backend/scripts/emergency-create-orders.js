#!/usr/bin/env node
/**
 * Render緊急デプロイ用ordersテーブル強制作成スクリプト
 * 外部からRender DBに直接接続し、ordersテーブルを作成する
 */

const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");

// 環境変数からDATABASE_URLを取得
require("dotenv").config();
const DATABASE_URL =
  process.env.DATABASE_URL || process.env.RENDER_DATABASE_URL;

async function createOrdersTable() {
  console.log("🚀 Render緊急デプロイ用ordersテーブル作成開始");
  console.log(
    "📋 接続先:",
    DATABASE_URL ? "環境変数のDATABASE_URL" : "❌ DATABASE_URL未設定"
  );
  console.log("");

  if (!DATABASE_URL) {
    console.error("❌ DATABASE_URLが設定されていません");
    console.log("💡 以下を確認してください:");
    console.log("  1. .env ファイルにDATABASE_URLが設定されているか");
    console.log("  2. RENDER_DATABASE_URL環境変数が設定されているか");
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 15000,
  });

  try {
    const client = await pool.connect();
    console.log("✅ Render DBに接続成功！");

    // 現在のテーブル状況を確認
    const tables = await client.query(`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    console.log("📋 現在のテーブル一覧:");
    if (tables.rows.length === 0) {
      console.log("  ❌ テーブルが存在しません");
    } else {
      tables.rows.forEach((row) => {
        console.log(`  - ${row.table_name}`);
      });
    }

    // ordersテーブルの存在確認
    const ordersExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'orders'
      )
    `);

    if (ordersExists.rows[0].exists) {
      console.log("✅ ordersテーブルは既に存在します");
    } else {
      console.log("❌ ordersテーブルが存在しません - 作成します");

      // ordersテーブル作成SQL
      const createOrdersSQL = `
        CREATE TABLE orders (
          id SERIAL PRIMARY KEY,
          customer_name VARCHAR(255) NOT NULL,
          menu_item VARCHAR(255) NOT NULL,
          quantity INTEGER NOT NULL,
          total_price DECIMAL(10,2) NOT NULL,
          status VARCHAR(50) NOT NULL DEFAULT 'pending',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `;

      await client.query(createOrdersSQL);
      console.log("✅ ordersテーブルを作成しました");

      // 作成後の確認
      const ordersCheck = await client.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_name = 'orders'
        ORDER BY ordinal_position
      `);

      console.log("📋 ordersテーブル構造:");
      ordersCheck.rows.forEach((row) => {
        console.log(
          `  - ${row.column_name}: ${row.data_type} (${
            row.is_nullable === "YES" ? "NULL" : "NOT NULL"
          })`
        );
      });
    }

    // サンプルデータを挿入（テスト用）
    const sampleData = await client.query(`
      INSERT INTO orders (customer_name, menu_item, quantity, total_price, status)
      VALUES
        ('テスト太郎', 'たこ焼き(6個)', 2, 600, 'pending'),
        ('テスト花子', 'たこ焼き(12個)', 1, 800, 'completed')
      ON CONFLICT DO NOTHING
      RETURNING id;
    `);

    if (sampleData.rows.length > 0) {
      console.log("✅ サンプルデータを挿入しました");
    } else {
      console.log("ℹ️  サンプルデータは既に存在します");
    }

    // 最終確認
    const finalCheck = await client.query("SELECT COUNT(*) FROM orders");
    console.log(`📊 ordersテーブルレコード数: ${finalCheck.rows[0].count}`);

    client.release();
    console.log("🎉 ordersテーブル作成処理が完了しました！");
  } catch (error) {
    console.error("❌ エラーが発生しました:", error.message);
    console.error("詳細:", error.stack);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// スクリプト実行
if (require.main === module) {
  createOrdersTable().catch(console.error);
}

module.exports = { createOrdersTable };
