/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useReducer, useEffect } from "react";
import type { ReactNode } from "react";
import type {
  Order,
  Product,
  Category,
  Topping,
  Cart,
  SystemState,
  Notification,
  StockInfo,
  StockHistory,
  StockAlert,
  WaitTimeInfo,
  TakoyakiCooker,
  DetailedCookingStatus,
  TemperatureManagement,
  CongestionStatus,
  EmergencyState,
  EmergencyLog,
} from "../types";
import { audioNotificationService } from "../utils/audioNotification";

// State型定義
interface AppState {
  orders: Order[];
  products: Product[];
  categories: Category[];
  toppings: Topping[];
  cart: Cart;
  systemState: SystemState;
  notifications: Notification[];
  stockInfo: StockInfo[];
  stockHistory: StockHistory[];
  stockAlerts: StockAlert[];
  // 待ち時間管理関連
  waitTimeInfo: WaitTimeInfo[];
  takoyakiCookers: TakoyakiCooker[];
  detailedCookingStatus: DetailedCookingStatus[];
  temperatureManagement: TemperatureManagement[];
  congestionStatus: CongestionStatus;
  // 緊急時対応関連
  emergencyState: EmergencyState;
  emergencyLogs: EmergencyLog[];
  currentUser?: {
    id: string;
    name: string;
    role: "customer" | "staff" | "admin";
  };
  connectionStatus: "connected" | "disconnected" | "connecting";
  lastUpdated: string;
}

// Action型定義
type AppAction =
  | { type: "SET_ORDERS"; payload: Order[] }
  | { type: "ADD_ORDER"; payload: Order }
  | { type: "UPDATE_ORDER"; payload: Order }
  | { type: "SET_PRODUCTS"; payload: Product[] }
  | { type: "ADD_PRODUCT"; payload: Product }
  | { type: "UPDATE_PRODUCT"; payload: Product }
  | { type: "SET_CATEGORIES"; payload: Category[] }
  | { type: "SET_TOPPINGS"; payload: Topping[] }
  | {
      type: "ADD_TO_CART";
      payload: { product: Product; quantity: number; toppings: Topping[] };
    }
  | { type: "REMOVE_FROM_CART"; payload: number }
  | { type: "UPDATE_CART_ITEM"; payload: { index: number; quantity: number } }
  | { type: "CLEAR_CART" }
  | { type: "SET_SYSTEM_STATE"; payload: Partial<SystemState> }
  | { type: "ADD_NOTIFICATION"; payload: Notification }
  | { type: "MARK_NOTIFICATION_READ"; payload: number }
  | { type: "SET_CURRENT_USER"; payload: AppState["currentUser"] }
  | {
      type: "SET_CONNECTION_STATUS";
      payload: "connected" | "disconnected" | "connecting";
    }
  | { type: "UPDATE_LAST_UPDATED" }
  // 在庫管理アクション
  | { type: "SET_STOCK_INFO"; payload: StockInfo[] }
  | {
      type: "UPDATE_STOCK";
      payload: { product_id: number; quantity: number; reason: string };
    }
  | { type: "ADD_STOCK_HISTORY"; payload: StockHistory }
  | { type: "ADD_STOCK_ALERT"; payload: StockAlert }
  | { type: "RESOLVE_STOCK_ALERT"; payload: number }
  // 待ち時間管理アクション
  | { type: "SET_WAIT_TIME_INFO"; payload: WaitTimeInfo[] }
  | { type: "UPDATE_WAIT_TIME"; payload: WaitTimeInfo }
  | { type: "SET_TAKOYAKI_COOKERS"; payload: TakoyakiCooker[] }
  | { type: "UPDATE_COOKER_STATUS"; payload: TakoyakiCooker }
  | { type: "SET_DETAILED_COOKING_STATUS"; payload: DetailedCookingStatus[] }
  | { type: "UPDATE_COOKING_PROGRESS"; payload: DetailedCookingStatus }
  | { type: "SET_TEMPERATURE_MANAGEMENT"; payload: TemperatureManagement[] }
  | { type: "UPDATE_TEMPERATURE_STATUS"; payload: TemperatureManagement }
  | { type: "SET_CONGESTION_STATUS"; payload: CongestionStatus }
  // 緊急時対応アクション
  | {
      type: "ACTIVATE_EMERGENCY";
      payload: {
        type: EmergencyState["emergency_type"];
        message: string;
        user: string;
      };
    }
  | { type: "DEACTIVATE_EMERGENCY"; payload: { user: string } }
  | {
      type: "UPDATE_EMERGENCY_MESSAGE";
      payload: { message: string; user: string };
    }
  | { type: "ADD_EMERGENCY_LOG"; payload: EmergencyLog };

