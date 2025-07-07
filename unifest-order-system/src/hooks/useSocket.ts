import { useEffect, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import type { Order } from "../types";
import { SOCKET_URL } from "../config/api";

interface UseSocketOptions {
  onConnect?: () => void;
  onDisconnect?: () => void;
  onOrderCreated?: (order: Order) => void;
  onOrderUpdated?: (order: Order) => void;
  onStatusUpdate?: (data: {
    orderId: number;
    status: string;
    timestamp: string;
  }) => void;
}

export const useSocket = (options: UseSocketOptions = {}) => {
  const socketRef = useRef<Socket | null>(null);

  const connectSocket = useCallback(() => {
    // 開発中でSocket.ioを無効化する場合
    if (import.meta.env.VITE_DISABLE_SOCKET === "true") {
      console.log("Socket.io is disabled in development mode");
      return;
    }

    // Socket.io接続を初期化
    socketRef.current = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      timeout: 20000,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    const socket = socketRef.current;

    // 接続イベント
    socket.on("connect", () => {
      console.log("Socket.io connected:", socket.id);
      options.onConnect?.();
    });

    // 切断イベント
    socket.on("disconnect", () => {
      console.log("Socket.io disconnected");
      options.onDisconnect?.();
    });

    // カスタムイベントリスナー
    if (options.onOrderCreated) {
      socket.on("orderCreated", options.onOrderCreated);
    }

    if (options.onOrderUpdated) {
      socket.on("orderUpdated", options.onOrderUpdated);
    }

    if (options.onStatusUpdate) {
      socket.on("statusUpdate", options.onStatusUpdate);
    }
  }, [options]);

  useEffect(() => {
    connectSocket();

    // クリーンアップ
    return () => {
      if (socketRef.current?.connected) {
        socketRef.current.disconnect();
      }
    };
  }, [connectSocket]);

  // Socket.ioインスタンスを返す
  return socketRef.current;
};

export default useSocket;
