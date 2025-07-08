/* eslint-disable react-refresh/only-export-components */
// 📱 アプリ全体の状態（情報）を管理するファイル
// 注文、商品、カートなど、アプリで使う全ての情報をここで管理しています
// どのページからでも同じ情報を見ることができるようにする仕組みです

import React, { createContext, useReducer, useEffect } from "react"; // Reactの基本道具
import type { ReactNode } from "react"; // React部品の型
import type {
  Order, // 注文の情報
  Product, // 商品の情報
  Category, // カテゴリの情報
  Topping, // トッピングの情報
  Cart, // カートの情報
  CartItem, // カートに入れた商品の情報
  SystemState, // システムの状態
  Notification, // 通知の情報
  StockInfo, // 在庫の情報
  StockHistory, // 在庫履歴
  StockAlert, // 在庫アラート
  WaitTimeInfo, // 待ち時間の情報
  TakoyakiCooker, // たこ焼き器の情報
  DetailedCookingStatus, // 詳細調理状況
  TemperatureManagement, // 温度管理
  CongestionStatus, // 混雑状況
  EmergencyState, // 緊急時状態
  EmergencyLog, // 緊急時ログ
} from "../types";
import { audioNotificationService } from "../utils/audioNotification"; // 音の通知サービス

// 🗂️ アプリで管理する全ての情報の入れ物（State型定義）
interface AppState {
  orders: Order[]; // 注文のリスト
  products: Product[]; // 商品のリスト
  categories: Category[]; // カテゴリのリスト
  toppings: Topping[]; // トッピングのリスト
  cart: Cart; // ショッピングカート
  systemState: SystemState; // システムの状態（営業中か休憩中か等）
  notifications: Notification[]; // 通知のリスト
  stockInfo: StockInfo[]; // 在庫情報のリスト
  stockHistory: StockHistory[]; // 在庫履歴のリスト
  stockAlerts: StockAlert[]; // 在庫アラートのリスト
  // ⏰ 待ち時間管理関連
  waitTimeInfo: WaitTimeInfo[]; // 待ち時間情報のリスト
  takoyakiCookers: TakoyakiCooker[]; // たこ焼き器のリスト
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
    itemCount: 0,
  },
  systemState: {
    isOpen: true,
    maxOrders: 50,
    currentOrders: 0,
    averageWaitTime: 10,
    maintenanceMode: false,
    混雑状況: "空いている",
    待ち件数: 0,
    営業状況: "営業中",
    音声通知設定: true,
    緊急停止状態: false,
  },
  notifications: [
    {
      id: "1",
      notification_id: "1",
      type: "info",
      notification_type: "new_order",
      title: "新規注文",
      message: "新しい注文が入りました",
      content: "新しい注文が入りました",
      timestamp: new Date(),
      notification_time: new Date(),
      read: false,
      is_confirmed: false,
      target_order_number: "A001",
    },
    {
      id: "2",
      notification_id: "2",
      type: "warning",
      notification_type: "low_stock",
      title: "在庫不足",
      message: "たこ焼きの材料が残り少なくなっています",
      content: "たこ焼きの材料が残り少なくなっています",
      timestamp: new Date(Date.now() - 300000),
      notification_time: new Date(Date.now() - 300000),
      read: false,
      is_confirmed: false,
    },
    {
      id: "3",
      notification_id: "3",
      type: "success",
      notification_type: "order_status_update",
      title: "注文完了",
      message: "注文が完了しました",
      content: "注文が完了しました",
      timestamp: new Date(Date.now() - 600000),
      notification_time: new Date(Date.now() - 600000),
      read: true,
      is_confirmed: true,
      target_order_number: "A002",
    },
  ],
  stockInfo: [],
  stockHistory: [],
  stockAlerts: [],
  // 待ち時間管理の初期状態
  waitTimeInfo: [],
  takoyakiCookers: [],
  detailedCookingStatus: [],
  temperatureManagement: [],
  congestionStatus: {
    currentOrders: 0,
    maxCapacity: 20,
    averageWaitTime: 0,
    peakHours: [],
    recommendations: [],
    current_wait_count: 0,
    current_cooking_count: 0,
    average_wait_time: 0,
    congestion_level: "空いている",
    estimated_new_order_wait: 8,
    cooker_utilization_rate: 0,
    updated_at: new Date().toISOString(),
  },
  // 緊急時対応の初期状態
  emergencyState: {
    is_active: false,
    emergency_type: "other",
    message: "",
    activated_at: undefined,
    deactivated_at: undefined,
    activated_by: undefined,
    actions: [],
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
      const newItem: CartItem = {
        id: action.payload.product.id, // 本番APIのproduct.idをそのまま使用
        name: action.payload.product.name,
        price: action.payload.product.price,
        quantity: action.payload.quantity,
        toppings: action.payload.toppings || [], // 🔄 統一型定義に対応
        product: action.payload.product,
        totalPrice: action.payload.product.price * action.payload.quantity,
      };
      const newItems = [...state.cart.items, newItem];
      const newTotal = newItems.reduce((total, item) => {
        const toppingsPrice =
          item.toppings?.reduce((sum, topping) => sum + topping.price, 0) || 0;
        return total + (item.price + toppingsPrice) * item.quantity;
      }, 0);

      return {
        ...state,
        cart: {
          items: newItems,
          total: newTotal,
          itemCount: newItems.length,
        },
      };
    }

    case "REMOVE_FROM_CART": {
      const filteredItems = state.cart.items.filter(
        (_, index) => index !== action.payload
      );
      const updatedTotal = filteredItems.reduce((total, item) => {
        const toppingsPrice =
          item.toppings?.reduce((sum, topping) => sum + topping.price, 0) || 0;
        return total + (item.price + toppingsPrice) * item.quantity;
      }, 0);

      return {
        ...state,
        cart: {
          items: filteredItems,
          total: updatedTotal,
          itemCount: filteredItems.length,
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
        const toppingsPrice =
          item.toppings?.reduce((sum, topping) => sum + topping.price, 0) || 0;
        return total + (item.price + toppingsPrice) * item.quantity;
      }, 0);

      return {
        ...state,
        cart: {
          items: updatedItems,
          total: recalculatedTotal,
          itemCount: updatedItems.length,
        },
      };
    }

    case "CLEAR_CART":
      return {
        ...state,
        cart: {
          items: [],
          total: 0,
          itemCount: 0,
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
          notification.notification_id === String(action.payload)
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
        if (stock.product_id === product_id.toString()) {
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
        (s) => s.product_id === product_id.toString()
      );
      if (stockInfo) {
        const historyEntry: StockHistory = {
          id: Date.now().toString(),
          history_id: Date.now(),
          productId: product_id.toString(),
          changeType: quantity > 0 ? "increase" : "decrease",
          quantity: Math.abs(quantity),
          reason: reason || (quantity > 0 ? "入荷" : "消費"),
          timestamp: new Date(),
          userId: "system",
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
          alert.alert_id === action.payload.toString()
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
      const now = new Date();
      const newLog: EmergencyLog = {
        id: `log-${state.emergencyLogs.length + 1}`,
        emergency_type: action.payload.type || "その他",
        action: "緊急停止",
        message: action.payload.message,
        performed_by: action.payload.user,
        timestamp: now,
        severity: "high",
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
          actions: [],
        },
        emergencyLogs: [...state.emergencyLogs, newLog],
      };
    }

    case "DEACTIVATE_EMERGENCY": {
      const now = new Date().toISOString();

      const newLog: EmergencyLog = {
        id: (state.emergencyLogs.length + 1).toString(),
        emergency_type: state.emergencyState.emergency_type || "その他",
        action: "復旧",
        message: "緊急事態が終了されました",
        performed_by: action.payload.user,
        timestamp: new Date(now),
        severity: "low",
      };

      return {
        ...state,
        emergencyState: {
          is_active: false,
          emergency_type: null,
          message: "",
          activated_at: undefined,
          activated_by: undefined,
          deactivated_at: new Date(now),
          actions: [],
        },
        emergencyLogs: [...state.emergencyLogs, newLog],
      };
    }

    case "UPDATE_EMERGENCY_MESSAGE": {
      const now = new Date().toISOString();
      const newLog: EmergencyLog = {
        id: (state.emergencyLogs.length + 1).toString(),
        emergency_type: state.emergencyState.emergency_type || "その他",
        action: "メッセージ更新",
        message: action.payload.message,
        performed_by: action.payload.user,
        timestamp: new Date(now),
        severity: "low",
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
      productId: "1",
      product_id: "1",
      currentStock: 80,
      current_stock: 80,
      minimumStock: 20,
      low_stock_threshold: 20,
      initial_stock: 100,
      reserved_stock: 5,
      available_stock: 75,
      unit: "個",
      lastUpdated: new Date(),
    },
    {
      productId: "2",
      product_id: "2",
      currentStock: 45,
      current_stock: 45,
      minimumStock: 15,
      low_stock_threshold: 15,
      initial_stock: 60,
      reserved_stock: 8,
      available_stock: 37,
      unit: "個",
      lastUpdated: new Date(),
    },
    {
      productId: "3",
      product_id: "3",
      currentStock: 12,
      current_stock: 12,
      minimumStock: 15,
      low_stock_threshold: 15,
      initial_stock: 40,
      reserved_stock: 2,
      available_stock: 10,
      unit: "個",
      lastUpdated: new Date(),
    },
  ];
};

// ダミーデータを生成する関数
const generateDummyOrders = (): Order[] => {
  return [] as Order[];
};

// たこ焼き器の初期データを生成
const generateDummyTakoyakiCookers = (): TakoyakiCooker[] => {
  return [
    {
      id: "1",
      name: "たこ焼き器1",
      currentLoad: 24,
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
      last_used_at: new Date().toISOString(),
      maintenance_required: false,
    },
    {
      id: "2",
      name: "たこ焼き器2",
      currentLoad: 0,
      cooker_id: 2,
      cooker_name: "たこ焼き器2",
      status: "空き",
      capacity: 48,
      max_capacity: 48,
      current_load: 0,
      temperature: 170,
      optimal_temperature_range: { min: 170, max: 190 },
      last_used_at: new Date(Date.now() - 15 * 60000).toISOString(),
      maintenance_required: false,
    },
    {
      id: "3",
      name: "たこ焼き器3",
      currentLoad: 0,
      cooker_id: 3,
      cooker_name: "たこ焼き器3",
      status: "清掃中",
      capacity: 48,
      max_capacity: 48,
      current_load: 0,
      temperature: 160,
      optimal_temperature_range: { min: 170, max: 190 },
      last_used_at: new Date(Date.now() - 30 * 60000).toISOString(),
      maintenance_required: true,
    },
  ];
};

// 待ち時間情報の初期データを生成
const generateDummyWaitTimeInfo = (): WaitTimeInfo[] => {
  const baseTime = new Date();
  return [
    {
      orderId: "1",
      estimatedTime: 3,
      factors: ["調理中"],
      order_id: "1",
      estimated_completion_time: new Date(
        baseTime.getTime() + 3 * 60000
      ).toISOString(),
      estimated_wait_minutes: 3,
      current_status: "調理中",
      cooking_completion_time: new Date(
        baseTime.getTime() + 3 * 60000
      ).toISOString(),
    },
    {
      orderId: "2",
      estimatedTime: 8,
      factors: ["待機中"],
      order_id: "2",
      estimated_completion_time: new Date(
        baseTime.getTime() + 8 * 60000
      ).toISOString(),
      estimated_wait_minutes: 8,
      current_status: "待機中",
    },
    {
      orderId: "3",
      estimatedTime: 15,
      factors: ["待機中"],
      order_id: "3",
      estimated_completion_time: new Date(
        baseTime.getTime() + 15 * 60000
      ).toISOString(),
      estimated_wait_minutes: 15,
      current_status: "待機中",
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
    if (typeof 音声通知設定 === "boolean") {
      audioNotificationService.setEnabled(音声通知設定);
      audioNotificationService.setVolume(0.7);
    }
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
            typeof state.systemState.音声通知設定 === "boolean" &&
            state.systemState.音声通知設定
          ) {
            audioNotificationService.playOrderReady(updatedOrder.order_number);
          }

          // 通知を追加
          const notification: Notification = {
            id: `notif-${Date.now()}`,
            notification_id: String(Date.now()),
            type: "info",
            notification_type: "order_status_update",
            title: "注文ステータス更新",
            message: `注文 ${randomOrder.order_number} が「${
              statuses[currentStatusIndex + 1]
            }」になりました`,
            content: `注文 ${randomOrder.order_number} が「${
              statuses[currentStatusIndex + 1]
            }」になりました`,
            timestamp: new Date(),
            notification_time: new Date(),
            read: false,
            is_confirmed: false,
            target_order_number: randomOrder.order_number,
          };

          dispatch({ type: "ADD_NOTIFICATION", payload: notification });
        }
      }

      // 新しい注文の追加をシミュレート
      if (randomOrderUpdate > 0.98) {
        const newOrder: Order = {
          id: `order-${Date.now()}`,
          order_id: String(Date.now()),
          orderNumber: `T${String(state.orders.length + 1).padStart(3, "0")}`,
          order_number: `T${String(state.orders.length + 1).padStart(3, "0")}`,
          customer_id: String(Date.now()),
          total: 500,
          total_amount: 500,
          createdAt: new Date(),
          updatedAt: new Date(),
          items: [
            {
              id: `item-${Date.now()}`,
              order_item_id: String(Date.now()),
              name: "たこ焼き（6個）",
              product_name: "たこ焼き（6個）",
              price: 500,
              unit_price: 500,
              quantity: 1,
              totalPrice: 500,
              total_price: 500,
              toppings: [],
            },
          ],
          status: "注文受付",
          payment_status: "支払い済み",
          payment_method: "PayPay",
          estimatedCompletionTime: new Date(Date.now() + 15 * 60000),
          actual_pickup_time: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        dispatch({ type: "ADD_ORDER", payload: newOrder });
        dispatch({ type: "UPDATE_LAST_UPDATED" });

        // 新規注文の音声通知
        if (
          typeof state.systemState.音声通知設定 === "boolean" &&
          state.systemState.音声通知設定
        ) {
          audioNotificationService.playNewOrder();
        }

        // 新規注文通知
        const notification: Notification = {
          id: `notif-${Date.now() + 1}`,
          notification_id: String(Date.now() + 1),
          type: "info",
          notification_type: "new_order",
          title: "新規注文",
          message: `新しい注文 ${newOrder.order_number} が入りました`,
          content: `新しい注文 ${newOrder.order_number} が入りました`,
          timestamp: new Date(),
          notification_time: new Date(),
          read: false,
          is_confirmed: false,
          target_order_number: newOrder.order_number,
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
