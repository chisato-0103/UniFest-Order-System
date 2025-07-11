// 型定義は必ずファイル先頭のトップレベルに記述
interface RawProductData {
  product_id: number;
  product_name: string;
  price: string;
  category_name?: string;
  description?: string;
  status: string;
  stock_quantity: number;
  preparation_time?: number;
}

interface RawToppingData {
  topping_id: number;
  topping_name: string;
  price: number;
  available?: boolean;
}

interface RawOrderItemData {
  product_id: string | number;
  id?: string | number;
  product_name?: string;
  name?: string;
  unit_price?: string | number;
  price?: string | number;
  quantity: string | number;
  total_price?: string | number;
  toppings?: RawToppingData[];
}

interface RawOrderData {
  order_id?: string | number;
  id?: string | number;
  order_number?: string;
  customer_id?: string | number;
  order_items?: RawOrderItemData[];
  items?: RawOrderItemData[];
  total_amount?: string | number;
  total_price?: string | number;
  order_status?: string;
  status?: string;
  payment_status?: string;
  payment_method?: string;
  special_instructions?: string;
  created_at?: string;
  updated_at?: string;
  estimated_pickup_time?: string;
}
// 🌐 統一API通信サービス
// 全ページで使用する共通のAPI通信ロジックを管理します
// エラーハンドリング、型変換、ローディング状態を統一します

// =========================
// 依存モジュール・型のimport
// =========================

import { apiLogger } from "../utils/logger"; // API通信のログ出力用
import { API_BASE_URL } from "../config/api"; // APIのベースURL
import type {
  Product, // 商品型
  Topping, // トッピング型
  Order, // 注文型
  // CartItem, // カート内商品型（未使用のためコメントアウト）
  OrderStatus, // 注文ステータス型
  PaymentStatus, // 支払いステータス型
} from "../types";
import type { OrderItemForApi } from "./orderTypes";
// 型定義を明示的にエクスポート

// 🚫 API通信のエラー種別
// API通信で発生したエラーを表現する独自エラークラス
export class ApiError extends Error {
  public status?: number; // HTTPステータス
  public code?: string; // エラーコード

  constructor(message: string, status?: number, code?: string) {
    super(message); // 親クラスErrorの初期化
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

// 📊 API共通のレスポンス型
// APIから返ってくるレスポンスの型（汎用）
interface ApiResponse<T = unknown> {
  success?: boolean; // 成功フラグ
  data?: T; // 実データ
  order_id?: string | number; // 注文ID
  id?: string | number; // 汎用ID
  order_number?: string; // 注文番号
  [key: string]: unknown; // その他のプロパティ
}

// API応答用の具体的な型定義
// サーバーから返ってくる生データの型
interface RawOrderData {
  order_id?: string | number; // 注文ID
  id?: string | number; // 汎用ID
  order_number?: string; // 注文番号
  customer_id?: string | number; // 顧客ID
  order_items?: RawOrderItemData[]; // 注文商品リスト
  items?: RawOrderItemData[]; // 注文商品リスト（別名）
  total_amount?: string | number; // 合計金額
  total_price?: string | number; // 合計金額（別名）
  order_status?: string; // 注文ステータス
  status?: string; // 注文ステータス（別名）
  payment_status?: string; // 支払いステータス
  payment_method?: string; // 支払い方法
  special_instructions?: string; // 特記事項
  created_at?: string; // 作成日時
  updated_at?: string; // 更新日時
  estimated_pickup_time?: string; // 受取予定時刻
}

// API応答用の具体的な型定義
// サーバーから返ってくる生データの型
interface RawProductData {
  product_id: number; // 商品ID
  product_name: string; // 商品名
  price: string; // 価格（文字列）
  category_name?: string; // カテゴリ名
  description?: string; // 商品説明
  status: string; // 商品ステータス
  stock_quantity: number; // 在庫数
  preparation_time?: number; // 調理時間
}

interface RawToppingData {
  topping_id: number; // トッピングID
  topping_name: string; // トッピング名
  price: number; // 価格
  available?: boolean; // 利用可否
}
interface RawProductData {
  product_id: number; // 商品ID
  product_name: string; // 商品名
  price: string; // 価格（文字列）
  category_name?: string; // カテゴリ名
  description?: string; // 商品説明
  status: string; // 商品ステータス
  stock_quantity: number; // 在庫数
  preparation_time?: number; // 調理時間
}

interface RawToppingData {
  topping_id: number; // トッピングID
  topping_name: string; // トッピング名
  price: number; // 価格
  available?: boolean; // 利用可否
}

interface RawOrderData {
  order_id?: string | number;
  id?: string | number;
  order_number?: string;
  customer_id?: string | number;
  total_amount?: string | number;
  total_price?: string | number;
  status?: string;
  order_status?: string;
  payment_status?: string;
  payment_method?: string;
  special_instructions?: string;
  created_at?: string;
  updated_at?: string;
  estimated_pickup_time?: string;
}
// --- 型定義はファイル先頭に移動 ---
interface RawOrderData {
  order_id?: string | number;
  order_number?: string;
  customer_id?: string | number;
  order_items?: RawOrderItemData[];
  items?: RawOrderItemData[];
  total_amount?: string | number;
  total_price?: string | number;
  order_status?: string;
  status?: string;
  payment_status?: string;
  payment_method?: string;
  special_instructions?: string;
  created_at?: string;
  updated_at?: string;
  estimated_pickup_time?: string;
}

interface RawOrderItemData {
  product_id: string | number; // 商品ID
  id?: string | number; // 商品ID（別名）
  product_name?: string; // 商品名
  name?: string; // 商品名（別名）
  unit_price?: string | number; // 単価
  price?: string | number; // 単価（別名）
  quantity: string | number; // 数量
  total_price?: string | number; // 小計
  toppings?: RawToppingData[]; // トッピングリスト
}

// ⏱️ タイムアウト付きfetch
// fetchにタイムアウト機能を付与したラッパー関数
async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs = 8000
): Promise<Response> {
  const controller = new AbortController(); // 中断用コントローラ
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs); // タイムアウト設定

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal, // タイムアウト時にabort
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache",
        ...options.headers,
      },
    });
    clearTimeout(timeoutId); // タイマー解除
    return response;
  } catch (error) {
    clearTimeout(timeoutId); // タイマー解除
    throw error;
  }
}

