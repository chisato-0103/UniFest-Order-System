// 基本的な型定義

export interface Product {
  product_id: number;
  product_name: string;
  price: number;
  category_id: number;
  status: "有効" | "無効" | "売り切れ";
  image_url?: string;
  description?: string;
  allergy_info?: string;
  cooking_time: number;
  max_simultaneous_cooking: number;
  display_order: number;
  deleted_flag: boolean;
  created_at: string;
  updated_at: string;
  // 在庫管理関連
  stock_quantity?: number; // 現在在庫数
  initial_stock?: number; // 初期在庫数
  low_stock_threshold?: number; // 在庫少量アラートの閾値
  auto_disable_on_zero?: boolean; // 在庫0時の自動無効化
}

export interface Category {
  category_id: number;
  category_name: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Topping {
  topping_id: number;
  topping_name: string;
  price: number;
  is_active: boolean;
  target_product_ids: number[];
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  order_item_id: number;
  order_id: number;
  product_id: number;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  toppings: Topping[];
  cooking_time: number;
  cooking_instruction?: string;
  created_at: string;
  updated_at: string;
}

export interface Order {
  order_id: number;
  customer_id: number;
  order_number: string;
  items: OrderItem[];
  total_amount: number;
  status:
    | "注文受付"
    | "調理待ち"
    | "調理中"
    | "調理完了"
    | "受け取り済み"
    | "キャンセル";
  payment_status: "未払い" | "支払済み";
  payment_method: "現金" | "クレジットカード" | "PayPay" | "その他";
  estimated_pickup_time: string;
  actual_pickup_time?: string | null;
  special_instructions?: string;
  created_at: string;
  updated_at: string;
}

export type OrderStatus =
  | "注文受付"
  | "調理待ち"
  | "調理中"
  | "調理完了"
  | "受け取り済み"
  | "キャンセル";

export interface Notification {
  notification_id: number;
  notification_type: string;
  target_order_number?: string;
  notification_time: string;
  content: string;
  priority: "緊急" | "通常" | "情報";
  is_confirmed: boolean;
  created_at: string;
}

export interface SystemSetting {
  setting_id: number;
  setting_name: string;
  setting_value: string;
  data_type: "string" | "number" | "boolean";
  description?: string;
  updated_at: string;
  updated_by?: string;
}

// カート関連
export interface CartItem {
  product: Product;
  quantity: number;
  selectedToppings: Topping[];
}

export interface Cart {
  items: CartItem[];
  total: number;
}

// システム状態
export interface SystemState {
  混雑状況: "空いている" | "普通" | "混雑";
  待ち件数: number;
  緊急停止状態: boolean;
  営業状況: "営業中" | "準備中" | "終了";
  手動運用モード: boolean;
  音声通知設定: {
    有効: boolean;
    音量: number; // 0.0 - 1.0
    新規注文通知: boolean;
    調理完了通知: boolean;
    遅延アラート: boolean;
    緊急通知: boolean;
  };
}

// 調理進捗状態
export type CookingStatus =
  | "準備中"
  | "焼き開始"
  | "焼き上がり"
  | "盛り付け完了";

// 在庫管理関連型
export interface StockInfo {
  product_id: number;
  current_stock: number;
  initial_stock: number;
  reserved_stock: number; // 調理中などで予約されている在庫
  available_stock: number; // 実際に注文可能な在庫
  low_stock_threshold: number;
  last_updated: string;
  auto_management: boolean; // 自動在庫管理の有効/無効
}

export interface StockHistory {
  history_id: number;
  product_id: number;
  change_type: "増加" | "減少" | "調整" | "初期設定";
  change_amount: number;
  previous_stock: number;
  new_stock: number;
  reason: string;
  order_id?: number; // 注文による在庫変動の場合
  created_by: string;
  created_at: string;
}

export interface StockAlert {
  alert_id: number;
  product_id: number;
  alert_type: "低在庫" | "在庫切れ" | "在庫過多";
  message: string;
  is_resolved: boolean;
  created_at: string;
  resolved_at?: string;
}

// 待ち時間管理関連
export interface WaitTimeInfo {
  order_id: number;
  estimated_completion_time: string; // 予想完了時刻
  estimated_wait_minutes: number; // 予想待ち時間（分）
  current_status: "待機中" | "調理中" | "完成" | "温度管理中" | "受け渡し可能";
  cooking_start_time?: string; // 調理開始時刻
  cooking_completion_time?: string; // 調理完了時刻
  temperature_alert_time?: string; // 温度管理アラート時刻
  updated_at: string;
}

// たこ焼き器管理関連
export interface TakoyakiCooker {
  cooker_id: number;
  cooker_name: string; // "たこ焼き器1", "たこ焼き器2"など
  status: "空き" | "使用中" | "清掃中" | "故障中";
  current_order_id?: number; // 現在調理中の注文ID
  cooking_start_time?: string; // 調理開始時刻
  estimated_completion_time?: string; // 調理完了予定時刻
  max_capacity: number; // 同時調理可能数（個数）
  current_load: number; // 現在の調理負荷（個数）
  last_used_at?: string; // 最終使用時刻
  maintenance_required: boolean; // メンテナンス要否
}

// 詳細調理管理関連
export interface DetailedCookingStatus {
  order_id: number;
  cooker_id?: number; // 使用中のたこ焼き器ID
  cooking_stage:
    | "待機中"
    | "調理開始"
    | "焼き工程"
    | "焼き上がり"
    | "盛り付け"
    | "完成";
  progress_percentage: number; // 調理進捗（0-100%）
  quality_check: {
    doneness: "生焼け" | "適切" | "焼きすぎ"; // 焼き加減
    appearance: "良好" | "要確認" | "不良"; // 見た目
    temperature: "適温" | "熱すぎ" | "冷めている"; // 温度
  };
  estimated_completion_time: string;
  actual_completion_time?: string;
  created_at: string;
  updated_at: string;
}

// 温度管理関連
export interface TemperatureManagement {
  order_id: number;
  completion_time: string; // 調理完了時刻
  current_temperature_status: "熱々" | "温かい" | "やや冷め" | "冷めている";
  optimal_serving_deadline: string; // 最適な提供期限
  temperature_alerts: {
    alert_time: string;
    alert_type: "5分経過" | "10分経過" | "15分経過" | "再加熱推奨";
    is_resolved: boolean;
  }[];
  reheating_required: boolean; // 再加熱要否
  created_at: string;
  updated_at: string;
}

// 混雑状況管理
export interface CongestionStatus {
  current_wait_count: number; // 現在の待ち件数
  current_cooking_count: number; // 現在調理中件数
  average_wait_time: number; // 平均待ち時間（分）
  congestion_level: "空いている" | "やや混雑" | "混雑" | "非常に混雑";
  estimated_new_order_wait: number; // 新規注文の予想待ち時間
  cooker_utilization_rate: number; // たこ焼き器稼働率（0-100%）
  peak_time_prediction: string; // ピーク時間予測
  updated_at: string;
}

// 緊急時対応関連
export interface EmergencyState {
  is_active: boolean; // 緊急事態フラグ
  emergency_type: "システム停止" | "手動運用" | "設備故障" | "その他" | null;
  message: string; // 緊急時メッセージ
  activated_at?: string; // 緊急事態開始時刻
  activated_by?: string; // 緊急事態を開始したユーザー
  deactivated_at?: string; // 緊急事態終了時刻
  deactivated_by?: string; // 緊急事態を終了したユーザー
  auto_deactivate_at?: string; // 自動終了予定時刻
}

export interface EmergencyLog {
  log_id: number;
  emergency_type: "システム停止" | "手動運用" | "設備故障" | "その他";
  action: "開始" | "終了" | "メッセージ更新";
  message: string;
  user_name: string;
  timestamp: string;
  duration_minutes?: number; // 継続時間（分）
}

// APIレスポンス型
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

// エラー型
export interface ApiError {
  message: string;
  code?: string;
  status?: number;
}
