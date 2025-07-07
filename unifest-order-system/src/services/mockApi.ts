import type { Product, Order } from "../types";

// グローバルウィンドウオブジェクトにデータを保存（確実な共有のため）
declare global {
  interface Window {
    __UNIFEST_MOCK_DATA__?: {
      products: Product[];
      orders: Order[];
    };
  }
}

// モックデータ
const mockProducts: Product[] = [
  {
    id: "1",
    product_id: "1",
    name: "たこ焼き（8個入り）",
    product_name: "たこ焼き（8個入り）",
    description: "外はカリッと中はとろっとした定番のたこ焼き",
    price: 500,
    category: "たこ焼き",
    available: true,
    preparationTime: 8,
    image: "/images/takoyaki-8.jpg",
  },
  {
    id: "2",
    product_id: "2",
    name: "たこ焼き（12個入り）",
    product_name: "たこ焼き（12個入り）",
    description: "大容量でお得なたこ焼き",
    price: 700,
    category: "たこ焼き",
    available: true,
    preparationTime: 12,
    image: "/images/takoyaki-12.jpg",
  },
  {
    id: "3",
    product_id: "3",
    name: "ねぎだこ（8個入り）",
    product_name: "ねぎだこ（8個入り）",
    description: "青ねぎたっぷりのねぎだこ",
    price: 600,
    category: "たこ焼き",
    available: true,
    preparationTime: 8,
    image: "/images/negidako-8.jpg",
  },
  {
    id: "4",
    product_id: "4",
    name: "明太子たこ焼き（8個入り）",
    product_name: "明太子たこ焼き（8個入り）",
    description: "明太子の辛みとうまみが効いた特製たこ焼き",
    price: 650,
    category: "たこ焼き",
    available: true,
    preparationTime: 10,
    image: "/images/mentaiko-8.jpg",
  },
  {
    id: "5",
    product_id: "5",
    name: "チーズたこ焼き（8個入り）",
    product_name: "チーズたこ焼き（8個入り）",
    description: "とろーりチーズが楽しめるたこ焼き",
    price: 650,
    category: "たこ焼き",
    available: true,
    preparationTime: 10,
    image: "/images/cheese-8.jpg",
  },
  {
    id: "6",
    product_id: "6",
    name: "売り切れ商品",
    product_name: "売り切れ商品",
    description: "テスト用の売り切れ商品",
    price: 500,
    category: "たこ焼き",
    available: false,
    preparationTime: 8,
    image: "/images/sold-out.jpg",
  },
];

// 初期のモック注文データ
const initialMockOrders: Order[] = [
  {
    id: "test-001",
    orderNumber: "ORD-TEST001",
    order_number: "ORD-TEST001",
    customer_id: "test-customer",
    items: [
      {
        id: "1",
        name: "たこ焼き（8個入り）",
        price: 500,
        quantity: 1,
        totalPrice: 500,
        toppings: [], // 必須プロパティを追加
      },
    ],
    status: "pending",
    total: 500,
    total_amount: 500,
    payment_status: "pending",
    payment_method: "cash",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "test-002",
    orderNumber: "ORD-TEST002",
    order_number: "ORD-TEST002",
    customer_id: "test-customer-2",
    items: [
      {
        id: "2",
        name: "たこ焼き（12個入り）",
        price: 700,
        quantity: 1,
        totalPrice: 700,
        toppings: [], // 必須プロパティを追加
      },
    ],
    status: "confirmed",
    total: 700,
    total_amount: 700,
    payment_status: "paid",
    payment_method: "card",
    createdAt: new Date(Date.now() - 30 * 60 * 1000), // 30分前
    updatedAt: new Date(),
  },
  {
    id: "test-003",
    orderNumber: "ORD-TEST003",
    order_number: "ORD-TEST003",
    customer_id: "test-customer-3",
    items: [
      {
        id: "3",
        name: "ねぎだこ（8個入り）",
        price: 600,
        quantity: 2,
        totalPrice: 1200,
        toppings: [{ id: "1", name: "ねぎ", price: 50, available: true }], // トッピング付きの例として
      },
    ],
    status: "preparing",
    total: 1200,
    total_amount: 1200,
    payment_status: "pending",
    payment_method: "cash",
    createdAt: new Date(Date.now() - 15 * 60 * 1000), // 15分前
    updatedAt: new Date(),
  },
  {
    id: "test-004",
    orderNumber: "ORD-TEST004",
    order_number: "ORD-TEST004",
    customer_id: "test-customer-4",
    items: [
      {
        id: "4",
        name: "明太子たこ焼き（8個入り）",
        price: 650,
        quantity: 1,
        totalPrice: 650,
        toppings: [{ id: "2", name: "明太子", price: 100, available: true }], // トッピング付きの例として
      },
      {
        id: "5",
        name: "チーズたこ焼き（8個入り）",
        price: 650,
        quantity: 1,
        totalPrice: 650,
        toppings: [{ id: "3", name: "チーズ", price: 100, available: true }], // トッピング付きの例として
      },
    ],
    status: "ready",
    total: 1300,
    total_amount: 1300,
    payment_status: "pending",
    payment_method: "cash",
    createdAt: new Date(Date.now() - 5 * 60 * 1000), // 5分前
    updatedAt: new Date(),
  },
];