// 🔄 APIレスポンスの共通処理
// fetchのレスポンスを共通的に処理し、エラー時はApiErrorを投げる
async function handleApiResponse<T>(
  response: Response
): Promise<ApiResponse<T>> {
  if (!response.ok) {
    let errorMessage = `API通信エラー: ${response.status}`;

    // ステータスごとにエラーメッセージを分岐
    switch (response.status) {
      case 503:
        errorMessage = "サーバーがメンテナンス中です";
        break;
      case 500:
        errorMessage = "サーバーエラーが発生しました";
        break;
      case 404:
        errorMessage = "データが見つかりません";
        break;
      case 400:
        errorMessage = "リクエストが正しくありません";
        break;
    }

    throw new ApiError(errorMessage, response.status);
  }

  try {
    const data = await response.json(); // JSONとしてパース
    return data as ApiResponse<T>;
  } catch {
    throw new ApiError("レスポンスの解析に失敗しました");
  }
}

// 🍽️ 商品関連API
// 商品取得・トッピング取得など商品関連のAPI通信をまとめたサービスクラス
export class ProductService {
  // 🔍 商品一覧を取得
  // サーバーから商品一覧を取得し、Product型配列に変換して返す
  static async getProducts(): Promise<Product[]> {
    try {
      const requestId = apiLogger.logApiStart(
        `${API_BASE_URL}/api/products`,
        "GET"
      ); // APIリクエスト開始ログ
      const startTime = Date.now(); // 開始時刻

      const response = await fetchWithTimeout(`${API_BASE_URL}/api/products`); // fetch実行
      const result = await handleApiResponse<RawProductData[]>(response); // レスポンス共通処理

      const duration = Date.now() - startTime; // 所要時間
      apiLogger.logApiSuccess(
        requestId,
        `${API_BASE_URL}/api/products`,
        response.status,
        duration
      ); // 成功ログ

      if (!result.success || !Array.isArray(result.data)) {
        throw new ApiError("商品データの形式が正しくありません");
      }

      // 🔄 APIレスポンスをProduct型に変換
      const products: Product[] = result.data.map((item: RawProductData) => ({
        id: item.product_id?.toString() || "", // 商品ID
        name: item.product_name || "", // 商品名
        price: parseFloat(item.price) || 0, // 価格
        category: item.category_name || "メイン", // カテゴリ
        description: item.description || `${item.product_name}です`, // 説明
        available: item.status === "有効" && (item.stock_quantity || 0) > 0, // 販売可否
        status: item.status, // ステータス
        preparationTime: item.preparation_time || 10, // 調理時間
      }));

      return products; // Product型配列を返す
    } catch (error) {
      const requestId = "unknown";
      apiLogger.logApiError(
        requestId,
        `${API_BASE_URL}/api/products`,
        error as Error,
        1,
        1
      );
      throw error;
    }
  }

