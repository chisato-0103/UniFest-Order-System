import { useState, useEffect } from "react";
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Alert,
  Badge,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  AppBar,
  Toolbar,
  IconButton,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  InputAdornment,
} from "@mui/material";
import {
  LocalShipping as DeliveryIcon,
  Receipt as ReceiptIcon,
  Search as SearchIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  AccessTime as TimeIcon,
  Refresh as RefreshIcon,
  Thermostat as TempIcon,
  Done as DoneIcon,
} from "@mui/icons-material";
import type {
  Order,
  OrderStatus,
  PaymentStatus,
  CookingStatus,
} from "../types";

// ダミーの受け渡し待ち注文データ
const dummyReadyOrders: Order[] = [
  {
    order_id: 1,
    customer_id: 1,
    order_number: "A001",
    order_status: "completed" as OrderStatus,
    payment_status: "paid" as PaymentStatus,
    total_price: 1300,
    order_items: [
      {
        order_item_id: 1,
        order_id: 1,
        product_id: 1,
        product_name: "たこ焼き 8個入り",
        quantity: 2,
        unit_price: 600,
        subtotal: 1200,
        total_price: 1200,
        cooking_status: "completed" as CookingStatus,
        toppings: [
          {
            order_topping_id: 1,
            order_item_id: 1,
            topping_id: 1,
            topping_name: "青のり",
            price: 50,
            is_active: true,
            target_product_ids: [1],
            display_order: 1,
            created_at: "2024-01-01T00:00:00Z",
            updated_at: "2024-01-01T00:00:00Z",
          },
        ],
        cooking_time: 10,
        cooking_instruction: "",
        created_at: "2024-01-01T10:00:00Z",
        updated_at: "2024-01-01T10:00:00Z",
      },
    ],
    items: [], // エイリアス（後で設定）
    total_amount: 1300,
    status: "completed" as OrderStatus,
    payment_method: "現金",
    estimated_pickup_time: "2024-01-01T10:15:00Z",
    actual_pickup_time: null,
    special_instructions: "",
    created_at: "2024-01-01T10:00:00Z",
    updated_at: "2024-01-01T10:10:00Z",
  },
  {
    order_id: 2,
    customer_id: 2,
    order_number: "A002",
    order_status: "completed" as OrderStatus,
    payment_status: "paid" as PaymentStatus,
    total_price: 850,
    order_items: [
      {
        order_item_id: 2,
        order_id: 2,
        product_id: 2,
        product_name: "たこ焼き 12個入り",
        quantity: 1,
        unit_price: 850,
        subtotal: 850,
        total_price: 850,
        cooking_status: "completed" as CookingStatus,
        toppings: [],
        cooking_time: 12,
        cooking_instruction: "",
        created_at: "2024-01-01T10:05:00Z",
        updated_at: "2024-01-01T10:05:00Z",
      },
    ],
    items: [], // エイリアス（後で設定）
    total_amount: 850,
    status: "completed" as OrderStatus,
    payment_method: "現金",
    estimated_pickup_time: "2024-01-01T10:20:00Z",
    actual_pickup_time: null,
    special_instructions: "アツアツでお願いします",
    created_at: "2024-01-01T10:05:00Z",
    updated_at: "2024-01-01T10:18:00Z",
  },
  {
    order_id: 3,
    customer_id: 3,
    order_number: "A003",
    order_status: "completed" as OrderStatus,
    payment_status: "paid" as PaymentStatus,
    total_price: 1130,
    order_items: [
      {
        order_item_id: 3,
        order_id: 3,
        product_id: 3,
        product_name: "たこ焼き 16個入り",
        quantity: 1,
        unit_price: 1100,
        subtotal: 1100,
        total_price: 1100,
        cooking_status: "completed" as CookingStatus,
        toppings: [
          {
            order_topping_id: 3,
            order_item_id: 3,
            topping_id: 3,
            topping_name: "マヨネーズ",
            price: 30,
            is_active: true,
            target_product_ids: [3],
            display_order: 3,
            created_at: "2024-01-01T00:00:00Z",
            updated_at: "2024-01-01T00:00:00Z",
          },
        ],
        cooking_time: 15,
        cooking_instruction: "",
        created_at: "2024-01-01T10:03:00Z",
        updated_at: "2024-01-01T10:03:00Z",
      },
    ],
    items: [], // エイリアス（後で設定）
    total_amount: 1130,
    status: "completed" as OrderStatus,
    payment_method: "現金",
    estimated_pickup_time: "2024-01-01T10:25:00Z",
    actual_pickup_time: null,
    special_instructions: "",
    created_at: "2024-01-01T10:03:00Z",
    updated_at: "2024-01-01T10:20:00Z",
  },
];