// 初期状態
const initialState: AppState = {
  orders: [],
  products: [],
  categories: [],
  toppings: [],
  cart: {
    items: [],
    total: 0,
  },
  systemState: {
    混雑状況: "空いている",
    待ち件数: 0,
    緊急停止状態: false,
    営業状況: "営業中",
    手動運用モード: false,
    音声通知設定: {
      有効: true,
      音量: 0.7,
      新規注文通知: true,
      調理完了通知: true,
      遅延アラート: true,
      緊急通知: true,
    },
  },
  notifications: [],
  stockInfo: [],
  stockHistory: [],
  stockAlerts: [],
  // 待ち時間管理の初期状態
  waitTimeInfo: [],
  takoyakiCookers: [],
  detailedCookingStatus: [],
  temperatureManagement: [],
  congestionStatus: {
    current_wait_count: 0,
    current_cooking_count: 0,
    average_wait_time: 0,
    congestion_level: "空いている",
    estimated_new_order_wait: 8,
    cooker_utilization_rate: 0,
    peak_time_prediction: "",
    updated_at: new Date().toISOString(),
  },
  // 緊急時対応の初期状態
  emergencyState: {
    is_active: false,
    emergency_type: null,
    message: "",
    activated_at: undefined,
    activated_by: undefined,
    deactivated_at: undefined,
    deactivated_by: undefined,
    auto_deactivate_at: undefined,
  },
  emergencyLogs: [],
  currentUser: undefined,
  connectionStatus: "connecting",
  lastUpdated: new Date().toISOString(),
};

