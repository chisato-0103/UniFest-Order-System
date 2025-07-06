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

    // 接続情報をログ出力（パスワード部分は隠す）
    if (process.env.DATABASE_URL) {
      const maskedUrl = process.env.DATABASE_URL.replace(
        /:\/\/([^:]+):([^@]+)@/,
        "://$1:***@"
      );
      console.log("📡 接続先:", maskedUrl);
    } else {
      console.log("❌ DATABASE_URLが設定されていません");
      process.exit(1);
    }

    client = await pool.connect();
    console.log("✅ データベース接続成功");

    // 現在の接続情報を確認
    const connectionInfo = await client.query(
      "SELECT current_database(), current_user, version();"
    );
    console.log("📋 接続情報:");
    console.log(`  - データベース: ${connectionInfo.rows[0].current_database}`);
    console.log(`  - ユーザー: ${connectionInfo.rows[0].current_user}`);
    console.log(
      `  - PostgreSQL: ${connectionInfo.rows[0].version
        .split(" ")
        .slice(0, 2)
        .join(" ")}`
    );

    // 既存のテーブルを確認
    const existingTables = await client.query(`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    console.log("\n📋 既存テーブル:");
    if (existingTables.rows.length === 0) {
      console.log("  ❌ テーブルが存在しません");
    } else {
      existingTables.rows.forEach((row) => {
        console.log(`  - ${row.table_name}`);
      });
    }

    // SQLファイルを読み込み
    const schemaPath = path.join(__dirname, "../src/database/schema.sql");
    if (!fs.existsSync(schemaPath)) {
      console.log(`❌ スキーマファイルが見つかりません: ${schemaPath}`);
      process.exit(1);
    }

    const schemaSql = fs.readFileSync(schemaPath, "utf8");
    console.log(`📄 スキーマファイル読み込み: ${schemaPath}`);
    console.log(`📊 スキーマサイズ: ${schemaSql.length} 文字`);

    console.log("\n🔄 データベーススキーマを作成中...");

    // スキーマを実行
    await client.query(schemaSql);

    console.log(
      `\n✅ データベーススキーマ作成完了`
    );

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
