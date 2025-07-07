import { io, Socket } from "socket.io-client";

/**
 * Socket.ioクライアント管理サービス
 * バックエンドとのリアルタイム通信を管理
 */

export type UserType = "customer" | "kitchen" | "cashier" | "pickup" | "admin";

// Socket.ioイベントデータの型定義
export interface OrderData {
  id?: number;
  orderNumber?: string;
  customerId?: number;
  totalPrice?: number;
  status?: string;
  paymentStatus?: string;
  items?: Array<{
    productId: number;
    quantity: number;
    toppings?: number[];
  }>;
}

export interface CookingData {
  orderId: number;
  orderNumber: string;
  progress?: number;
  estimatedTime?: number;
  temperature?: number;
}

export interface StockData {
  productId: number;
  currentStock: number;
  lowStockThreshold: number;
  message?: string;
}

export interface EmergencyData {
  type: string;
  reason?: string;
  timestamp: string;
  activatedBy?: string;
}

export interface NotificationData {
  id: number;
  title: string;
  content: string;
  priority: "緊急" | "通常" | "低";
  timestamp: string;
}

export interface AudioData {
  type:
    | "new-order"
    | "cooking-complete"
    | "order-ready"
    | "emergency"
    | "temperature";
  loop?: boolean;
}

export interface StatsData {
  totalOrders: number;
  totalRevenue: number;
  averageOrderTime: number;
  peakHours: Array<{ hour: number; orders: number }>;
}

export interface SettingsData {
  storeStatus?: "open" | "closed" | "busy";
  maxOrders?: number;
  cookingTime?: number;
  message?: string;
}

// Socket.ioイベント型の統合
export type SocketEventData =
  | OrderData
  | CookingData
  | StockData
  | EmergencyData
  | NotificationData
  | AudioData
  | StatsData
  | SettingsData
  | Record<string, unknown>;

export interface SocketService {
  socket: Socket | null;
  connect: (userType: UserType) => void;
  disconnect: () => void;
  joinRoom: (roomName: string) => void;
  leaveRoom: (roomName: string) => void;
  emit: (event: string, data: SocketEventData) => void;
  on: (event: string, callback: (data: SocketEventData) => void) => void;
  off: (event: string, callback?: (data: SocketEventData) => void) => void;
  isConnected: () => boolean;
}

class SocketServiceImpl implements SocketService {
  public socket: Socket | null = null;
  private userType: UserType | null = null;
  private baseUrl: string;

  constructor() {
    // 環境変数からバックエンドURLを取得、デフォルトはlocalhost:3001
    this.baseUrl = import.meta.env.VITE_API_URL || "http://localhost:3001";
  }

  connect(userType: UserType): void {
    // 開発中でSocket.ioを無効化する場合
    if (import.meta.env.VITE_DISABLE_SOCKET === "true") {
      console.log("Socket.io is disabled in development mode");
      return;
    }

    if (this.socket?.connected) {
      console.log("Socket already connected");
      return;
    }

    console.log(`🔌 Connecting to ${this.baseUrl} as ${userType}`);

    this.userType = userType;
    this.socket = io(this.baseUrl, {
      transports: ["websocket", "polling"],
      timeout: 20000,
    });

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    if (!this.socket) return;

    this.socket.on("connect", () => {
      console.log("✅ Socket connected:", this.socket?.id);

      // 認証を送信
      if (this.userType) {
        this.socket?.emit("authenticate", { userType: this.userType });
      }
    });

    this.socket.on("disconnect", (reason) => {
      console.log("❌ Socket disconnected:", reason);
    });

    this.socket.on("authentication-success", (data) => {
      console.log("🔐 Authentication successful:", data);

      // 初期ルームに参加
      if (data.initialRoom) {
        this.joinRoom(data.initialRoom);
      }
    });

    this.socket.on("connect_error", (error) => {
      console.error("🚫 Connection error:", error);
    });

    this.socket.on("error", (error) => {
      console.error("💥 Socket error:", error);
    });

    // リアルタイムイベントの基本リスナー
    this.setupRealtimeListeners();
  }

