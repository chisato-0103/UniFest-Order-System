// 🔄 API通信の安定性を向上させるユーティリティ
// タイムアウト、リトライ、エラーハンドリングを統一管理

import { apiLogger } from "./logger";

interface FetchOptions extends RequestInit {
  timeout?: number; // タイムアウト時間（ミリ秒）
  retries?: number; // リトライ回数
  retryDelay?: number; // リトライ間隔（ミリ秒）
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

/**
 * 🚀 改良版fetch関数
 * - 自動リトライ機能付き
 * - タイムアウト処理
 * - エラーハンドリング統一
 */
export async function fetchWithRetry<T>(
  url: string,
  options: FetchOptions = {}
): Promise<ApiResponse<T>> {
  const {
    timeout = 30000, // 30秒に大幅延長
    retries = 2, // リトライ回数を減らして負荷軽減
    retryDelay = 3000, // 3秒間隔
    ...fetchOptions
  } = options;

  let lastError: Error | null = null;
  const requestId = apiLogger.logApiStart(
    url,
    (fetchOptions.method as string) || "GET",
    {
      timeout,
      retries,
      retryDelay,
    }
  );
  const startTime = performance.now();

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      // ネットワーク接続チェック
      if (!navigator.onLine) {
        throw new Error("インターネット接続がありません");
      }

      if (attempt > 0) {
        apiLogger.logRetry(requestId, url, attempt, retryDelay);
        await new Promise((resolve) =>
          setTimeout(resolve, retryDelay * Math.pow(2, attempt - 1))
        );
      }

      // AbortController でタイムアウト制御（Promise.race使用）
      const controller = new AbortController();

      const fetchPromise = fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache",
          Connection: "keep-alive", // 接続維持
          ...fetchOptions.headers,
        },
      });

      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          controller.abort();
          reject(new Error(`通信がタイムアウトしました (${timeout / 1000}秒)`));
        }, timeout);
      });

      const response = await Promise.race([fetchPromise, timeoutPromise]);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const duration = performance.now() - startTime;

      // 成功ログ
      apiLogger.logApiSuccess(requestId, url, response.status, duration);

      return data as ApiResponse<T>;
    } catch (error) {
      lastError = error as Error;

      // AbortErrorの場合は即座に中断（リトライしない）
      if (lastError.name === "AbortError") {
        // エラーログは記録するが、リトライは行わない
        apiLogger.logApiError(
          requestId,
          url,
          lastError,
          attempt + 1,
          retries + 1
        );
        break;
      }

      // エラーログ
      apiLogger.logApiError(
        requestId,
        url,
        lastError,
        attempt + 1,
        retries + 1
      );

      // 最後の試行でない場合はリトライ
      if (attempt < retries) {
        console.warn(
          `API呼び出し失敗 (試行 ${attempt + 1}/${retries + 1}):`,
          error
        );

        // 指数バックオフでリトライ間隔を調整
        const delay = retryDelay * Math.pow(2, attempt);
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
    }
  }

  // すべてのリトライが失敗した場合
  const errorMessage =
    lastError?.name === "AbortError"
      ? `通信がタイムアウトしました (${timeout / 1000}秒)`
      : lastError?.message || "不明なエラーが発生しました";

  throw new Error(errorMessage);
}

/**
 * 🏥 健康チェック関数
 * サーバーが正常に動作しているかを確認
 */
export async function healthCheck(baseUrl: string): Promise<boolean> {
  try {
    const response = await fetchWithRetry(`${baseUrl}/health`, {
      timeout: 5000,
      retries: 1,
    });
    return response.success;
  } catch {
    return false;
  }
}

/**
 * 📊 注文データ取得（専用関数）
 */
export async function fetchOrders(baseUrl: string) {
  return fetchWithRetry(`${baseUrl}/api/orders`, {
    timeout: 30000, // 30秒
    retries: 1, // リトライ1回のみ
    retryDelay: 5000, // 5秒間隔
  });
}

/**
 * 🔄 注文ステータス更新（専用関数）
 */
export async function updateOrderStatus(
  baseUrl: string,
  orderId: number,
  status: string
) {
  return fetchWithRetry(`${baseUrl}/api/orders/${orderId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
    timeout: 8000,
    retries: 2,
  });
}
