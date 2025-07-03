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
  subtotal: number;
  toppings?: OrderTopping[];
  cooking_status: CookingStatus;
  cooking_start_time?: string;
  cooking_completion_time?: string;
  created_at: string;
  updated_at: string;

  // CustomerStatusPageで使用される追加プロパティ
  total_price: number; // subtotalのエイリアス
  cooking_time: number;
  cooking_instruction: string;
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
  order_status: OrderStatus;
  payment_status: PaymentStatus;
  total_price: number;
  order_items: OrderItem[];
  estimated_completion_time?: string;
  actual_completion_time?: string;
  pickup_time?: string;
  special_requests?: string;
  qr_code?: string;
  created_at: string;
  updated_at: string;

  // CustomerStatusPageで使用される追加プロパティ
  items: OrderItem[]; // order_itemsのエイリアス
  total_amount: number; // total_priceのエイリアス
  status: OrderStatus; // order_statusのエイリアス
  payment_method: string;
  estimated_pickup_time: string;
  actual_pickup_time?: string;
  special_instructions?: string;
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
export type CongestionStatus = "空いている" | "やや混雑" | "混雑" | "大変混雑";

export interface CongestionInfo {
  status: CongestionStatus;
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
  | "注文受付"
  | "調理待ち"
  | "調理中"
  | "調理完了"
  | "受け渡し完了"
  | "受け取り済み"
  | "キャンセル";
export type PaymentStatus = "未払い" | "支払い済み" | "返金";
export type CookingStatus = "待機中" | "調理中" | "完成" | "温度管理中";
