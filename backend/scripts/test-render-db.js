#!/usr/bin/env node
/**
 * Renderデータベース直接接続テスト
 * ログから判明した情報を使用
 */

const { Pool } = require("pg");

// ログから判明した情報
// - データベース: unifest_db
// - ユーザー: unifest_db_user
// - ホスト: dpg-d1jj1424d50c7382va8g-a (内部用と推定)

const possibleUrls = [
  // 内部接続URL (Render内のサービス間通信用)
  "postgresql://unifest_db_user:PASSWORD@dpg-d1jj1424d50c7382va8g-a:5432/unifest_db",
  // 外部接続URL (外部からのアクセス用)
  "postgresql://unifest_db_user:PASSWORD@dpg-d1jj1424d50c7382va8g-a.oregon-postgres.render.com:5432/unifest_db",
];

async function testDatabaseUrls() {
  console.log("🔍 Renderデータベース接続テスト");
  console.log("📋 ログから判明した情報:");
  console.log("  - データベース名: unifest_db");
  console.log("  - ユーザー名: unifest_db_user");
  console.log("  - ホスト: dpg-d1jj1424d50c7382va8g-a");
  console.log("");

  for (let i = 0; i < possibleUrls.length; i++) {
    const url = possibleUrls[i];
    console.log(`🔄 テスト ${i + 1}: ${url.replace("PASSWORD", "***")}`);

    const pool = new Pool({
      connectionString: url,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 10000,
    });

    try {
      const client = await pool.connect();
      console.log("✅ 接続成功！");

      // データベース情報を取得
      const dbInfo = await client.query(
        "SELECT current_database(), current_user, version();"
      );
      console.log("📋 データベース情報:");
      console.log(`  - データベース: ${dbInfo.rows[0].current_database}`);
      console.log(`  - ユーザー: ${dbInfo.rows[0].current_user}`);
      console.log(
        `  - バージョン: ${dbInfo.rows[0].version
          .split(" ")
          .slice(0, 2)
          .join(" ")}`
      );

      // 既存テーブルを確認
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

      client.release();
      await pool.end();
      return url;
    } catch (error) {
      console.log(`❌ 接続失敗: ${error.message}`);
      await pool.end().catch(() => {});
    }
    console.log("");
  }

  return null;
}

testDatabaseUrls()
  .then((successUrl) => {
    if (successUrl) {
      console.log("🎉 接続成功したURL:", successUrl.replace("PASSWORD", "***"));
      console.log("💡 このURLを環境変数DATABASE_URLに設定してください");
    } else {
      console.log("❌ すべての接続が失敗しました");
      console.log("💡 Renderダッシュボードで正確な接続情報を確認してください");
    }
  })
  .catch(console.error);