  private setupRealtimeListeners(): void {
    if (!this.socket) return;

    // 注文関連イベント
    this.socket.on("new-order-notification", (data) => {
      console.log("📝 New order:", data);
      this.handleNewOrder(data);
    });

    this.socket.on("order-status-changed", (data) => {
      console.log("🔄 Order status changed:", data);
      this.handleOrderStatusChange(data);
    });

    this.socket.on("payment-status-changed", (data) => {
      console.log("💳 Payment status changed:", data);
      this.handlePaymentStatusChange(data);
    });

    // 調理関連イベント
    this.socket.on("cooking-started-notification", (data) => {
      console.log("👨‍🍳 Cooking started:", data);
      this.handleCookingStart(data);
    });

    this.socket.on("cooking-completed-notification", (data) => {
      console.log("✅ Cooking completed:", data);
      this.handleCookingComplete(data);
    });

    this.socket.on("cooking-progress-update", (data) => {
      console.log("⏳ Cooking progress:", data);
      this.handleCookingProgress(data);
    });

    // 在庫関連イベント
    this.socket.on("stock-updated-notification", (data) => {
      console.log("📦 Stock updated:", data);
      this.handleStockUpdate(data);
    });

    this.socket.on("stock-alert-notification", (data) => {
      console.log("⚠️ Stock alert:", data);
      this.handleStockAlert(data);
    });

    // 緊急・通知イベント
    this.socket.on("emergency-stop-activated", (data) => {
      console.log("🚨 Emergency stop activated:", data);
      this.handleEmergencyStop(data);
    });

    this.socket.on("emergency-stop-resolved", (data) => {
      console.log("✅ Emergency resolved:", data);
      this.handleEmergencyResolved(data);
    });

    this.socket.on("notification", (data) => {
      console.log("🔔 Notification:", data);
      this.handleNotification(data);
    });

    this.socket.on("audio-notification", (data) => {
      console.log("🔊 Audio notification:", data);
      this.handleAudioNotification(data);
    });

    this.socket.on("audio-alert", (data) => {
      console.log("🚨 Audio alert:", data);
      this.handleAudioAlert(data);
    });

    // 統計更新イベント
    this.socket.on("stats-update", (data) => {
      console.log("📊 Stats update:", data);
      this.handleStatsUpdate(data);
    });

    this.socket.on("stats-broadcast", (data) => {
      console.log("📈 Stats broadcast:", data);
      this.handleStatsBroadcast(data);
    });

    // システム設定イベント
    this.socket.on("settings-updated", (data) => {
      console.log("⚙️ Settings updated:", data);
      this.handleSettingsUpdate(data);
    });

    this.socket.on("store-status-changed", (data) => {
      console.log("🏪 Store status changed:", data);
      this.handleStoreStatusChange(data);
    });
  }

  // イベントハンドラー（カスタムイベントエミッターに転送）
  private handleNewOrder(data: OrderData): void {
    this.emitCustomEvent("order:new", data);
    this.showNotification("新しい注文が入りました", "info");
  }

  private handleOrderStatusChange(data: OrderData): void {
    this.emitCustomEvent("order:statusChange", data);
  }

  private handlePaymentStatusChange(data: OrderData): void {
    this.emitCustomEvent("order:paymentChange", data);
  }

  private handleCookingStart(data: CookingData): void {
    this.emitCustomEvent("cooking:start", data);
  }

  private handleCookingComplete(data: CookingData): void {
    this.emitCustomEvent("cooking:complete", data);
    this.showNotification(
      `注文${data.orderNumber}の調理が完了しました`,
      "success"
    );
  }

  private handleCookingProgress(data: CookingData): void {
    this.emitCustomEvent("cooking:progress", data);
  }

  private handleStockUpdate(data: StockData): void {
    this.emitCustomEvent("stock:update", data);
  }

  private handleStockAlert(data: StockData): void {
    this.emitCustomEvent("stock:alert", data);
    this.showNotification(data.message || "在庫が不足しています", "warning");
  }

  private handleEmergencyStop(data: EmergencyData): void {
    this.emitCustomEvent("emergency:stop", data);
    this.showNotification("緊急停止が発動されました", "error");
  }

  private handleEmergencyResolved(data: EmergencyData): void {
    this.emitCustomEvent("emergency:resolved", data);
    this.showNotification("緊急停止が解除されました", "success");
  }

  private handleNotification(data: NotificationData): void {
    this.emitCustomEvent("notification:new", data);

    const severity =
      data.priority === "緊急"
        ? "error"
        : data.priority === "通常"
        ? "info"
        : "warning";
    this.showNotification(data.content, severity);
  }

  private handleAudioNotification(data: AudioData): void {
    this.emitCustomEvent("audio:notification", data);
    this.playAudioNotification(data);
  }

  private handleAudioAlert(data: AudioData): void {
    this.emitCustomEvent("audio:alert", data);
    this.playAudioAlert(data);
  }

  private handleStatsUpdate(data: StatsData): void {
    this.emitCustomEvent("stats:update", data);
  }

  private handleStatsBroadcast(data: StatsData): void {
    this.emitCustomEvent("stats:broadcast", data);
  }

  private handleSettingsUpdate(data: SettingsData): void {
    this.emitCustomEvent("settings:update", data);
  }

  private handleStoreStatusChange(data: SettingsData): void {
    this.emitCustomEvent("store:statusChange", data);
    this.showNotification(data.message || "店舗状態が変更されました", "info");
  }

