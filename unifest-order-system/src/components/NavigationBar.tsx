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
} from "@mui/icons-material";

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

        <Chip label="営業中" color="success" variant="filled" sx={{ mr: 2 }} />

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
