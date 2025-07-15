// データベースエンティティの型定義

export interface Category {
  category_id: number;
  category_name: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

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
  stock_quantity: number;
  initial_stock: number;
  low_stock_threshold: number;
  auto_disable_on_zero: boolean;
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

export interface Order {
  order_id: number;
  customer_id?: number;
  order_number: string;
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
  estimated_pickup_time?: string;
  actual_pickup_time?: string;
  special_instructions?: string;
  cooking_start_time?: string;
  cooking_completion_time?: string;
  cancel_reason?: string;
  qr_code?: string;
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
  toppings: any; // JSONB
  cooking_time: number;
  cooking_instruction?: string;
  created_at: string;
  updated_at: string;
}

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
  data_type: "string" | "number" | "boolean" | "json";
  description?: string;
  updated_at: string;
  updated_by?: string;
}

export interface StockHistory {
  history_id: number;
  product_id: number;
  change_type: "入荷" | "注文減少" | "手動調整" | "初期設定";
  quantity_before: number;
  quantity_after: number;
  change_amount: number;
  reason?: string;
  created_at: string;
  created_by?: string;
}

export interface StockAlert {
  alert_id: number;
  product_id: number;
  alert_type: "低在庫" | "在庫切れ" | "過剰在庫";
  current_stock: number;
  threshold_value: number;
  message: string;
  is_resolved: boolean;
  resolved_at?: string;
  created_at: string;
}

export interface TakoyakiCooker {
  cooker_id: number;
  cooker_name: string;
  status: "空き" | "使用中" | "清掃中" | "故障中";
  current_order_id?: number;
  cooking_start_time?: string;
  estimated_completion_time?: string;
  max_capacity: number;
  current_load: number;
  last_used_at?: string;
  maintenance_required: boolean;
  created_at: string;
  updated_at: string;
}

export interface EmergencyState {
  emergency_id: number;
  is_active: boolean;
  emergency_type?: "システム停止" | "手動運用" | "設備故障" | "その他";
  message?: string;
  activated_at?: string;
  activated_by?: string;
  deactivated_at?: string;
  deactivated_by?: string;
  auto_deactivate_at?: string;
  created_at: string;
  updated_at: string;
}

export interface EmergencyLog {
  log_id: number;
  emergency_type: "システム停止" | "手動運用" | "設備故障" | "その他";
  action: "開始" | "終了" | "メッセージ更新";
  message: string;
  user_name: string;
  timestamp: string;
  duration_minutes?: number;
}

// API関連の型定義
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  timestamp: string;
}

export interface ApiError {
  success: false;
  error: {
    message: string;
    code?: string;
    status: number;
    timestamp: string;
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// リクエスト関連の型定義
export interface CreateOrderRequest {
  items: {
    product_id: number;
    quantity: number;
    toppings: number[];
  }[];
  special_instructions?: string;
  payment_method?: Order["payment_method"];
}

export interface UpdateOrderStatusRequest {
  status: Order["status"];
  cooking_start_time?: string;
  cooking_completion_time?: string;
  cancel_reason?: string;
}

export interface CreateProductRequest {
  product_name: string;
  price: number;
  category_id: number;
  description?: string;
  allergy_info?: string;
  cooking_time: number;
  max_simultaneous_cooking: number;
  stock_quantity: number;
  low_stock_threshold: number;
}

export interface UpdateStockRequest {
  product_id: number;
  quantity: number;
  change_type: StockHistory["change_type"];
  reason?: string;
}

// Socket.IO イベントの型定義
export interface SocketEvents {
  // クライアント → サーバー
  "order-update": (data: { order_id: number; status: Order["status"] }) => void;
  "cooking-completed": (data: {
    order_number: string;
    order_id: number;
  }) => void;
  "emergency-update": (data: EmergencyState) => void;
  "stock-update": (data: {
    product_id: number;
    stock_quantity: number;
  }) => void;
  "join-room": (room: string) => void;
  "leave-room": (room: string) => void;

  // サーバー → クライアント
  "order-status-change": (data: {
    order_id: number;
    status: Order["status"];
    timestamp: string;
  }) => void;
  "cooking-notification": (data: {
    order_number: string;
    message: string;
    timestamp: string;
  }) => void;
  "emergency-notification": (data: EmergencyState) => void;
  "stock-notification": (data: {
    product_id: number;
    product_name: string;
    stock_quantity: number;
    alert_type?: string;
  }) => void;
  "new-order": (data: Order) => void;
  "system-update": (data: {
    type: string;
    message: string;
    timestamp: string;
  }) => void;
}
