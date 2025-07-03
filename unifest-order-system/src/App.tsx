import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AppProvider } from './contexts/AppContext';

// Components
import NavigationBar from './components/NavigationBar';

// Pages
import OrderPage from './pages/OrderPage';
import CustomerStatusPage from './pages/CustomerStatusPage';
import StoreMonitorPage from './pages/StoreMonitorPage';
import KitchenPage from './pages/KitchenPage';
import PaymentPage from './pages/PaymentPage';
import DeliveryPage from './pages/DeliveryPage';
import HistoryPage from './pages/HistoryPage';
import ProductManagementPage from './pages/ProductManagementPage';
import SystemSettingsPage from './pages/SystemSettingsPage';

// MUIテーマ設定
const theme = createTheme({
  palette: {
    primary: {
      main: '#FF6B35', // たこ焼きっぽいオレンジ色
    },
    secondary: {
      main: '#4ECDC4', // 爽やかな青緑
    },
    background: {
      default: '#F7F7F7',
    },
  },
  typography: {
    fontFamily: [
      'Noto Sans JP',
      'Arial',
      'sans-serif',
    ].join(','),
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
      <AppProvider>
        <Router>
          <NavigationBar />
          <Routes>
            {/* お客様向け画面 */}
            <Route path="/" element={<OrderPage />} />
            <Route path="/customer-status" element={<CustomerStatusPage />} />
            
            {/* スタッフ向け画面 */}
            <Route path="/store-monitor" element={<StoreMonitorPage />} />
            <Route path="/kitchen" element={<KitchenPage />} />
            <Route path="/payment" element={<PaymentPage />} />
            <Route path="/delivery" element={<DeliveryPage />} />
            <Route path="/history" element={<HistoryPage />} />
            
            {/* 管理者向け画面 */}
            <Route path="/product-management" element={<ProductManagementPage />} />
            <Route path="/system-settings" element={<SystemSettingsPage />} />
          </Routes>
        </Router>
      </AppProvider>
    </ThemeProvider>
  );
}

export default App;
