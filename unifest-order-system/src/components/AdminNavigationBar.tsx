import React from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  Menu,
  MenuItem,
} from "@mui/material";
import {
  Home as HomeIcon,
  Restaurant as KitchenIcon,
  Payment as PaymentIcon,
  LocalShipping as DeliveryIcon,
  History as HistoryIcon,
  Store as MonitorIcon,
  Settings as SettingsIcon,
  AccountCircle as AccountIcon,
  Menu as MenuIcon,
  ArrowBack as ArrowBackIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

interface AdminNavigationBarProps {
  currentPage?: string;
}

const AdminNavigationBar: React.FC<AdminNavigationBarProps> = ({
  currentPage,
}) => {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [mobileMenuAnchorEl, setMobileMenuAnchorEl] =
    useState<null | HTMLElement>(null);

  const handleAccountMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMobileMenu = (event: React.MouseEvent<HTMLElement>) => {
    setMobileMenuAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
    setMobileMenuAnchorEl(null);
  };

  const navigationItems = [
    { path: "/", label: "ホーム", icon: <HomeIcon /> },
    { path: "/admin-navigation", label: "管理者メニュー", icon: <MenuIcon /> },
    { path: "/admin/monitor", label: "店舗モニター", icon: <MonitorIcon /> },
    { path: "/admin/kitchen", label: "厨房管理", icon: <KitchenIcon /> },
    { path: "/admin/payment", label: "支払い管理", icon: <PaymentIcon /> },
    { path: "/admin/delivery", label: "受け渡し管理", icon: <DeliveryIcon /> },
    { path: "/admin/history", label: "履歴管理", icon: <HistoryIcon /> },
    { path: "/admin/settings", label: "システム設定", icon: <SettingsIcon /> },
  ];

  const handleNavigation = (path: string) => {
    navigate(path);
    handleClose();
  };

  const handleLogout = () => {
    // ログアウト処理（今はシンプルにログインページに戻る）
    navigate("/admin-login");
    handleClose();
  };

  return (
    <AppBar position="static" sx={{ mb: 2 }}>
      <Toolbar>
        {/* 戻るボタン */}
        <IconButton
          color="inherit"
          onClick={() => window.history.back()}
          sx={{ mr: 1 }}
        >
          <ArrowBackIcon />
        </IconButton>

        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          🏪 UniFest 管理画面
          {currentPage && (
            <Typography component="span" sx={{ ml: 1, opacity: 0.8 }}>
              - {currentPage}
            </Typography>
          )}
        </Typography>

        {/* デスクトップ用ナビゲーション */}
        <Box sx={{ display: { xs: "none", md: "flex" } }}>
          <Button
            color="inherit"
            startIcon={<HomeIcon />}
            onClick={() => handleNavigation("/")}
            sx={{ mr: 1 }}
          >
            ホーム
          </Button>
          <Button
            color="inherit"
            startIcon={<MenuIcon />}
            onClick={() => handleNavigation("/admin-navigation")}
            sx={{ mr: 1 }}
          >
            メニュー
          </Button>
          {navigationItems.slice(2, 5).map((item) => (
            <Button
              key={item.path}
              color="inherit"
              startIcon={item.icon}
              onClick={() => handleNavigation(item.path)}
              sx={{ mr: 1 }}
            >
              {item.label.replace("管理", "")}
            </Button>
          ))}
        </Box>

        {/* モバイル用メニューボタン */}
        <IconButton
          color="inherit"
          onClick={handleMobileMenu}
          sx={{ display: { xs: "flex", md: "none" } }}
        >
          <MenuIcon />
        </IconButton>

        {/* アカウントメニュー */}
        <IconButton color="inherit" onClick={handleAccountMenu}>
          <AccountIcon />
        </IconButton>

        {/* アカウントメニュー */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleClose}
          anchorOrigin={{
            vertical: "bottom",
            horizontal: "right",
          }}
          transformOrigin={{
            vertical: "top",
            horizontal: "right",
          }}
        >
          <MenuItem onClick={() => handleNavigation("/admin-navigation")}>
            <MenuIcon sx={{ mr: 1 }} />
            管理者メニュー
          </MenuItem>
          <MenuItem onClick={() => handleNavigation("/")}>
            <HomeIcon sx={{ mr: 1 }} />
            ホームページ
          </MenuItem>
          <MenuItem onClick={handleLogout}>
            <AccountIcon sx={{ mr: 1 }} />
            ログアウト
          </MenuItem>
        </Menu>

        {/* モバイル用メニュー */}
        <Menu
          anchorEl={mobileMenuAnchorEl}
          open={Boolean(mobileMenuAnchorEl)}
          onClose={handleClose}
          anchorOrigin={{
            vertical: "bottom",
            horizontal: "right",
          }}
          transformOrigin={{
            vertical: "top",
            horizontal: "right",
          }}
        >
          {navigationItems.map((item) => (
            <MenuItem
              key={item.path}
              onClick={() => handleNavigation(item.path)}
            >
              <Box sx={{ display: "flex", alignItems: "center" }}>
                {item.icon}
                <Typography sx={{ ml: 1 }}>{item.label}</Typography>
              </Box>
            </MenuItem>
          ))}
        </Menu>
      </Toolbar>
    </AppBar>
  );
};

export default AdminNavigationBar;
