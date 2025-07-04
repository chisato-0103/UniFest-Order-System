#!/usr/bin/env node
/**
 * Render環境の実際のDATABASE_URLを確認するスクリプト
 */

require("dotenv").config();
const { Pool } = require("pg");

console.log("🔍 Render環境変数確認スクリプト");
console.log("=================================");

// 環境変数の確認
const envVars = [
  "DATABASE_URL",
  "RENDER_DATABASE_URL",
  "NODE_ENV",
  "PORT",
  "FRONTEND_URL",
];

console.log("📋 設定されている環境変数:");
envVars.forEach((varName) => {
  const value = process.env[varName];
  if (value) {
    // パスワード部分を隠す
    if (varName.includes("DATABASE_URL")) {
      const maskedValue = value.replace(/:([^:/@]+)@/, ":***@");
      console.log(`  ${varName}: ${maskedValue}`);
    } else {
      console.log(`  ${varName}: ${value}`);
    }
  } else {
    console.log(`  ${varName}: ❌ 未設定`);
  }
});

console.log("");

// DATABASE_URLが設定されている場合、接続テスト
const databaseUrl = process.env.DATABASE_URL || process.env.RENDER_DATABASE_URL;

if (databaseUrl) {
  console.log("🔄 データベース接続テスト中...");

  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
  });

  pool
    .connect()
    .then(async (client) => {
      console.log("✅ データベース接続成功！");

      // 基本情報を取得
      const info = await client.query(
        "SELECT current_database(), current_user, version()"
      );
      console.log("📋 データベース情報:");
      console.log(`  - データベース: ${info.rows[0].current_database}`);
      console.log(`  - ユーザー: ${info.rows[0].current_user}`);
      console.log(
        `  - バージョン: ${info.rows[0].version
          .split(" ")
          .slice(0, 2)
          .join(" ")}`
      );

      // テーブル一覧を取得
      const tables = await client.query(`
        SELECT table_name FROM information_schema.tables
        WHERE table_schema = 'public'
        ORDER BY table_name
      `);

      console.log("\n📋 既存テーブル:");
      if (tables.rows.length === 0) {
        console.log("  ❌ テーブルが存在しません");
      } else {
        tables.rows.forEach((row) => {
          console.log(`  - ${row.table_name}`);
        });
      }

      // ordersテーブルの確認
      const ordersExists = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'public'
          AND table_name = 'orders'
        )
      `);

      console.log(
        `\n📊 ordersテーブル: ${
          ordersExists.rows[0].exists ? "✅ 存在" : "❌ 不存在"
        }`
      );

      client.release();
      await pool.end();
    })
    .catch(async (error) => {
      console.log("❌ データベース接続失敗:", error.message);
      await pool.end().catch(() => {});
    });
} else {
  console.log("❌ DATABASE_URLが設定されていません");
  console.log("💡 .env ファイルまたは環境変数を確認してください");
}
