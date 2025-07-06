import { useState, useEffect } from "react";
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  Chip,
  Alert,
  Badge,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  AppBar,
  Toolbar,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  InputAdornment,
  LinearProgress,
} from "@mui/material";
import {
  Payment as PaymentIcon,
  Search as SearchIcon,
  AttachMoney as MoneyIcon,
  Refresh as RefreshIcon,
} from "@mui/icons-material";
import type { Order, PaymentStatus, OrderStatus } from "../types";

function PaymentPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [change, setChange] = useState(0);

  // APIから注文データを取得
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
      console.error("支払いデータ取得エラー:", err);
      const errorMessage =
        err instanceof Error ? err.message : "データの取得に失敗しました";
      setError(errorMessage);
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

  // 支払い処理
  const handlePayment = async () => {
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
            payment_status: "paid",
          }),
        }
      );

      if (!response.ok) {
        throw new Error("支払い処理に失敗しました");
      }

      // ローカル状態を更新
      setOrders((prev) =>
        prev.map((order) =>
          order.order_id === selectedOrder.order_id
            ? { ...order, payment_status: "paid" as PaymentStatus }
            : order
        )
      );

      setPaymentDialogOpen(false);
      setSelectedOrder(null);
      setPaymentAmount("");
      setChange(0);
    } catch (err: unknown) {
      console.error("支払い処理エラー:", err);
      const errorMessage =
        err instanceof Error ? err.message : "支払い処理に失敗しました";
      setError(errorMessage);
    }
  };

  // 支払いダイアログを開く
  const openPaymentDialog = (order: Order) => {
    setSelectedOrder(order);
    setPaymentAmount(order.total_amount.toString());
    setPaymentDialogOpen(true);
  };

  // おつりを計算
  const calculateChange = (amount: string) => {
    if (!selectedOrder || !amount) return 0;
    return Math.max(0, parseFloat(amount) - selectedOrder.total_amount);
  };

  // 検索フィルター
  const filteredOrders = orders.filter((order) => {
    if (!searchTerm) return true;

    return (
      order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.items.some((item) =>
        item.product_name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  });

  // 未払い注文のみフィルター
  const unpaidOrders = filteredOrders.filter(
    (order) =>
      order.payment_status === "unpaid" || order.payment_status === "pending"
  );

  const getStatusColor = (status: PaymentStatus) => {
    switch (status) {
      case "paid":
        return "success";
      case "unpaid":
        return "error";
      case "pending":
        return "warning";
      default:
        return "default";
    }
  };

  const getStatusText = (status: PaymentStatus) => {
    switch (status) {
      case "paid":
        return "支払い済み";
      case "unpaid":
        return "未払い";
      case "pending":
        return "保留中";
      default:
        return status;
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <AppBar position="static" color="default" sx={{ mb: 3 }}>
        <Toolbar>
          <PaymentIcon sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            支払い管理
          </Typography>
          <Badge
            badgeContent={unpaidOrders.length}
            color="error"
            sx={{ mr: 2 }}
          >
            <Chip label="未払い" />
          </Badge>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchOrders}
            disabled={loading}
            size="small"
          >
            更新
          </Button>
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
          <LinearProgress />
        </Box>
      )}

      {/* 検索フィールド */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <TextField
            fullWidth
            placeholder="注文番号や商品名で検索..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
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

      {/* 注文テーブル */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>注文番号</TableCell>
              <TableCell>商品</TableCell>
              <TableCell align="right">金額</TableCell>
              <TableCell>支払い状況</TableCell>
              <TableCell>注文時刻</TableCell>
              <TableCell align="center">操作</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {unpaidOrders.map((order) => (
              <TableRow key={order.order_id}>
                <TableCell>
                  <Typography variant="body2" fontWeight="bold">
                    {order.order_number}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Box>
                    {order.items.map((item, index) => (
                      <Typography key={index} variant="body2">
                        {item.product_name} × {item.quantity}
                      </Typography>
                    ))}
                  </Box>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="h6" color="primary">
                    ¥{order.total_amount.toLocaleString()}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={getStatusText(order.payment_status)}
                    color={getStatusColor(order.payment_status)}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {new Date(order.created_at).toLocaleString()}
                  </Typography>
                </TableCell>
                <TableCell align="center">
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<MoneyIcon />}
                    onClick={() => openPaymentDialog(order)}
                    disabled={order.payment_status === "paid"}
                    size="small"
                  >
                    支払い
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {unpaidOrders.length === 0 && !loading && (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <Typography
                    variant="body1"
                    color="text.secondary"
                    sx={{ py: 4 }}
                  >
                    {searchTerm
                      ? "検索条件に一致する未払い注文がありません"
                      : "未払い注文がありません"}
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* 支払いダイアログ */}
      <Dialog
        open={paymentDialogOpen}
        onClose={() => setPaymentDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center">
            <PaymentIcon sx={{ mr: 1 }} />
            支払い処理
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedOrder && (
            <Box>
              <Typography variant="h6" gutterBottom>
                注文番号: {selectedOrder.order_number}
              </Typography>

              <Divider sx={{ my: 2 }} />

              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle1" gutterBottom>
                  注文内容:
                </Typography>
                {selectedOrder.items.map((item, index) => (
                  <Typography key={index} variant="body2">
                    {item.product_name} × {item.quantity} = ¥{item.total_price}
                  </Typography>
                ))}
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="h6" color="primary">
                  合計金額: ¥{selectedOrder.total_amount.toLocaleString()}
                </Typography>
              </Box>

              <TextField
                fullWidth
                label="受取金額"
                type="number"
                value={paymentAmount}
                onChange={(e) => {
                  setPaymentAmount(e.target.value);
                  setChange(calculateChange(e.target.value));
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">¥</InputAdornment>
                  ),
                }}
                sx={{ mb: 2 }}
              />

              {change > 0 && (
                <Typography variant="h6" color="success.main">
                  おつり: ¥{change.toLocaleString()}
                </Typography>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPaymentDialogOpen(false)}>
            キャンセル
          </Button>
          <Button
            variant="contained"
            onClick={handlePayment}
            disabled={
              !paymentAmount ||
              parseFloat(paymentAmount) < (selectedOrder?.total_amount || 0)
            }
          >
            支払い完了
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default PaymentPage;
