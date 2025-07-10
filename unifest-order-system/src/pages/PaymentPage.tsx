// 🧰 Reactと画面の部品を持ってくる
import { useState, useEffect } from "react"; // Reactの基本機能
import { useSearchParams } from "react-router-dom"; // URLパラメーター取得
import {
  Container, // 画面全体を囲む容器
  Typography, // 文字表示用
  Box, // レイアウト用の箱
  Card, // カード型の表示
  CardContent, // カードの中身
  Button, // ボタン
  Chip, // 小さなタグ表示
  Alert, // 警告メッセージ
  Badge, // バッジ表示
  TextField, // 入力欄
  Dialog, // ポップアップ画面
  DialogTitle, // ポップアップのタイトル
  DialogContent, // ポップアップの中身
  DialogActions, // ポップアップのボタン
  AppBar, // 上部のバー
  Toolbar, // ツールバー
  Divider, // 区切り線
  Table, // 表
  TableBody, // 表の本体
  TableCell, // 表のセル
  TableContainer, // 表の容器
  TableHead, // 表のヘッダー
  TableRow, // 表の行
  Paper, // 紙のような背景
  InputAdornment, // 入力欄の装飾
  LinearProgress, // プログレスバー
} from "@mui/material";
import {
  Payment as PaymentIcon,
  Search as SearchIcon,
  AttachMoney as MoneyIcon,
  Refresh as RefreshIcon,
} from "@mui/icons-material";
import type { Order, PaymentStatus } from "../types";
import AdminNavigationBar from "../components/AdminNavigationBar";
import { OrderService, ApiError } from "../services/apiService"; // 統一API通信サービス

