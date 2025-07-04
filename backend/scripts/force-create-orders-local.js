#!/usr/bin/env node
/**
 * ローカルからRender本番データベースに直接接続してordersテーブルを強制作成
 * Renderのシェル制限を完全に回避する最終手段
 */

const { Pool } = require("pg");

// Renderの本番データベースURL（実際のパスワードを含む）
// 注意: 実際の運用では環境変数を使用すること
const RENDER_DATABASE_URLS = [
  // 内部URL
  process.env.RENDER_DATABASE_URL ||
    "postgresql://unifest_db_user:PASSWORD@dpg-d1jj1424d50c7382va8g-a:5432/unifest_db",
  // 外部URL
  process.env.RENDER_DATABASE_URL_EXTERNAL ||
    "postgresql://unifest_db_user:PASSWORD@dpg-d1jj1424d50c7382va8g-a.oregon-postgres.render.com:5432/unifest_db",
];

async function forceCreateOrdersTable() {
  console.log("🚨 緊急措置: ローカルからRender本番DBに直接接続");
  console.log("📋 ordersテーブルを強制作成します");
  console.log("=".repeat(50));

  let successfulConnection = null;

  // 複数のURLを試行
  for (let i = 0; i < RENDER_DATABASE_URLS.length; i++) {
    const url = RENDER_DATABASE_URLS[i];

    if (!url || url.includes("PASSWORD")) {
      console.log(`⚠️  URL ${i + 1}: パスワードが設定されていません`);
      continue;
    }

    console.log(`🔄 試行 ${i + 1}: ${url.replace(/:([^:/@]+)@/, ":***@")}`);

    const pool = new Pool({
      connectionString: url,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 15000,
    });

    try {
      const client = await pool.connect();
      console.log(`✅ 接続成功: URL ${i + 1}`);
      successfulConnection = client;
      break;
    } catch (error) {
      console.log(`❌ 接続失敗: ${error.message}`);
      await pool.end().catch(() => {});
    }
  }

  if (!successfulConnection) {
    console.log("❌ すべての接続URLで失敗しました");
    console.log("💡 次の手順を試してください:");
    console.log("  1. RenderダッシュボードでDATABASE_URLを確認");
    console.log("  2. 環境変数RENDER_DATABASE_URLを設定");
    console.log("  3. パスワードが正しいか確認");
    process.exit(1);
  }

  try {
    const client = successfulConnection;

    // 現在のデータベース状況を確認
    console.log("\n📊 データベース状況確認:");

    const dbInfo = await client.query(
      "SELECT current_database(), current_user, version()"
    );
    console.log(`  データベース: ${dbInfo.rows[0].current_database}`);
    console.log(`  ユーザー: ${dbInfo.rows[0].current_user}`);
    console.log(
      `  バージョン: ${dbInfo.rows[0].version.split(" ").slice(0, 2).join(" ")}`
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

    // ordersテーブルの存在確認
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

    if (!ordersExists.rows[0].exists) {
      console.log("\n🔨 ordersテーブルを作成します...");

      // 最小限のordersテーブル作成SQL
      const createOrdersSQL = `
        CREATE TABLE orders (
          order_id SERIAL PRIMARY KEY,
          customer_id INTEGER,
          order_number VARCHAR(4) NOT NULL UNIQUE,
          total_amount DECIMAL(10,2) NOT NULL,
          status VARCHAR(20) NOT NULL DEFAULT '注文受付'
            CHECK (status IN ('注文受付', '調理待ち', '調理中', '調理完了', '受け取り済み', 'キャンセル')),
          payment_status VARCHAR(20) NOT NULL DEFAULT '未払い'
            CHECK (payment_status IN ('未払い', '支払済み')),
          payment_method VARCHAR(20) DEFAULT '現金'
            CHECK (payment_method IN ('現金', 'クレジットカード', 'PayPay', 'その他')),
          estimated_pickup_time TIMESTAMP,
          actual_pickup_time TIMESTAMP,
          special_instructions TEXT,
          cooking_start_time TIMESTAMP,
          cooking_completion_time TIMESTAMP,
          cancel_reason TEXT,
          qr_code TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `;

      await client.query(createOrdersSQL);
      console.log("✅ ordersテーブル作成完了");

      // インデックスを作成
      const indexSQL = `
        CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
        CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
      `;

      await client.query(indexSQL);
      console.log("✅ インデックス作成完了");

      // サンプルデータを挿入
      const sampleSQL = `
        INSERT INTO orders (order_number, total_amount, status, payment_status)
        VALUES
          ('A001', 600.00, '注文受付', '未払い'),
          ('A002', 850.00, '調理完了', '支払済み')
      `;

      await client.query(sampleSQL);
      console.log("✅ サンプルデータ挿入完了");
    } else {
      console.log("✅ ordersテーブルは既に存在します");
    }

    // 最終確認
    const finalCount = await client.query("SELECT COUNT(*) FROM orders");
    console.log(
      `\n📊 最終確認: ordersテーブルに ${finalCount.rows[0].count} 件のレコード`
    );

    console.log("\n🎉 処理完了！");
    console.log(
      "💡 Renderアプリケーションを再起動して統計機能を確認してください"
    );

    client.release();
  } catch (error) {
    console.error("❌ エラーが発生しました:", error.message);
    console.error("詳細:", error.stack);
    process.exit(1);
  }
}

// 実行
if (require.main === module) {
  forceCreateOrdersTable().catch(console.error);
}

module.exports = { forceCreateOrdersTable };
