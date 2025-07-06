import { createContext } from "react";

// 管理者認証のコンテキスト
export interface AuthContextType {
  isAuthenticated: boolean;
  login: (password: string) => boolean;
  logout: () => void;
  isAdminRoute: (path: string) => boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);