function PaymentPage() {
  const [searchParams] = useSearchParams(); // URLパラメーター取得機能
  const highlightOrderId = searchParams.get("order"); // URLから注文番号を取得

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [change, setChange] = useState(0);

  // 🌐 統一APIサービスから注文データを取得
  const fetchOrders = async () => {
    try {
      setError("");
      setLoading(true);

      // 統一APIサービスで注文データを取得
      const ordersData = await OrderService.getOrders();
      setOrders(ordersData);

      // 取得した注文データの中身を全て出力
      console.log("[DEBUG] /api/orders response:", ordersData);
      // payment_statusごとの件数も出力
      const statusCount = ordersData.reduce(
        (acc: Record<string, number>, o) => {
          const status = o.payment_status ?? "unknown";
          acc[status] = (acc[status] || 0) + 1;
          return acc;
        },
        {}
      );
      console.log("[DEBUG] payment_status count:", statusCount);
    } catch (err: unknown) {
      console.error("支払いデータ取得エラー:", err);

      let errorMessage = "データの取得に失敗しました";
      if (err instanceof ApiError) {
        errorMessage = err.message;
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // 初期データ取得と定期更新
  useEffect(() => {
    fetchOrders();

    // モックAPIのデータ変更を検知するイベントリスナー
    const handleDataChange = () => {
      fetchOrders();
    };

    window.addEventListener("unifest-data-updated", handleDataChange);

    const interval = setInterval(() => {
      fetchOrders();
    }, 5000); // 5秒ごとに更新

    return () => {
      clearInterval(interval);
      window.removeEventListener("unifest-data-updated", handleDataChange);
    };
  }, []);

  // 🎯 強調表示された注文に自動スクロール
  useEffect(() => {
    if (highlightOrderId && orders.length > 0 && !loading) {
      // 該当する注文が見つかったら少し遅延してスクロール
      setTimeout(() => {
        const targetOrder = orders.find(
          (order) =>
            order.order_number === highlightOrderId ||
            order.order_id === highlightOrderId ||
            order.id === highlightOrderId
        );

        if (targetOrder) {
          // 注文が見つかった場合は検索欄をクリアして該当注文を表示
          setSearchTerm("");

          // ページトップにスクロール（注文リストが見えるように）
          window.scrollTo({
            top: 300,
            behavior: "smooth",
          });
        }
      }, 1000);
    }
  }, [highlightOrderId, orders, loading]);

  // 支払い処理
  // 💳 支払い処理（統一APIサービス使用）
  const handlePayment = async () => {
    if (!selectedOrder) return;

    try {
      const orderTotal = selectedOrder.total_amount || selectedOrder.total || 0;
      const receivedAmount = parseFloat(paymentAmount) || orderTotal;

      // 統一APIサービスで支払い処理
      await OrderService.processPayment(selectedOrder.id, {
        paymentMethod: "cash",
        amount: orderTotal,
        receivedAmount: receivedAmount,
      });

      // ローカル状態を更新
      setOrders((prev) =>
        prev.map((order) =>
          order.id === selectedOrder.id
            ? { ...order, payment_status: "paid" as PaymentStatus }
            : order
        )
      );

      setPaymentDialogOpen(false);
      setSelectedOrder(null);
      setPaymentAmount("");
      setChange(0);

      console.log(`支払い完了: 注文${selectedOrder.orderNumber}`);
    } catch (err: unknown) {
      console.error("支払い処理エラー:", err);

      let errorMessage = "支払い処理に失敗しました";
      if (err instanceof ApiError) {
        errorMessage = `支払いエラー: ${err.message}`;
      } else if (err instanceof Error) {
        errorMessage = `支払いエラー: ${err.message}`;
      }

      setError(errorMessage);
    }
  };

  // 支払いダイアログを開く
  const openPaymentDialog = (order: Order) => {
    setSelectedOrder(order);
    const amount = order.total_amount || order.total || 0;
    setPaymentAmount(amount.toString());
    setPaymentDialogOpen(true);
  };

  // おつりを計算
  const calculateChange = (amount: string) => {
    if (!selectedOrder || !amount) return 0;
    const orderTotal = selectedOrder.total_amount || selectedOrder.total || 0;
    return Math.max(0, parseFloat(amount) - orderTotal);
  };

  // 検索フィルター
  const filteredOrders = orders.filter((order) => {
    if (!searchTerm) return true;

    return (
      order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.items.some((item) => {
        const productName = item.product_name || item.name || "";
        return productName.toLowerCase().includes(searchTerm.toLowerCase());
      })
    );
  });

  // 未払い注文のみフィルター
  const unpaidOrders = filteredOrders.filter(
    (order) =>
      order.payment_status === "unpaid" ||
      order.payment_status === "pending" ||
      order.payment_status === "未払い" ||
      order.payment_status === "支払い中"
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
    <Box>
      <AdminNavigationBar currentPage="支払い管理" />
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

        {/* 🎉 新しい注文の案内メッセージ */}
        {highlightOrderId && (
          <Alert
            severity="success"
            sx={{ mb: 2 }}
            onClose={() => {
              // URLパラメーターをクリア
              const url = new URL(window.location.href);
              url.searchParams.delete("order");
              window.history.replaceState({}, "", url.toString());
            }}
          >
            注文番号 <strong>{highlightOrderId}</strong> の注文が完了しました！
            下記リストで支払いを行ってください。
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
              {unpaidOrders.map((order) => {
                // 🎯 カートから来た注文番号と一致する場合は強調表示
                const isHighlighted =
                  highlightOrderId &&
                  (order.order_number === highlightOrderId ||
                    order.order_id === highlightOrderId ||
                    order.id === highlightOrderId);

                return (
                  <TableRow
                    key={order.order_id}
                    sx={{
                      // 🌟 強調表示のスタイル
                      backgroundColor: isHighlighted ? "primary.50" : "inherit",
                      border: isHighlighted ? 2 : 0,
                      borderColor: isHighlighted
                        ? "primary.main"
                        : "transparent",
                      "&:hover": {
                        backgroundColor: isHighlighted
                          ? "primary.100"
                          : "action.hover",
                      },
                    }}
                  >
                    <TableCell>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <Typography variant="body2" fontWeight="bold">
                          {order.order_number}
                        </Typography>
                        {/* 🔥 新しい注文にはバッジを表示 */}
                        {isHighlighted && (
                          <Chip
                            label="新規"
                            size="small"
                            color="primary"
                            variant="filled"
                          />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box>
                        {order.items.map((item, index) => (
                          <Typography key={index} variant="body2">
                            {item.product_name || item.name || "商品名不明"} ×{" "}
                            {item.quantity}
                          </Typography>
                        ))}
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="h6" color="primary">
                        ¥
                        {(
                          order.total_amount ||
                          order.total ||
                          0
                        ).toLocaleString()}
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
                );
              })}
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
                      {item.product_name || item.name || "商品名不明"} ×{" "}
                      {item.quantity} = ¥
                      {item.total_price || item.totalPrice || 0}
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
    </Box>
  );
}

export default PaymentPage;
