// 📡 リアルタイム通信を簡単に使えるようにする道具
// 注文が入ったらすぐに画面が更新されるようにする仕組みです
// 例：お客さんが注文すると、キッチンの画面にすぐに表示される

import { useEffect, useRef, useCallback } from "react"; // Reactの基本道具
import { io, Socket } from "socket.io-client"; // リアルタイム通信の道具
import type { Order } from "../types"; // 注文データの形
import { SOCKET_URL } from "../config/api"; // サーバーの住所

// 🏷️ この道具を使う時に設定できるオプション
interface UseSocketOptions {
  onConnect?: () => void; // 接続できた時に実行する処理
  onDisconnect?: () => void; // 切断された時に実行する処理
  onOrderCreated?: (order: Order) => void; // 新しい注文が入った時の処理
  onOrderUpdated?: (order: Order) => void; // 注文が更新された時の処理
  onStatusUpdate?: (data: {
    // 注文状況が変わった時の処理
    orderId: number; // 注文番号
    status: string; // 新しい状況（例：調理中、完成）
    timestamp: string; // 変更時刻
  }) => void;
}

// 🔧 リアルタイム通信を使いやすくする関数
export const useSocket = (options: UseSocketOptions = {}) => {
  const socketRef = useRef<Socket | null>(null); // 通信の接続を保存する箱

  // 🔌 サーバーに接続する関数
  const connectSocket = useCallback(() => {
    // 🚫 開発中でSocket.ioを無効化する場合
    if (import.meta.env.VITE_DISABLE_SOCKET === "true") {
      console.log("Socket.io is disabled in development mode"); // 「リアルタイム通信を止めてるよ」
      return;
    }

    // 📡 Socket.io接続を初期化（サーバーに繋ぐ）
    socketRef.current = io(SOCKET_URL, {
      transports: ["websocket", "polling"], // 通信方法（2種類用意）
      timeout: 20000, // 20秒でタイムアウト
      reconnection: true, // 切断されたら自動で再接続する
      reconnectionAttempts: 5, // 最大5回まで再接続を試す
      reconnectionDelay: 1000, // 1秒待ってから再接続
    });

    const socket = socketRef.current; // 接続を変数に保存

    // ✅ 接続成功イベント
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
