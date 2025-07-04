#!/usr/bin/env node

/**
 * サーバー起動時のordersテーブル強制作成
 * Render Shell制限の代替手段
 */

const { Pool } = require("pg");

async function ensureOrdersTable(pool) {
  let client;

  try {
    console.log("🔄 ordersテーブル存在確認...");
    client = await pool.connect();

    // ordersテーブルの存在確認
    const result = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'orders'
      );
    `);

    if (result.rows[0].exists) {
      console.log("✅ ordersテーブルは既に存在します");
      return true;
    }

    console.log("⚠️  ordersテーブルが存在しません。作成中...");

    // 必要なテーブルを順序立てて作成
    const createStatements = [
      // UUIDエクステンション
      `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`,

      // categoriesテーブル
      `CREATE TABLE IF NOT EXISTS categories (
        category_id SERIAL PRIMARY KEY,
        category_name VARCHAR(50) NOT NULL,
        display_order INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );`,

      // productsテーブル
      `CREATE TABLE IF NOT EXISTS products (
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
      );`,

      // ordersテーブル（最重要）
      `CREATE TABLE IF NOT EXISTS orders (
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
      );`,

      // order_itemsテーブル
      `CREATE TABLE IF NOT EXISTS order_items (
        order_item_id SERIAL PRIMARY KEY,
        order_id INTEGER REFERENCES orders(order_id) ON DELETE CASCADE,
        product_id INTEGER REFERENCES products(product_id),
        product_name VARCHAR(100) NOT NULL,
        quantity INTEGER NOT NULL,
        unit_price DECIMAL(10,2) NOT NULL,
        total_price DECIMAL(10,2) NOT NULL,
        toppings JSONB,
        cooking_time INTEGER,
        cooking_instruction TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );`,

      // インデックス
      `CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);`,
      `CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);`,
      `CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);`,

      // 基本データ
      `INSERT INTO categories (category_name, display_order)
       VALUES ('たこ焼き', 1), ('ドリンク', 2), ('サイドメニュー', 3)
       ON CONFLICT DO NOTHING;`,

      `INSERT INTO products (product_name, price, category_id, cooking_time, stock_quantity)
       VALUES
         ('たこ焼き 8個入り', 600, 1, 8, 100),
         ('たこ焼き 12個入り', 850, 1, 10, 80),
         ('たこ焼き 16個入り', 1100, 1, 12, 60)
       ON CONFLICT DO NOTHING;`,
    ];

    // 各ステートメントを実行
    for (let i = 0; i < createStatements.length; i++) {
      const statement = createStatements[i];
      try {
        await client.query(statement);
        console.log(`✅ ステップ ${i + 1}/${createStatements.length} 完了`);
      } catch (error) {
        // 既存オブジェクトのエラーは無視
        if (
          error.code === "42P07" ||
          error.code === "23505" ||
          error.code === "42710"
        ) {
          console.log(
            `⚠️  ステップ ${i + 1} スキップ (既存): ${
              error.message.split("\n")[0]
            }`
          );
        } else {
          console.error(`❌ ステップ ${i + 1} エラー:`, error.message);
          // ordersテーブル作成以外のエラーは続行
          if (!statement.includes("CREATE TABLE IF NOT EXISTS orders")) {
            continue;
          } else {
            throw error;
          }
        }
      }
    }

    // 最終確認
    const finalCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'orders'
      );
    `);

    if (finalCheck.rows[0].exists) {
      console.log("🎉 ordersテーブル作成完了！");
      return true;
    } else {
      console.log("❌ ordersテーブル作成に失敗");
      return false;
    }
  } catch (error) {
    console.error("❌ ordersテーブル作成エラー:", error.message);
    return false;
  } finally {
    if (client) {
      client.release();
    }
  }
}

module.exports = { ensureOrdersTable };
