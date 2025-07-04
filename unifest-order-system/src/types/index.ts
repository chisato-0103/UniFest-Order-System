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
  total_price: number; // データベースに合わせて統一
  toppings?: OrderTopping[];
  cooking_time: number;
  cooking_instruction?: string;
  created_at: string;
  updated_at: string;

  // 下位互換性のためのエイリアス
  subtotal?: number; // total_priceのエイリアス
  cooking_status?: CookingStatus; // 調理状況（フロントエンド用）
  cooking_start_time?: string; // 調理開始時刻
  cooking_completion_time?: string; // 調理完了時刻
}

export interface OrderTopping {
  order_topping_id: number;
  order_item_id: number;
  topping_id: number;
  topping_name: string;
  price: number;
  created_at: string;

  // CustomerStatusPageで使用される追加プロパティ
  is_active: boolean;
  target_product_ids: number[];
  display_order: number;
  updated_at: string;
}

export interface Order {
  order_id: number;
  order_number: string;
  customer_id?: number;
  total_amount: number; // データベースに合わせて統一
  status: OrderStatus; // データベースに合わせて統一
  payment_status: PaymentStatus;
  payment_method?: string;
  estimated_pickup_time?: string;
  actual_pickup_time?: string;
  special_instructions?: string;
  cooking_start_time?: string;
  cooking_completion_time?: string;
  cancel_reason?: string;
  qr_code?: string;
  created_at: string;
  updated_at: string;

  // 関連データ
  order_items?: OrderItem[];

  // 下位互換性のためのエイリアス
  items?: OrderItem[]; // order_itemsのエイリアス
  total_price?: number; // total_amountのエイリアス
  order_status?: OrderStatus; // statusのエイリアス
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

// 混雑状況管理
export interface CongestionInfo {
  status: "空いている" | "やや混雑" | "混雑" | "大変混雑";
  waiting_orders: number;
  estimated_wait_minutes: number;
  last_updated: string;
}

// たこ焼き器管理関連
export interface TakoyakiCooker {
  cooker_id: number;
  cooker_name: string; // "たこ焼き器1", "たこ焼き器2"など
  status: "空き" | "使用中" | "清掃中" | "故障中";
  current_order_id?: number; // 現在調理中の注文ID
  cooking_start_time?: string; // 調理開始時刻
  estimated_completion_time?: string; // 予想完了時刻
  temperature: number; // 現在の温度
  optimal_temperature_range: { min: number; max: number }; // 最適温度範囲
  last_cleaned_at?: string; // 最終清掃時刻
  maintenance_notes?: string; // メンテナンス記録
  created_at: string;
  updated_at: string;
}

// システム設定
export interface SystemSettings {
  setting_id: number;
  setting_key: string;
  setting_value: string;
  description?: string;
  updated_by?: string;
  updated_at: string;
}

// 在庫管理
export interface StockLog {
  stock_log_id: number;
  product_id: number;
  change_type: "入庫" | "出庫" | "調整" | "廃棄";
  quantity_change: number;
  previous_quantity: number;
  new_quantity: number;
  reason?: string;
  performed_by?: string;
  created_at: string;
}

// 調理ログ
export interface CookingLog {
  cooking_log_id: number;
  order_id: number;
  cooker_id: number;
  cooking_start_time: string;
  cooking_completion_time?: string;
  cooking_duration_minutes?: number;
  temperature_readings?: TemperatureReading[];
  quality_rating?: number; // 1-5の品質評価
  notes?: string;
  performed_by?: string;
  created_at: string;
}

export interface TemperatureReading {
  timestamp: string;
  temperature: number;
  cooker_id: number;
}

// 統計・分析用データ
export interface OrderStatistics {
  total_orders: number;
  total_revenue: number;
  average_order_value: number;
  average_cooking_time: number;
  peak_hours: Array<{ hour: number; order_count: number }>;
  popular_products: Array<{
    product_id: number;
    product_name: string;
    quantity_sold: number;
  }>;
  date_range: { start: string; end: string };
  last_updated: string;
}

// UI状態管理用
export interface AppState {
  // 注文関連
  orders: Order[];
  currentOrder?: Order;
  waitTimeInfo: WaitTimeInfo[];
  congestionStatus: CongestionInfo;

  // 商品・カテゴリ関連
  products: Product[];
  categories: Category[];
  toppings: Topping[];

  // 調理・厨房関連
  takoyakiCookers: TakoyakiCooker[];
  cookingLogs: CookingLog[];

  // システム関連
  systemSettings: SystemSettings[];
  stockLogs: StockLog[];
  statistics: OrderStatistics;

  // UI状態
  loading: boolean;
  error?: string;
  notifications: NotificationData[];
}

// 通知システム
export interface NotificationData {
  id: number;
  title: string;
  content: string;
  priority: "緊急" | "通常" | "低";
  category: "注文" | "調理" | "在庫" | "システム" | "緊急";
  target_user_types: Array<
    "customer" | "kitchen" | "cashier" | "pickup" | "admin"
  >;
  is_read: boolean;
  created_at: string;
  expires_at?: string;
}

// Socket.io通信用型定義
export interface SocketEventData {
  type: string;
  data: Record<string, unknown>;
  timestamp: string;
  user_type?: "customer" | "kitchen" | "cashier" | "pickup" | "admin";
}

// フォーム用型定義
export interface ProductFormData {
  product_name: string;
  price: number;
  category_id: number;
  description?: string;
  allergy_info?: string;
  cooking_time: number;
  max_simultaneous_cooking: number;
  initial_stock?: number;
  low_stock_threshold?: number;
}

export interface OrderFormData {
  items: Array<{
    product_id: number;
    quantity: number;
    toppings: number[];
  }>;
  special_requests?: string;
}

// API レスポンス用型定義
export interface ApiResponse<T = Record<string, unknown>> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// エラーハンドリング用
export interface AppError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  timestamp: string;
}

