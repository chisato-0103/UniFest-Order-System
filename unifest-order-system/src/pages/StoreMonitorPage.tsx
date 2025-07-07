import { useState, useEffect, useCallback } from "react";
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Chip,
  Alert,
  Badge,
  LinearProgress,
  AppBar,
  Toolbar,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tabs,
  Tab,
  Button,
} from "@mui/material";
import {
  Restaurant as RestaurantIcon,
  Timer as TimerIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  People as PeopleIcon,
  TrendingUp as TrendingUpIcon,
  Refresh as RefreshIcon,
  Notifications as NotificationsIcon,
  Store as StoreIcon,
  Inventory as InventoryIcon,
} from "@mui/icons-material";
import AdminNavigationBar from "../components/AdminNavigationBar";
import StockManagement from "../components/StockManagement";
import TakoyakiCookerManagement from "../components/TakoyakiCookerManagement";
import { useSocket } from "../hooks/useSocket";
import MockApi from "../services/mockApi";

// 店舗監視画面用の型定義
interface MonitorOrder {
  order_id: number;
  customer_id: number | null;
  order_number: string;
  status: string;
  payment_status: string;
  total_amount: number;
  order_items: Array<{
    order_item_id: number;
    product_id: number;
    product_name: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    toppings: Array<{
      topping_id: number;
      topping_name: string;
      price: number;
    }>;
    cooking_time: number;
    cooking_instruction: string;
  }>;
  payment_method: string;
  estimated_pickup_time: string;
  actual_pickup_time: string | null;
  special_instructions: string;
  created_at: string;
  updated_at: string;
}