  // 🍯 トッピング一覧を取得
  // サーバーからトッピング一覧を取得し、Topping型配列に変換して返す
  static async getToppings(): Promise<Topping[]> {
    try {
      const requestId = apiLogger.logApiStart(
        `${API_BASE_URL}/api/toppings`,
        "GET"
      ); // APIリクエスト開始ログ
      const startTime = Date.now(); // 開始時刻

      const response = await fetchWithTimeout(`${API_BASE_URL}/api/toppings`); // fetch実行
      const result = await handleApiResponse<RawToppingData[]>(response); // レスポンス共通処理

      const duration = Date.now() - startTime; // 所要時間
      apiLogger.logApiSuccess(
        requestId,
        `${API_BASE_URL}/api/toppings`,
        response.status,
        duration
      ); // 成功ログ

      if (!result.success || !Array.isArray(result.data)) {
        throw new ApiError("トッピングデータの形式が正しくありません");
      }

      // 🔄 APIレスポンスをTopping型に変換
      const toppings: Topping[] = result.data.map((item: RawToppingData) => ({
        id: item.topping_id?.toString() || "", // トッピングID
        name: item.topping_name || "", // トッピング名
        price:
          typeof item.price === "string"
            ? parseFloat(item.price)
            : item.price || 0, // 価格
        available: item.available !== false, // 利用可否
      }));

      return toppings; // Topping型配列を返す
    } catch (error) {
      const requestId = "unknown";
      apiLogger.logApiError(
        requestId,
        `${API_BASE_URL}/api/toppings`,
        error as Error,
        1,
        1
      );
      throw error;
    }
  }
}

// 📦 注文関連API
// 注文取得・作成・更新・支払いなど注文関連のAPI通信をまとめたサービスクラス
export class OrderService {
  // 🔍 注文一覧を取得
  // サーバーから注文一覧を取得し、Order型配列に変換して返す
  static async getOrders(): Promise<Order[]> {
    try {
      const requestId = apiLogger.logApiStart(
        `${API_BASE_URL}/api/orders`,
        "GET"
      ); // APIリクエスト開始ログ
      const startTime = Date.now(); // 開始時刻

      const response = await fetchWithTimeout(`${API_BASE_URL}/api/orders`); // fetch実行
      const result = await handleApiResponse<unknown[]>(response); // レスポンス共通処理

      const duration = Date.now() - startTime; // 所要時間
      apiLogger.logApiSuccess(
        requestId,
        `${API_BASE_URL}/api/orders`,
        response.status,
        duration
      ); // 成功ログ

      const ordersData = result.data || result || [];
      if (!Array.isArray(ordersData)) {
        throw new ApiError("注文データの形式が正しくありません");
      }

      // 🔄 APIレスポンスをOrder型に変換
      const orders: Order[] = ordersData.map((item: unknown) => {
        const rawOrder = item as RawOrderData;
        return {
          id: (rawOrder.order_id || "").toString(), // 注文ID
          orderNumber: rawOrder.order_number || "", // 注文番号
          customer_id: rawOrder.customer_id, // 顧客ID
          items: (rawOrder.order_items || rawOrder.items || []).map(
            (orderItem: RawOrderItemData) => ({
              id: (orderItem.product_id || orderItem.id || "").toString(), // 商品ID
              name: orderItem.product_name || orderItem.name || "", // 商品名
              price:
                parseFloat(String(orderItem.unit_price || orderItem.price)) ||
                0, // 単価
              quantity: parseInt(String(orderItem.quantity)) || 1, // 数量
              toppings: (orderItem.toppings || []).map(
                (topping: RawToppingData) => ({
                  id: (topping.topping_id || "").toString(), // トッピングID
                  name: topping.topping_name || "", // トッピング名
                  price: parseFloat(String(topping.price)) || 0, // 価格
                  available: true, // 利用可否
                })
              ),
              totalPrice:
                parseFloat(String(orderItem.total_price || orderItem.price)) ||
                0, // 小計
            })
          ),
          total:
            parseFloat(String(rawOrder.total_amount || rawOrder.total_price)) ||
            0, // 合計
          total_amount:
            parseFloat(String(rawOrder.total_amount || rawOrder.total_price)) ||
            0, // 合計（別名）
          status: (rawOrder.order_status ||
            rawOrder.status ||
            "pending") as OrderStatus, // 注文ステータス
          payment_status: (rawOrder.payment_status ||
            "pending") as PaymentStatus, // 支払いステータス
          payment_method: rawOrder.payment_method || "cash", // 支払い方法
          notes: rawOrder.special_instructions || "", // 特記事項
          createdAt: new Date(rawOrder.created_at || new Date()), // 作成日時
          updatedAt: new Date(rawOrder.updated_at || new Date()), // 更新日時
          estimatedCompletionTime: rawOrder.estimated_pickup_time
            ? new Date(rawOrder.estimated_pickup_time)
            : undefined, // 受取予定時刻
          order_number: rawOrder.order_number || "", // 注文番号（別名）
          order_items: (rawOrder.order_items || rawOrder.items || []).map(
            (orderItem: RawOrderItemData) => ({
              id: (orderItem.product_id || orderItem.id || "").toString(),
              name: orderItem.product_name || orderItem.name || "",
              price:
                parseFloat(String(orderItem.unit_price || orderItem.price)) ||
                0,
              quantity: parseInt(String(orderItem.quantity)) || 1,
              toppings: (orderItem.toppings || []).map(
                (topping: RawToppingData) => ({
                  id: (topping.topping_id || "").toString(),
                  name: topping.topping_name || "",
                  price: parseFloat(String(topping.price)) || 0,
                  available: true,
                })
              ),
              totalPrice:
                parseFloat(String(orderItem.total_price || orderItem.price)) ||
                0,
            })
          ),
        };
      });

      return orders; // Order型配列を返す
    } catch (error) {
      const requestId = "unknown";
      apiLogger.logApiError(
        requestId,
        `${API_BASE_URL}/api/orders`,
        error as Error,
        1,
        1
      );
      throw error;
    }
  }

