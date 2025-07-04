#!/usr/bin/env node

/**
 * システム要件書に基づくordersテーブル作成スクリプト
 * ローカルからRenderデータベースに直接接続
 */

const { Pool } = require("pg");

// 環境変数またはコマンドライン引数からDATABASE_URLを取得
const DATABASE_URL = process.env.DATABASE_URL || process.argv[2];

if (!DATABASE_URL) {
  console.log("🔧 使用方法:");
  console.log(
    "  1. 環境変数で指定: DATABASE_URL='postgresql://...' node create-orders-system.js"
  );
  console.log(
    "  2. 引数で指定: node create-orders-system.js 'postgresql://...'"
  );
  console.log("  3. .envファイルに設定: DATABASE_URL=postgresql://...");
  console.log("");
  console.log("📋 DATABASE_URLの取得方法:");
  console.log("  1. https://dashboard.render.com にログイン");
  console.log("  2. PostgreSQL サービス (unifest-database) を選択");
  console.log("  3. Connect タブ → External Database URL をコピー");
  process.exit(1);
}

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 15000,
});

async function createUniFestOrderSystem() {
  let client;

  try {
    console.log("🚀 UniFestオーダー管理システム データベース作成開始");
    console.log(
      "📡 接続先:",
      DATABASE_URL.replace(/:\/\/([^:]+):([^@]+)@/, "://$1:***@")
    );

    client = await pool.connect();
    console.log("✅ データベース接続成功");

    // 接続情報確認
    const connInfo = await client.query(
      "SELECT current_database(), current_user;"
    );
    console.log(`📋 データベース: ${connInfo.rows[0].current_database}`);
    console.log(`👤 ユーザー: ${connInfo.rows[0].current_user}`);

    // 現在のテーブル状況確認
    const existingTables = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);

    console.log("📋 現在のテーブル:");
    if (existingTables.rows.length === 0) {
      console.log("  - なし");
    } else {
      existingTables.rows.forEach((row) =>
        console.log(`  - ${row.table_name}`)
      );
    }

    console.log("\n🔄 システム要件書に基づくテーブル作成開始...");

    // 1. UUIDエクステンション
    await client.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`);
    console.log("✅ 1. UUID拡張を有効化");

    // 2. カテゴリテーブル（メイン、トッピング、セット等）
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
    console.log("✅ 2. categoriesテーブル作成");

    // 3. 商品テーブル（システム要件書に基づく）
    await client.query(`
      CREATE TABLE IF NOT EXISTS products (
        product_id SERIAL PRIMARY KEY,
        product_name VARCHAR(100) NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        category_id INTEGER REFERENCES categories(category_id),
        status VARCHAR(20) NOT NULL DEFAULT '有効' CHECK (status IN ('有効', '無効', '売り切れ')),
        image_url VARCHAR(255),
        description TEXT,
        allergy_info TEXT,
        cooking_time INTEGER DEFAULT 10, -- 予想調理時間（分）
        max_simultaneous_cooking INTEGER DEFAULT 5, -- 同時調理可能数
        display_order INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        deleted_flag BOOLEAN DEFAULT FALSE -- 論理削除
      );
    `);
    console.log("✅ 3. productsテーブル作成");

    // 4. トッピングテーブル
    await client.query(`
      CREATE TABLE IF NOT EXISTS toppings (
        topping_id SERIAL PRIMARY KEY,
        topping_name VARCHAR(50) NOT NULL,
        price DECIMAL(10,2) NOT NULL DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        target_product_ids INTEGER[], -- 対象商品ID配列
        display_order INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("✅ 4. toppingsテーブル作成");

    // 5. ordersテーブル（システム要件書完全準拠）
    await client.query(`
      CREATE TABLE IF NOT EXISTS orders (
        order_id SERIAL PRIMARY KEY,
        order_number VARCHAR(4) NOT NULL UNIQUE, -- お客様向け表示用4桁
        order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- 注文日時
        total_amount DECIMAL(10,2) NOT NULL, -- 合計金額
        status VARCHAR(20) NOT NULL DEFAULT '注文受付'
          CHECK (status IN ('注文受付', '調理中', '調理完了', '支払済', '受渡完了', 'キャンセル')),
        special_instructions TEXT, -- 特記事項
        estimated_cooking_time INTEGER, -- 予想調理時間（分）
        cooking_start_time TIMESTAMP, -- 調理開始時刻
        cooking_completion_time TIMESTAMP, -- 調理完了時刻
        payment_time TIMESTAMP, -- 支払完了時刻
        delivery_time TIMESTAMP, -- 受渡完了時刻
        cancel_reason TEXT, -- キャンセル理由
        qr_code TEXT, -- QRコード文字列
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("✅ 5. ordersテーブル作成（システム要件書完全準拠）");

    // 6. 注文明細テーブル
    await client.query(`
      CREATE TABLE IF NOT EXISTS order_items (
        order_item_id SERIAL PRIMARY KEY,
        order_id INTEGER REFERENCES orders(order_id) ON DELETE CASCADE,
        product_id INTEGER REFERENCES products(product_id),
        product_name VARCHAR(100) NOT NULL, -- 商品名
        quantity INTEGER NOT NULL, -- 数量
        unit_price DECIMAL(10,2) NOT NULL, -- 単価
        total_price DECIMAL(10,2) NOT NULL, -- 小計
        toppings JSONB, -- トッピング情報（JSON形式）
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("✅ 6. order_itemsテーブル作成");

    // 7. 通知テーブル（システム要件書準拠）
    await client.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        notification_id SERIAL PRIMARY KEY,
        notification_type VARCHAR(30) NOT NULL, -- 調理完了/受渡遅延/緊急停止など
        target_order_number VARCHAR(4), -- 対象注文番号
        notification_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- 通知日時
        content TEXT NOT NULL, -- 通知内容
        priority VARCHAR(10) DEFAULT '通常' CHECK (priority IN ('緊急', '通常', '情報')), -- 重要度
        is_confirmed BOOLEAN DEFAULT FALSE, -- 確認状況
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("✅ 7. notificationsテーブル作成");

    // 8. システム設定テーブル
    await client.query(`
      CREATE TABLE IF NOT EXISTS system_settings (
        setting_id SERIAL PRIMARY KEY,
        setting_name VARCHAR(100) NOT NULL UNIQUE,
        setting_value TEXT NOT NULL,
        data_type VARCHAR(20) NOT NULL CHECK (data_type IN ('string', 'number', 'boolean', 'json')),
        description TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_by VARCHAR(50)
      );
    `);
    console.log("✅ 8. system_settingsテーブル作成");

    // 9. 商品変更履歴テーブル（システム要件書準拠）
    await client.query(`
      CREATE TABLE IF NOT EXISTS product_change_history (
        history_id SERIAL PRIMARY KEY,
        product_id INTEGER REFERENCES products(product_id),
        change_type VARCHAR(50) NOT NULL, -- 商品名/価格/有効性等
        old_value TEXT, -- 変更前の値
        new_value TEXT, -- 変更後の値
        change_reason TEXT, -- 変更理由
        changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- 変更日時
        changed_by VARCHAR(50) -- 変更者
      );
    `);
    console.log("✅ 9. product_change_historyテーブル作成");

    // インデックス作成
    const indexes = [
      `CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);`,
      `CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);`,
      `CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);`,
      `CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);`,
      `CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);`,
      `CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);`,
      `CREATE INDEX IF NOT EXISTS idx_notifications_confirmed ON notifications(is_confirmed);`,
    ];

    for (const indexSql of indexes) {
      await client.query(indexSql);
    }
    console.log("✅ インデックス作成完了");

    // 基本データ挿入（システム要件書に基づく）
    console.log("🔄 基本データを挿入中...");

    // カテゴリ挿入
    await client.query(`
      INSERT INTO categories (category_name, display_order) VALUES
      ('たこ焼き', 1),
      ('トッピング', 2),
      ('セット', 3)
      ON CONFLICT (category_name) DO NOTHING;
    `);

    // 商品挿入（システム要件書の仕様）
    await client.query(`
      INSERT INTO products (product_name, price, category_id, cooking_time, max_simultaneous_cooking, display_order) VALUES
      ('たこ焼き 8個入り', 600, 1, 8, 10, 1),
      ('たこ焼き 12個入り', 850, 1, 10, 8, 2),
      ('たこ焼き 16個入り', 1100, 1, 12, 6, 3)
      ON CONFLICT DO NOTHING;
    `);

    // トッピング挿入
    await client.query(`
      INSERT INTO toppings (topping_name, price, target_product_ids, display_order) VALUES
      ('ソース', 0, '{1,2,3}', 1),
      ('マヨネーズ', 50, '{1,2,3}', 2),
      ('青のり', 50, '{1,2,3}', 3),
      ('かつお節', 50, '{1,2,3}', 4)
      ON CONFLICT DO NOTHING;
    `);

    // システム設定挿入
    await client.query(`
      INSERT INTO system_settings (setting_name, setting_value, data_type, description) VALUES
      ('store_name', 'たこ焼き太郎', 'string', '店舗名'),
      ('operating_status', '営業中', 'string', '営業状況'),
      ('emergency_stop', 'false', 'boolean', '緊急停止状態'),
      ('max_simultaneous_orders', '20', 'number', '同時処理可能注文数'),
      ('default_cooking_time', '10', 'number', 'デフォルト調理時間'),
      ('manual_operation_mode', 'false', 'boolean', '手動運用モード')
      ON CONFLICT (setting_name) DO NOTHING;
    `);

    console.log("✅ 基本データ挿入完了");

    // 最終確認
    const finalCheck = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);

    console.log("\n📋 作成されたテーブル:");
    finalCheck.rows.forEach((row) => {
      console.log(`  ✅ ${row.table_name}`);
    });

    // ordersテーブルの構造確認
    const ordersColumns = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'orders' AND table_schema = 'public'
      ORDER BY ordinal_position;
    `);

    console.log("\n📊 ordersテーブル構造（システム要件書準拠）:");
    ordersColumns.rows.forEach((col) => {
      console.log(
        `  - ${col.column_name}: ${col.data_type} ${
          col.is_nullable === "NO" ? "(NOT NULL)" : ""
        }`
      );
    });

    console.log("\n🎉 UniFestオーダー管理システム データベース作成完了！");
    console.log("✅ 全テーブルが正常に作成されました");
    console.log("✅ システム要件書の仕様に完全準拠");
    console.log("✅ ordersテーブルが利用可能になりました");

    return true;
  } catch (error) {
    console.error("❌ エラー発生:", error.message);
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
  createUniFestOrderSystem()
    .then((success) => {
      if (success) {
        console.log("\n🎯 次のステップ:");
        console.log("  1. Renderサービスを再起動");
        console.log("  2. 統計エラーの解消を確認");
        console.log("  3. フロントエンド接続テスト");
      }
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error("❌ 致命的エラー:", error);
      process.exit(1);
    });
}

module.exports = { createUniFestOrderSystem };