  disconnect(): void {
    if (this.socket) {
      console.log("🔌 Disconnecting socket");
      this.socket.disconnect();
      this.socket = null;
      this.userType = null;
    }
  }

  joinRoom(roomName: string): void {
    if (this.socket?.connected) {
      console.log(`🏠 Joining room: ${roomName}`);
      this.socket.emit("join-room", roomName);
    }
  }

  leaveRoom(roomName: string): void {
    if (this.socket?.connected) {
      console.log(`🚪 Leaving room: ${roomName}`);
      this.socket.emit("leave-room", roomName);
    }
  }

  emit(event: string, data: SocketEventData): void {
    if (this.socket?.connected) {
      console.log(`📤 Emitting ${event}:`, data);
      this.socket.emit(event, data);
    } else {
      console.warn(`Socket not connected, cannot emit ${event}`);
    }
  }

  on(event: string, callback: (data: SocketEventData) => void): void {
    if (this.socket) {
      this.socket.on(event, callback);
    } else {
      console.warn(`Socket not initialized, cannot listen to ${event}`);
    }
  }

  off(event: string, callback?: (data: SocketEventData) => void): void {
    if (this.socket) {
      this.socket.off(event, callback);
    } else {
      console.warn(
        `Socket not initialized, cannot remove listener for ${event}`
      );
    }
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  // カスタムイベントエミッター（React側で使用）
  private customEventTarget = new EventTarget();

  private emitCustomEvent(type: string, data: SocketEventData): void {
    const event = new CustomEvent(type, { detail: data });
    this.customEventTarget.dispatchEvent(event);
  }

  public addEventListener(type: string, listener: EventListener): void {
    this.customEventTarget.addEventListener(type, listener);
  }

  public removeEventListener(type: string, listener: EventListener): void {
    this.customEventTarget.removeEventListener(type, listener);
  }

  // 通知表示（実装は環境に応じて）
  private showNotification(
    message: string,
    type: "success" | "error" | "warning" | "info"
  ): void {
    // ブラウザ通知またはトーストライブラリを使用
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("UniFest Order System", {
        body: message,
        icon: "/favicon.ico",
      });
    }

    // カスタムイベントとして通知情報を送信
    this.emitCustomEvent("ui:notification", { message, type });
  }

  // 音声通知再生
  private playAudioNotification(data: AudioData): void {
    if (data.type === "new-order") {
      this.playSound("/sounds/new-order.mp3");
    } else if (data.type === "cooking-complete") {
      this.playSound("/sounds/cooking-complete.mp3");
    } else if (data.type === "order-ready") {
      this.playSound("/sounds/order-ready.mp3");
    }
  }

  private playAudioAlert(data: AudioData): void {
    if (data.type === "emergency") {
      this.playSound("/sounds/emergency-alert.mp3", true);
    } else if (data.type === "temperature") {
      this.playSound("/sounds/temperature-alert.mp3");
    }
  }

  private playSound(src: string, loop: boolean = false): void {
    try {
      const audio = new Audio(src);
      audio.loop = loop;
      audio.play().catch((error) => {
        console.warn("Audio playback failed:", error);
      });
    } catch (error) {
      console.warn("Audio creation failed:", error);
    }
  }

  // ハートビート送信
  public startHeartbeat(interval: number = 30000): void {
    if (this.socket?.connected) {
      setInterval(() => {
        if (this.socket?.connected) {
          this.socket.emit("heartbeat");
        }
      }, interval);
    }
  }

  // 統計リクエスト
  public requestStats(): void {
    this.emit("request-stats", {});
  }

  // 注文操作
  public emitNewOrder(orderData: OrderData): void {
    this.emit("new-order", orderData);
  }

  public emitOrderStatusUpdate(data: OrderData): void {
    this.emit("order-status-update", data);
  }

  public emitOrderPaymentUpdate(data: OrderData): void {
    this.emit("order-payment-update", data);
  }

  // 調理操作
  public emitCookingStart(data: CookingData): void {
    this.emit("cooking-start", data);
  }

  public emitCookingComplete(data: CookingData): void {
    this.emit("cooking-complete", data);
  }

  public emitCookingProgress(data: CookingData): void {
    this.emit("cooking-progress", data);
  }

  // 在庫操作
  public emitStockUpdate(data: StockData): void {
    this.emit("stock-update", data);
  }

  // 緊急操作
  public emitEmergencyStart(data: EmergencyData): void {
    this.emit("emergency-start", data);
  }

  public emitEmergencyEnd(data: EmergencyData): void {
    this.emit("emergency-end", data);
  }

  // システム設定
  public emitSettingsUpdate(data: SettingsData): void {
    this.emit("settings-update", data);
  }
}

// シングルトンインスタンスを作成
export const socketService: SocketService = new SocketServiceImpl();

// React Hook用のヘルパー
export const useSocket = () => {
  return socketService;
};
