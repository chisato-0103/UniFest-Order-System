// 🌐 統一API通信サービス
// 全ページで使用する共通のAPI通信ロジックを管理します
// エラーハンドリング、型変換、ローディング状態を統一します

import { apiLogger } from "../utils/logger";
import { API_BASE_URL } from "../config/api";
import type {
  Product,
  Topping,
  Order,
  CartItem,
  OrderStatus,
  PaymentStatus,
} from "../types";

// 🚫 API通信のエラー種別
export class ApiError extends Error {
  public status?: number;
  public code?: string;

  constructor(message: string, status?: number, code?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

// 📊 API共通のレスポンス型
interface ApiResponse<T = unknown> {
  success?: boolean;
  data?: T;
  order_id?: string | number;
  id?: string | number;
  order_number?: string;
  [key: string]: unknown;
}

// API応答用の具体的な型定義
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

interface RawOrderData {
  order_id: string | number;
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

// ⏱️ タイムアウト付きfetch
async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs = 8000
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache",
        ...options.headers,
      },
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

// 🔄 APIレスポンスの共通処理
async function handleApiResponse<T>(
  response: Response
): Promise<ApiResponse<T>> {
  if (!response.ok) {
    let errorMessage = `API通信エラー: ${response.status}`;

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
    const data = await response.json();
    return data as ApiResponse<T>;
  } catch {
    throw new ApiError("レスポンスの解析に失敗しました");
  }
}

// 🍽️ 商品関連API
export class ProductService {
  // 🔍 商品一覧を取得
  static async getProducts(): Promise<Product[]> {
    try {
      const requestId = apiLogger.logApiStart(
        `${API_BASE_URL}/api/products`,
        "GET"
      );
      const startTime = Date.now();

      const response = await fetchWithTimeout(`${API_BASE_URL}/api/products`);
      const result = await handleApiResponse<RawProductData[]>(response);

      const duration = Date.now() - startTime;
      apiLogger.logApiSuccess(
        requestId,
        `${API_BASE_URL}/api/products`,
        response.status,
        duration
      );

      if (!result.success || !Array.isArray(result.data)) {
        throw new ApiError("商品データの形式が正しくありません");
      }

      // 🔄 APIレスポンスをProduct型に変換
      const products: Product[] = result.data.map((item: RawProductData) => ({
        id: item.product_id?.toString() || "",
        name: item.product_name || "",
        price: parseFloat(item.price) || 0,
        category: item.category_name || "メイン",
        description: item.description || `${item.product_name}です`,
        available: item.status === "有効" && (item.stock_quantity || 0) > 0,
        status: item.status,
        preparationTime: item.preparation_time || 10,
      }));

      return products;
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
  static async getToppings(): Promise<Topping[]> {
    try {
      const requestId = apiLogger.logApiStart(
        `${API_BASE_URL}/api/toppings`,
        "GET"
      );
      const startTime = Date.now();

      const response = await fetchWithTimeout(`${API_BASE_URL}/api/toppings`);
      const result = await handleApiResponse<RawToppingData[]>(response);

      const duration = Date.now() - startTime;
      apiLogger.logApiSuccess(
        requestId,
        `${API_BASE_URL}/api/toppings`,
        response.status,
        duration
      );

      if (!result.success || !Array.isArray(result.data)) {
        throw new ApiError("トッピングデータの形式が正しくありません");
      }

      // 🔄 APIレスポンスをTopping型に変換
      const toppings: Topping[] = result.data.map((item: RawToppingData) => ({
        id: item.topping_id?.toString() || "",
        name: item.topping_name || "",
        price:
          typeof item.price === "string"
            ? parseFloat(item.price)
            : item.price || 0,
        available: item.available !== false,
      }));

      return toppings;
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
export class OrderService {
  // 🔍 注文一覧を取得
  static async getOrders(): Promise<Order[]> {
    try {
      const requestId = apiLogger.logApiStart(
        `${API_BASE_URL}/api/orders`,
        "GET"
      );
      const startTime = Date.now();

      const response = await fetchWithTimeout(`${API_BASE_URL}/api/orders`);
      const result = await handleApiResponse<unknown[]>(response);

      const duration = Date.now() - startTime;
      apiLogger.logApiSuccess(
        requestId,
        `${API_BASE_URL}/api/orders`,
        response.status,
        duration
      );

      const ordersData = result.data || result || [];
      if (!Array.isArray(ordersData)) {
        throw new ApiError("注文データの形式が正しくありません");
      }

      // 🔄 APIレスポンスをOrder型に変換
      const orders: Order[] = ordersData.map((item: unknown) => {
        const rawOrder = item as RawOrderData;
        return {
          id: (rawOrder.order_id || "").toString(),
          orderNumber: rawOrder.order_number || "",
          customer_id: rawOrder.customer_id,
          items: (rawOrder.order_items || rawOrder.items || []).map(
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
          total:
            parseFloat(String(rawOrder.total_amount || rawOrder.total_price)) ||
            0,
          total_amount:
            parseFloat(String(rawOrder.total_amount || rawOrder.total_price)) ||
            0,
          status: (rawOrder.order_status ||
            rawOrder.status ||
            "pending") as OrderStatus,
          payment_status: (rawOrder.payment_status ||
            "pending") as PaymentStatus,
          payment_method: rawOrder.payment_method || "cash",
          notes: rawOrder.special_instructions || "",
          createdAt: new Date(rawOrder.created_at || new Date()),
          updatedAt: new Date(rawOrder.updated_at || new Date()),
          estimatedCompletionTime: rawOrder.estimated_pickup_time
            ? new Date(rawOrder.estimated_pickup_time)
            : undefined,
          order_number: rawOrder.order_number || "",
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

      return orders;
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
  static async createOrder(orderData: {
    items: CartItem[];
    totalAmount: number;
    paymentMethod?: string;
    specialInstructions?: string;
  }): Promise<Order> {
    try {
      const requestId = apiLogger.logApiStart(
        `${API_BASE_URL}/api/orders`,
        "POST"
      );
      const startTime = Date.now();

      const requestData = {
        customer_id: null,
        items: orderData.items.map((item) => ({
          product_id: item.id,
          quantity: item.quantity,
          unit_price: item.price,
          toppings: item.toppings || [],
        })),
        total_amount: orderData.totalAmount,
        payment_method: orderData.paymentMethod || "cash",
        payment_status: "pending",
        special_instructions: orderData.specialInstructions || "",
      };

      const response = await fetchWithTimeout(`${API_BASE_URL}/api/orders`, {
        method: "POST",
        body: JSON.stringify(requestData),
      });

      const result = await handleApiResponse<unknown>(response);

      const duration = Date.now() - startTime;
      apiLogger.logApiSuccess(
        requestId,
        `${API_BASE_URL}/api/orders`,
        response.status,
        duration
      );

      // 🔄 レスポンスをOrder型に変換
      const order: Order = {
        id: (result.order_id || result.id || "").toString(),
        orderNumber: String(result.order_number || ""),
        customer_id: result.customer_id as string | number | undefined,
        items: orderData.items,
        total: orderData.totalAmount,
        total_amount: orderData.totalAmount,
        status: ((result.order_status as string) || "pending") as OrderStatus,
        payment_status: ((result.payment_status as string) ||
          "pending") as PaymentStatus,
        payment_method: String(result.payment_method || "cash"),
        notes: String(result.special_instructions || ""),
        createdAt: new Date(String(result.created_at || new Date())),
        updatedAt: new Date(String(result.updated_at || new Date())),
        order_number: String(result.order_number || ""),
        order_items: orderData.items,
      };

      return order;
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
  static async updateOrderStatus(
    orderId: string,
    status: string,
    additionalData?: Record<string, unknown>
  ): Promise<void> {
    try {
      const requestId = apiLogger.logApiStart(
        `${API_BASE_URL}/api/orders/${orderId}`,
        "PUT"
      );
      const startTime = Date.now();

      const response = await fetchWithTimeout(
        `${API_BASE_URL}/api/orders/${orderId}`,
        {
          method: "PUT",
          body: JSON.stringify({ status, ...additionalData }),
        }
      );

      await handleApiResponse(response);

      const duration = Date.now() - startTime;
      apiLogger.logApiSuccess(
        requestId,
        `${API_BASE_URL}/api/orders/${orderId}`,
        response.status,
        duration
      );
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
  static async processPayment(
    orderId: string,
    paymentData: {
      paymentMethod: string;
      amount: number;
      receivedAmount?: number;
    }
  ): Promise<void> {
    try {
      const requestId = apiLogger.logApiStart(
        `${API_BASE_URL}/api/orders/${orderId}/payment`,
        "POST"
      );
      const startTime = Date.now();

      const response = await fetchWithTimeout(
        `${API_BASE_URL}/api/orders/${orderId}/payment`,
        {
          method: "POST",
          body: JSON.stringify(paymentData),
        }
      );

      await handleApiResponse(response);

      const duration = Date.now() - startTime;
      apiLogger.logApiSuccess(
        requestId,
        `${API_BASE_URL}/api/orders/${orderId}/payment`,
        response.status,
        duration
      );
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