  // 📝 新しい注文を作成
  // サーバーに注文データをPOSTし、作成されたOrder型を返す

  static async createOrder(orderData: {
    items: OrderItemForApi[]; // API送信用の注文商品リスト
    totalAmount: number; // 合計金額
    paymentMethod?: string; // 支払い方法
    specialInstructions?: string; // 特記事項
  }): Promise<Order> {
    try {
      const requestId = apiLogger.logApiStart(
        `${API_BASE_URL}/api/orders`,
        "POST"
      ); // APIリクエスト開始ログ
      const startTime = Date.now(); // 開始時刻

      // サーバーに送る注文データを整形
      const requestData = {
        customer_id: null, // 顧客ID（未使用）
        items: orderData.items.map((item) => ({
          product_id: item.product_id, // ←修正: product_idをそのまま使う
          quantity: item.quantity, // 数量
          unit_price: item.price, // 単価
          toppings: item.toppings || [], // トッピング
        })),
        total_amount: orderData.totalAmount, // 合計金額
        payment_method: orderData.paymentMethod || "cash", // 支払い方法
        payment_status: "pending", // 支払いステータス
        special_instructions: orderData.specialInstructions || "", // 特記事項
      };

      // POSTリクエストで注文データを送信
      const response = await fetchWithTimeout(`${API_BASE_URL}/api/orders`, {
        method: "POST",
        body: JSON.stringify(requestData),
      });

      const result = await handleApiResponse<unknown>(response); // レスポンス共通処理
      console.log("[DEBUG] APIレスポンス result:", result);

      const duration = Date.now() - startTime; // 所要時間
      apiLogger.logApiSuccess(
        requestId,
        `${API_BASE_URL}/api/orders`,
        response.status,
        duration
      ); // 成功ログ

      // 🔄 レスポンスをOrder型に変換
      // API送信用OrderItemForApi[]をCartItem[]に変換（最低限の型整合性を保つ）
      type ToppingForApi = {
        topping_id: string | number;
        name?: string;
        price?: number;
      };
      const itemsAsCartItem = orderData.items.map((item) => ({
        id: String(item.product_id),
        name:
          typeof item.product_name === "string"
            ? item.product_name
            : typeof item.name === "string"
            ? item.name
            : "商品",
        price: typeof item.price === "number" ? item.price : 0,
        quantity: item.quantity,
        toppings: (item.toppings || []).map((t: ToppingForApi) => ({
          id: String(t.topping_id),
          name: typeof t.name === "string" ? t.name : "トッピング",
          price: typeof t.price === "number" ? t.price : 0,
          available: true,
        })),
        totalPrice:
          (typeof item.price === "number" ? item.price : 0) * item.quantity +
          (item.toppings || []).reduce(
            (sum: number, t: ToppingForApi) =>
              sum + (typeof t.price === "number" ? t.price : 0),
            0
          ),
      }));

      const data: RawOrderData = (result.data as RawOrderData) || {};
      const order: Order = {
        id: (data.order_id || data.id || "").toString(), // 注文ID
        orderNumber: String(data.order_number || ""), // 注文番号
        customer_id: data.customer_id as string | number | undefined, // 顧客ID
        items: itemsAsCartItem, // 商品リスト（CartItem[]型に変換）
        total: Number(data.total_amount ?? orderData.totalAmount), // 合計
        total_amount: Number(data.total_amount ?? orderData.totalAmount), // 合計
        status: ((data.status as string) || "pending") as OrderStatus, // 注文ステータス
        payment_status: ((data.payment_status as string) ||
          "pending") as PaymentStatus, // 支払いステータス
        payment_method: String(data.payment_method || "cash"), // 支払い方法
        notes: String(data.special_instructions || ""), // 特記事項
        createdAt: new Date(String(data.created_at || new Date())), // 作成日時
        updatedAt: new Date(String(data.updated_at || new Date())), // 更新日時
        order_number: String(data.order_number || ""), // 注文番号（別名）
        order_items: itemsAsCartItem, // 商品リスト（CartItem[]型に変換）
      };

      return order; // 作成されたOrder型を返す
    } catch (error) {
      const requestId = "unknown";
      apiLogger.logApiError(
        requestId,
        `${API_BASE_URL}/api/orders`,
        error as Error,
        1,
        1
      );
      throw error;
    }
  }

