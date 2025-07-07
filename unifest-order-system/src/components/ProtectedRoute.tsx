// 🛡️ 管理者専用ページを守る番人コンポーネント
// ログインしていない人が管理者ページに入ろうとすると、ログイン画面に送り返します
// 例：お店の売上を見る画面は、店長さんだけが見れるようにする

import React from "react"; // Reactの基本道具
import { Navigate, useLocation } from "react-router-dom"; // ページ移動の道具
import { useAuth } from "../hooks/useAuth"; // ログイン状態を確認する道具

// 🏷️ このコンポーネントが受け取るデータの形
interface ProtectedRouteProps {
  children: React.ReactNode; // 中に入れる内容（管理者ページ）
}

// 🚪 番人コンポーネント（ログインチェック機能）
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated } = useAuth(); // ログインしているかチェック
  const location = useLocation(); // 今いるページの場所を確認

  // 🔒 ログインしていない場合
  if (!isAuthenticated) {
    // 管理者ログイン画面に送り返す（「君はここに入れないよ！」）
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  // ✅ ログインしている場合は、中身を表示する
  return <>{children}</>;
};

export default ProtectedRoute;