// Reducer関数
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "SET_ORDERS":
      return { ...state, orders: action.payload };

    case "ADD_ORDER":
      return { ...state, orders: [...state.orders, action.payload] };

    case "UPDATE_ORDER":
      return {
        ...state,
        orders: state.orders.map((order) =>
          order.order_id === action.payload.order_id ? action.payload : order
        ),
      };

    case "SET_PRODUCTS":
      return { ...state, products: action.payload };

    case "ADD_PRODUCT":
      return { ...state, products: [...state.products, action.payload] };

    case "UPDATE_PRODUCT":
      return {
        ...state,
        products: state.products.map((product) =>
          product.product_id === action.payload.product_id
            ? action.payload
            : product
        ),
      };

    case "SET_CATEGORIES":
      return { ...state, categories: action.payload };

    case "SET_TOPPINGS":
      return { ...state, toppings: action.payload };

    case "ADD_TO_CART": {
      const newItem = {
        product: action.payload.product,
        quantity: action.payload.quantity,
        selectedToppings: action.payload.toppings,
      };
      const newItems = [...state.cart.items, newItem];
      const newTotal = newItems.reduce((total, item) => {
        const toppingsPrice = item.selectedToppings.reduce(
          (sum, topping) => sum + topping.price,
          0
        );
        return total + (item.product.price + toppingsPrice) * item.quantity;
      }, 0);

      return {
        ...state,
        cart: {
          items: newItems,
          total: newTotal,
        },
      };
    }

    case "REMOVE_FROM_CART": {
      const filteredItems = state.cart.items.filter(
        (_, index) => index !== action.payload
      );
      const updatedTotal = filteredItems.reduce((total, item) => {
        const toppingsPrice = item.selectedToppings.reduce(
          (sum, topping) => sum + topping.price,
          0
        );
        return total + (item.product.price + toppingsPrice) * item.quantity;
      }, 0);

      return {
        ...state,
        cart: {
          items: filteredItems,
          total: updatedTotal,
        },
      };
    }

    case "UPDATE_CART_ITEM": {
      const updatedItems = state.cart.items.map((item, index) =>
        index === action.payload.index
          ? { ...item, quantity: action.payload.quantity }
          : item
      );
      const recalculatedTotal = updatedItems.reduce((total, item) => {
        const toppingsPrice = item.selectedToppings.reduce(
          (sum, topping) => sum + topping.price,
          0
        );
        return total + (item.product.price + toppingsPrice) * item.quantity;
      }, 0);

      return {
        ...state,
        cart: {
          items: updatedItems,
          total: recalculatedTotal,
        },
      };
    }

    case "CLEAR_CART":
      return {
        ...state,
        cart: {
          items: [],
          total: 0,
        },
      };

    case "SET_SYSTEM_STATE":
      return {
        ...state,
        systemState: { ...state.systemState, ...action.payload },
      };

    case "ADD_NOTIFICATION":
      return {
        ...state,
        notifications: [action.payload, ...state.notifications],
      };

    case "MARK_NOTIFICATION_READ":
      return {
        ...state,
        notifications: state.notifications.map((notification) =>
          notification.notification_id === action.payload
            ? { ...notification, is_confirmed: true }
            : notification
        ),
      };

    case "SET_CURRENT_USER":
      return { ...state, currentUser: action.payload };

    case "SET_CONNECTION_STATUS":
      return { ...state, connectionStatus: action.payload };

    case "UPDATE_LAST_UPDATED":
      return { ...state, lastUpdated: new Date().toISOString() };

    // 在庫管理ケース
    case "SET_STOCK_INFO":
      return { ...state, stockInfo: action.payload };

    case "UPDATE_STOCK": {
      const { product_id, quantity, reason } = action.payload;
      const updatedStockInfo = state.stockInfo.map((stock) => {
        if (stock.product_id === product_id) {
          const newStock = Math.max(0, stock.current_stock + quantity);
          return {
            ...stock,
            current_stock: newStock,
            available_stock: Math.max(0, newStock - stock.reserved_stock),
            last_updated: new Date().toISOString(),
          };
        }
        return stock;
      });

      // 在庫履歴を自動追加
      const stockInfo = state.stockInfo.find(
        (s) => s.product_id === product_id
      );
      if (stockInfo) {
        const historyEntry: StockHistory = {
          history_id: Date.now(),
          product_id,
          action_type: quantity > 0 ? "入荷" : "消費",
          change_type: quantity > 0 ? "増加" : "減少",
          change_amount: Math.abs(quantity),
          quantity_change: quantity,
          previous_stock: stockInfo.current_stock,
          before_quantity: stockInfo.current_stock,
          new_stock: Math.max(0, stockInfo.current_stock + quantity),
          after_quantity: Math.max(0, stockInfo.current_stock + quantity),
          reason,
          performed_by: "system",
          created_by: "system",
          created_at: new Date().toISOString(),
        };

        return {
          ...state,
          stockInfo: updatedStockInfo,
          stockHistory: [...state.stockHistory, historyEntry],
        };
      }

      return { ...state, stockInfo: updatedStockInfo };
    }

    case "ADD_STOCK_HISTORY":
      return {
        ...state,
        stockHistory: [...state.stockHistory, action.payload],
      };

    case "ADD_STOCK_ALERT":
      return { ...state, stockAlerts: [...state.stockAlerts, action.payload] };

    case "RESOLVE_STOCK_ALERT":
      return {
        ...state,
        stockAlerts: state.stockAlerts.map((alert) =>
          alert.alert_id === action.payload
            ? {
                ...alert,
                is_resolved: true,
                resolved_at: new Date().toISOString(),
              }
            : alert
        ),
      };

    // 待ち時間管理ケース
    case "SET_WAIT_TIME_INFO":
      return { ...state, waitTimeInfo: action.payload };

    case "UPDATE_WAIT_TIME":
      return {
        ...state,
        waitTimeInfo: state.waitTimeInfo.map((wait) =>
          wait.order_id === action.payload.order_id ? action.payload : wait
        ),
      };

    case "SET_TAKOYAKI_COOKERS":
      return { ...state, takoyakiCookers: action.payload };

    case "UPDATE_COOKER_STATUS":
      return {
        ...state,
        takoyakiCookers: state.takoyakiCookers.map((cooker) =>
          cooker.cooker_id === action.payload.cooker_id
            ? action.payload
            : cooker
        ),
      };

    case "SET_DETAILED_COOKING_STATUS":
      return { ...state, detailedCookingStatus: action.payload };

    case "UPDATE_COOKING_PROGRESS":
      return {
        ...state,
        detailedCookingStatus: state.detailedCookingStatus.map((status) =>
          status.order_id === action.payload.order_id ? action.payload : status
        ),
      };

    case "SET_TEMPERATURE_MANAGEMENT":
      return { ...state, temperatureManagement: action.payload };

    case "UPDATE_TEMPERATURE_STATUS":
      return {
        ...state,
        temperatureManagement: state.temperatureManagement.map((temp) =>
          temp.cooker_id === action.payload.cooker_id ? action.payload : temp
        ),
      };

    case "SET_CONGESTION_STATUS":
      return { ...state, congestionStatus: action.payload };

    // 緊急時対応ケース
    case "ACTIVATE_EMERGENCY": {
      const now = new Date().toISOString();
      const newLog: EmergencyLog = {
        log_id: state.emergencyLogs.length + 1,
        emergency_type: action.payload.type || "その他",
        action: "緊急停止",
        message: action.payload.message,
        performed_by: action.payload.user,
        timestamp: now,
      };

      return {
        ...state,
        emergencyState: {
          is_active: true,
          emergency_type: action.payload.type,
          message: action.payload.message,
          activated_at: now,
          activated_by: action.payload.user,
          deactivated_at: undefined,
          deactivated_by: undefined,
          auto_deactivate_at: undefined,
        },
        emergencyLogs: [...state.emergencyLogs, newLog],
      };
    }

    case "DEACTIVATE_EMERGENCY": {
      const now = new Date().toISOString();

      const newLog: EmergencyLog = {
        log_id: state.emergencyLogs.length + 1,
        emergency_type: state.emergencyState.emergency_type || "その他",
        action: "復旧",
        message: "緊急事態が終了されました",
        performed_by: action.payload.user,
        timestamp: now,
      };

      return {
        ...state,
        emergencyState: {
          is_active: false,
          emergency_type: null,
          message: "",
          activated_at: undefined,
          activated_by: undefined,
          deactivated_at: now,
          deactivated_by: action.payload.user,
          auto_deactivate_at: undefined,
        },
        emergencyLogs: [...state.emergencyLogs, newLog],
      };
    }

    case "UPDATE_EMERGENCY_MESSAGE": {
      const now = new Date().toISOString();
      const newLog: EmergencyLog = {
        log_id: state.emergencyLogs.length + 1,
        emergency_type: state.emergencyState.emergency_type || "その他",
        action: "メッセージ更新",
        message: action.payload.message,
        performed_by: action.payload.user,
        timestamp: now,
      };

      return {
        ...state,
        emergencyState: {
          ...state.emergencyState,
          message: action.payload.message,
        },
        emergencyLogs: [...state.emergencyLogs, newLog],
      };
    }

    case "ADD_EMERGENCY_LOG":
      return {
        ...state,
        emergencyLogs: [...state.emergencyLogs, action.payload],
      };

    default:
      return state;
  }
}

