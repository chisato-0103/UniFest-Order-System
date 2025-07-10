import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Box,
  useTheme,
  useMediaQuery,
  Divider,
} from "@mui/material";
import {
  Menu as MenuIcon,
  Close as CloseIcon,
  Home as HomeIcon,
  QrCode as QrCodeIcon,
} from "@mui/icons-material";

interface CustomerNavigationBarProps {
  title?: string;
  showBackButton?: boolean;
  onBackClick?: () => void;
}

const CustomerNavigationBar: React.FC<CustomerNavigationBarProps> = ({
  title = "UniFest オーダーシステム",
  showBackButton = false,
  onBackClick,
}) => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const menuItems = [
    {
      label: "ホーム",
      icon: <HomeIcon />,
      path: "/",
      description: "メニュー一覧",
    },
    {
      label: "QRコード",
      icon: <QrCodeIcon />,
      path: "/qr-menu",
      description: "QRコードメニュー",
    },
  ];

  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen);
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    setDrawerOpen(false);
  };

  const handleBackClick = () => {
    if (onBackClick) {
      onBackClick();
    } else {
      navigate(-1);
    }
  };

  const isCurrentPage = (path: string) => {
    return location.pathname === path;
  };

  const drawerContent = (
    <Box sx={{ width: 280, height: "100%" }}>
      {/* ヘッダー */}
      <Box
        sx={{
          p: 2,
          bgcolor: "primary.main",
          color: "primary.contrastText",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Typography variant="h6" noWrap>
          メニュー
        </Typography>
        <IconButton
          onClick={handleDrawerToggle}
          sx={{ color: "primary.contrastText" }}
        >
          <CloseIcon />
        </IconButton>
      </Box>

      <Divider />

      {/* メニューリスト */}
      <List sx={{ flexGrow: 1 }}>
        {menuItems.map((item) => (
          <ListItem
            key={item.path}
            component="div"
            onClick={() => handleNavigation(item.path)}
            sx={{
              bgcolor: isCurrentPage(item.path)
                ? "action.selected"
                : "transparent",
              "&:hover": {
                bgcolor: "action.hover",
              },
              py: 1.5,
              cursor: "pointer",
            }}
          >
            <ListItemIcon
              sx={{
                color: isCurrentPage(item.path) ? "primary.main" : "inherit",
              }}
            >
              {item.icon}
            </ListItemIcon>
            <Box>
              <ListItemText
                primary={item.label}
                secondary={item.description}
                primaryTypographyProps={{
                  fontWeight: isCurrentPage(item.path) ? "bold" : "normal",
                  color: isCurrentPage(item.path) ? "primary.main" : "inherit",
                }}
              />
            </Box>
          </ListItem>
        ))}
      </List>

      <Divider />

      {/* フッター情報 */}
      <Box sx={{ p: 2 }}>
        <Typography variant="caption" color="text.secondary" display="block">
          UniFest 2025
        </Typography>
        <Typography variant="caption" color="text.secondary" display="block">
          お困りの際はスタッフまで
        </Typography>
      </Box>
    </Box>
  );

  return (
    <>
      <AppBar
        position="sticky"
        elevation={1}
        sx={{
          bgcolor: "background.paper",
          color: "text.primary",
          borderBottom: 1,
          borderColor: "divider",
        }}
      >
        <Toolbar
          sx={{
            justifyContent: "space-between",
            minHeight: { xs: 56, sm: 64 },
            px: { xs: 1, sm: 2 },
          }}
        >
          {/* 左側 - メニューボタンまたは戻るボタン */}
          <Box sx={{ display: "flex", alignItems: "center" }}>
            {showBackButton ? (
              <IconButton edge="start" onClick={handleBackClick} sx={{ mr: 1 }}>
                <CloseIcon />
              </IconButton>
            ) : (
              <IconButton
                edge="start"
                onClick={handleDrawerToggle}
                sx={{ mr: 1 }}
              >
                <MenuIcon />
              </IconButton>
            )}

            {/* タイトル */}
            <Typography
              variant={isMobile ? "h6" : "h5"}
              component="h1"
              sx={{
                fontWeight: "bold",
                color: "primary.main",
                fontSize: { xs: "1rem", sm: "1.25rem" },
              }}
              noWrap
            >
              {title}
            </Typography>
          </Box>

          {/* 右側 - アクションボタン（デスクトップのみ） */}
          {/* 右側の注文状況・カートボタンは非表示に */}
          {/* ナビゲーションバー自体はそのまま残す */}
        </Toolbar>
      </AppBar>

      {/* サイドドロワー */}
      <Drawer
        variant="temporary"
        anchor="left"
        open={drawerOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true, // モバイルパフォーマンス向上
        }}
        sx={{
          "& .MuiDrawer-paper": {
            boxSizing: "border-box",
            width: 280,
          },
        }}
      >
        {drawerContent}
      </Drawer>
    </>
  );
};

export default CustomerNavigationBar;
