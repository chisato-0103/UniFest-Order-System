-- データベース初期化とテーブル作成スクリプト
-- 既存のテーブルを削除してから再作成

-- 既存テーブルの削除（外部キー制約の順序に注意）
DROP TABLE IF EXISTS emergency_logs;
DROP TABLE IF EXISTS stock_logs;
DROP TABLE IF EXISTS cooking_logs;
DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS system_settings;
DROP TABLE IF EXISTS activity_logs;
DROP TABLE IF EXISTS toppings;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS categories;

-- 拡張機能の有効化
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- カテゴリテーブル
CREATE TABLE categories (
    category_id SERIAL PRIMARY KEY,
    category_name VARCHAR(50) NOT NULL,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 商品テーブル
CREATE TABLE products (
    product_id SERIAL PRIMARY KEY,
    product_name VARCHAR(100) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    category_id INTEGER REFERENCES categories(category_id),
    status VARCHAR(20) NOT NULL DEFAULT '有効' CHECK (status IN ('有効', '無効', '売り切れ')),
    image_url VARCHAR(255),
    description TEXT,
    allergy_info TEXT,
    cooking_time INTEGER DEFAULT 10, -- 分
    max_simultaneous_cooking INTEGER DEFAULT 5,
    display_order INTEGER DEFAULT 0,
    deleted_flag BOOLEAN DEFAULT FALSE,
    -- 在庫管理
    stock_quantity INTEGER DEFAULT 0,
    initial_stock INTEGER DEFAULT 0,
    low_stock_threshold INTEGER DEFAULT 10,
    auto_disable_on_zero BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- トッピングテーブル
CREATE TABLE toppings (
    topping_id SERIAL PRIMARY KEY,
    topping_name VARCHAR(50) NOT NULL,
    price DECIMAL(10,2) NOT NULL DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    target_product_ids INTEGER[],
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 注文テーブル
CREATE TABLE orders (
    order_id SERIAL PRIMARY KEY,
    customer_id INTEGER,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT '注文受付'
        CHECK (status IN ('注文受付', '調理待ち', '調理中', '調理完了', '受け取り済み', 'キャンセル')),
    payment_status VARCHAR(20) NOT NULL DEFAULT '未払い'
        CHECK (payment_status IN ('未払い', '支払済み')),
    payment_method VARCHAR(30) DEFAULT '現金',
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

-- 注文商品テーブル
CREATE TABLE order_items (
    order_item_id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(order_id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(product_id),
    product_name VARCHAR(100) NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    toppings JSONB DEFAULT '[]',
    cooking_time INTEGER DEFAULT 10,
    cooking_instruction TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 通知テーブル
CREATE TABLE notifications (
    notification_id SERIAL PRIMARY KEY,
    notification_type VARCHAR(50) NOT NULL,
    target_order_number VARCHAR(50),
    notification_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    content TEXT NOT NULL,
    priority VARCHAR(10) DEFAULT '通常' CHECK (priority IN ('緊急', '通常', '情報')),
    is_confirmed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- システム設定テーブル
CREATE TABLE system_settings (
    setting_id SERIAL PRIMARY KEY,
    setting_name VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT NOT NULL,
    data_type VARCHAR(20) DEFAULT 'string' CHECK (data_type IN ('string', 'number', 'boolean', 'json')),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- アクティビティログテーブル
CREATE TABLE activity_logs (
    log_id SERIAL PRIMARY KEY,
    action_type VARCHAR(50) NOT NULL,
    target_table VARCHAR(50),
    target_id INTEGER,
    user_id INTEGER,
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 調理ログテーブル（SocketHandlers用）
CREATE TABLE cooking_logs (
    log_id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(order_id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL CHECK (status IN ('started', 'progress', 'completed', 'cancelled')),
    estimated_time INTEGER, -- 予想調理時間（分）
    actual_time INTEGER, -- 実際の調理時間（分）
    staff_name VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 在庫ログテーブル
CREATE TABLE stock_logs (
    log_id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(product_id) ON DELETE CASCADE,
    change_type VARCHAR(20) NOT NULL CHECK (change_type IN ('increase', 'decrease', 'set', 'adjust')),
    quantity_before INTEGER,
    quantity_change INTEGER,
    quantity_after INTEGER,
    reason VARCHAR(100),
    staff_name VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 緊急対応ログテーブル
CREATE TABLE emergency_logs (
    log_id SERIAL PRIMARY KEY,
    event_type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    description TEXT NOT NULL,
    initiated_by VARCHAR(50),
    resolved_by VARCHAR(50),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'cancelled')),
    resolution_notes TEXT,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- インデックスの作成
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_payment_status ON orders(payment_status);
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_orders_order_number ON orders(order_number);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at);

-- 更新時間の自動更新トリガー関数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 更新時間の自動更新トリガー
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_toppings_updated_at BEFORE UPDATE ON toppings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_order_items_updated_at BEFORE UPDATE ON order_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_system_settings_updated_at BEFORE UPDATE ON system_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 初期データの投入

-- カテゴリデータ
INSERT INTO categories (category_name, display_order) VALUES
('たこ焼き', 1),
('トッピング', 2),
('ドリンク', 3);

-- 商品データ
INSERT INTO products (product_name, price, category_id, cooking_time, stock_quantity, initial_stock) VALUES
('たこ焼き 8個入り', 400, 1, 8, 100, 100),
('たこ焼き 12個入り', 600, 1, 10, 80, 80),
('たこ焼き 16個入り', 800, 1, 12, 60, 60);

-- トッピングデータ
INSERT INTO toppings (topping_name, price, target_product_ids) VALUES
('ソース', 0, ARRAY[1, 2, 3]),
('マヨネーズ', 50, ARRAY[1, 2, 3]),
('青のり', 0, ARRAY[1, 2, 3]),
('かつお節', 0, ARRAY[1, 2, 3]),
('チーズ', 100, ARRAY[1, 2, 3]);

-- システム設定データ
INSERT INTO system_settings (setting_name, setting_value, data_type, description) VALUES
('store_name', '大学祭たこ焼き店', 'string', '店舗名'),
('operating_hours_start', '10:00', 'string', '営業開始時間'),
('operating_hours_end', '18:00', 'string', '営業終了時間'),
('max_cooking_devices', '3', 'number', '調理器具数'),
('sound_notifications', 'true', 'boolean', '音声通知の有効/無効'),
('emergency_mode', 'false', 'boolean', '緊急モード'),
('auto_refresh_interval', '5', 'number', '自動更新間隔（秒）'),
('low_stock_alert_threshold', '10', 'number', '在庫不足アラート閾値'),
('max_simultaneous_orders', '20', 'number', '同時処理可能注文数'),
('default_cooking_time', '10', 'number', 'デフォルト調理時間（分）');

-- 完了メッセージ
SELECT 'Database schema created successfully!' AS message;
