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
  Button,
} from "@mui/material";
import {
  Menu as MenuIcon,
  Store as StoreIcon,
  Kitchen as KitchenIcon,
  Payment as PaymentIcon,
  LocalShipping as DeliveryIcon,
  History as HistoryIcon,
} from "@mui/icons-material";

const navigationItems = [
  { label: "店舗監視", path: "/test/monitor", icon: StoreIcon },
  { label: "厨房管理", path: "/kitchen-test", icon: KitchenIcon },
  { label: "会計処理", path: "/payment", icon: PaymentIcon },
  { label: "受け渡し", path: "/delivery", icon: DeliveryIcon },
  { label: "履歴", path: "/history", icon: HistoryIcon },
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

  const handleNavigation = (path: string) => {
    navigate(path);
    handleClose();
  };

  return (
    <AppBar position="static" sx={{ mb: 2 }}>
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          UniFest Order System
        </Typography>

        <Box sx={{ display: { xs: "none", md: "flex" } }}>
          {navigationItems.map((item) => (
            <Button
              key={item.path}
              color="inherit"
              onClick={() => handleNavigation(item.path)}
              startIcon={<item.icon />}
              sx={{
                backgroundColor:
                  location.pathname === item.path
                    ? "rgba(255,255,255,0.1)"
                    : "transparent",
              }}
            >
              {item.label}
            </Button>
          ))}
        </Box>

        <Box sx={{ display: { xs: "flex", md: "none" } }}>
          <IconButton
            size="large"
            edge="start"
            color="inherit"
            aria-label="menu"
            onClick={handleClick}
          >
            <MenuIcon />
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={open}
            onClose={handleClose}
            MenuListProps={{
              "aria-labelledby": "basic-button",
            }}
          >
            {navigationItems.map((item) => (
              <MenuItem
                key={item.path}
                onClick={() => handleNavigation(item.path)}
                selected={location.pathname === item.path}
              >
                <item.icon sx={{ mr: 1 }} />
                {item.label}
              </MenuItem>
            ))}
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
}

export default NavigationBar;
