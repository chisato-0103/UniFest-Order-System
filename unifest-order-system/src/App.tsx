import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { Box } from "@mui/material";
import CssBaseline from "@mui/material/CssBaseline";
import { SimpleAppProvider } from "./contexts/SimpleAppContext2";
import { AppProvider } from "./contexts/AppContext";
import { AuthProvider } from "./contexts/AuthContext";
import SimpleOrderPage from "./pages/SimpleOrderPage";

// Components
// import NavigationBar from "./components/NavigationBar";
import ProtectedRoute from "./components/ProtectedRoute";

// Pages
import OrderPage from "./pages/OrderPage";
import OrderTestPage from "./pages/OrderTestPage";
import CustomerStatusPage from "./pages/CustomerStatusPage";
import AdminLoginPage from "./pages/AdminLoginPage";
import AdminDashboard from "./pages/AdminDashboard";
import SimpleOrderPageTest from "./pages/SimpleOrderPageTest";
import KitchenPageTest from "./pages/KitchenPageTest";
import KitchenPageSimple from "./pages/KitchenPageSimple";
import KitchenPageSimpleTest from "./pages/KitchenPageSimpleTest";
import TestRoute from "./pages/TestRoute";
import NavigationPage from "./pages/NavigationPage";
import AdminNavigationPage from "./pages/AdminNavigationPage";

// Admin Pages
import StoreMonitorPage from "./pages/StoreMonitorPage";
import KitchenPage from "./pages/KitchenPage";
import PaymentPage from "./pages/PaymentPage";
import DeliveryPage from "./pages/DeliveryPage";
import HistoryPage from "./pages/HistoryPage";
import ProductManagementPage from "./pages/ProductManagementPage";
import SystemSettingsPage from "./pages/SystemSettingsPage";

// MUIテーマ設定
const theme = createTheme({
  palette: {
    primary: {
      main: "#FF6B35", // たこ焼きっぽいオレンジ色
    },
    secondary: {
      main: "#4ECDC4", // 爽やかな青緑
    },
    background: {
      default: "#F7F7F7",
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

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <AppProvider>
          <SimpleAppProvider>
            <Router>
              {/* <NavigationBar /> */}
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
                  <Route path="/order" element={<SimpleOrderPage />} />
                  <Route path="/simple-order" element={<SimpleOrderPage />} />

                  {/* お客様向けその他のページ */}
                  <Route
                    path="/customer-status"
                    element={<CustomerStatusPage />}
                  />

                  {/* 開発・テスト用（デモ・比較用） */}
                  <Route path="/order-demo" element={<OrderPage />} />
                  <Route
                    path="/simple-order-test"
                    element={<SimpleOrderPageTest />}
                  />

                  {/* 注文テストページ */}
                  <Route path="/order-test" element={<OrderTestPage />} />

                  {/* 管理者ログイン */}
                  <Route path="/admin-login" element={<AdminLoginPage />} />
                  <Route path="/admin/login" element={<AdminLoginPage />} />

                  {/* 管理者ダッシュボード */}
                  <Route
                    path="/admin"
                    element={
                      <ProtectedRoute>
                        <AdminDashboard />
                      </ProtectedRoute>
                    }
                  />

                  {/* 管理者向け画面（保護されたルート） */}
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
                        <KitchenPageTest />
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
                  <Route
                    path="/system-settings"
                    element={<SystemSettingsPage />}
                  />

                  {/* テスト用：認証なしルート */}
                  <Route path="/test/kitchen" element={<KitchenPageTest />} />
                  <Route path="/test/monitor" element={<StoreMonitorPage />} />
                  <Route path="/test/route" element={<TestRoute />} />
                  <Route
                    path="/admin-navigation"
                    element={<AdminNavigationPage />}
                  />
                  <Route path="/kitchen-test" element={<KitchenPageTest />} />
                  <Route
                    path="/kitchen-simple"
                    element={<KitchenPageSimple />}
                  />
                  <Route
                    path="/kitchen-simple-test"
                    element={<KitchenPageSimpleTest />}
                  />
                </Routes>
              </Box>
            </Router>
          </SimpleAppProvider>
        </AppProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
