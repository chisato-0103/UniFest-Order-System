import { Server, Socket } from "socket.io";
import { db } from "../database/connection";

/**
 * Socket.io イベントハンドラー
 * リアルタイム通信でのイベント処理を管理
 */

interface ConnectedUser {
  socketId: string;
  userType: "customer" | "kitchen" | "cashier" | "pickup" | "admin";
  joinedAt: Date;
  lastActivity: Date;
}

interface RoomData {
  [roomName: string]: Set<string>;
}

export class SocketHandlers {
  private io: Server;
  private connectedUsers: Map<string, ConnectedUser> = new Map();
  private rooms: RoomData = {};

  constructor(io: Server) {
    this.io = io;
    this.initializeHandlers();
  }

  private initializeHandlers() {
    this.io.on("connection", (socket: Socket) => {
      console.log(`📱 Client connected: ${socket.id}`);

      // 接続時の認証・ユーザータイプ設定
      socket.on("authenticate", (data: { userType: string }) => {
        this.handleAuthentication(socket, data);
      });

      // ルーム管理
      socket.on("join-room", (roomName: string) => {
        this.handleJoinRoom(socket, roomName);
      });

      socket.on("leave-room", (roomName: string) => {
        this.handleLeaveRoom(socket, roomName);
      });

      // 注文関連イベント
      socket.on("new-order", (orderData) => {
        this.handleNewOrder(socket, orderData);
      });

      socket.on("order-status-update", (data) => {
        this.handleOrderStatusUpdate(socket, data);
      });

      socket.on("order-payment-update", (data) => {
        this.handleOrderPaymentUpdate(socket, data);
      });

      // 調理関連イベント
      socket.on("cooking-start", (data) => {
        this.handleCookingStart(socket, data);
      });

      socket.on("cooking-complete", (data) => {
        this.handleCookingComplete(socket, data);
      });

      socket.on("cooking-progress", (data) => {
        this.handleCookingProgress(socket, data);
      });

      // 在庫関連イベント
      socket.on("stock-update", (data) => {
        this.handleStockUpdate(socket, data);
      });

      socket.on("stock-alert", (data) => {
        this.handleStockAlert(socket, data);
      });

      // 緊急対応イベント
      socket.on("emergency-start", (data) => {
        this.handleEmergencyStart(socket, data);
      });

      socket.on("emergency-end", (data) => {
        this.handleEmergencyEnd(socket, data);
      });

      // システム設定更新
      socket.on("settings-update", (data) => {
        this.handleSettingsUpdate(socket, data);
      });

      // 統計・ダッシュボード更新
      socket.on("request-stats", () => {
        this.handleStatsRequest(socket);
      });

      // ハートビート
      socket.on("heartbeat", () => {
        this.handleHeartbeat(socket);
      });

      // 切断処理
      socket.on("disconnect", () => {
        this.handleDisconnect(socket);
      });
    });
  }

  // 認証処理
  private handleAuthentication(socket: Socket, data: { userType: string }) {
    const userType = data.userType as ConnectedUser["userType"];

    this.connectedUsers.set(socket.id, {
      socketId: socket.id,
      userType,
      joinedAt: new Date(),
      lastActivity: new Date(),
    });

    // ユーザータイプ別の初期ルームに参加
    const initialRoom = this.getInitialRoom(userType);
    socket.join(initialRoom);

    console.log(`👤 User authenticated: ${socket.id} as ${userType}`);

    socket.emit("authentication-success", {
      userType,
      initialRoom,
      timestamp: new Date().toISOString(),
    });
  }

  // ルーム参加処理
  private handleJoinRoom(socket: Socket, roomName: string) {
    socket.join(roomName);

    if (!this.rooms[roomName]) {
      this.rooms[roomName] = new Set();
    }
    this.rooms[roomName].add(socket.id);

    console.log(`🏠 Client ${socket.id} joined room: ${roomName}`);

    // ルーム内の他のユーザーに通知
    socket.to(roomName).emit("user-joined-room", {
      socketId: socket.id,
      roomName,
      timestamp: new Date().toISOString(),
    });

    socket.emit("room-joined", {
      roomName,
      userCount: this.rooms[roomName].size,
      timestamp: new Date().toISOString(),
    });
  }

