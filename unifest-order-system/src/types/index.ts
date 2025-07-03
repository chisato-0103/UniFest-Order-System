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
