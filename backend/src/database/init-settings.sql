-- システム初期設定データ投入スクリプト
-- 要件定義書に基づいた基本設定値を設定

-- 基本設定
INSERT INTO system_settings (setting_name, setting_value, data_type, description) VALUES
-- 営業設定
('store_name', '大学祭たこ焼き店', 'string', '店舗名'),
('store_status', 'preparing', 'string', '営業状態（open/preparing/closed）'),
('accept_orders', 'true', 'boolean', '注文受付状態'),
('emergency_mode', 'false', 'boolean', '緊急モード'),

-- 調理設定
('kitchen_capacity', '3', 'number', 'たこ焼き器の台数'),
('max_simultaneous_cooking', '15', 'number', '同時調理可能数（一度に作れるたこ焼きセット数）'),
('default_cooking_time', '10', 'number', '標準調理時間（分）'),
('temperature_alert_time', '15', 'number', '温度管理アラート時間（分）'),

-- 通知設定
('audio_notifications_enabled', 'true', 'boolean', '音声通知の有効/無効'),
('notification_volume', '70', 'number', '通知音量（0-100）'),
('auto_notifications', 'true', 'boolean', '自動通知の有効/無効'),
('notification_language', 'ja', 'string', '通知言語'),

-- 表示設定
('queue_display_limit', '10', 'number', '待ち行列表示件数'),
('order_display_time', '30', 'number', '注文表示時間（秒）'),
('congestion_threshold_low', '5', 'number', '混雑度判定：普通（件数）'),
('congestion_threshold_high', '10', 'number', '混雑度判定：混雑（件数）'),

-- 運用設定
('max_orders_per_hour', '60', 'number', '1時間あたり最大注文数'),
('daily_order_count', '0', 'number', '本日の注文件数'),
('last_reset_date', CURRENT_DATE::text, 'string', '最終リセット日'),

-- QRコード設定
('qr_code_enabled', 'true', 'boolean', 'QRコード生成の有効/無効'),
('customer_check_url', 'https://unifest-order.onrender.com/customer', 'string', 'お客様確認画面URL'),

-- 安全・品質設定
('max_cooking_temperature_time', '20', 'number', '最大調理後経過時間（分）'),
('quality_check_interval', '5', 'number', '品質チェック間隔（分）'),
('emergency_contact', '大学祭実行委員会', 'string', '緊急連絡先'),

-- データ管理設定
('auto_backup_enabled', 'true', 'boolean', '自動バックアップの有効/無効'),
('backup_interval_hours', '6', 'number', 'バックアップ間隔（時間）'),
('data_retention_days', '30', 'number', 'データ保持期間（日）')

ON CONFLICT (setting_name) DO UPDATE SET
setting_value = EXCLUDED.setting_value,
updated_at = CURRENT_TIMESTAMP;

-- 商品の初期在庫を設定（既存商品がある場合）
UPDATE products SET
  stock_quantity = initial_stock,
  low_stock_threshold = CASE
    WHEN product_name LIKE '%8個%' THEN 20
    WHEN product_name LIKE '%12個%' THEN 15
    WHEN product_name LIKE '%16個%' THEN 10
    ELSE 10
  END,
  auto_disable_on_zero = true
WHERE deleted_flag = false;

-- システム初期化完了メッセージ
SELECT 'システム初期設定が完了しました。' as message,
       COUNT(*) || '件の設定が投入されました。' as settings_count
FROM system_settings;