// LocalStorageを使用したデータ永続化
const STORAGE_KEY = "unifest_mock_data";

// グローバルなデータストレージの初期化
const initializeGlobalData = () => {
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // 日付オブジェクトを復元
        if (parsed.orders) {
          parsed.orders = parsed.orders.map((order: Order) => ({
            ...order,
            createdAt: new Date(order.createdAt),
            updatedAt: new Date(order.updatedAt),
          }));
        }
        console.log(
          "💾 LocalStorageから既存データを読み込み:",
          parsed.orders.length,
          "件"
        );
        return parsed;
      }
    } catch (error) {
      console.error("💾 LocalStorageからのデータ読み込みに失敗:", error);
    }

    // 初期データを保存
    const initialData = {
      products: mockProducts,
      orders: [...initialMockOrders],
    };

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initialData));
      console.log("💾 初期データをLocalStorageに保存");
    } catch (error) {
      console.error("💾 LocalStorageへの保存に失敗:", error);
    }

    return initialData;
  }

  return { products: mockProducts, orders: [...initialMockOrders] };
};

// データ取得関数
const getGlobalData = () => {
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // 日付オブジェクトを復元
        if (parsed.orders) {
          parsed.orders = parsed.orders.map((order: Order) => ({
            ...order,
            createdAt: new Date(order.createdAt),
            updatedAt: new Date(order.updatedAt),
          }));
        }
        return parsed;
      }
    } catch (error) {
      console.error("💾 データ取得エラー:", error);
    }
  }

  return initializeGlobalData();
};

// データ更新関数
const updateGlobalOrders = (orders: Order[]) => {
  if (typeof window !== "undefined") {
    try {
      const currentData = getGlobalData();
      const newData = { ...currentData, orders };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
      console.log("� LocalStorageに注文データを保存:", orders.length, "件");

      // 他のタブに通知
      window.dispatchEvent(new Event("unifest-data-updated"));
      console.log("🔔 他のタブにデータ更新を通知");
    } catch (error) {
      console.error("💾 データ更新エラー:", error);
    }
  }
};

// API関数のモック
class MockApi {
  // 商品取得
  static async getProducts(): Promise<{ data: Product[] }> {
    console.log("🔄 MockAPI.getProducts() called");
    return new Promise((resolve) => {
      setTimeout(() => {
        const globalData = getGlobalData();
        console.log(
          "✅ MockAPI.getProducts() resolved with",
          globalData.products.length,
          "products"
        );
        resolve({ data: globalData.products });
      }, 500);
    });
  }

  // 注文取得
  static async getOrders(): Promise<{ data: Order[] }> {
    console.log("🔄 MockAPI.getOrders() called");
    return new Promise((resolve) => {
      setTimeout(() => {
        const globalData = getGlobalData();
        const currentOrders = globalData.orders;
        console.log(
          "✅ MockAPI.getOrders() resolved with",
          currentOrders.length,
          "orders"
        );
        console.log("✅ MockAPI.getOrders() current orders:", currentOrders);
        resolve({ data: [...currentOrders] }); // コピーを返す
      }, 500);
    });
  }

