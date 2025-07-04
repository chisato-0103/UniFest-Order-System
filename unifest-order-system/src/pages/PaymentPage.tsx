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
  Payment as PaymentIcon,
  Receipt as ReceiptIcon,
  Search as SearchIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  AttachMoney as MoneyIcon,
  Refresh as RefreshIcon,
  Print as PrintIcon,
} from "@mui/icons-material";
import type {
  Order,
  PaymentStatus,
  CookingStatus,
  OrderStatus,
} from "../types";

// ダミーの未払い注文データ
const dummyUnpaidOrders: Order[] = [
  {
    order_id: 1,
    customer_id: 1,
    order_number: "A001",
    order_status: "completed" as OrderStatus,
    payment_status: "unpaid" as PaymentStatus,
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
    updated_at: "2024-01-01T10:05:00Z",
  },
  {
    order_id: 2,
    customer_id: 2,
    order_number: "A002",
    order_status: "cooking" as OrderStatus,
    payment_status: "unpaid" as PaymentStatus,
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
        cooking_status: "cooking" as CookingStatus,
        toppings: [],
        cooking_time: 12,
        cooking_instruction: "",
        created_at: "2024-01-01T10:02:00Z",
        updated_at: "2024-01-01T10:02:00Z",
      },
    ],
    items: [], // エイリアス（後で設定）
    total_amount: 850,
    status: "cooking" as OrderStatus,
    payment_method: "現金",
    estimated_pickup_time: "2024-01-01T10:17:00Z",
    actual_pickup_time: null,
    special_instructions: "",
    created_at: "2024-01-01T10:02:00Z",
    updated_at: "2024-01-01T10:03:00Z",
  },
  {
    order_id: 3,
    customer_id: 3,
    order_number: "A003",
    order_status: "completed" as OrderStatus,
    payment_status: "unpaid" as PaymentStatus,
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
        created_at: "2024-01-01T10:01:00Z",
        updated_at: "2024-01-01T10:01:00Z",
      },
    ],
    items: [], // エイリアス（後で設定）
    total_amount: 1130,
    status: "completed" as OrderStatus,
    payment_method: "現金",
    estimated_pickup_time: "2024-01-01T10:20:00Z",
    actual_pickup_time: null,
    special_instructions: "",
    created_at: "2024-01-01T10:01:00Z",
    updated_at: "2024-01-01T10:06:00Z",
  },
];

// エイリアスを設定
dummyUnpaidOrders.forEach((order) => {
  order.items = order.order_items;
});