// エイリアスを設定
dummyReadyOrders.forEach((order) => {
  order.items = order.order_items;
});

function DeliveryPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [deliveryDialog, setDeliveryDialog] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // APIから完了済み注文データを取得
  const fetchOrders = async () => {
    try {
      setError("");
      const response = await fetch("http://localhost:3001/api/orders");

      if (!response.ok) {
        throw new Error("注文データの取得に失敗しました");
      }

      const result = await response.json();

      if (!result.success || !Array.isArray(result.data)) {
        throw new Error("データ形式が正しくありません");
      }

      // APIデータをOrder形式に変換
      const formattedOrders: Order[] = result.data.map(
        (order: {
          order_id: number;
          customer_id: number;
          order_number: string;
          status: string;
          payment_status: string;
          total_amount: string;
          items: Array<{
            product_name: string;
            quantity: number;
            total_price: number;
          }>;
          payment_method: string;
          estimated_pickup_time: string;
          actual_pickup_time: string | null;
          special_instructions: string;
          created_at: string;
          updated_at: string;
        }) => ({
          order_id: order.order_id,
          customer_id: order.customer_id,
          order_number: order.order_number,
          order_status: order.status as OrderStatus,
          payment_status: order.payment_status as PaymentStatus,
          total_price: parseFloat(order.total_amount),
          order_items: order.items || [],
          total_amount: parseFloat(order.total_amount),
          status: order.status as OrderStatus,
          payment_method: order.payment_method,
          estimated_pickup_time: order.estimated_pickup_time,
          actual_pickup_time: order.actual_pickup_time,
          special_instructions: order.special_instructions || "",
          created_at: order.created_at,
          updated_at: order.updated_at,
          items: order.items || [],
        })
      );

      setOrders(formattedOrders);
    } catch (err: unknown) {
      console.error("配達データ取得エラー:", err);
      const errorMessage =
        err instanceof Error ? err.message : "データの取得に失敗しました";
      setError(errorMessage);

      // フォールバック: ダミーデータを使用
      setOrders(dummyReadyOrders);
    } finally {
      setLoading(false);
    }
  };

  // 初期データ取得と定期更新
  useEffect(() => {
    fetchOrders();

    const interval = setInterval(() => {
      fetchOrders();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  // 現在時刻を更新
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // フィルタリングされた注文（受け渡し待ちのみ）
  const filteredOrders = orders.filter(
    (order) =>
      order.status === "調理完了" &&
      order.payment_status === "paid" &&
      order.actual_pickup_time === null &&
      (order.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.items.some((item) =>
          item.product_name.toLowerCase().includes(searchQuery.toLowerCase())
        ))
  );

  // 統計情報
  const stats = {
    readyForDelivery: orders.filter(
      (o) =>
        o.status === "調理完了" &&
        o.payment_status === "paid" &&
        o.actual_pickup_time === null
    ).length,
    urgentDeliveries: orders.filter(
      (o) =>
        o.status === "調理完了" &&
        o.payment_status === "paid" &&
        o.actual_pickup_time === null &&
        getElapsedTime(o.updated_at) > 10
    ).length,
    todayDelivered: orders.filter((o) => o.actual_pickup_time !== null).length,
  };

  // 受け渡し処理
  const handleDelivery = (order: Order) => {
    setSelectedOrder(order);
    setDeliveryDialog(true);
  };

  // 受け渡し完了処理
  const completeDelivery = async () => {
    if (!selectedOrder) return;

    try {
      const response = await fetch(
        `http://localhost:3001/api/orders/${selectedOrder.order_id}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: "受け取り済み",
          }),
        }
      );

      if (!response.ok) {
        throw new Error("受け渡し処理に失敗しました");
      }

      // ローカル状態を更新
      setOrders((prev) =>
        prev.map((order) =>
          order.order_id === selectedOrder.order_id
            ? {
                ...order,
                status: "受け取り済み" as OrderStatus,
                actual_pickup_time: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              }
            : order
        )
      );
      setDeliveryDialog(false);
      setSelectedOrder(null);
    } catch (err: unknown) {
      console.error("受け渡し処理エラー:", err);
      const errorMessage =
        err instanceof Error ? err.message : "受け渡し処理に失敗しました";
      setError(errorMessage);
    }
  };

  // 経過時間を計算（調理完了からの時間）
  const getElapsedTime = (updatedAt: string) => {
    const now = new Date();
    const updated = new Date(updatedAt);
    const diffMinutes = Math.floor(
      (now.getTime() - updated.getTime()) / (1000 * 60)
    );
    return diffMinutes;
  };

  // 温度状態を取得
  const getTempStatus = (elapsedTime: number) => {
    if (elapsedTime <= 5)
      return { status: "hot", color: "success", label: "アツアツ" };
    if (elapsedTime <= 10)
      return { status: "warm", color: "warning", label: "温かい" };
    return { status: "cool", color: "error", label: "冷めかけ" };
  };

  // データ更新
  const refreshData = () => {
    fetchOrders();
  };

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <AppBar position="static" color="default" sx={{ mb: 3 }}>
        <Toolbar>
          <DeliveryIcon sx={{ mr: 2 }} />
          <Typography variant="h6" component="h1" sx={{ flexGrow: 1 }}>
            受け渡し管理システム
          </Typography>
          <Typography variant="body2" sx={{ mr: 2 }}>
            {currentTime.toLocaleTimeString()}
          </Typography>
          <IconButton color="inherit" onClick={refreshData}>
            <RefreshIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* エラー表示 */}
      {error && (
        <Alert
          severity="error"
          sx={{ mb: 2 }}
          action={
            <Button color="inherit" size="small" onClick={fetchOrders}>
              再試行
            </Button>
          }
        >
          {error}
        </Alert>
      )}

      {/* ローディング表示 */}
      {loading && (
        <Box sx={{ mb: 2 }}>
          <Typography>データを読み込み中...</Typography>
        </Box>
      )}

      {/* 統計情報 */}
      <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap" }}>
        <Card sx={{ minWidth: 200 }}>
          <CardContent>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <DeliveryIcon color="info" />
              <Typography variant="h6">受け渡し待ち</Typography>
            </Box>
            <Typography variant="h4" color="info.main">
              {stats.readyForDelivery}
            </Typography>
          </CardContent>
        </Card>

        <Card sx={{ minWidth: 200 }}>
          <CardContent>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <WarningIcon color="error" />
              <Typography variant="h6">緊急受け渡し</Typography>
            </Box>
            <Typography variant="h4" color="error.main">
              {stats.urgentDeliveries}
            </Typography>
          </CardContent>
        </Card>

        <Card sx={{ minWidth: 200 }}>
          <CardContent>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <CheckCircleIcon color="success" />
              <Typography variant="h6">本日受け渡し完了</Typography>
            </Box>
            <Typography variant="h4" color="success.main">
              {stats.todayDelivered}
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* 緊急受け渡し警告 */}
      {stats.urgentDeliveries > 0 && (
        <Alert severity="error" sx={{ mb: 3 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <WarningIcon />
            <Typography variant="h6">緊急受け渡し注文あり</Typography>
          </Box>
          <Typography variant="body2">
            10分以上経過している注文があります。温かいうちにお渡しください。
          </Typography>
        </Alert>
      )}

      {/* 検索バー */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <TextField
            fullWidth
            placeholder="注文番号または商品名で検索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        </CardContent>
      </Card>

      {/* 受け渡し待ち注文一覧 */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            受け渡し待ち注文一覧
          </Typography>

          {filteredOrders.length === 0 ? (
            <Alert severity="info">
              {searchQuery
                ? "検索条件に該当する注文がありません"
                : "受け渡し待ちの注文はありません"}
            </Alert>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>注文番号</TableCell>
                    <TableCell>商品</TableCell>
                    <TableCell>金額</TableCell>
                    <TableCell>温度状態</TableCell>
                    <TableCell>経過時間</TableCell>
                    <TableCell>特別指示</TableCell>
                    <TableCell>操作</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredOrders.map((order) => {
                    const elapsedTime = getElapsedTime(order.updated_at);
                    const tempStatus = getTempStatus(elapsedTime);

                    return (
                      <TableRow
                        key={order.order_id}
                        sx={{
                          bgcolor:
                            elapsedTime > 10
                              ? "error.light"
                              : elapsedTime > 5
                              ? "warning.light"
                              : "success.light",
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
                            {elapsedTime > 10 && (
                              <Badge
                                badgeContent={<WarningIcon />}
                                color="error"
                              >
                                <TimeIcon />
                              </Badge>
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box>
                            {order.items.map((item, index) => (
                              <Typography key={index} variant="body2">
                                {item.product_name} × {item.quantity}
                                {item.toppings.length > 0 && (
                                  <Box
                                    component="span"
                                    sx={{ ml: 1, color: "text.secondary" }}
                                  >
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
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                            }}
                          >
                            <TempIcon
                              color={
                                tempStatus.color as
                                  | "success"
                                  | "warning"
                                  | "error"
                              }
                            />
                            <Chip
                              label={tempStatus.label}
                              color={
                                tempStatus.color as
                                  | "success"
                                  | "warning"
                                  | "error"
                              }
                              size="small"
                            />
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography
                            variant="body2"
                            color={
                              elapsedTime > 10
                                ? "error"
                                : elapsedTime > 5
                                ? "warning.main"
                                : "success.main"
                            }
                            fontWeight="bold"
                          >
                            {elapsedTime}分経過
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {order.special_instructions ? (
                            <Alert severity="info" sx={{ py: 0, px: 1 }}>
                              <Typography variant="caption">
                                {order.special_instructions}
                              </Typography>
                            </Alert>
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              なし
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="contained"
                            size="small"
                            startIcon={<DoneIcon />}
                            onClick={() => handleDelivery(order)}
                            color={
                              elapsedTime > 10
                                ? "error"
                                : elapsedTime > 5
                                ? "warning"
                                : "success"
                            }
                          >
                            受け渡し完了
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* 受け渡し確認ダイアログ */}
      <Dialog
        open={deliveryDialog}
        onClose={() => setDeliveryDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <DeliveryIcon />
            受け渡し確認 - 注文番号: {selectedOrder?.order_number}
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedOrder && (
            <Box>
              <Typography variant="h6" gutterBottom>
                注文内容確認
              </Typography>
              <List>
                {selectedOrder.items.map((item) => (
                  <ListItem key={item.order_item_id} divider>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: "orange.light" }}>
                        <ReceiptIcon />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={`${item.product_name} × ${item.quantity}`}
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            ¥{item.total_price.toLocaleString()}
                          </Typography>
                          {item.toppings.length > 0 && (
                            <Box sx={{ mt: 0.5 }}>
                              {item.toppings.map((topping) => (
                                <Chip
                                  key={topping.topping_id}
                                  label={topping.topping_name}
                                  size="small"
                                  sx={{ mr: 0.5, mb: 0.5 }}
                                />
                              ))}
                            </Box>
                          )}
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>

              <Divider sx={{ my: 2 }} />

              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 2,
                }}
              >
                <Typography variant="h6">合計金額</Typography>
                <Typography variant="h6" color="primary">
                  ¥{selectedOrder.total_amount.toLocaleString()}
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  支払い状況: {selectedOrder.payment_status}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  支払い方法: {selectedOrder.payment_method}
                </Typography>
              </Box>

              {selectedOrder.special_instructions && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    特別指示: {selectedOrder.special_instructions}
                  </Typography>
                </Alert>
              )}

              <Alert severity="warning">
                <Typography variant="body1" fontWeight="bold">
                  お客様にお渡しする前に以下をご確認ください
                </Typography>
                <ul style={{ margin: "8px 0", paddingLeft: "20px" }}>
                  <li>注文番号の確認</li>
                  <li>商品内容と数量の確認</li>
                  <li>トッピングの確認</li>
                  <li>商品の温度確認</li>
                  <li>やけど注意の声かけ</li>
                </ul>
              </Alert>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeliveryDialog(false)}>キャンセル</Button>
          <Button
            variant="contained"
            onClick={completeDelivery}
            startIcon={<CheckCircleIcon />}
            color="success"
          >
            受け渡し完了
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default DeliveryPage;
