import React from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Container,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemButton,
  Chip,
} from "@mui/material";
import {
  Dashboard as DashboardIcon,
  MonitorHeart as MonitorIcon,
  Kitchen as KitchenIcon,
  Payment as PaymentIcon,
  LocalShipping as DeliveryIcon,
  History as HistoryIcon,
  Inventory as ProductIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  Home as HomeIcon,
  Science as TestIcon,
} from "@mui/icons-material";
import { Link, useNavigate } from "react-router-dom";

const AdminNavigation: React.FC = () => {
  const navigate = useNavigate();

  const adminPages = [
    {
      path: "/admin",
      label: "管理者ダッシュボード",
      icon: <DashboardIcon />,
      protected: true,
    },
    {
      path: "/admin/monitor",
      label: "店舗監視画面",
      icon: <MonitorIcon />,
      protected: true,
    },
    {
      path: "/admin/kitchen",
      label: "厨房管理",
      icon: <KitchenIcon />,
      protected: true,
    },
    {
      path: "/admin/payment",
      label: "決済管理",
      icon: <PaymentIcon />,
      protected: true,
    },
    {
      path: "/admin/delivery",
      label: "受け渡し管理",
      icon: <DeliveryIcon />,
      protected: true,
    },
    {
      path: "/admin/history",
      label: "注文履歴",
      icon: <HistoryIcon />,
      protected: true,
    },
    {
      path: "/admin/products",
      label: "商品管理",
      icon: <ProductIcon />,
      protected: true,
    },
    {
      path: "/admin/settings",
      label: "システム設定",
      icon: <SettingsIcon />,
      protected: true,
    },
  ];

  const testPages = [
    {
      path: "/test/kitchen",
      label: "厨房テスト",
      icon: <TestIcon />,
      protected: false,
    },
    {
      path: "/test/monitor",
      label: "店舗監視テスト",
      icon: <TestIcon />,
      protected: false,
    },
    {
      path: "/kitchen-simple",
      label: "厨房画面（シンプル）",
      icon: <KitchenIcon />,
      protected: false,
    },
    {
      path: "/kitchen-test",
      label: "厨房テスト画面",
      icon: <TestIcon />,
      protected: false,
    },
  ];

  return (
    <Box sx={{ mb: 3 }}>
      <AppBar position="static" sx={{ mb: 2 }}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            🛠️ UniFest たこ焼き注文システム - 管理者画面
          </Typography>
          <Button
            color="inherit"
            onClick={() => navigate("/")}
            startIcon={<HomeIcon />}
            sx={{ mr: 1 }}
          >
            お客様画面へ
          </Button>
          <Button
            color="inherit"
            onClick={() => {
              // ログアウト処理（実装に応じて）
              navigate("/admin-login");
            }}
            startIcon={<LogoutIcon />}
          >
            ログアウト
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg">
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            gap: 3,
          }}
        >
          {/* 管理者ページ */}
          <Box sx={{ flex: 1 }}>
            <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                🔐 管理者ページ（認証必要）
              </Typography>
              <List>
                {adminPages.map((page) => (
                  <ListItem
                    key={page.path}
                    disablePadding
                    sx={{
                      borderRadius: 1,
                      mb: 1,
                      "&:hover": { backgroundColor: "action.hover" },
                    }}
                  >
                    <ListItemButton component={Link} to={page.path}>
                      <ListItemIcon>{page.icon}</ListItemIcon>
                      <ListItemText
                        primary={
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                            }}
                          >
                            {page.label}
                            {page.protected && (
                              <Chip label="保護" size="small" color="warning" />
                            )}
                          </Box>
                        }
                        secondary={page.path}
                      />
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            </Paper>
          </Box>

          {/* テスト用ページ */}
          <Box sx={{ flex: 1 }}>
            <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                🧪 テスト用ページ（認証不要）
              </Typography>
              <List>
                {testPages.map((page) => (
                  <ListItem
                    key={page.path}
                    disablePadding
                    sx={{
                      borderRadius: 1,
                      mb: 1,
                      "&:hover": { backgroundColor: "action.hover" },
                    }}
                  >
                    <ListItemButton component={Link} to={page.path}>
                      <ListItemIcon>{page.icon}</ListItemIcon>
                      <ListItemText
                        primary={
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                            }}
                          >
                            {page.label}
                            <Chip label="テスト" size="small" color="info" />
                          </Box>
                        }
                        secondary={page.path}
                      />
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            </Paper>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default AdminNavigation;