function PaymentPage() {
  const [orders, setOrders] = useState<Order[]>(dummyUnpaidOrders);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [paymentDialog, setPaymentDialog] = useState(false);
  const [receivedAmount, setReceivedAmount] = useState("");
  const [currentTime, setCurrentTime] = useState(new Date());

  // 現在時刻を更新
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // フィルタリングされた注文
  const filteredOrders = orders.filter(
    (order) =>
      order.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.items.some((item) =>
        item.product_name.toLowerCase().includes(searchQuery.toLowerCase())
      )
  );

  // 統計情報
  const stats = {
    unpaidOrders: orders.filter((o) => o.payment_status === "未払い").length,
    unpaidAmount: orders
      .filter((o) => o.payment_status === "未払い")
      .reduce((sum, o) => sum + o.total_amount, 0),
    readyForPayment: orders.filter(
      (o) => o.status === "調理完了" && o.payment_status === "未払い"
    ).length,
  };

  // 支払い処理
  const handlePayment = (order: Order) => {
    setSelectedOrder(order);
    setReceivedAmount(order.total_amount.toString());
    setPaymentDialog(true);
  };

  // 支払い完了処理
  const completePayment = () => {
    if (selectedOrder) {
      setOrders((prev) =>
        prev.map((order) =>
          order.order_id === selectedOrder.order_id
            ? {
                ...order,
                payment_status: "paid" as PaymentStatus,
                updated_at: new Date().toISOString(),
              }
            : order
        )
      );
      setPaymentDialog(false);
      setSelectedOrder(null);
      setReceivedAmount("");
    }
  };

  // お釣り計算
  const calculateChange = () => {
    if (selectedOrder && receivedAmount) {
      const change = parseFloat(receivedAmount) - selectedOrder.total_amount;
      return change >= 0 ? change : 0;
    }
    return 0;
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
  const getStatusColor = (order: Order) => {
    if (order.status === "調理完了" && order.payment_status === "未払い") {
      return "success";
    } else if (order.status === "調理中") {
      return "info";
    } else if (order.payment_status === "paid") {
      return "default";
    }
    return "warning";
  };

  // データ更新
  const refreshData = () => {
    // TODO: APIから最新データを取得
    console.log("支払いデータを更新中...");
  };

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <AppBar position="static" color="default" sx={{ mb: 3 }}>
        <Toolbar>
          <PaymentIcon sx={{ mr: 2 }} />
          <Typography variant="h6" component="h1" sx={{ flexGrow: 1 }}>
            支払い管理システム
          </Typography>
          <Typography variant="body2" sx={{ mr: 2 }}>
            {currentTime.toLocaleTimeString()}
          </Typography>
          <IconButton color="inherit" onClick={refreshData}>
            <RefreshIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* 統計情報 */}
      <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap" }}>
        <Card sx={{ minWidth: 200 }}>
          <CardContent>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <WarningIcon color="warning" />
              <Typography variant="h6">未払い注文</Typography>
            </Box>
            <Typography variant="h4" color="warning.main">
              {stats.unpaidOrders}
            </Typography>
          </CardContent>
        </Card>

        <Card sx={{ minWidth: 200 }}>
          <CardContent>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <MoneyIcon color="error" />
              <Typography variant="h6">未払い金額</Typography>
            </Box>
            <Typography variant="h4" color="error.main">
              ¥{stats.unpaidAmount.toLocaleString()}
            </Typography>
          </CardContent>
        </Card>

        <Card sx={{ minWidth: 200 }}>
          <CardContent>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <CheckCircleIcon color="success" />
              <Typography variant="h6">支払い可能</Typography>
            </Box>
            <Typography variant="h4" color="success.main">
              {stats.readyForPayment}
            </Typography>
          </CardContent>
        </Card>
      </Box>

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

      {/* 支払い待ち注文一覧 */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            支払い待ち注文一覧
          </Typography>

          {filteredOrders.length === 0 ? (
            <Alert severity="info">
              {searchQuery
                ? "検索条件に該当する注文がありません"
                : "支払い待ちの注文はありません"}
            </Alert>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>注文番号</TableCell>
                    <TableCell>商品</TableCell>
                    <TableCell>金額</TableCell>
                    <TableCell>状態</TableCell>
                    <TableCell>支払い状況</TableCell>
                    <TableCell>経過時間</TableCell>
                    <TableCell>操作</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredOrders.map((order) => (
                    <TableRow
                      key={order.order_id}
                      sx={{
                        bgcolor:
                          order.status === "調理完了" &&
                          order.payment_status === "未払い"
                            ? "success.light"
                            : "inherit",
                        "&:hover": { bgcolor: "action.hover" },
                      }}
                    >
                      <TableCell>
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          <Typography variant="body1" fontWeight="bold">
                            {order.order_number}
                          </Typography>
                          {order.status === "調理完了" &&
                            order.payment_status === "未払い" && (
                              <Badge
                                badgeContent={<CheckCircleIcon />}
                                color="success"
                              >
                                <ReceiptIcon />
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
                        <Chip
                          label={order.status}
                          color={
                            getStatusColor(order) as
                              | "success"
                              | "info"
                              | "warning"
                              | "default"
                          }
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={order.payment_status}
                          color={
                            order.payment_status === "paid"
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
                            getElapsedTime(order.created_at) > 20
                              ? "error"
                              : "text.secondary"
                          }
                        >
                          {getElapsedTime(order.created_at)}分
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: "flex", gap: 1 }}>
                          {order.payment_status === "未払い" && (
                            <Button
                              variant="contained"
                              size="small"
                              startIcon={<PaymentIcon />}
                              onClick={() => handlePayment(order)}
                              disabled={order.status !== "調理完了"}
                              color={
                                order.status === "調理完了"
                                  ? "success"
                                  : "primary"
                              }
                            >
                              {order.status === "調理完了"
                                ? "支払い処理"
                                : "調理待ち"}
                            </Button>
                          )}
                          {order.payment_status === "paid" && (
                            <Button
                              variant="outlined"
                              size="small"
                              startIcon={<PrintIcon />}
                              onClick={() => console.log("レシート印刷")}
                            >
                              レシート
                            </Button>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* 支払い処理ダイアログ */}
      <Dialog
        open={paymentDialog}
        onClose={() => setPaymentDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <PaymentIcon />
            支払い処理 - 注文番号: {selectedOrder?.order_number}
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedOrder && (
            <Box>
              <Typography variant="h6" gutterBottom>
                注文内容
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

              <TextField
                fullWidth
                label="お預かり金額"
                type="number"
                value={receivedAmount}
                onChange={(e) => setReceivedAmount(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">¥</InputAdornment>
                  ),
                }}
                sx={{ mb: 2 }}
              />

              {receivedAmount &&
                parseFloat(receivedAmount) >= selectedOrder.total_amount && (
                  <Alert severity="success" sx={{ mb: 2 }}>
                    <Typography variant="h6">
                      お釣り: ¥{calculateChange().toLocaleString()}
                    </Typography>
                  </Alert>
                )}

              {receivedAmount &&
                parseFloat(receivedAmount) < selectedOrder.total_amount && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    <Typography variant="body1">
                      金額が不足しています
                    </Typography>
                  </Alert>
                )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPaymentDialog(false)}>キャンセル</Button>
          <Button
            variant="contained"
            onClick={completePayment}
            disabled={
              !receivedAmount ||
              !selectedOrder ||
              parseFloat(receivedAmount) < selectedOrder.total_amount
            }
            startIcon={<CheckCircleIcon />}
          >
            支払い完了
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default PaymentPage;
