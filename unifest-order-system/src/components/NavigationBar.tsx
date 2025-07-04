import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  Box,
  Chip,
  Badge,
} from "@mui/material";
import {
  Menu as MenuIcon,
  Store as StoreIcon,
  Kitchen as KitchenIcon,
  Payment as PaymentIcon,
  LocalShipping as DeliveryIcon,
  History as HistoryIcon,
  Settings as SettingsIcon,
  ShoppingCart as ShoppingCartIcon,
  MonitorHeart as MonitorIcon,
  Inventory as InventoryIcon,
  Wifi as WifiIcon,
  WifiOff as WifiOffIcon,
  Notifications as NotificationsIcon,
} from "@mui/icons-material";
import { useAppContext } from "../hooks/useAppContext";
import EmergencyControl from "./EmergencyControl";

const navigationItems = [
  {
    path: "/",
    label: "注文画面",
    icon: <ShoppingCartIcon />,
    color: "primary",
  },
  {
    path: "/customer-status",
    label: "注文状況",
    icon: <MonitorIcon />,
    color: "info",
  },
  {
    path: "/store-monitor",
    label: "店舗モニター",
    icon: <StoreIcon />,
    color: "secondary",
  },
  {
    path: "/kitchen",
    label: "厨房画面",
    icon: <KitchenIcon />,
    color: "warning",
  },
  {
    path: "/payment",
    label: "支払い画面",
    icon: <PaymentIcon />,
    color: "success",
  },
  {
    path: "/delivery",
    label: "受け渡し画面",
    icon: <DeliveryIcon />,
    color: "info",
  },
  {
    path: "/history",
    label: "注文履歴",
    icon: <HistoryIcon />,
    color: "default",
  },
  {
    path: "/product-management",
    label: "商品管理",
    icon: <InventoryIcon />,
    color: "secondary",
  },
  {
    path: "/system-settings",
    label: "システム設定",
    icon: <SettingsIcon />,
    color: "default",
  },
];

function NavigationBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const { state } = useAppContext();
  const { systemState, connectionStatus, notifications } = state;

  const unreadNotifications = notifications.filter(
    (n) => !n.is_confirmed
  ).length;

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleNavigate = (path: string) => {
    navigate(path);
    handleClose();
  };

  const getCurrentPageInfo = () => {
    return (
      navigationItems.find((item) => item.path === location.pathname) ||
      navigationItems[0]
    );
  };

  const currentPage = getCurrentPageInfo();

  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case "connected":
        return "success";
      case "connecting":
        return "warning";
      case "disconnected":
        return "error";
      default:
        return "default";
    }
  };

  const getConnectionStatusText = () => {
    switch (connectionStatus) {
      case "connected":
        return "接続中";
      case "connecting":
        return "接続中...";
      case "disconnected":
        return "切断";
      default:
        return "不明";
    }
  };

  const getOperatingStatusColor = () => {
    switch (systemState.営業状況) {
      case "営業中":
        return "success";
      case "準備中":
        return "warning";
      case "営業終了":
        return "error";
      default:
        return "default";
    }
  };

  return (
    <AppBar position="static" sx={{ mb: 0 }}>
      <Toolbar>
        <IconButton
          edge="start"
          color="inherit"
          aria-label="menu"
          onClick={handleClick}
          sx={{ mr: 2 }}
        >
          <MenuIcon />
        </IconButton>

        <Box sx={{ display: "flex", alignItems: "center", flexGrow: 1 }}>
          {currentPage.icon}
          <Typography variant="h6" component="div" sx={{ ml: 1 }}>
            UniFest Order System - {currentPage.label}
          </Typography>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {/* 営業状況 */}
          <Chip
            label={systemState.営業状況}
            color={getOperatingStatusColor()}
            variant="filled"
            size="small"
          />

          {/* 待ち件数 */}
          {systemState.待ち件数 > 0 && (
            <Chip
              label={`待ち${systemState.待ち件数}件`}
              color={systemState.待ち件数 > 10 ? "error" : "info"}
              variant="outlined"
              size="small"
            />
          )}

          {/* 混雑状況 */}
          <Chip
            label={systemState.混雑状況}
            color={
              systemState.混雑状況 === "混雑"
                ? "error"
                : systemState.混雑状況 === "普通"
                ? "warning"
                : "success"
            }
            variant="outlined"
            size="small"
          />

          {/* 接続状況 */}
          <Chip
            icon={
              connectionStatus === "connected" ? <WifiIcon /> : <WifiOffIcon />
            }
            label={getConnectionStatusText()}
            color={getConnectionStatusColor()}
            variant="outlined"
            size="small"
          />

          {/* 緊急時対応（コンパクト表示） */}
          <EmergencyControl compactView={true} />

          {/* 通知 */}
          {unreadNotifications > 0 && (
            <Badge badgeContent={unreadNotifications} color="error">
              <NotificationsIcon color="inherit" />
            </Badge>
          )}
        </Box>

        <Menu
          id="navigation-menu"
          anchorEl={anchorEl}
          open={open}
          onClose={handleClose}
          MenuListProps={{
            "aria-labelledby": "navigation-button",
          }}
        >
          {navigationItems.map((item) => (
            <MenuItem
              key={item.path}
              onClick={() => handleNavigate(item.path)}
              selected={location.pathname === item.path}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                minWidth: 200,
              }}
            >
              {item.icon}
              <Typography>{item.label}</Typography>
            </MenuItem>
          ))}
        </Menu>
      </Toolbar>
    </AppBar>
  );
}

export default NavigationBar;
