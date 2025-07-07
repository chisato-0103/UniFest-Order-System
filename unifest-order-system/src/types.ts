// 基本的な型定義

export interface Product {
  id: string;
  product_id: string;
  name: string;
  product_name: string;
  price: number;
  category: string;
  description: string;
  available: boolean;
  status?: string;
  image?: string;
  preparationTime?: number;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  sortOrder?: number;
}

export interface Topping {
  id: string;
  topping_id?: string | number;
  order_topping_id?: string | number;
  name: string;
  topping_name?: string;
  price: number;
  available: boolean;
}

export interface CartItem {
  id: string;
  order_item_id?: string | number;
  name: string;
  product_name?: string;
  price: number;
  unit_price?: number;
  quantity: number;
  toppings?: Topping[];
  selectedToppings?: Topping[];
  product?: Product;
  totalPrice: number;
  total_price?: number;
}

export interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  toppings?: Topping[];
  totalPrice: number;
}

export interface Cart {
  items: CartItem[];
  total: number;
  itemCount: number;
}

export interface Order {
  id: string;
  order_id?: string;
  orderNumber: string;
  order_number: string;
  customer_id?: string | number;
  items: CartItem[];
  order_items?: CartItem[];
  total: number;
  total_amount: number;
  status:
    | "pending"
    | "confirmed"
    | "preparing"
    | "ready"
    | "delivered"
    | "cancelled"
    | "注文受付"
    | "調理待ち"
    | "調理中"
    | "調理完了"
    | "受け取り済み"
    | "キャンセル"
    | "completed"
    | "picked_up";
  payment_status?: PaymentStatus;
  payment_method?: string;
  customerName?: string;
  customerPhone?: string;
  notes?: string;
  special_instructions?: string;
  createdAt: Date;
  created_at?: string;
  updatedAt: Date;
  updated_at?: string;
  actual_pickup_time?: string | Date | null;
  estimatedCompletionTime?: Date;
  qrCode?: string;
}

export interface SystemState {
  isOpen: boolean;
  maxOrders: number;
  currentOrders: number;
  averageWaitTime: number;
  maintenanceMode: boolean;
  営業状況: "営業中" | "営業停止" | "準備中" | "閉店" | "営業終了";
  待ち件数: number;
  混雑状況:
    | "空いています"
    | "やや混雑"
    | "混雑"
    | "大変混雑"
    | "普通"
    | "空いている";
  音声通知設定?: boolean;
  緊急停止状態?: boolean;
}

export interface Notification {
  id: string;
  notification_id: string;
  type: "info" | "warning" | "error" | "success";
  notification_type:
    | "order"
    | "emergency"
    | "system"
    | "stock"
    | "payment"
    | "system_alert"
    | "low_stock"
    | "new_order"
    | "order_status_update";
  title: string;
  message: string;
  content: string;
  timestamp: Date;
  notification_time: Date;
  read: boolean;
  is_confirmed: boolean;
  target_order_number?: string;
}

export interface StockInfo {
  productId: string;
  product_id: string;
  currentStock: number;
  current_stock: number;
  available_stock?: number;
  reserved_stock?: number;
  minimumStock: number;
  low_stock_threshold: number;
  initial_stock: number;
  unit: string;
  lastUpdated: Date;
}

export interface StockHistory {
  id: string;
  history_id?: string | number;
  productId: string;
  changeType: "increase" | "decrease" | "adjustment";
  quantity: number;
  reason: string;
  timestamp: Date;
  userId: string;
}

export interface StockAlert {
  id: string;
  alert_id?: string;
  productId: string;
  product_id?: string | number;
  alertType: "low_stock" | "out_of_stock" | "expired";
  alert_type?: string;
  message: string;
  timestamp: Date;
  created_at?: string;
  acknowledged: boolean;
  is_resolved: boolean;
}

export interface WaitTimeInfo {
  orderId: string;
  estimatedTime: number;
  actualTime?: number;
  factors: string[];
  // APIレスポンス用のsnake_caseプロパティ
  order_id?: string;
  estimated_wait_minutes?: number;
  current_status?: string;
  cooking_completion_time?: string | Date;
  estimated_completion_time?: string | Date;
}

