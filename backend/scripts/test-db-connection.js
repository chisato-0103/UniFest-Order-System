#!/usr/bin/env node
/**
 * Renderデータベース情報確認スクリプト
 */

const { Pool } = require("pg");
require("dotenv").config();

// 可能なデータベースURL候補
const databaseUrls = [
  "postgresql://unifest_order_db_user:your_password@dpg-csm8ej88fa8c73fhkepg-a.oregon-postgres.render.com/unifest_order_db",
  "postgresql://unifest_order_db_user:your_password@dpg-csm8ej88fa8c73fhkepg-a:5432/unifest_order_db",
];

async function testDatabaseConnection(url) {
  console.log(`🔄 テスト中: ${url.replace(/:\/\/.*@/, "://***@")}`);

  const pool = new Pool({
    connectionString: url,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 5000,
  });

  try {
    const client = await pool.connect();
    const result = await client.query(
      "SELECT version(), current_database(), current_user;"
    );
    client.release();
    await pool.end();

    console.log("✅ 接続成功!");
    console.log("📋 データベース情報:");
    console.log(`  - データベース: ${result.rows[0].current_database}`);
    console.log(`  - ユーザー: ${result.rows[0].current_user}`);
    console.log(
      `  - PostgreSQLバージョン: ${result.rows[0].version
        .split(" ")
        .slice(0, 2)
        .join(" ")}`
    );

    return true;
  } catch (error) {
    console.log(`❌ 接続失敗: ${error.message}`);
    await pool.end().catch(() => {});
    return false;
  }
}

async function main() {
  console.log("🔍 Renderデータベース接続テスト\n");

  // 環境変数からのURL
  if (process.env.DATABASE_URL) {
    console.log("📌 環境変数 DATABASE_URL を使用:");
    const success = await testDatabaseConnection(process.env.DATABASE_URL);
    if (success) return;
  }

  // 候補URLをテスト
  console.log("\n📌 候補URLをテスト:");
  for (const url of databaseUrls) {
    const success = await testDatabaseConnection(url);
    if (success) return;
    console.log("");
  }

  console.log("❌ すべての接続試行が失敗しました");
  console.log(
    "💡 Renderダッシュボードで正確なデータベースURLを確認してください"
  );
}

main().catch(console.error);
