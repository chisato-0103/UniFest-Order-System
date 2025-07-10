// 🧭 ページの移動とデザインのための道具たち
import {
  HashRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom"; // HashRouterでリロード404対策
import { ThemeProvider, createTheme } from "@mui/material/styles"; // 見た目のテーマを作る道具
import { Box } from "@mui/material"; // レイアウト用の箱
import CssBaseline from "@mui/material/CssBaseline"; // デフォルトスタイルをリセット
import { SimpleAppProvider } from "./contexts/SimpleAppContext2"; // 簡単なアプリの状態管理
import { AppProvider } from "./contexts/AppContext"; // アプリ全体の状態管理
import { AuthProvider } from "./contexts/AuthContext"; // ログイン状態の管理
// import SimpleOrderPage from "./pages/SimpleOrderPage"; // 簡単注文ページ

// 🧩 部品（コンポーネント）
// NavigationBarは使わない
import ProtectedRoute from "./components/ProtectedRoute"; // 管理者のみアクセスできるページを守る
import CustomerNavigationBar from "./components/CustomerNavigationBar";
import AdminNavigationBar from "./components/AdminNavigationBar";

// 🏪 お客さん用のページたち
import OrderPage from "./pages/OrderPage"; // 注文ページ
import CustomerStatusPage from "./pages/CustomerStatusPage"; // お客さんの注文状況ページ
import AdminLoginPage from "./pages/AdminLoginPage"; // 管理者ログインページ
import AdminDashboard from "./pages/AdminDashboard"; // 管理者ダッシュボード
import KitchenPageSimple from "./pages/KitchenPageSimple"; // 簡単キッチンページ
import NavigationPage from "./pages/NavigationPage"; // ナビゲーションページ
import AdminNavigationPage from "./pages/AdminNavigationPage"; // 管理者ナビゲーションページ
import CartPage from "./pages/CartPage"; // カートページ

// 👨‍💼 管理者用のページたち
import StoreMonitorPage from "./pages/StoreMonitorPage"; // お店の状況監視ページ
import KitchenPage from "./pages/KitchenPage"; // キッチン画面
import PaymentPage from "./pages/PaymentPage"; // 支払い画面
import DeliveryPage from "./pages/DeliveryPage"; // 受け渡し画面
import HistoryPage from "./pages/HistoryPage"; // 注文履歴ページ
import ProductManagementPage from "./pages/ProductManagementPage"; // 商品管理ページ
import SystemSettingsPage from "./pages/SystemSettingsPage"; // システム設定ページ

// 🎨 アプリの見た目設定（たこ焼き屋さんっぽい色）
const theme = createTheme({
  palette: {
    primary: {
      main: "#FF6B35", // たこ焼きっぽいオレンジ色
    },
    secondary: {
      main: "#4ECDC4", // 爽やかな青緑
    },
    background: {
      default: "#F7F7F7", // 背景色（薄いグレー）
    },
  },
  typography: {
    fontFamily: ["Noto Sans JP", "Arial", "sans-serif"].join(","),
    h4: {
      fontWeight: 600,
    },
    h5: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 12,
  },
});

function AppWithNavBar() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith("/admin");
  return (
    <>
      {isAdminRoute ? <AdminNavigationBar /> : <CustomerNavigationBar />}
      <Box
        component="main"
        sx={{
          minHeight: "100vh",
          backgroundColor: "background.default",
        }}
      >
        <Routes>
          {/* ホームページ - 全ページナビゲーション */}
          <Route path="/" element={<NavigationPage />} />

          {/* お客様向け画面 - 統一された注文ページ */}
          <Route path="/order" element={<OrderPage />} />
          {/* <Route path="/simple-order" element={<SimpleOrderPage />} /> */}

          {/* 🛍️ お客様向けその他のページ */}
          <Route path="/cart" element={<CartPage />} />
          <Route path="/customer-status" element={<CustomerStatusPage />} />

          {/* 🎮 開発・デモ用（比較用） */}
          <Route path="/order-demo" element={<OrderPage />} />

          {/* 🔐 管理者ログイン */}
          <Route path="/admin-login" element={<AdminLoginPage />} />
          <Route path="/admin/login" element={<AdminLoginPage />} />

          {/* 📊 管理者ダッシュボード */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* 👨‍💼 管理者向け画面（保護されたルート） */}
          <Route
            path="/admin/monitor"
            element={
              <ProtectedRoute>
                <StoreMonitorPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/kitchen"
            element={
              <ProtectedRoute>
                <KitchenPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/payment"
            element={
              <ProtectedRoute>
                <PaymentPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/delivery"
            element={
              <ProtectedRoute>
                <DeliveryPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/history"
            element={
              <ProtectedRoute>
                <HistoryPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/products"
            element={
              <ProtectedRoute>
                <ProductManagementPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/settings"
            element={
              <ProtectedRoute>
                <SystemSettingsPage />
              </ProtectedRoute>
            }
          />

          {/* 後方互換性のための旧ルート（廃止予定） */}
          <Route path="/store-monitor" element={<StoreMonitorPage />} />
          <Route path="/kitchen" element={<KitchenPageSimple />} />
          <Route path="/kitchen-old" element={<KitchenPage />} />
          <Route path="/payment" element={<PaymentPage />} />
          <Route path="/delivery" element={<DeliveryPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route
            path="/product-management"
            element={<ProductManagementPage />}
          />
          <Route path="/system-settings" element={<SystemSettingsPage />} />

          {/* 🧭 管理者ナビゲーション */}
          <Route path="/admin-navigation" element={<AdminNavigationPage />} />

          {/* 🍳 キッチン画面（認証なし・開発用） */}
          <Route path="/kitchen-simple" element={<KitchenPageSimple />} />
        </Routes>
      </Box>
    </>
  );
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <AppProvider>
          <SimpleAppProvider>
            <Router>
              <AppWithNavBar />
            </Router>
          </SimpleAppProvider>
        </AppProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