export interface TakoyakiCooker {
  id: string;
  name: string;
  capacity: number;
  currentLoad: number;
  status:
    | "idle"
    | "cooking"
    | "cleaning"
    | "maintenance"
    | "空き"
    | "使用中"
    | "清掃中"
    | "故障中";
  estimatedCompletionTime?: Date;
  temperature?: number;
  optimal_temperature_range?: { min: number; max: number };
  // APIレスポンス用のsnake_caseプロパティ
  cooker_id?: string | number;
  cooker_name?: string;
  max_capacity?: number;
  current_load?: number;
  current_order_id?: string | number;
  maintenance_required?: boolean;
  last_used_at?: string | Date;
  cooking_start_time?: string | Date;
  estimated_completion_time?: string | Date;
}

export interface DetailedCookingStatus {
  cookerId: string;
  order_id?: string;
  batchId: string;
  startTime: Date;
  estimatedEndTime: Date;
  currentPhase: "preparation" | "cooking" | "finishing";
  temperature: number;
  progress: number;
}

export interface TemperatureManagement {
  cookerId: string;
  cooker_id?: string;
  currentTemp: number;
  targetTemp: number;
  timestamp: Date;
  alerts: string[];
}

export interface CongestionStatus {
  currentOrders: number;
  maxCapacity: number;
  averageWaitTime: number;
  peakHours: { start: string; end: string }[];
  recommendations: string[];
  // APIレスポンス用のsnake_caseプロパティ
  congestion_level?: string;
  current_wait_count?: number;
  current_cooking_count?: number;
  average_wait_time?: number;
  estimated_new_order_wait?: number;
  cooker_utilization_rate?: number;
  updated_at?: string | Date;
}

export interface EmergencyState {
  is_active: boolean;
  emergency_type:
    | "fire"
    | "medical"
    | "technical"
    | "other"
    | "システム停止"
    | "緊急事態"
    | "機器故障"
    | "その他";
  message: string;
  activated_at?: Date;
  deactivated_at?: Date;
  activated_by?: string;
  resolved_at?: Date;
  actions: string[];
}

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "preparing"
  | "ready"
  | "delivered"
  | "cancelled"
  | "注文受付"
  | "調理待ち"
  | "調理中"
  | "調理完了"
  | "受け取り済み"
  | "キャンセル";

export type PaymentStatus =
  | "unpaid"
  | "pending"
  | "paid"
  | "failed"
  | "refunded"
  | "支払い済み"
  | "未払い"
  | "支払い中"
  | "返金済み";

export type CookingStatus =
  | "waiting"
  | "cooking"
  | "completed"
  | "failed"
  | "調理待ち"
  | "調理中"
  | "調理完了"
  | "調理失敗";

export interface EmergencyLog {
  id: string;
  emergency_type:
    | "fire"
    | "medical"
    | "technical"
    | "other"
    | "システム停止"
    | "緊急事態"
    | "機器故障"
    | "その他";
  message: string;
  timestamp: Date;
  resolved_timestamp?: Date;
  action: string;
  performed_by?: string;
  severity: "low" | "medium" | "high" | "critical";
}

// 厨房画面用のOrder型
export interface KitchenOrder {
  id: string;
  customer_name: string;
  items: KitchenOrderItem[];
  status: "pending" | "preparing" | "ready" | "completed" | "cancelled";
  created_at: string;
  total_amount: number;
}

export interface KitchenOrderItem {
  id: string;
  product_name: string;
  quantity: number;
  price: number;
  product_id: string;
  options?: string;
}

// Action types for AppContext
export type AppAction =
  | { type: "ADD_ORDER"; payload: Order }
  | { type: "UPDATE_ORDER"; payload: { id: string; updates: Partial<Order> } }
  | { type: "DELETE_ORDER"; payload: string }
  | { type: "SET_PRODUCTS"; payload: Product[] }
  | { type: "UPDATE_CART"; payload: Cart }
  | { type: "CLEAR_CART" }
  | { type: "ADD_NOTIFICATION"; payload: Notification }
  | { type: "REMOVE_NOTIFICATION"; payload: string }
  | { type: "UPDATE_SYSTEM_STATE"; payload: Partial<SystemState> }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null };