  // 🔄 注文状況を更新
  // サーバーに注文ステータス変更をPUTで送信
  static async updateOrderStatus(
    orderId: string, // 注文ID
    status: string, // 新しいステータス
    additionalData?: Record<string, unknown> // 追加データ
  ): Promise<void> {
    try {
      const requestId = apiLogger.logApiStart(
        `${API_BASE_URL}/api/orders/${orderId}`,
        "PUT"
      ); // APIリクエスト開始ログ
      const startTime = Date.now(); // 開始時刻

      // PUTリクエストで注文ステータスを更新
      const response = await fetchWithTimeout(
        `${API_BASE_URL}/api/orders/${orderId}`,
        {
          method: "PUT",
          body: JSON.stringify({ status, ...additionalData }),
        }
      );

      await handleApiResponse(response); // レスポンス共通処理

      const duration = Date.now() - startTime; // 所要時間
      apiLogger.logApiSuccess(
        requestId,
        `${API_BASE_URL}/api/orders/${orderId}`,
        response.status,
        duration
      ); // 成功ログ
    } catch (error) {
      const requestId = "unknown";
      apiLogger.logApiError(
        requestId,
        `${API_BASE_URL}/api/orders/${orderId}`,
        error as Error,
        1,
        1
      );
      throw error;
    }
  }

  // 💳 支払い処理
  // サーバーに支払い情報をPOSTし、決済処理を行う
  static async processPayment(
    orderId: string, // 注文ID
    paymentData: {
      paymentMethod: string; // 支払い方法
      amount: number; // 支払い金額
      receivedAmount?: number; // 受取金額
    }
  ): Promise<void> {
    try {
      const requestId = apiLogger.logApiStart(
        `${API_BASE_URL}/api/orders/${orderId}/payment`,
        "POST"
      ); // APIリクエスト開始ログ
      const startTime = Date.now(); // 開始時刻

      // POSTリクエストで支払い情報を送信
      const response = await fetchWithTimeout(
        `${API_BASE_URL}/api/orders/${orderId}/payment`,
        {
          method: "POST",
          body: JSON.stringify(paymentData),
        }
      );

      await handleApiResponse(response); // レスポンス共通処理

      const duration = Date.now() - startTime; // 所要時間
      apiLogger.logApiSuccess(
        requestId,
        `${API_BASE_URL}/api/orders/${orderId}/payment`,
        response.status,
        duration
      ); // 成功ログ
    } catch (error) {
      const requestId = "unknown";
      apiLogger.logApiError(
        requestId,
        `${API_BASE_URL}/api/orders/${orderId}/payment`,
        error as Error,
        1,
        1
      );
      throw error;
    }
  }
}

// 📊 フォールバック用のダミーデータ
// サーバーが落ちている場合などに使うダミーデータ
export const FALLBACK_DATA = {
  products: [
    {
      id: "1",
      name: "たこ焼き 6個入り",
      price: 500,
      category: "メイン",
      description: "定番の6個入りたこ焼きです",
      available: true,
    },
    {
      id: "2",
      name: "たこ焼き 8個入り",
      price: 650,
      category: "メイン",
      description: "お得な8個入りたこ焼きです",
      available: true,
    },
  ] as Product[],

  toppings: [
    { id: "1", name: "ソース", price: 0, available: true },
    { id: "2", name: "マヨネーズ", price: 0, available: true },
    { id: "3", name: "青のり", price: 50, available: true },
    { id: "4", name: "かつお節", price: 50, available: true },
  ] as Topping[],
};