function StoreMonitorPage() {
  const [orders, setOrders] = useState<MonitorOrder[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  // Socket.io統合
  const socket = useSocket();

  // APIからデータを取得
  const fetchOrders = useCallback(async () => {
    try {
      setError("");

      // モックAPIを使用
      const response = await MockApi.getOrders();

      // OrderをMonitorOrder形式に変換
      const formattedOrders: MonitorOrder[] = response.data.map((order) => ({
        order_id: parseInt(order.id),
        customer_id: order.customer_id
          ? parseInt(String(order.customer_id))
          : null,
        order_number: order.orderNumber,
        status: order.status,
        payment_status: order.payment_status || "pending",
        total_amount: order.total,
        order_items: (order.items || []).map((item, index) => ({
          order_item_id: index + 1,
          product_id: parseInt(item.id),
          product_name: item.name,
          quantity: item.quantity,
          unit_price: item.price,
          total_price: item.totalPrice,
          toppings: [],
          cooking_time: 5,
          cooking_instruction: "",
        })),
        payment_method: order.payment_method || "cash",
        estimated_pickup_time: order.createdAt.toISOString(),
        actual_pickup_time: null,
        special_instructions: "",
        created_at: order.createdAt.toISOString(),
        updated_at: order.updatedAt.toISOString(),
      }));

      setOrders(formattedOrders);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching orders:", err);
      setError("注文データの取得に失敗しました");
      setLoading(false);
    }
  }, []);

  // 初回データ取得
  useEffect(() => {
    fetchOrders();

    // 定期的にデータを更新（新しい注文を取得するため）
    const interval = setInterval(() => {
      console.log("📊 店舗監視画面: 注文データを自動更新中...");
      if (navigator.onLine) {
        fetchOrders();
      }
    }, 3000); // 3秒間隔に短縮

    // 他のタブからの更新通知を受信
    const handleDataUpdate = () => {
      console.log("🔔 店舗監視: 他のタブからの更新通知を受信");
      fetchOrders();
    };

    window.addEventListener("unifest-data-updated", handleDataUpdate);

    return () => {
      clearInterval(interval);
      window.removeEventListener("unifest-data-updated", handleDataUpdate);
    };
  }, [fetchOrders]);

  // Socket.io統合
  useEffect(() => {
    if (!socket) return;

    // 店舗監視に参加
    socket.emit("join-monitor");

    // 注文の更新を監視
    socket.on("order-status-updated", () => {
      fetchOrders();
    });

    socket.on("new-order", () => {
      fetchOrders();
    });

    return () => {
      socket.off("order-status-updated");
      socket.off("new-order");
    };
  }, [socket, fetchOrders]);

  // 現在時刻を更新
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // 統計情報を計算
  const stats = {
    totalOrders: orders.length,
    waitingOrders: orders.filter((o) => o.status === "調理待ち").length,
    cookingOrders: orders.filter((o) => o.status === "調理中").length,
    completedOrders: orders.filter((o) => o.status === "調理完了").length,
    deliveredOrders: orders.filter((o) => o.status === "受け取り済み").length,
    totalSales: orders
      .filter((o) => o.payment_status === "支払い済み")
      .reduce((sum, o) => sum + o.total_amount, 0),
    averageOrderValue:
      orders.length > 0
        ? orders.reduce((sum, o) => sum + o.total_amount, 0) / orders.length
        : 0,
  };

  // 注文の経過時間を計算
  const getElapsedTime = (createdAt: string) => {
    const now = new Date();
    const created = new Date(createdAt);
    const diffMinutes = Math.floor(
      (now.getTime() - created.getTime()) / (1000 * 60)
    );
    return diffMinutes;
  };

  // 状態の色を取得
  const getStatusColor = (status: string) => {
    switch (status) {
      case "調理待ち":
        return "warning";
      case "調理中":
        return "info";
      case "調理完了":
        return "success";
      case "受け取り済み":
        return "default";
      default:
        return "default";
    }
  };

  // 緊急性の判定
  const isUrgent = (order: MonitorOrder) => {
    const elapsedTime = getElapsedTime(order.created_at);
    return (
      elapsedTime > 15 &&
      (order.status === "調理待ち" || order.status === "調理中")
    );
  };

  // 注文を更新
  const refreshOrders = () => {
    // TODO: APIから最新の注文データを取得
    console.log("注文データを更新中...");
  };

  // ローディング表示
  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Typography variant="h6" align="center">
          データを読み込み中...
        </Typography>
        <LinearProgress sx={{ mt: 2 }} />
      </Container>
    );
  }

  // エラー表示
  if (error) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button onClick={fetchOrders} variant="contained">
          再試行
        </Button>
      </Container>
    );
  }

  return (
    <Box>
      <AdminNavigationBar currentPage="店舗モニター" />
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <AppBar position="static" color="default" sx={{ mb: 3 }}>
          <Toolbar>
            <StoreIcon sx={{ mr: 2 }} />
            <Typography variant="h6" component="h1" sx={{ flexGrow: 1 }}>
              店舗モニター - たこ焼き屋さん
            </Typography>
            <Typography variant="body2" sx={{ mr: 2 }}>
              {currentTime.toLocaleTimeString()}
            </Typography>
            <IconButton color="inherit" onClick={refreshOrders}>
              <RefreshIcon />
            </IconButton>
          </Toolbar>
        </AppBar>

        {/* タブナビゲーション */}
        <Card sx={{ mb: 3 }}>
          <Tabs
            value={activeTab}
            onChange={(_, newValue) => setActiveTab(newValue)}
            aria-label="店舗モニタータブ"
          >
            <Tab
              label="注文監視"
              icon={<RestaurantIcon />}
              iconPosition="start"
            />
            <Tab
              label="在庫管理"
              icon={<InventoryIcon />}
              iconPosition="start"
            />
            <Tab
              label="たこ焼き器管理"
              icon={<StoreIcon />}
              iconPosition="start"
            />
          </Tabs>
        </Card>

        {/* タブコンテンツ */}
        {activeTab === 0 && (
          <Box>
            {/* 統計情報 */}
            <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap" }}>
              <Card sx={{ minWidth: 200 }}>
                <CardContent>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <PeopleIcon color="primary" />
                    <Typography variant="h6">総注文数</Typography>
                  </Box>
                  <Typography variant="h4" color="primary">
                    {stats.totalOrders}
                  </Typography>
                </CardContent>
              </Card>

              <Card sx={{ minWidth: 200 }}>
                <CardContent>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <TrendingUpIcon color="success" />
                    <Typography variant="h6">総売上</Typography>
                  </Box>
                  <Typography variant="h4" color="success.main">
                    ¥{stats.totalSales.toLocaleString()}
                  </Typography>
                </CardContent>
              </Card>

              <Card sx={{ minWidth: 200 }}>
                <CardContent>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <TimerIcon color="warning" />
                    <Typography variant="h6">調理待ち</Typography>
                  </Box>
                  <Typography variant="h4" color="warning.main">
                    {stats.waitingOrders}
                  </Typography>
                </CardContent>
              </Card>

              <Card sx={{ minWidth: 200 }}>
                <CardContent>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <RestaurantIcon color="info" />
                    <Typography variant="h6">調理中</Typography>
                  </Box>
                  <Typography variant="h4" color="info.main">
                    {stats.cookingOrders}
                  </Typography>
                </CardContent>
              </Card>

              <Card sx={{ minWidth: 200 }}>
                <CardContent>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <CheckCircleIcon color="success" />
                    <Typography variant="h6">調理完了</Typography>
                  </Box>
                  <Typography variant="h4" color="success.main">
                    {stats.completedOrders}
                  </Typography>
                </CardContent>
              </Card>
            </Box>

            {/* 緊急注文の警告 */}
            {orders.some(isUrgent) && (
              <Alert severity="error" sx={{ mb: 3 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <WarningIcon />
                  <Typography variant="h6">緊急注文あり</Typography>
                </Box>
                <Typography variant="body2">
                  15分以上経過している注文があります。優先的に処理してください。
                </Typography>
              </Alert>
            )}

            {/* 注文一覧テーブル */}
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  注文一覧
                </Typography>
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>注文番号</TableCell>
                        <TableCell>商品</TableCell>
                        <TableCell>金額</TableCell>
                        <TableCell>状態</TableCell>
                        <TableCell>支払い</TableCell>
                        <TableCell>経過時間</TableCell>
                        <TableCell>予定時刻</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {orders.map((order) => (
                        <TableRow
                          key={order.order_id}
                          sx={{
                            bgcolor: isUrgent(order)
                              ? "error.light"
                              : "inherit",
                            "&:hover": { bgcolor: "action.hover" },
                          }}
                        >
                          <TableCell>
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                              }}
                            >
                              <Typography variant="body1" fontWeight="bold">
                                {order.order_number}
                              </Typography>
                              {isUrgent(order) && (
                                <Badge
                                  badgeContent={<WarningIcon />}
                                  color="error"
                                >
                                  <NotificationsIcon />
                                </Badge>
                              )}
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box>
                              {order.order_items.map((item, index) => (
                                <Typography key={index} variant="body2">
                                  {item.product_name} × {item.quantity}
                                  {item.toppings.length > 0 && (
                                    <Box component="span" sx={{ ml: 1 }}>
                                      (
                                      {item.toppings
                                        .map((t) => t.topping_name)
                                        .join(", ")}
                                      )
                                    </Box>
                                  )}
                                </Typography>
                              ))}
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body1" fontWeight="bold">
                              ¥{order.total_amount.toLocaleString()}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={order.status}
                              color={
                                getStatusColor(order.status) as
                                  | "warning"
                                  | "info"
                                  | "success"
                                  | "default"
                              }
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={order.payment_status}
                              color={
                                order.payment_status === "支払い済み"
                                  ? "success"
                                  : "warning"
                              }
                              size="small"
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell>
                            <Typography
                              variant="body2"
                              color={
                                getElapsedTime(order.created_at) > 15
                                  ? "error"
                                  : "text.secondary"
                              }
                            >
                              {getElapsedTime(order.created_at)}分
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary">
                              {new Date(
                                order.estimated_pickup_time
                              ).toLocaleTimeString()}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>

            {/* 進捗状況バー */}
            <Card sx={{ mt: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  調理進捗状況
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      mb: 1,
                    }}
                  >
                    <Typography variant="body2">調理完了率</Typography>
                    <Typography variant="body2">
                      {stats.totalOrders > 0
                        ? Math.round(
                            ((stats.completedOrders + stats.deliveredOrders) /
                              stats.totalOrders) *
                              100
                          )
                        : 0}
                      %
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={
                      stats.totalOrders > 0
                        ? ((stats.completedOrders + stats.deliveredOrders) /
                            stats.totalOrders) *
                          100
                        : 0
                    }
                    sx={{ height: 10, borderRadius: 5 }}
                  />
                </Box>
                <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                  <Chip
                    label={`調理待ち: ${stats.waitingOrders}`}
                    color="warning"
                    size="small"
                  />
                  <Chip
                    label={`調理中: ${stats.cookingOrders}`}
                    color="info"
                    size="small"
                  />
                  <Chip
                    label={`調理完了: ${stats.completedOrders}`}
                    color="success"
                    size="small"
                  />
                  <Chip
                    label={`受け取り済み: ${stats.deliveredOrders}`}
                    color="default"
                    size="small"
                  />
                </Box>
              </CardContent>
            </Card>
          </Box>
        )}

        {/* 在庫管理タブ */}
        {activeTab === 1 && (
          <Box>
            <StockManagement />
          </Box>
        )}

        {/* たこ焼き器管理タブ */}
        {activeTab === 2 && (
          <Box>
            <TakoyakiCookerManagement showDetailedView={true} />
          </Box>
        )}
      </Container>
    </Box>
  );
}

export default StoreMonitorPage;
