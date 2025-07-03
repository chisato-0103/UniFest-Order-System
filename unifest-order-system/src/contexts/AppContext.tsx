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
  | { type: "UPDATE_LAST_UPDATED" };

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

    default:
      return state;
  }
}

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
    items: [
      {
        order_item_id: i * 10 + 1,
        order_id: i + 1,
        product_id: 1,
        product_name: "たこ焼き（6個）",
        quantity: 1,
        unit_price: 500,
        total_price: 500,
        toppings: [],
        cooking_time: 8,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ],
    total_amount: 500,
    status: statuses[Math.floor(Math.random() * statuses.length)],
    payment_status: Math.random() > 0.3 ? "支払済み" : "未払い",
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
              toppings: [],
              cooking_time: 8,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          ],
          total_amount: 500,
          status: "注文受付",
          payment_status: "支払済み",
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