  // 注文作成
  static async createOrder(
    orderData: Partial<Order>
  ): Promise<{ data: Order }> {
    console.log("🔄 MockAPI.createOrder() called with:", orderData);
    return new Promise((resolve) => {
      setTimeout(() => {
        const newOrder: Order = {
          id: Date.now().toString(),
          orderNumber: `ORD-${Date.now().toString().slice(-6)}`,
          order_number: `ORD-${Date.now().toString().slice(-6)}`,
          customer_id: "guest",
          items: orderData.items || [],
          status: "pending",
          total: orderData.total || 0,
          total_amount: orderData.total || 0,
          payment_method: orderData.payment_method || "cash",
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        console.log("✅ MockAPI.createOrder() creating new order:", newOrder);

        // グローバルデータに追加
        const globalData = getGlobalData();
        globalData.orders.push(newOrder);
        updateGlobalOrders(globalData.orders);

        console.log(
          "✅ MockAPI.createOrder() global orders length:",
          globalData.orders.length
        );
        console.log(
          "✅ MockAPI.createOrder() all global orders:",
          globalData.orders
        );

        resolve({ data: newOrder });
      }, 500);
    });
  }

  // 注文更新
  static async updateOrder(
    orderId: string,
    updates: Partial<Order>
  ): Promise<{ data: Order }> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const globalData = getGlobalData();
        const orderIndex = globalData.orders.findIndex(
          (order) => order.id === orderId
        );

        if (orderIndex !== -1) {
          globalData.orders[orderIndex] = {
            ...globalData.orders[orderIndex],
            ...updates,
            updatedAt: new Date(),
          };

          updateGlobalOrders(globalData.orders);
          console.log(
            `📝 MockAPI: 注文 ${orderId} のステータスを ${updates.status} に更新`
          );

          resolve({ data: globalData.orders[orderIndex] });
        } else {
          reject(new Error("Order not found"));
        }
      }, 500);
    });
  }

  // 注文ステータス更新（厨房画面用）
  static async updateOrderStatus(
    orderId: string,
    status: Order["status"]
  ): Promise<{ data: Order }> {
    return this.updateOrder(orderId, { status });
  }

  // 注文番号で注文を取得
  static async getOrderByNumber(
    orderNumber: string
  ): Promise<{ success: boolean; data?: Order }> {
    console.log(
      "🔄 MockAPI.getOrderByNumber() called with orderNumber:",
      orderNumber
    );
    return new Promise((resolve) => {
      setTimeout(() => {
        const globalData = getGlobalData();
        const order = globalData.orders.find(
          (o) => o.orderNumber === orderNumber || o.order_number === orderNumber
        );

        if (order) {
          console.log("✅ MockAPI.getOrderByNumber() found order:", order);
          resolve({ success: true, data: order });
        } else {
          console.log("❌ MockAPI.getOrderByNumber() order not found");
          resolve({ success: false });
        }
      }, 300);
    });
  }

  // データリセット機能（テスト用）
  static async resetData(): Promise<void> {
    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_KEY);
      console.log("💾 LocalStorageのデータをクリアしました");

      // 初期データを再作成
      const initialData = {
        products: mockProducts,
        orders: [...initialMockOrders],
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(initialData));
      console.log("💾 初期データをリセットしました");

      // 他のタブに通知
      window.dispatchEvent(new Event("unifest-data-updated"));
    }
  }

  // 現在のデータ状況を確認（デバッグ用）
  static getDataStatus(): { products: number; orders: number } {
    const data = getGlobalData();
    return {
      products: data.products.length,
      orders: data.orders.length,
    };
  } // テスト用注文を作成する関数（開発用）
  static async createTestOrder(): Promise<{ data: Order }> {
    console.log("🧪 MockAPI.createTestOrder() called");
    const testOrderData: Partial<Order> = {
      orderNumber: `TEST-${Date.now().toString().slice(-6)}`,
      items: [
        {
          id: "1",
          name: "テスト商品",
          product_name: "テスト商品",
          price: 1000,
          quantity: 1,
          totalPrice: 1000,
          toppings: [],
        },
      ],
      total: 1000,
      status: "pending" as const,
      payment_status: "pending",
      customerName: "テストユーザー",
      notes: "テスト注文",
    };

    return this.createOrder(testOrderData);
  }
}

// 開発環境でのみテスト関数をグローバルに追加
if (import.meta.env.DEV) {
  // @ts-expect-error - Adding MockApi to global window for development debugging
  window.MockApi = MockApi;
  // @ts-expect-error - Adding createTestOrder to global window for development testing
  window.createTestOrder = () => MockApi.createTestOrder();
}

// デバッグ用関数をグローバルに公開
if (typeof window !== "undefined") {
  // デバッグ関数をグローバルに公開
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).debugMockApi = {
    // データ確認
    checkData: () => {
      const data = getGlobalData();
      console.log("🔍 Current Data:", data);
      console.log("📦 Orders:", data.orders);
      console.log("🍱 Products:", data.products);
      return data;
    },

    // データリセット
    resetData: () => {
      localStorage.removeItem(STORAGE_KEY);
      console.log("🔄 Data reset complete");
      window.location.reload();
    },

    // テスト用注文追加
    addTestOrder: () => {
      const testOrder = MockApi.createTestOrder();
      console.log("➕ Test order added:", testOrder);
      return testOrder;
    },

    // LocalStorage状態確認
    checkStorage: () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          console.log("💾 LocalStorage content:", parsed);
          return parsed;
        } else {
          console.log("💾 LocalStorage is empty");
          return null;
        }
      } catch (error) {
        console.error("💾 LocalStorage error:", error);
        return null;
      }
    },
  };

  console.log("🛠️ Debug tools available: window.debugMockApi");
}

export default MockApi;