// 在庫データを生成する関数
const generateDummyStockInfo = (): StockInfo[] => {
  return [
    {
      product_id: 1,
      current_stock: 80,
      initial_stock: 100,
      reserved_stock: 5, // 調理中のため予約
      available_stock: 75,
      low_stock_threshold: 20,
      last_updated: new Date().toISOString(),
      auto_management: true,
    },
    {
      product_id: 2,
      current_stock: 45,
      initial_stock: 60,
      reserved_stock: 8,
      available_stock: 37,
      low_stock_threshold: 15,
      last_updated: new Date().toISOString(),
      auto_management: true,
    },
    {
      product_id: 3,
      current_stock: 12, // 低在庫状態
      initial_stock: 40,
      reserved_stock: 2,
      available_stock: 10,
      low_stock_threshold: 15,
      last_updated: new Date().toISOString(),
      auto_management: true,
    },
  ];
};

// ダミーデータを生成する関数
const generateDummyOrders = (): Order[] => {
  const statuses = [
    "注文受付",
    "調理待ち",
    "調理中",
    "調理完了",
    "受け取り済み",
  ] as const;
  const paymentMethods = ["現金", "PayPay", "クレジットカード"] as const;

  return Array.from({ length: 12 }, (_, i) => ({
    order_id: i + 1,
    customer_id: i + 1,
    order_number: `T${String(i + 1).padStart(3, "0")}`,
    order_items: [
      {
        order_item_id: i * 10 + 1,
        order_id: i + 1,
        product_id: 1,
        product_name: "たこ焼き（6個）",
        quantity: 1,
        unit_price: 500,
        total_price: 500,
        subtotal: 500,
        toppings: [],
        cooking_status: "waiting",
        cooking_time: 8,
        cooking_instruction: "",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ],
    items: [
      {
        order_item_id: i * 10 + 1,
        order_id: i + 1,
        product_id: 1,
        product_name: "たこ焼き（6個）",
        quantity: 1,
        unit_price: 500,
        total_price: 500,
        subtotal: 500,
        toppings: [],
        cooking_status: "waiting",
        cooking_time: 8,
        cooking_instruction: "",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ],
    total_price: 500,
    total_amount: 500,
    order_status: statuses[Math.floor(Math.random() * statuses.length)],
    status: statuses[Math.floor(Math.random() * statuses.length)],
    payment_status: Math.random() > 0.3 ? "支払い済み" : "未払い",
    payment_method:
      paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
    estimated_pickup_time: new Date(
      Date.now() + Math.random() * 30 * 60000
    ).toISOString(),
    actual_pickup_time: Math.random() > 0.5 ? new Date().toISOString() : null,
    special_instructions:
      Math.random() > 0.8 ? "ソース多めでお願いします" : undefined,
    created_at: new Date(Date.now() - Math.random() * 60 * 60000).toISOString(),
    updated_at: new Date().toISOString(),
  }));
};

// たこ焼き器の初期データを生成
const generateDummyTakoyakiCookers = (): TakoyakiCooker[] => {
  return [
    {
      cooker_id: 1,
      cooker_name: "たこ焼き器1",
      status: "使用中",
      current_order_id: 1,
      cooking_start_time: new Date(Date.now() - 5 * 60000).toISOString(),
      estimated_completion_time: new Date(Date.now() + 3 * 60000).toISOString(),
      capacity: 48,
      max_capacity: 48,
      current_load: 24,
      temperature: 180,
      optimal_temperature_range: { min: 170, max: 190 },
      last_maintenance: new Date(Date.now() - 24 * 60 * 60000).toISOString(),
      last_used_at: new Date().toISOString(),
      maintenance_required: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      cooker_id: 2,
      cooker_name: "たこ焼き器2",
      status: "空き",
      capacity: 48,
      max_capacity: 48,
      current_load: 0,
      temperature: 170,
      optimal_temperature_range: { min: 170, max: 190 },
      last_maintenance: new Date(Date.now() - 12 * 60 * 60000).toISOString(),
      last_used_at: new Date(Date.now() - 15 * 60000).toISOString(),
      maintenance_required: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      cooker_id: 3,
      cooker_name: "たこ焼き器3",
      status: "清掃中",
      capacity: 48,
      max_capacity: 48,
      current_load: 0,
      temperature: 160,
      optimal_temperature_range: { min: 170, max: 190 },
      last_maintenance: new Date(Date.now() - 6 * 60 * 60000).toISOString(),
      last_used_at: new Date(Date.now() - 30 * 60000).toISOString(),
      maintenance_required: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];
};

// 待ち時間情報の初期データを生成
const generateDummyWaitTimeInfo = (): WaitTimeInfo[] => {
  const baseTime = new Date();
  return [
    {
      order_id: 1,
      estimated_completion_time: new Date(
        baseTime.getTime() + 3 * 60000
      ).toISOString(),
      estimated_wait_minutes: 3,
      current_status: "調理中",
      priority_level: "normal",
      cooking_start_time: new Date(
        baseTime.getTime() - 5 * 60000
      ).toISOString(),
      last_updated: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      order_id: 2,
      estimated_completion_time: new Date(
        baseTime.getTime() + 8 * 60000
      ).toISOString(),
      estimated_wait_minutes: 8,
      current_status: "待機中",
      priority_level: "normal",
      last_updated: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      order_id: 3,
      estimated_completion_time: new Date(
        baseTime.getTime() + 15 * 60000
      ).toISOString(),
      estimated_wait_minutes: 15,
      current_status: "待機中",
      priority_level: "high",
      last_updated: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];
};

// Context作成
export const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
} | null>(null);

// Provider Component
export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // 音声通知サービスの初期化
  useEffect(() => {
    const { 音声通知設定 } = state.systemState;
    audioNotificationService.setEnabled(音声通知設定.有効);
    audioNotificationService.setVolume(音声通知設定.音量);
  }, [state.systemState]);

  // リアルタイム機能のシミュレーション
  useEffect(() => {
    // 初期データの設定
    dispatch({ type: "SET_CONNECTION_STATUS", payload: "connecting" });

    // 接続シミュレーション
    const connectTimer = setTimeout(() => {
      dispatch({ type: "SET_CONNECTION_STATUS", payload: "connected" });
      dispatch({ type: "SET_ORDERS", payload: generateDummyOrders() });
      dispatch({ type: "SET_STOCK_INFO", payload: generateDummyStockInfo() });
      dispatch({
        type: "SET_TAKOYAKI_COOKERS",
        payload: generateDummyTakoyakiCookers(),
      });
      dispatch({
        type: "SET_WAIT_TIME_INFO",
        payload: generateDummyWaitTimeInfo(),
      });
      dispatch({ type: "UPDATE_LAST_UPDATED" });
    }, 1000);

    return () => {
      clearTimeout(connectTimer);
    };
  }, []); // 初回のみ実行

  // 定期的な更新のシミュレーション
  useEffect(() => {
    if (state.connectionStatus !== "connected") return;

    const updateInterval = setInterval(() => {
      // ランダムに注文ステータスを更新
      const randomOrderUpdate = Math.random();

      if (randomOrderUpdate > 0.8 && state.orders.length > 0) {
        const randomOrder =
          state.orders[Math.floor(Math.random() * state.orders.length)];
        const statuses = [
          "注文受付",
          "調理待ち",
          "調理中",
          "調理完了",
          "受け取り済み",
        ] as const;
        const currentStatusIndex = statuses.findIndex(
          (status) => status === randomOrder.status
        );

        if (
          currentStatusIndex >= 0 &&
          currentStatusIndex < statuses.length - 1
        ) {
          const updatedOrder: Order = {
            ...randomOrder,
            status: statuses[currentStatusIndex + 1],
            updated_at: new Date().toISOString(),
          };

          dispatch({ type: "UPDATE_ORDER", payload: updatedOrder });
          dispatch({ type: "UPDATE_LAST_UPDATED" });

          // 調理完了時の音声通知
          if (
            updatedOrder.status === "調理完了" &&
            state.systemState.音声通知設定.調理完了通知
          ) {
            audioNotificationService.playOrderReady(updatedOrder.order_number);
          }

          // 通知を追加
          const notification: Notification = {
            notification_id: Date.now(),
            notification_type: "order_status_update",
            target_order_number: randomOrder.order_number,
            notification_time: new Date().toISOString(),
            content: `注文 ${randomOrder.order_number} が「${
              statuses[currentStatusIndex + 1]
            }」になりました`,
            priority:
              statuses[currentStatusIndex + 1] === "調理完了" ? "緊急" : "通常",
            is_confirmed: false,
            created_at: new Date().toISOString(),
          };

          dispatch({ type: "ADD_NOTIFICATION", payload: notification });
        }
      }

      // 新しい注文の追加をシミュレート
      if (randomOrderUpdate > 0.98) {
        const newOrder: Order = {
          order_id: Date.now(),
          customer_id: Date.now(),
          order_number: `T${String(state.orders.length + 1).padStart(3, "0")}`,
          items: [
            {
              order_item_id: Date.now(),
              order_id: Date.now(),
              product_id: 1,
              product_name: "たこ焼き（6個）",
              quantity: 1,
              unit_price: 500,
              total_price: 500,
              subtotal: 500,
              toppings: [],
              cooking_status: "waiting",
              cooking_time: 8,
              cooking_instruction: "",
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          ],
          order_items: [
            {
              order_item_id: Date.now(),
              order_id: Date.now(),
              product_id: 1,
              product_name: "たこ焼き（6個）",
              quantity: 1,
              unit_price: 500,
              total_price: 500,
              subtotal: 500,
              toppings: [],
              cooking_status: "waiting",
              cooking_time: 8,
              cooking_instruction: "",
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          ],
          total_price: 500,
          total_amount: 500,
          order_status: "注文受付",
          status: "注文受付",
          payment_status: "支払い済み",
          payment_method: "PayPay",
          estimated_pickup_time: new Date(
            Date.now() + 15 * 60000
          ).toISOString(),
          actual_pickup_time: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        dispatch({ type: "ADD_ORDER", payload: newOrder });
        dispatch({ type: "UPDATE_LAST_UPDATED" });

        // 新規注文の音声通知
        if (state.systemState.音声通知設定.新規注文通知) {
          audioNotificationService.playNewOrder();
        }

        // 新規注文通知
        const notification: Notification = {
          notification_id: Date.now() + 1,
          notification_type: "new_order",
          target_order_number: newOrder.order_number,
          notification_time: new Date().toISOString(),
          content: `新しい注文 ${newOrder.order_number} が入りました`,
          priority: "通常",
          is_confirmed: false,
          created_at: new Date().toISOString(),
        };

        dispatch({ type: "ADD_NOTIFICATION", payload: notification });
      }

      // システム状態の更新
      const waitingOrders = state.orders.filter(
        (o) =>
          o.status === "注文受付" ||
          o.status === "調理待ち" ||
          o.status === "調理中"
      ).length;

      let congestionLevel: "空いている" | "普通" | "混雑" = "空いている";
      if (waitingOrders > 10) congestionLevel = "混雑";
      else if (waitingOrders > 5) congestionLevel = "普通";

      dispatch({
        type: "SET_SYSTEM_STATE",
        payload: {
          待ち件数: waitingOrders,
          混雑状況: congestionLevel,
        },
      });
    }, 8000); // 8秒ごとに更新

    return () => {
      clearInterval(updateInterval);
    };
  }, [state.connectionStatus, state.orders, state.systemState]); // 接続状態と注文リスト、システム状態が変更されたときに再実行

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}