  // ルーム退出処理
  private handleLeaveRoom(socket: Socket, roomName: string) {
    socket.leave(roomName);

    if (this.rooms[roomName]) {
      this.rooms[roomName].delete(socket.id);
      if (this.rooms[roomName].size === 0) {
        delete this.rooms[roomName];
      }
    }

    console.log(`🚪 Client ${socket.id} left room: ${roomName}`);

    socket.to(roomName).emit("user-left-room", {
      socketId: socket.id,
      roomName,
      timestamp: new Date().toISOString(),
    });
  }

  // 新規注文処理
  private async handleNewOrder(socket: Socket, orderData: any) {
    try {
      console.log(`📝 New order received: ${JSON.stringify(orderData)}`);

      // 全画面に新規注文を通知
      this.io.emit("new-order-notification", {
        order: orderData,
        timestamp: new Date().toISOString(),
        source: socket.id,
      });

      // 厨房画面に特別通知
      this.io.to("kitchen").emit("kitchen-new-order", {
        order: orderData,
        priority: orderData.priority || "normal",
        timestamp: new Date().toISOString(),
      });

      // 音声通知が有効な場合
      if (orderData.enableAudioNotification) {
        this.io.to("kitchen").emit("audio-notification", {
          type: "new-order",
          message: `新しい注文が入りました。注文番号: ${orderData.orderNumber}`,
          timestamp: new Date().toISOString(),
        });
      }

      // 統計更新
      this.broadcastStatsUpdate();
    } catch (error) {
      console.error("新規注文処理エラー:", error);
      socket.emit("error", {
        type: "new-order-error",
        message: "注文の処理中にエラーが発生しました",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  // 注文ステータス更新処理
  private async handleOrderStatusUpdate(socket: Socket, data: any) {
    try {
      console.log(`🔄 Order status update: ${JSON.stringify(data)}`);

      const { orderId, newStatus, previousStatus, updatedBy } = data;

      // ステータス更新をDBに保存
      await this.updateOrderStatus(orderId, newStatus, updatedBy);

      // 全画面に更新を通知
      this.io.emit("order-status-changed", {
        orderId,
        newStatus,
        previousStatus,
        updatedBy,
        timestamp: new Date().toISOString(),
      });

      // ステータス別の特別処理
      switch (newStatus) {
        case "preparing":
          this.io.to("kitchen").emit("cooking-start-notification", data);
          break;
        case "ready":
          this.io.to("pickup").emit("pickup-ready-notification", data);
          this.io.to("cashier").emit("payment-ready-notification", data);
          break;
        case "completed":
          this.io.emit("order-completed-notification", data);
          break;
      }

      // 統計更新
      this.broadcastStatsUpdate();
    } catch (error) {
      console.error("注文ステータス更新エラー:", error);
      socket.emit("error", {
        type: "status-update-error",
        message: "ステータス更新中にエラーが発生しました",
      });
    }
  }

  // 決済更新処理
  private async handleOrderPaymentUpdate(socket: Socket, data: any) {
    try {
      console.log(`💳 Payment update: ${JSON.stringify(data)}`);

      const { orderId, paymentStatus, paymentMethod, amount } = data;

      // 決済情報をDBに保存
      await this.updateOrderPayment(
        orderId,
        paymentStatus,
        paymentMethod,
        amount
      );

      // 全画面に決済更新を通知
      this.io.emit("payment-status-changed", {
        orderId,
        paymentStatus,
        paymentMethod,
        amount,
        timestamp: new Date().toISOString(),
      });

      // 受け渡し画面に通知
      if (paymentStatus === "completed") {
        this.io.to("pickup").emit("payment-completed-notification", data);
      }

      // 統計更新
      this.broadcastStatsUpdate();
    } catch (error) {
      console.error("決済更新エラー:", error);
      socket.emit("error", {
        type: "payment-update-error",
        message: "決済情報の更新中にエラーが発生しました",
      });
    }
  }

  // 調理開始処理
  private async handleCookingStart(socket: Socket, data: any) {
    try {
      console.log(`👨‍🍳 Cooking started: ${JSON.stringify(data)}`);

      const { orderId, estimatedTime, cookingStaff } = data;

      // 調理開始をDBに記録
      await this.recordCookingStart(orderId, estimatedTime, cookingStaff);

      // 全画面に調理開始を通知
      this.io.emit("cooking-started-notification", {
        orderId,
        estimatedTime,
        cookingStaff,
        timestamp: new Date().toISOString(),
      });

      // 監視画面に詳細通知
      this.io.to("monitoring").emit("cooking-progress-update", {
        orderId,
        status: "started",
        estimatedTime,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("調理開始処理エラー:", error);
      socket.emit("error", {
        type: "cooking-start-error",
        message: "調理開始の記録中にエラーが発生しました",
      });
    }
  }

  // 調理完了処理
  private async handleCookingComplete(socket: Socket, data: any) {
    try {
      console.log(`✅ Cooking completed: ${JSON.stringify(data)}`);

      const { orderId, actualCookingTime, cookingStaff } = data;

      // 調理完了をDBに記録
      await this.recordCookingComplete(
        orderId,
        actualCookingTime,
        cookingStaff
      );

      // 全画面に調理完了を通知
      this.io.emit("cooking-completed-notification", {
        orderId,
        actualCookingTime,
        cookingStaff,
        timestamp: new Date().toISOString(),
      });

      // 受け渡し画面に特別通知
      this.io.to("pickup").emit("order-ready-for-pickup", {
        orderId,
        timestamp: new Date().toISOString(),
      });

      // 音声通知
      this.io.to("pickup").emit("audio-notification", {
        type: "order-ready",
        message: `注文番号 ${data.orderNumber} の調理が完了しました`,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("調理完了処理エラー:", error);
      socket.emit("error", {
        type: "cooking-complete-error",
        message: "調理完了の記録中にエラーが発生しました",
      });
    }
  }

  // 調理進捗更新処理
  private handleCookingProgress(socket: Socket, data: any) {
    console.log(`⏳ Cooking progress: ${JSON.stringify(data)}`);

    // リアルタイムで調理進捗を通知
    this.io.to("monitoring").emit("cooking-progress-update", {
      ...data,
      timestamp: new Date().toISOString(),
    });

    this.io.to("kitchen").emit("cooking-timer-update", {
      ...data,
      timestamp: new Date().toISOString(),
    });
  }

  // 在庫更新処理
  private async handleStockUpdate(socket: Socket, data: any) {
    try {
      console.log(`📦 Stock update: ${JSON.stringify(data)}`);

      const { productId, newQuantity, changeType, reason } = data;

      // 在庫更新をDBに保存
      await this.updateStock(productId, newQuantity, changeType, reason);

      // 全画面に在庫更新を通知
      this.io.emit("stock-updated-notification", {
        productId,
        newQuantity,
        changeType,
        reason,
        timestamp: new Date().toISOString(),
      });

      // 在庫アラートチェック
      await this.checkStockAlerts(productId, newQuantity);
    } catch (error) {
      console.error("在庫更新エラー:", error);
      socket.emit("error", {
        type: "stock-update-error",
        message: "在庫更新中にエラーが発生しました",
      });
    }
  }

  // 在庫アラート処理
  private async handleStockAlert(socket: Socket, data: any) {
    console.log(`⚠️ Stock alert: ${JSON.stringify(data)}`);

    // 管理者と厨房に緊急通知
    this.io.to("admin").emit("stock-alert-notification", {
      ...data,
      severity: "high",
      timestamp: new Date().toISOString(),
    });

    this.io.to("kitchen").emit("stock-alert-notification", {
      ...data,
      timestamp: new Date().toISOString(),
    });
  }

  // 緊急対応開始処理
  private async handleEmergencyStart(socket: Socket, data: any) {
    try {
      console.log(`🚨 Emergency started: ${JSON.stringify(data)}`);

      const { type, severity, description, initiatedBy } = data;

      // 緊急対応をDBに記録
      await this.recordEmergencyEvent(
        type,
        severity,
        description,
        initiatedBy,
        "started"
      );

      // 全画面に緊急アラートを送信
      this.io.emit("emergency-alert", {
        type,
        severity,
        description,
        initiatedBy,
        status: "active",
        timestamp: new Date().toISOString(),
      });

      // 音声アラート
      this.io.emit("audio-alert", {
        type: "emergency",
        message: `緊急事態が発生しました: ${description}`,
        severity,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("緊急対応開始エラー:", error);
      socket.emit("error", {
        type: "emergency-start-error",
        message: "緊急対応の開始中にエラーが発生しました",
      });
    }
  }

  // 緊急対応終了処理
  private async handleEmergencyEnd(socket: Socket, data: any) {
    try {
      console.log(`✅ Emergency ended: ${JSON.stringify(data)}`);

      const { emergencyId, resolvedBy, resolution } = data;

      // 緊急対応終了をDBに記録
      await this.recordEmergencyEvent(
        "",
        "",
        resolution,
        resolvedBy,
        "resolved"
      );

      // 全画面に緊急事態解決を通知
      this.io.emit("emergency-resolved", {
        emergencyId,
        resolvedBy,
        resolution,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("緊急対応終了エラー:", error);
      socket.emit("error", {
        type: "emergency-end-error",
        message: "緊急対応の終了中にエラーが発生しました",
      });
    }
  }

  // システム設定更新処理
  private async handleSettingsUpdate(socket: Socket, data: any) {
    try {
      console.log(`⚙️ Settings update: ${JSON.stringify(data)}`);

      // 全画面に設定更新を通知
      this.io.emit("settings-updated", {
        ...data,
        timestamp: new Date().toISOString(),
      });

      // 特定の設定変更に応じた処理
      if (data.type === "emergency_mode") {
        this.handleEmergencyModeChange(data.value);
      }
    } catch (error) {
      console.error("設定更新エラー:", error);
      socket.emit("error", {
        type: "settings-update-error",
        message: "設定更新中にエラーが発生しました",
      });
    }
  }

  // 統計情報リクエスト処理
  private async handleStatsRequest(socket: Socket) {
    try {
      const stats = await this.getRealtimeStats();
      socket.emit("stats-update", {
        ...stats,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("統計取得エラー:", error);
      socket.emit("error", {
        type: "stats-error",
        message: "統計情報の取得中にエラーが発生しました",
      });
    }
  }

  // ハートビート処理
  private handleHeartbeat(socket: Socket) {
    const user = this.connectedUsers.get(socket.id);
    if (user) {
      user.lastActivity = new Date();
      this.connectedUsers.set(socket.id, user);
    }

    socket.emit("heartbeat-ack", {
      timestamp: new Date().toISOString(),
    });
  }

  // 切断処理
  private handleDisconnect(socket: Socket) {
    console.log(`📱 Client disconnected: ${socket.id}`);

    // ユーザー情報削除
    this.connectedUsers.delete(socket.id);

    // 全ルームから削除
    Object.keys(this.rooms).forEach((roomName) => {
      if (this.rooms[roomName]) {
        this.rooms[roomName].delete(socket.id);
        if (this.rooms[roomName].size === 0) {
          delete this.rooms[roomName];
        }
      }
    });
  }

  // ユーティリティメソッド
  private getInitialRoom(userType: ConnectedUser["userType"]): string {
    const roomMap = {
      customer: "customer",
      kitchen: "kitchen",
      cashier: "cashier",
      pickup: "pickup",
      admin: "admin",
    };
    return roomMap[userType] || "general";
  }

  private async updateOrderStatus(
    orderId: number,
    status: string,
    updatedBy: string
  ) {
    const query = `
      UPDATE orders
      SET status = $1, updated_at = CURRENT_TIMESTAMP
      WHERE order_id = $2
    `;
    await db.query(query, [status, orderId]);
  }

  private async updateOrderPayment(
    orderId: number,
    paymentStatus: string,
    paymentMethod: string,
    amount: number
  ) {
    const query = `
      UPDATE orders
      SET payment_status = $1, payment_method = $2, payment_amount = $3, updated_at = CURRENT_TIMESTAMP
      WHERE order_id = $4
    `;
    await db.query(query, [paymentStatus, paymentMethod, amount, orderId]);
  }

  private async recordCookingStart(
    orderId: number,
    estimatedTime: number,
    cookingStaff: string
  ) {
    const query = `
      INSERT INTO cooking_logs (order_id, status, estimated_time, staff_name, created_at)
      VALUES ($1, 'started', $2, $3, CURRENT_TIMESTAMP)
    `;
    await db.query(query, [orderId, estimatedTime, cookingStaff]);
  }

  private async recordCookingComplete(
    orderId: number,
    actualTime: number,
    cookingStaff: string
  ) {
    const query = `
      INSERT INTO cooking_logs (order_id, status, actual_time, staff_name, created_at)
      VALUES ($1, 'completed', $2, $3, CURRENT_TIMESTAMP)
    `;
    await db.query(query, [orderId, actualTime, cookingStaff]);
  }

  private async updateStock(
    productId: number,
    newQuantity: number,
    changeType: string,
    reason: string
  ) {
    const query = `
      UPDATE products
      SET stock_quantity = $1, updated_at = CURRENT_TIMESTAMP
      WHERE product_id = $2
    `;
    await db.query(query, [newQuantity, productId]);

    // 在庫変更ログ記録
    const logQuery = `
      INSERT INTO stock_logs (product_id, change_type, quantity_change, reason, created_at)
      VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
    `;
    await db.query(logQuery, [productId, changeType, newQuantity, reason]);
  }

  private async checkStockAlerts(productId: number, currentQuantity: number) {
    const query = `
      SELECT product_name, low_stock_threshold
      FROM products
      WHERE product_id = $1
    `;
    const result = await db.query(query, [productId]);

    if (result.rows.length > 0) {
      const { product_name, low_stock_threshold } = result.rows[0];

      if (currentQuantity <= low_stock_threshold) {
        this.io.to("admin").emit("stock-alert-notification", {
          productId,
          productName: product_name,
          currentQuantity,
          threshold: low_stock_threshold,
          severity: currentQuantity === 0 ? "critical" : "warning",
          timestamp: new Date().toISOString(),
        });
      }
    }
  }

  private async recordEmergencyEvent(
    type: string,
    severity: string,
    description: string,
    user: string,
    status: string
  ) {
    const query = `
      INSERT INTO emergency_logs (event_type, severity, description, initiated_by, status, created_at)
      VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
    `;
    await db.query(query, [type, severity, description, user, status]);
  }

  private handleEmergencyModeChange(emergencyMode: boolean) {
    if (emergencyMode) {
      this.io.emit("emergency-mode-activated", {
        message: "緊急モードが有効になりました",
        timestamp: new Date().toISOString(),
      });
    } else {
      this.io.emit("emergency-mode-deactivated", {
        message: "緊急モードが解除されました",
        timestamp: new Date().toISOString(),
      });
    }
  }

  private async getRealtimeStats() {
    // リアルタイム統計情報を取得
    const queries = {
      totalOrders:
        "SELECT COUNT(*) as count FROM orders WHERE DATE(created_at) = CURRENT_DATE",
      pendingOrders:
        "SELECT COUNT(*) as count FROM orders WHERE status IN ('pending', 'preparing')",
      completedOrders:
        "SELECT COUNT(*) as count FROM orders WHERE status = 'completed' AND DATE(created_at) = CURRENT_DATE",
      totalRevenue:
        "SELECT COALESCE(SUM(total_amount), 0) as revenue FROM orders WHERE payment_status = 'completed' AND DATE(created_at) = CURRENT_DATE",
    };

    const results = await Promise.all([
      db.query(queries.totalOrders),
      db.query(queries.pendingOrders),
      db.query(queries.completedOrders),
      db.query(queries.totalRevenue),
    ]);

    return {
      totalOrders: results[0].rows[0].count,
      pendingOrders: results[1].rows[0].count,
      completedOrders: results[2].rows[0].count,
      totalRevenue: results[3].rows[0].revenue,
      connectedUsers: this.connectedUsers.size,
      activeRooms: Object.keys(this.rooms).length,
    };
  }

  // 統計更新をブロードキャスト
  private async broadcastStatsUpdate() {
    try {
      const stats = await this.getRealtimeStats();
      this.io.emit("stats-update", {
        ...stats,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("統計更新ブロードキャストエラー:", error);
    }
  }

  // 接続統計を取得
  public getConnectionStats() {
    return {
      connectedUsers: this.connectedUsers.size,
      activeRooms: Object.keys(this.rooms).length,
      usersByType: Array.from(this.connectedUsers.values()).reduce(
        (acc, user) => {
          acc[user.userType] = (acc[user.userType] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      ),
    };
  }
}
