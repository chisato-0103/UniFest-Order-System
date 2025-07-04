#!/usr/bin/env node
/**
 * データベース初期化スクリプト (改良版)
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
  connectionTimeoutMillis: 10000,
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
    console.log(`\n📄 スキーマファイル読み込み: ${schemaPath}`);
    console.log(`📊 スキーマサイズ: ${schemaSql.length} 文字`);

    console.log("\n🔄 データベーススキーマを作成中...");

    // スキーマを実行（複数のステートメントを分割して実行）
    const statements = schemaSql
      .split(";")
      .map((stmt) => stmt.trim())
      .filter((stmt) => stmt.length > 0 && !stmt.startsWith("--"));

    console.log(`📝 実行予定のSQL文: ${statements.length}個`);

    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        try {
          await client.query(statement);
          successCount++;

          // 進捗表示
          if ((i + 1) % 10 === 0 || i === statements.length - 1) {
            console.log(
              `📊 進捗: ${i + 1}/${
                statements.length
              } (成功: ${successCount}, スキップ: ${skipCount}, エラー: ${errorCount})`
            );
          }
        } catch (error) {
          // 既に存在するテーブルやインデックスのエラーは無視
          if (
            error.code === "42P07" || // relation already exists
            error.code === "42P06" || // schema already exists
            error.code === "42P16" || // undefined object
            error.code === "42710" // duplicate object
          ) {
            skipCount++;
            console.log(
              `⚠️  スキップ [${error.code}]: ${error.message.split("\n")[0]}`
            );
          } else {
            errorCount++;
            console.error(
              `❌ SQL実行エラー [${error.code}]: ${statement.substring(
                0,
                100
              )}...`
            );
            console.error(`   ${error.message}`);
            // 重大なエラーの場合は停止
            if (errorCount > 5) {
              console.error("💥 エラーが多すぎます。処理を停止します。");
              throw error;
            }
          }
        }
      }
    }

    console.log(
      `\n✅ データベーススキーマ作成完了 (成功: ${successCount}, スキップ: ${skipCount}, エラー: ${errorCount})`
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

    // 重要なテーブルの存在確認
    const importantTables = [
      "orders",
      "order_items",
      "products",
      "categories",
      "toppings",
    ];
    const missingTables = [];

    for (const tableName of importantTables) {
      const tableExists = tablesResult.rows.some(
        (row) => row.table_name === tableName
      );
      if (tableExists) {
        console.log(`✅ ${tableName}テーブルが存在します`);
      } else {
        missingTables.push(tableName);
        console.log(`❌ ${tableName}テーブルが見つかりません`);
      }
    }

    if (missingTables.length === 0) {
      console.log("\n🎉 すべての重要なテーブルが正常に作成されました");
      return true;
    } else {
      console.log(`\n⚠️  不足しているテーブル: ${missingTables.join(", ")}`);
      return false;
    }
  } catch (error) {
    console.error("❌ データベース初期化エラー:", error);
    return false;
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
    .then((success) => {
      if (success) {
        console.log("🎉 データベース初期化が完了しました");
        process.exit(0);
      } else {
        console.log("💥 データベース初期化に失敗しました");
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error("💥 初期化失敗:", error);
      process.exit(1);
    });
}

module.exports = { initializeDatabase };
