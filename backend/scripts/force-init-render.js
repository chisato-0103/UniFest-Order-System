#!/usr/bin/env node

/**
 * Render本番環境でのデータベース強制初期化スクリプト
 * ordersテーブルが作成されない場合の緊急対応用
 */

const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");

// 本番環境でのデータベース接続
const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL環境変数が設定されていません");
  process.exit(1);
}

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 10000,
});

async function forceInitializeDatabase() {
  let client;

  try {
    console.log("🚀 Render本番環境データベース強制初期化開始");
    console.log(
      "📡 接続先:",
      DATABASE_URL.replace(/:\/\/([^:]+):([^@]+)@/, "://$1:***@")
    );

    client = await pool.connect();
    console.log("✅ データベース接続成功");

    // 現在のテーブル状況を確認
    const existingTables = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);

    console.log("📋 現在のテーブル一覧:");
    if (existingTables.rows.length === 0) {
      console.log("  - テーブルなし");
    } else {
      existingTables.rows.forEach((row) => {
        console.log(`  - ${row.table_name}`);
      });
    }

    // ordersテーブルの存在確認
    const ordersExists = existingTables.rows.some(
      (row) => row.table_name === "orders"
    );
    if (ordersExists) {
      console.log("✅ ordersテーブルは既に存在します");
      return true;
    }

    // スキーマファイルを読み込み（distディレクトリから）
    const schemaPath = path.join(
      __dirname,
      "..",
      "dist",
      "database",
      "schema.sql"
    );
    if (!fs.existsSync(schemaPath)) {
      console.error(`❌ スキーマファイルが見つかりません: ${schemaPath}`);
      process.exit(1);
    }

    const schemaSql = fs.readFileSync(schemaPath, "utf8");
    console.log("📄 スキーマファイル読み込み完了");

    // 基本的なテーブルのみを作成（順序を保証）
    const createTableStatements = [
      // 依存関係のない基本テーブル
      `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`,

      `CREATE TABLE IF NOT EXISTS categories (
        category_id SERIAL PRIMARY KEY,
        category_name VARCHAR(50) NOT NULL,
        display_order INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );`,

      `CREATE TABLE IF NOT EXISTS products (
        product_id SERIAL PRIMARY KEY,
        product_name VARCHAR(100) NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        category_id INTEGER REFERENCES categories(category_id),
        status VARCHAR(20) NOT NULL DEFAULT '有効' CHECK (status IN ('有効', '無効', '売り切れ')),
        image_url VARCHAR(255),
        description TEXT,
        allergy_info TEXT,
        cooking_time INTEGER DEFAULT 10,
        max_simultaneous_cooking INTEGER DEFAULT 5,
        display_order INTEGER DEFAULT 0,
        deleted_flag BOOLEAN DEFAULT FALSE,
        stock_quantity INTEGER DEFAULT 0,
        initial_stock INTEGER DEFAULT 0,
        low_stock_threshold INTEGER DEFAULT 10,
        auto_disable_on_zero BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );`,

      `CREATE TABLE IF NOT EXISTS toppings (
        topping_id SERIAL PRIMARY KEY,
        topping_name VARCHAR(50) NOT NULL,
        price DECIMAL(10,2) NOT NULL DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        target_product_ids INTEGER[],
        display_order INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );`,

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
    ];

    console.log("🔄 基本テーブルを作成中...");
    for (const statement of createTableStatements) {
      try {
        await client.query(statement);
        console.log(`✅ 実行成功: ${statement.split("(")[0].trim()}`);
      } catch (error) {
        if (error.code === "42P07") {
          console.log(
            `⚠️  既存テーブルをスキップ: ${statement.split("(")[0].trim()}`
          );
        } else {
          console.error(`❌ エラー: ${error.message}`);
          throw error;
        }
      }
    }

    // インデックスを作成
    console.log("🔄 インデックスを作成中...");
    const indexStatements = [
      `CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);`,
      `CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);`,
      `CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);`,
      `CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);`,
      `CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);`,
      `CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);`,
    ];

    for (const statement of indexStatements) {
      try {
        await client.query(statement);
        console.log(
          `✅ インデックス作成: ${statement.split(" ON ")[1]?.split("(")[0]}`
        );
      } catch (error) {
        if (error.code === "42P07") {
          console.log(`⚠️  既存インデックスをスキップ`);
        } else {
          console.error(`❌ インデックスエラー: ${error.message}`);
        }
      }
    }

    // 基本データを挿入
    console.log("🔄 基本データを挿入中...");
    try {
      await client.query(`
        INSERT INTO categories (category_name, display_order) VALUES
        ('たこ焼き', 1),
        ('ドリンク', 2),
        ('サイドメニュー', 3)
        ON CONFLICT DO NOTHING;
      `);

      await client.query(`
        INSERT INTO products (product_name, price, category_id, cooking_time, max_simultaneous_cooking, stock_quantity, initial_stock, display_order) VALUES
        ('たこ焼き 8個入り', 600, 1, 8, 10, 100, 100, 1),
        ('たこ焼き 12個入り', 850, 1, 10, 8, 80, 80, 2),
        ('たこ焼き 16個入り', 1100, 1, 12, 6, 60, 60, 3)
        ON CONFLICT DO NOTHING;
      `);

      console.log("✅ 基本データ挿入完了");
    } catch (error) {
      console.log(`⚠️  基本データ挿入エラー（無視）: ${error.message}`);
    }

    // 最終確認
    const finalCheck = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name = 'orders';
    `);

    if (finalCheck.rows.length > 0) {
      console.log("🎉 データベース強制初期化完了！");
      console.log("✅ ordersテーブルが利用可能になりました");
      return true;
    } else {
      console.log("❌ ordersテーブルの作成に失敗しました");
      return false;
    }
  } catch (error) {
    console.error("❌ データベース強制初期化エラー:", error);
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
  forceInitializeDatabase()
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error("致命的エラー:", error);
      process.exit(1);
    });
}

module.exports = { forceInitializeDatabase };
