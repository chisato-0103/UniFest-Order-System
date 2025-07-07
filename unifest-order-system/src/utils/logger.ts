// 🐛 デバッグ・ログ機能
// API通信のエラーやパフォーマンスを詳細に記録・分析

interface LogEntry {
  timestamp: string;
  level: "INFO" | "WARN" | "ERROR" | "DEBUG";
  category: string;
  message: string;
  data?: Record<string, unknown>;
  duration?: number;
  url?: string;
  method?: string;
  status?: number;
}

class ApiLogger {
  private logs: LogEntry[] = [];
  private readonly maxLogs = 100; // 最大ログ保持数

  // 📝 ログを記録
  log(
    level: LogEntry["level"],
    category: string,
    message: string,
    data?: Record<string, unknown>
  ) {
    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      category,
      message,
      data: data ? JSON.parse(JSON.stringify(data)) : undefined,
    };

    this.logs.push(logEntry);

    // 最大数を超えたら古いログを削除
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // コンソールにも出力（開発時のみ）
    if (import.meta.env.DEV) {
      const logMethod =
        level === "ERROR"
          ? console.error
          : level === "WARN"
          ? console.warn
          : console.log;

      logMethod(`[${level}][${category}] ${message}`, data || "");
    }
  }

  // 🌐 API通信開始をログ
  logApiStart(
    url: string,
    method: string = "GET",
    options?: Record<string, unknown>
  ): string {
    const requestId = `req_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    this.log("INFO", "API_START", `API通信開始: ${method} ${url}`, {
      requestId,
      url,
      method,
      options,
      userAgent: navigator.userAgent,
      online: navigator.onLine,
    });

    return requestId;
  }

  // ✅ API通信成功をログ
  logApiSuccess(
    requestId: string,
    url: string,
    status: number,
    duration: number,
    responseSize?: number
  ) {
    this.log("INFO", "API_SUCCESS", `API通信成功: ${url}`, {
      requestId,
      url,
      status,
      duration,
      responseSize,
    });
  }

  // ❌ API通信エラーをログ
  logApiError(
    requestId: string,
    url: string,
    error: Error,
    attempt: number,
    maxRetries: number
  ) {
    this.log("ERROR", "API_ERROR", `API通信エラー: ${url}`, {
      requestId,
      url,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      attempt,
      maxRetries,
      isAbortError: error.name === "AbortError",
      isTimeoutError:
        error.message.includes("timeout") ||
        error.message.includes("タイムアウト"),
      isNetworkError:
        error.message.includes("fetch") || error.message.includes("network"),
    });
  }

  // 🔄 リトライをログ
  logRetry(requestId: string, url: string, attempt: number, delay: number) {
    this.log("WARN", "API_RETRY", `API通信リトライ: ${url} (${attempt}回目)`, {
      requestId,
      url,
      attempt,
      delay,
    });
  }

  // 📊 ログ統計を取得
  getStats() {
    const now = Date.now();
    const oneHourAgo = now - 60 * 60 * 1000;

    const recentLogs = this.logs.filter(
      (log) => new Date(log.timestamp).getTime() > oneHourAgo
    );

    const errorCount = recentLogs.filter((log) => log.level === "ERROR").length;
    const successCount = recentLogs.filter(
      (log) => log.level === "INFO" && log.category === "API_SUCCESS"
    ).length;
    const retryCount = recentLogs.filter(
      (log) => log.category === "API_RETRY"
    ).length;

    const abortErrors = recentLogs.filter(
      (log) =>
        log.level === "ERROR" &&
        log.data?.error &&
        typeof log.data.error === "object" &&
        (log.data.error as { name?: string }).name === "AbortError"
    ).length;

    const timeoutErrors = recentLogs.filter(
      (log) => log.level === "ERROR" && log.data?.isTimeoutError
    ).length;

    return {
      period: "過去1時間",
      totalRequests: successCount + errorCount,
      successCount,
      errorCount,
      retryCount,
      abortErrors,
      timeoutErrors,
      successRate:
        successCount + errorCount > 0
          ? Math.round((successCount / (successCount + errorCount)) * 100)
          : 0,
    };
  }

  // 📄 ログを出力（デバッグ用）
  exportLogs() {
    return {
      logs: this.logs,
      stats: this.getStats(),
      timestamp: new Date().toISOString(),
    };
  }

  // 🧹 ログをクリア
  clearLogs() {
    this.logs = [];
    this.log("INFO", "SYSTEM", "ログをクリアしました");
  }
}

// グローバルロガーインスタンス
export const apiLogger = new ApiLogger();

// デバッグ用のグローバル関数
if (typeof window !== "undefined") {
  (window as Window & { debugApi?: unknown }).debugApi = {
    getLogs: () => apiLogger.exportLogs(),
    getStats: () => apiLogger.getStats(),
    clearLogs: () => apiLogger.clearLogs(),
  };
}
