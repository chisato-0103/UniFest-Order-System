
-- UniFest Order System Database Schema
-- 大学祭たこ焼き店舗向けオーダー管理システム

-- 既存のテーブルを削除
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS toppings CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS system_settings CASCADE;
DROP TABLE IF EXISTS stock_history CASCADE;
DROP TABLE IF EXISTS stock_alerts CASCADE;
DROP TABLE IF EXISTS product_change_history CASCADE;
DROP TABLE IF EXISTS takoyaki_cookers CASCADE;
DROP TABLE IF EXISTS emergency_states CASCADE;
DROP TABLE IF EXISTS emergency_logs CASCADE;


-- 拡張機能の有効化
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- テーブル作成
CREATE TABLE categories (
    category_id SERIAL PRIMARY KEY,
    category_name VARCHAR(50) NOT NULL,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

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
    stock_quantity INTEGER DEFAULT 0,
    initial_stock INTEGER DEFAULT 0,
    low_stock_threshold INTEGER DEFAULT 10,
    auto_disable_on_zero BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

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
    qr_code TEXT, -- QRコード文字列
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE order_items (
    order_item_id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(order_id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(product_id),
    product_name VARCHAR(100) NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    toppings JSONB, -- トッピング情報をJSONで保存
    cooking_time INTEGER, -- この商品の調理時間
    cooking_instruction TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE notifications (
    notification_id SERIAL PRIMARY KEY,
    notification_type VARCHAR(30) NOT NULL,
    target_order_number VARCHAR(4),
    notification_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    content TEXT NOT NULL,
    priority VARCHAR(10) DEFAULT '通常' CHECK (priority IN ('緊急', '通常', '情報')),
    is_confirmed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE system_settings (
    setting_id SERIAL PRIMARY KEY,
    setting_name VARCHAR(100) NOT NULL UNIQUE,
    setting_value TEXT NOT NULL,
    data_type VARCHAR(20) NOT NULL CHECK (data_type IN ('string', 'number', 'boolean', 'json')),
    description TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(50)
);

CREATE TABLE stock_history (
    history_id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(product_id),
    change_type VARCHAR(20) NOT NULL CHECK (change_type IN ('入荷', '注文減少', '手動調整', '初期設定')),
    quantity_before INTEGER,
    quantity_after INTEGER,
    change_amount INTEGER,
    reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(50)
);

CREATE TABLE stock_alerts (
    alert_id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(product_id),
    alert_type VARCHAR(20) NOT NULL CHECK (alert_type IN ('低在庫', '在庫切れ', '過剰在庫')),
    current_stock INTEGER,
    threshold_value INTEGER,
    message TEXT,
    is_resolved BOOLEAN DEFAULT FALSE,
    resolved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE product_change_history (
    history_id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(product_id),
    change_type VARCHAR(50) NOT NULL,
    field_name VARCHAR(50),
    old_value TEXT,
    new_value TEXT,
    change_reason TEXT,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    changed_by VARCHAR(50)
);

CREATE TABLE takoyaki_cookers (
    cooker_id SERIAL PRIMARY KEY,
    cooker_name VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT '空き'
        CHECK (status IN ('空き', '使用中', '清掃中', '故障中')),
    current_order_id INTEGER REFERENCES orders(order_id),
    cooking_start_time TIMESTAMP,
    estimated_completion_time TIMESTAMP,
    max_capacity INTEGER DEFAULT 20, -- 同時調理可能数（個数）
    current_load INTEGER DEFAULT 0, -- 現在の調理負荷（個数）
    last_used_at TIMESTAMP,
    maintenance_required BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE emergency_states (
    emergency_id SERIAL PRIMARY KEY,
    is_active BOOLEAN DEFAULT FALSE,
    emergency_type VARCHAR(20) CHECK (emergency_type IN ('システム停止', '手動運用', '設備故障', 'その他')),
    message TEXT,
    activated_at TIMESTAMP,
    activated_by VARCHAR(50),
    deactivated_at TIMESTAMP,
    deactivated_by VARCHAR(50),
    auto_deactivate_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE emergency_logs (
    log_id SERIAL PRIMARY KEY,
    emergency_type VARCHAR(20) NOT NULL,
    action VARCHAR(20) NOT NULL CHECK (action IN ('開始', '終了', 'メッセージ更新')),
    message TEXT NOT NULL,
    user_name VARCHAR(50) NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    duration_minutes INTEGER
);

-- インデックスの作成
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_notifications_confirmed ON notifications(is_confirmed);
CREATE INDEX IF NOT EXISTS idx_stock_history_product_id ON stock_history(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_alerts_resolved ON stock_alerts(is_resolved);

-- 更新時刻の自動更新トリガー関数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 在庫自動減少トリガー関数
CREATE OR REPLACE FUNCTION decrease_stock_on_order()
RETURNS TRIGGER AS $$
BEGIN
    -- 商品の在庫を減少
    UPDATE products
    SET stock_quantity = stock_quantity - NEW.quantity
    WHERE product_id = NEW.product_id;

    -- 在庫履歴を記録
    INSERT INTO stock_history (product_id, change_type, quantity_before, quantity_after, change_amount, reason)
    SELECT
        NEW.product_id,
        '注文減少',
        stock_quantity + NEW.quantity,
        stock_quantity,
        -NEW.quantity,
        'Order ID: ' || NEW.order_id
    FROM products
    WHERE product_id = NEW.product_id;

    -- 低在庫アラートチェック
    INSERT INTO stock_alerts (product_id, alert_type, current_stock, threshold_value, message)
    SELECT
        p.product_id,
        CASE
            WHEN p.stock_quantity <= 0 THEN '在庫切れ'
            WHEN p.stock_quantity <= p.low_stock_threshold THEN '低在庫'
        END,
        p.stock_quantity,
        p.low_stock_threshold,
        CASE
            WHEN p.stock_quantity <= 0 THEN p.product_name || 'の在庫が切れました'
            WHEN p.stock_quantity <= p.low_stock_threshold THEN p.product_name || 'の在庫が少なくなりました'
        END
    FROM products p
    WHERE p.product_id = NEW.product_id
    AND p.stock_quantity <= p.low_stock_threshold
    AND NOT EXISTS (
        SELECT 1 FROM stock_alerts sa
        WHERE sa.product_id = p.product_id
        AND sa.is_resolved = FALSE
        AND sa.created_at > CURRENT_DATE
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 注文番号生成関数
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS VARCHAR(4) AS $$
DECLARE
    new_number VARCHAR(4);
    exists_check INTEGER;
BEGIN
    LOOP
        -- T001〜T999の範囲でランダム生成
        new_number := 'T' || LPAD((FLOOR(RANDOM() * 999) + 1)::TEXT, 3, '0');

        -- 既存チェック
        SELECT COUNT(*) INTO exists_check
        FROM orders
        WHERE order_number = new_number
        AND DATE(created_at) = CURRENT_DATE;

        -- 重複がなければ終了
        EXIT WHEN exists_check = 0;
    END LOOP;

    RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- 更新時刻トリガーの設定
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_toppings_updated_at BEFORE UPDATE ON toppings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_order_items_updated_at BEFORE UPDATE ON order_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_system_settings_updated_at BEFORE UPDATE ON system_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_takoyaki_cookers_updated_at BEFORE UPDATE ON takoyaki_cookers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_emergency_states_updated_at BEFORE UPDATE ON emergency_states FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 在庫減少トリガーの設定
CREATE TRIGGER trigger_decrease_stock_on_order
    AFTER INSERT ON order_items
    FOR EACH ROW EXECUTE FUNCTION decrease_stock_on_order();

-- 初期データの投入
INSERT INTO categories (category_name, display_order) VALUES
('たこ焼き', 1),
('ドリンク', 2),
('サイドメニュー', 3);

INSERT INTO products (product_name, price, category_id, cooking_time, max_simultaneous_cooking, stock_quantity, initial_stock, display_order) VALUES
('たこ焼き 8個入り', 600, 1, 8, 10, 100, 100, 1),
('たこ焼き 12個入り', 850, 1, 10, 8, 80, 80, 2),
('たこ焼き 16個入り', 1100, 1, 12, 6, 60, 60, 3);

INSERT INTO toppings (topping_name, price, target_product_ids, display_order) VALUES
('青のり', 50, '{1,2,3}', 1),
('かつお節', 50, '{1,2,3}', 2),
('マヨネーズ', 50, '{1,2,3}', 3),
('特製ソース', 0, '{1,2,3}', 4);

INSERT INTO system_settings (setting_name, setting_value, data_type, description) VALUES
('store_name', 'たこ焼き太郎', 'string', '店舗名'),
('operating_hours_start', '10:00', 'string', '営業開始時間'),
('operating_hours_end', '18:00', 'string', '営業終了時間'),
('max_simultaneous_orders', '20', 'number', '同時処理可能注文数'),
('default_cooking_time', '10', 'number', 'デフォルト調理時間（分）'),
('audio_notifications_enabled', 'true', 'boolean', '音声通知有効'),
('notification_volume', '0.7', 'number', '通知音量'),
('operating_status', '営業中', 'string', '営業状況'),
('emergency_stop', 'false', 'boolean', '緊急停止状態');

INSERT INTO takoyaki_cookers (cooker_name, max_capacity) VALUES
('たこ焼き器1号', 20),
('たこ焼き器2号', 20),
('たこ焼き器3号', 20);
