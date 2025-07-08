// 🌐 サーバーとの通信設定ファイル
// サーバー（バックエンド）がどこにあるかを教えるファイルです
// 例：「商品情報を取りに行くときは、この住所に行ってね」という案内

// 📍 サーバーの住所を環境変数から取得（設定ファイルから読む）
export const API_BASE_URL =
  import.meta.env.VITE_API_URL || "https://unifest-backend.onrender.com"; // 普通のAPI用
export const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL || "https://unifest-backend.onrender.com"; // リアルタイム通信用

// 🗺️ 各機能のサーバー住所一覧
export const API_ENDPOINTS = {
  products: `${API_BASE_URL}/api/products`, // 商品情報を取る住所
  orders: `${API_BASE_URL}/api/orders`, // 注文情報を取る住所
  orderByNumber: (
    orderNumber: string // 注文番号で注文を探す住所
  ) => `${API_BASE_URL}/api/orders/number/${orderNumber}`,
  health: `${API_BASE_URL}/health`, // サーバーが元気かチェックする住所
} as const;
