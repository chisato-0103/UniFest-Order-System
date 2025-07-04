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
  Popover,
  List,
  Button,
  Card,
  CardContent,
  Avatar,
  Fade,
  Grow,
  Paper,
  useTheme,
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
  Warning as WarningIcon,
  Info as InfoIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Schedule as ScheduleIcon,
  Done as DoneIcon,
  NotificationsActive as NotificationsActiveIcon,
  Clear as ClearIcon,
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
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [notificationAnchorEl, setNotificationAnchorEl] =
    useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const notificationOpen = Boolean(notificationAnchorEl);

  const { state, dispatch } = useAppContext();
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

  const handleNotificationClick = (
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    setNotificationAnchorEl(event.currentTarget);
  };

  const handleNotificationClose = () => {
    setNotificationAnchorEl(null);
  };

  const handleNotificationRead = (notificationId: number) => {
    dispatch({ type: "MARK_NOTIFICATION_READ", payload: notificationId });
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
    <AppBar
      position="fixed"
      sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}
    >
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
          <IconButton
            onClick={handleNotificationClick}
            sx={{
              position: "relative",
              "&:hover": {
                backgroundColor: "rgba(255, 255, 255, 0.1)",
              },
            }}
          >
            <Badge
              badgeContent={unreadNotifications}
              color="error"
              sx={{
                "& .MuiBadge-badge": {
                  animation:
                    unreadNotifications > 0 ? "pulse 2s infinite" : "none",
                  "@keyframes pulse": {
                    "0%": {
                      transform: "scale(1)",
                    },
                    "50%": {
                      transform: "scale(1.2)",
                    },
                    "100%": {
                      transform: "scale(1)",
                    },
                  },
                },
              }}
            >
              {unreadNotifications > 0 ? (
                <NotificationsActiveIcon
                  color="inherit"
                  sx={{
                    animation: "shake 0.5s ease-in-out",
                    "@keyframes shake": {
                      "0%, 100%": { transform: "translateX(0)" },
                      "25%": { transform: "translateX(-2px)" },
                      "75%": { transform: "translateX(2px)" },
                    },
                  }}
                />
              ) : (
                <NotificationsIcon color="inherit" />
              )}
            </Badge>
          </IconButton>
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

        {/* 通知パネル */}
        <Popover
          open={notificationOpen}
          anchorEl={notificationAnchorEl}
          onClose={handleNotificationClose}
          anchorOrigin={{
            vertical: "bottom",
            horizontal: "right",
          }}
          transformOrigin={{
            vertical: "top",
            horizontal: "right",
          }}
          TransitionComponent={Grow}
          sx={{
            "& .MuiPopover-paper": {
              borderRadius: 3,
              boxShadow: theme.shadows[8],
              border: `1px solid ${theme.palette.divider}`,
              background: "linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)",
            },
          }}
        >
          <Paper sx={{ width: 380, maxHeight: 500, overflow: "hidden" }}>
            {/* ヘッダー */}
            <Box
              sx={{
                p: 3,
                background: "linear-gradient(135deg, #FF6B35 0%, #FF8A65 100%)",
                color: "white",
                position: "relative",
                "&::after": {
                  content: '""',
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: 1,
                  background: "rgba(255, 255, 255, 0.2)",
                },
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <NotificationsActiveIcon />
                  <Typography
                    variant="h6"
                    component="h2"
                    sx={{ fontWeight: 600 }}
                  >
                    通知
                  </Typography>
                </Box>
                <Chip
                  label={`${unreadNotifications}件未読`}
                  size="small"
                  sx={{
                    backgroundColor: "rgba(255, 255, 255, 0.2)",
                    color: "white",
                    fontWeight: 500,
                  }}
                />
              </Box>
            </Box>

            {/* 通知リスト */}
            <Box sx={{ maxHeight: 350, overflow: "auto" }}>
              {notifications.length === 0 ? (
                <Box sx={{ p: 4, textAlign: "center" }}>
                  <NotificationsIcon
                    sx={{ fontSize: 48, color: "text.secondary", mb: 2 }}
                  />
                  <Typography variant="body1" color="text.secondary">
                    新しい通知はありません
                  </Typography>
                </Box>
              ) : (
                <List sx={{ p: 0 }}>
                  {notifications.map((notification, index) => (
                    <Fade
                      in={true}
                      timeout={300 + index * 100}
                      key={notification.notification_id}
                    >
                      <Card
                        sx={{
                          m: 2,
                          mb: index === notifications.length - 1 ? 2 : 1,
                          boxShadow: notification.is_confirmed ? 1 : 3,
                          opacity: notification.is_confirmed ? 0.7 : 1,
                          transition: "all 0.3s ease",
                          border: !notification.is_confirmed
                            ? "1px solid #FF6B35"
                            : "none",
                          "&:hover": {
                            boxShadow: 4,
                            transform: "translateY(-2px)",
                          },
                        }}
                      >
                        <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                          <Box sx={{ display: "flex", gap: 2 }}>
                            {/* アイコン */}
                            <Avatar
                              sx={{
                                width: 40,
                                height: 40,
                                backgroundColor:
                                  notification.notification_type ===
                                  "system_alert"
                                    ? "warning.main"
                                    : notification.notification_type ===
                                      "low_stock"
                                    ? "error.main"
                                    : notification.notification_type ===
                                      "new_order"
                                    ? "primary.main"
                                    : "info.main",
                              }}
                            >
                              {notification.notification_type ===
                              "system_alert" ? (
                                <WarningIcon />
                              ) : notification.notification_type ===
                                "low_stock" ? (
                                <ErrorIcon />
                              ) : notification.notification_type ===
                                "new_order" ? (
                                <ShoppingCartIcon />
                              ) : (
                                <InfoIcon />
                              )}
                            </Avatar>

                            {/* 通知内容 */}
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Typography
                                variant="subtitle1"
                                sx={{
                                  fontWeight: notification.is_confirmed
                                    ? 400
                                    : 600,
                                  color: notification.is_confirmed
                                    ? "text.secondary"
                                    : "text.primary",
                                  mb: 0.5,
                                }}
                              >
                                {notification.content}
                              </Typography>

                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 1,
                                  mb: 1,
                                }}
                              >
                                <ScheduleIcon
                                  sx={{ fontSize: 14, color: "text.secondary" }}
                                />
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  {new Date(
                                    notification.notification_time
                                  ).toLocaleString()}
                                </Typography>
                              </Box>

                              {notification.target_order_number && (
                                <Chip
                                  label={`注文: ${notification.target_order_number}`}
                                  size="small"
                                  variant="outlined"
                                  sx={{ fontSize: "0.75rem" }}
                                />
                              )}
                            </Box>

                            {/* 既読ボタン */}
                            {!notification.is_confirmed && (
                              <Box
                                sx={{ display: "flex", alignItems: "center" }}
                              >
                                <IconButton
                                  size="small"
                                  onClick={() =>
                                    handleNotificationRead(
                                      notification.notification_id
                                    )
                                  }
                                  sx={{
                                    color: "success.main",
                                    "&:hover": {
                                      backgroundColor: "success.light",
                                      color: "white",
                                    },
                                  }}
                                >
                                  <DoneIcon />
                                </IconButton>
                              </Box>
                            )}
                          </Box>
                        </CardContent>
                      </Card>
                    </Fade>
                  ))}
                </List>
              )}
            </Box>

            {/* フッター */}
            <Box
              sx={{
                p: 2,
                borderTop: 1,
                borderColor: "divider",
                backgroundColor: "grey.50",
              }}
            >
              <Box sx={{ display: "flex", gap: 1 }}>
                <Button
                  variant="contained"
                  onClick={handleNotificationClose}
                  startIcon={<ClearIcon />}
                  sx={{
                    flex: 1,
                    borderRadius: 2,
                    textTransform: "none",
                    fontWeight: 500,
                  }}
                >
                  閉じる
                </Button>
                {unreadNotifications > 0 && (
                  <Button
                    variant="outlined"
                    onClick={() => {
                      // 全て既読にする機能
                      notifications.forEach((notification) => {
                        if (!notification.is_confirmed) {
                          handleNotificationRead(notification.notification_id);
                        }
                      });
                    }}
                    startIcon={<CheckCircleIcon />}
                    sx={{
                      flex: 1,
                      borderRadius: 2,
                      textTransform: "none",
                      fontWeight: 500,
                    }}
                  >
                    全て既読
                  </Button>
                )}
              </Box>
            </Box>
          </Paper>
        </Popover>
      </Toolbar>
    </AppBar>
  );
}

export default NavigationBar;
