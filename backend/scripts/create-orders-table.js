#!/usr/bin/env node

/**
 * 最小限のordersテーブル作成スクリプト
 * Render環境での緊急対応用
 */

const { Pool } = require("pg");

// データベース接続設定
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : false,
  connectionTimeoutMillis: 15000,
});

async function createOrdersTableOnly() {
  let client;

  try {
    console.log("🚀 最小限のordersテーブル作成開始");

    if (!process.env.DATABASE_URL) {
      console.error("❌ DATABASE_URL環境変数が設定されていません");
      process.exit(1);
    }

    const maskedUrl = process.env.DATABASE_URL.replace(
      /:\/\/([^:]+):([^@]+)@/,
      "://$1:***@"
    );
    console.log("📡 接続先:", maskedUrl);

    client = await pool.connect();
    console.log("✅ データベース接続成功");

    // 接続情報を確認
    const connInfo = await client.query(
      "SELECT current_database(), current_user;"
    );
    console.log(`📋 データベース: ${connInfo.rows[0].current_database}`);
    console.log(`👤 ユーザー: ${connInfo.rows[0].current_user}`);

    // 現在のテーブル確認
    const tables = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);

    console.log("📋 現在のテーブル:");
    if (tables.rows.length === 0) {
      console.log("  - なし");
    } else {
      tables.rows.forEach((row) => console.log(`  - ${row.table_name}`));
    }

    // ordersテーブルが既に存在するかチェック
    const ordersExists = tables.rows.some((row) => row.table_name === "orders");
    if (ordersExists) {
      console.log("✅ ordersテーブルは既に存在します");
      return true;
    }

    console.log("🔄 ordersテーブルを作成中...");

    // UUIDエクステンションを有効化
    await client.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`);
    console.log("✅ UUID拡張を有効化");

    // categoriesテーブル（ordersの依存関係）
    await client.query(`
      CREATE TABLE IF NOT EXISTS categories (
        category_id SERIAL PRIMARY KEY,
        category_name VARCHAR(50) NOT NULL,
        display_order INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("✅ categoriesテーブル作成");

    // productsテーブル（ordersの依存関係）
    await client.query(`
      CREATE TABLE IF NOT EXISTS products (
        product_id SERIAL PRIMARY KEY,
        product_name VARCHAR(100) NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        category_id INTEGER REFERENCES categories(category_id),
        status VARCHAR(20) NOT NULL DEFAULT '有効',
        image_url VARCHAR(255),
        description TEXT,
        cooking_time INTEGER DEFAULT 10,
        stock_quantity INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("✅ productsテーブル作成");

    // ordersテーブル（メインターゲット）
    await client.query(`
      CREATE TABLE IF NOT EXISTS orders (
        order_id SERIAL PRIMARY KEY,
        customer_id INTEGER,
        order_number VARCHAR(4) NOT NULL UNIQUE,
        total_amount DECIMAL(10,2) NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT '注文受付',
        payment_status VARCHAR(20) NOT NULL DEFAULT '未払い',
        payment_method VARCHAR(20) DEFAULT '現金',
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
    `);
    console.log("✅ ordersテーブル作成");

    // order_itemsテーブル
    await client.query(`
      CREATE TABLE IF NOT EXISTS order_items (
        order_item_id SERIAL PRIMARY KEY,
        order_id INTEGER REFERENCES orders(order_id) ON DELETE CASCADE,
        product_id INTEGER REFERENCES products(product_id),
        product_name VARCHAR(100) NOT NULL,
        quantity INTEGER NOT NULL,
        unit_price DECIMAL(10,2) NOT NULL,
        total_price DECIMAL(10,2) NOT NULL,
        toppings JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("✅ order_itemsテーブル作成");

    // 基本的なインデックスを作成
    await client.query(
      `CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);`
    );
    await client.query(
      `CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);`
    );
    await client.query(
      `CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);`
    );
    console.log("✅ インデックス作成");

    // 基本データを挿入
    try {
      await client.query(`
        INSERT INTO categories (category_name, display_order)
        VALUES ('たこ焼き', 1), ('ドリンク', 2), ('サイドメニュー', 3)
        ON CONFLICT DO NOTHING;
      `);

      await client.query(`
        INSERT INTO products (product_name, price, category_id, cooking_time, stock_quantity)
        VALUES
          ('たこ焼き 8個入り', 600, 1, 8, 100),
          ('たこ焼き 12個入り', 850, 1, 10, 80),
          ('たこ焼き 16個入り', 1100, 1, 12, 60)
        ON CONFLICT DO NOTHING;
      `);
      console.log("✅ 基本データ挿入");
    } catch (dataError) {
      console.log("⚠️  基本データ挿入をスキップ:", dataError.message);
    }

    // 最終確認
    const finalCheck = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'orders';
    `);

    if (finalCheck.rows.length > 0) {
      console.log("🎉 ordersテーブル作成完了！");

      // テーブル構造も確認
      const columns = await client.query(`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = 'orders' AND table_schema = 'public'
        ORDER BY ordinal_position;
      `);

      console.log("📊 ordersテーブル構造:");
      columns.rows.forEach((col) => {
        console.log(`  - ${col.column_name}: ${col.data_type}`);
      });

      return true;
    } else {
      console.log("❌ ordersテーブル作成に失敗");
      return false;
    }
  } catch (error) {
    console.error("❌ エラー:", error);
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
  createOrdersTableOnly()
    .then((success) => {
      console.log(success ? "🎉 成功" : "❌ 失敗");
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error("❌ 致命的エラー:", error);
      process.exit(1);
    });
}

module.exports = { createOrdersTableOnly };
