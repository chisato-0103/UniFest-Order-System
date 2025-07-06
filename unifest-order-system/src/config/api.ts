// 環境変数からAPIのベースURLを取得
export const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3001";
export const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL || "http://localhost:3001";

// APIエンドポイント
export const API_ENDPOINTS = {
  products: `${API_BASE_URL}/api/products`,
  orders: `${API_BASE_URL}/api/orders`,
  health: `${API_BASE_URL}/health`,
} as const;
