import React, { useState, useEffect } from "react";
import { AuthContext } from "./AuthContextType";

// 管理者パスワード（本番環境では環境変数で管理）
const ADMIN_PASSWORD = "takoyaki2024";

// 管理者専用ルート
const ADMIN_ROUTES = [
  "/admin",
  "/admin/products",
  "/admin/kitchen",
  "/admin/payment",
  "/admin/delivery",
  "/admin/history",
  "/admin/settings",
  "/admin/monitor",
];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  // ページ読み込み時にローカルストレージから認証状態を復元
  useEffect(() => {
    const savedAuth = localStorage.getItem("unifest_admin_auth");
    if (savedAuth === "true") {
      setIsAuthenticated(true);
    }
  }, []);

  const login = (password: string): boolean => {
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      localStorage.setItem("unifest_admin_auth", "true");
      return true;
    }
    return false;
  };

  const logout = (): void => {
    setIsAuthenticated(false);
    localStorage.removeItem("unifest_admin_auth");
  };

  const isAdminRoute = (path: string): boolean => {
    return ADMIN_ROUTES.some((route) => path.startsWith(route));
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        login,
        logout,
        isAdminRoute,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