// ステータス関連の型定義
export type OrderStatus =
  | "pending" // 注文受付
  | "waiting" // 調理待ち
  | "cooking" // 調理中
  | "completed" // 調理完了
  | "delivered" // 受け渡し完了
  | "picked_up" // 受け取り済み
  | "cancelled" // キャンセル
  | "注文受付"
  | "調理待ち"
  | "調理中"
  | "調理完了"
  | "受け渡し完了"
  | "受け取り済み"
  | "キャンセル";
export type PaymentStatus =
  | "unpaid" // 未払い
  | "paid" // 支払い済み
  | "refunded" // 返金
  | "未払い"
  | "支払い済み"
  | "返金";
export type CookingStatus =
  | "waiting" // 待機中
  | "cooking" // 調理中
  | "completed" // 完成
  | "warming" // 温度管理中
  | "待機中"
  | "調理中"
  | "完成"
  | "温度管理中";

// 在庫管理関連の型定義
export interface StockInfo {
  product_id: number;
  current_stock: number;
  initial_stock: number;
  reserved_stock: number;
  available_stock: number;
  low_stock_threshold: number;
  last_updated: string;
  auto_management: boolean;
}

export interface StockHistory {
  history_id: number;
  product_id: number;
  action_type: "入荷" | "消費" | "廃棄" | "調整";
  change_type: "増加" | "減少";
  change_amount: number;
  quantity_change: number;
  previous_stock: number;
  new_stock: number;
  before_quantity: number;
  after_quantity: number;
  reason: string;
  performed_by: string;
  created_by: string;
  created_at: string;
}

export interface StockAlert {
  alert_id: number;
  product_id: number;
  alert_type: "在庫不足" | "在庫切れ";
  message: string;
  is_resolved: boolean;
  created_at: string;
  resolved_at?: string;
}

// 緊急時対応関連の型定義
export interface EmergencyState {
  is_active: boolean;
  emergency_type: "システム停止" | "在庫切れ" | "機器故障" | "その他" | null;
  message: string;
  activated_at?: string;
  activated_by?: string;
  deactivated_at?: string;
  deactivated_by?: string;
  auto_deactivate_at?: string;
}

export interface EmergencyLog {
  log_id: number;
  emergency_type: EmergencyState["emergency_type"];
  action: "緊急停止" | "復旧" | "メッセージ更新";
  message: string;
  performed_by: string;
  timestamp: string;
}

// 混雑状況関連の型定義
export interface CongestionStatus {
  current_wait_count: number;
  current_cooking_count: number;
  average_wait_time: number;
  congestion_level: "空いている" | "やや混雑" | "混雑" | "非常に混雑";
  estimated_new_order_wait: number;
  cooker_utilization_rate: number;
  peak_time_prediction: string;
  updated_at: string;
}

// たこ焼き器管理関連の型定義
export interface TakoyakiCooker {
  cooker_id: number;
  cooker_name: string;
  status: "空き" | "使用中" | "清掃中" | "故障中";
  current_order_id?: number;
  capacity: number;
  current_load: number;
  max_capacity: number;
  temperature: number;
  last_maintenance: string;
  maintenance_required: boolean;
  estimated_completion_time?: string;
  last_used_at?: string;
  created_at: string;
  updated_at: string;
}

export interface WaitTimeInfo {
  order_id: number;
  estimated_wait_minutes: number;
  current_status: "調理中" | "待機中" | "完成" | "温度管理中" | "受け渡し可能";
  priority_level: "normal" | "high" | "urgent";
  cooking_start_time?: string;
  cooking_completion_time?: string;
  last_updated: string;
}

export interface DetailedCookingStatus {
  order_id: number;
  cooker_id: number;
  cooking_phase: "準備" | "調理" | "仕上げ" | "完成";
  progress_percentage: number;
  estimated_remaining_minutes: number;
  temperature_status: "適温" | "加熱中" | "過熱";
  last_updated: string;
}

export interface TemperatureManagement {
  cooker_id: number;
  current_temperature: number;
  target_temperature: number;
  temperature_status: "適温" | "加熱中" | "過熱" | "冷却中";
  last_check: string;
  alert_level: "normal" | "warning" | "critical";
}

// カート関連の型定義
export interface Cart {
  items: CartItem[];
  total: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedToppings: Topping[];
}

// システム状態関連の型定義
export interface SystemState {
  混雑状況: "空いている" | "普通" | "混雑";
  待ち件数: number;
  緊急停止状態: boolean;
  営業状況: "営業中" | "営業終了" | "準備中";
  手動運用モード: boolean;
  音声通知設定: {
    有効: boolean;
    音量: number;
    新規注文通知: boolean;
    調理完了通知: boolean;
    遅延アラート: boolean;
    緊急通知: boolean;
  };
}

// 通知関連の型定義
export interface Notification {
  notification_id: number;
  notification_type:
    | "new_order"
    | "order_status_update"
    | "low_stock"
    | "system_alert";
  target_order_number?: string;
  notification_time: string;
  content: string;
  priority: "緊急" | "通常";
  is_confirmed: boolean;
  created_at: string;
}
