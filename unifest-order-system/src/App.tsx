import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { Box } from "@mui/material";
import CssBaseline from "@mui/material/CssBaseline";
import { AppProvider } from "./contexts/AppContext";
import { AuthProvider } from "./contexts/AuthContext";

// Components
import NavigationBar from "./components/NavigationBar";
import ProtectedRoute from "./components/ProtectedRoute";

// Pages
import OrderPage from "./pages/OrderPage";
import EnhancedOrderPage from "./pages/EnhancedOrderPage";
import CustomerStatusPage from "./pages/CustomerStatusPage";
import AdminLoginPage from "./pages/AdminLoginPage";
import AdminDashboard from "./pages/AdminDashboard";

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
          <Router>
            <NavigationBar />
            <Box
              component="main"
              sx={{
                minHeight: "100vh",
                backgroundColor: "background.default",
              }}
            >
              <Routes>
                {/* お客様向け画面 */}
                <Route path="/" element={<EnhancedOrderPage />} />
                <Route
                  path="/customer-status"
                  element={<CustomerStatusPage />}
                />

                {/* 旧デザインのOrderPage（比較用） */}
                <Route path="/order-old" element={<OrderPage />} />

                {/* 管理者ログイン */}
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
                <Route path="/kitchen" element={<KitchenPage />} />
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
              </Routes>
            </Box>
          </Router>
        </AppProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
