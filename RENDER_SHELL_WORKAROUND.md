# 🔧 Render Shell 制限対応ガイド

## 🚨 現在の状況

- Render 無料プランでは Shell アクセスが制限されている
- 手動でのスクリプト実行ができない
- orders テーブルが未作成の状態

## ✅ 代替解決方法

### 方法 1: サーバー起動時の強制初期化

**概要:** サーバー起動時に必ず orders テーブルを作成するよう修正

**実装済み内容:**

- 次回デプロイ時にサーバー起動で自動的に orders テーブル作成
- 失敗してもサーバーは継続起動
- 詳細ログで問題を特定

### 方法 2: ローカルからのリモート接続

**手順:**

1. ローカル環境で以下を実行:

```bash
# backend/.envファイルを作成
echo "DATABASE_URL=YOUR_RENDER_DATABASE_URL" > backend/.env

# ローカルからRenderデータベースに接続してテーブル作成
cd backend
npm run create-orders-table
```

**必要情報:**

- Render ダッシュボードから DATABASE_URL をコピー
- External Database URL を使用

### 方法 3: データベース管理ツールの使用

**pgAdmin / DBeaver 等を使用:**

1. **接続情報:**

   - Host: `dpg-d1jj1424d50c7382va8g-a.oregon-postgres.render.com`
   - Port: `5432`
   - Database: `unifest_db`
   - Username: `unifest_db_user`
   - Password: (Render ダッシュボードで確認)

2. **実行する SQL:**

```sql
-- UUIDエクステンション
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- categoriesテーブル
CREATE TABLE IF NOT EXISTS categories (
    category_id SERIAL PRIMARY KEY,
    category_name VARCHAR(50) NOT NULL,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- productsテーブル
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

-- ordersテーブル
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

-- order_itemsテーブル
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

-- インデックス
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);

-- 基本データ
INSERT INTO categories (category_name, display_order)
VALUES ('たこ焼き', 1), ('ドリンク', 2), ('サイドメニュー', 3)
ON CONFLICT DO NOTHING;

INSERT INTO products (product_name, price, category_id, cooking_time, stock_quantity)
VALUES
  ('たこ焼き 8個入り', 600, 1, 8, 100),
  ('たこ焼き 12個入り', 850, 1, 10, 80),
  ('たこ焼き 16個入り', 1100, 1, 12, 60)
ON CONFLICT DO NOTHING;
```

### 方法 4: Render 有料プランへのアップグレード

**最も確実な方法:**

- Render Pro Plan ($7/月) で Shell アクセス可能
- 即座に問題解決
- 今後の運用も楽になる

## 🎯 推奨解決手順

### 1. まず方法 2（ローカル接続）を試す

- 最も簡単で確実
- すぐに実行可能

### 2. 方法 3（SQL 直接実行）をバックアップとして

- pgAdmin や DBeaver 使用
- GUI 操作で安全

### 3. 長期的には方法 4 を検討

- 開発効率向上
- 本格運用には必要

## 📞 サポート

解決しない場合は以下の情報をお知らせください：

- 選択した方法
- 発生したエラーメッセージ
- 接続状況

---

**最優先:** 方法 2 のローカル接続を今すぐ試してください！
