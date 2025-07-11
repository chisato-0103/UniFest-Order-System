import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Chip,
  Paper,
  Container,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import type { SelectChangeEvent } from "@mui/material";
import {
  CheckCircle as CheckCircleIcon,
  Refresh as RefreshIcon,
  QrCodeScanner as QrIcon,
  Person as PersonIcon,
} from "@mui/icons-material";
import type { Order } from "../types";
import MockApi from "../services/mockApi";
import { OrderService } from "../services/apiService";

function DeliveryPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [deliveryDialogOpen, setDeliveryDialogOpen] = useState(false);
  const [qrScannerOpen, setQrScannerOpen] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [verificationMethod, setVerificationMethod] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 注文データ取得関数
  const fetchOrders = useCallback(async () => {
    setRefreshing(true);
    setError(null);
    try {
      // 本番環境かどうかでAPI切り替え
      if (process.env.NODE_ENV === "production") {
        const result = await OrderService.getOrders();
        setOrders(result);
      } else {
        const result = await MockApi.getOrders();
        setOrders(result.data);
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError("注文データの取得に失敗しました: " + err.message);
      } else {
        setError("注文データの取得に失敗しました");
      }
    } finally {
      setRefreshing(false);
    }
  }, []);

  // 初期データ設定
  useEffect(() => {
    fetchOrders();

    // 定期的にデータを更新
    const interval = setInterval(() => {
      console.log("📦 受け渡し画面: 注文データを自動更新中...");
      fetchOrders();
    }, 4000); // 4秒ごと

    // 他のタブからの更新通知を受信
    const handleDataUpdate = () => {
      console.log("🔔 受け渡し画面: 他のタブからの更新通知を受信");
      fetchOrders();
    };

    window.addEventListener("unifest-data-updated", handleDataUpdate);

    return () => {
      clearInterval(interval);
      window.removeEventListener("unifest-data-updated", handleDataUpdate);
    };
  }, [fetchOrders]);

  // 受け渡し処理
  const handleDelivery = async (orderId: string) => {
    try {
      setLoading(true);
      // API呼び出し
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setOrders((prev) => prev.filter((order) => order.id !== orderId));
      setDeliveryDialogOpen(false);
      setSelectedOrder(null);
      setCustomerName("");
      setCustomerPhone("");
      setVerificationMethod("");
    } catch (error) {
      console.error("受け渡し処理エラー:", error);
    } finally {
      setLoading(false);
    }
  };

  // QRコード読み取り処理
  const handleQRScan = (qrData: string) => {
    try {
      console.log("QRコード読み取り:", qrData);

      // QRコードデータを解析
      let orderInfo;
      try {
        orderInfo = JSON.parse(qrData);
      } catch {
        // JSONでない場合は注文番号として扱う
        orderInfo = { orderNumber: qrData };
      }

      // 注文番号で注文を検索
      const foundOrder = orders.find(
        (order) =>
          order.orderNumber === orderInfo.orderNumber ||
          order.order_number === orderInfo.orderNumber ||
          order.id === orderInfo.orderNumber
      );

      if (foundOrder) {
        setSelectedOrder(foundOrder);
        // QRコード読み取り成功時は自動的に受け渡し完了とする
        handleDelivery(foundOrder.id);
      } else {
        setError(`注文番号 ${orderInfo.orderNumber} が見つかりません。`);
      }
    } catch (error) {
      console.error("QRコード処理エラー:", error);
      setError("QRコードの読み取りに失敗しました。");
    }
  };

  // 手動確認ダイアログを開く
  const handleManualVerification = (order: Order) => {
    setSelectedOrder(order);
    setDeliveryDialogOpen(true);
  };

  // データ更新
  const handleRefresh = async () => {
    console.log("📦 受け渡し画面: 手動リフレッシュ実行");
    await fetchOrders();
  };

  return (
    <Box>
      {/* ナビゲーションバーはApp.tsxで共通表示 */}
      <Container maxWidth="lg" sx={{ py: 2 }}>
        <Paper elevation={3} sx={{ p: 3 }}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h4" gutterBottom>
              受け渡し管理
            </Typography>
            <Typography variant="body1" color="text.secondary">
              調理完了した注文の受け渡しを管理します
            </Typography>
          </Box>

          {/* 統計情報 */}
          <Box sx={{ mb: 3 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  受け渡し待ち
                </Typography>
                <Typography variant="h4" color="primary">
                  {orders.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  件
                </Typography>
              </CardContent>
            </Card>
          </Box>

          {/* エラー表示 */}
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {/* 受け渡し待ち注文一覧 */}
          <Box sx={{ mb: 3 }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 2,
              }}
            >
              <Typography variant="h6">受け渡し待ち注文</Typography>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={handleRefresh}
                disabled={refreshing}
              >
                更新
              </Button>
            </Box>

            {orders.length === 0 ? (
              <Alert severity="info" sx={{ mb: 2 }}>
                現在、受け渡し待ちの注文はありません。
              </Alert>
            ) : (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {orders.map((order) => (
                  <Card key={order.id}>
                    <CardContent>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          mb: 2,
                        }}
                      >
                        <Typography variant="h6">
                          注文番号: {order.orderNumber}
                        </Typography>
                        <Chip
                          label="受け渡し待ち"
                          color="success"
                          icon={<CheckCircleIcon />}
                        />
                      </Box>

                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          合計金額: ¥{order.total?.toLocaleString() || 0}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          注文時刻:{" "}
                          {order.createdAt
                            ? new Date(order.createdAt).toLocaleString()
                            : ""}
                        </Typography>
                      </Box>

                      <Box sx={{ display: "flex", gap: 1 }}>
                        <Button
                          variant="contained"
                          color="primary"
                          startIcon={<QrIcon />}
                          sx={{ flex: 1 }}
                          onClick={() => {
                            setSelectedOrder(order);
                            setQrScannerOpen(true);
                          }}
                        >
                          QRスキャン
                        </Button>
                        <Button
                          variant="outlined"
                          color="primary"
                          startIcon={<PersonIcon />}
                          sx={{ flex: 1 }}
                          onClick={() => handleManualVerification(order)}
                        >
                          手動確認
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            )}
          </Box>

          {/* 受け渡し確認ダイアログ */}
          {/* 手動確認ダイアログ */}
          <Dialog
            open={deliveryDialogOpen}
            onClose={() => setDeliveryDialogOpen(false)}
            maxWidth="md"
            fullWidth
          >
            <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <PersonIcon />
              手動本人確認
            </DialogTitle>
            <DialogContent>
              {selectedOrder && (
                <React.Fragment>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      合計金額: ¥{selectedOrder.total?.toLocaleString() || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      注文時刻:{" "}
                      {selectedOrder.createdAt
                        ? new Date(selectedOrder.createdAt).toLocaleString()
                        : ""}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mt: 1 }}
                    >
                      <span>
                        支払い状況:{" "}
                        {(() => {
                          switch (selectedOrder.payment_status) {
                            case "paid":
                            case "支払い済み":
                              return (
                                <Chip
                                  label="支払い済み"
                                  color="primary"
                                  size="small"
                                />
                              );
                            case "pending":
                            case "支払い中":
                              return (
                                <Chip
                                  label="支払い中"
                                  color="warning"
                                  size="small"
                                />
                              );
                            case "unpaid":
                            case "未払い":
                              return (
                                <Chip
                                  label="未払い"
                                  color="error"
                                  size="small"
                                />
                              );
                            case "refunded":
                            case "返金済み":
                              return (
                                <Chip
                                  label="返金済み"
                                  color="info"
                                  size="small"
                                />
                              );
                            default:
                              return (
                                <Chip
                                  label={selectedOrder.payment_status || "不明"}
                                  color="default"
                                  size="small"
                                />
                              );
                          }
                        })()}
                      </span>
                    </Typography>
                  </Box>
                  <TextField
                    label="お客様のお名前"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    fullWidth
                    sx={{ mb: 2 }}
                  />
                  <TextField
                    label="電話番号"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    fullWidth
                    sx={{ mb: 2 }}
                  />
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel>確認方法</InputLabel>
                    <Select
                      value={verificationMethod}
                      onChange={(e: SelectChangeEvent) =>
                        setVerificationMethod(e.target.value)
                      }
                    >
                      <MenuItem value="name">お名前</MenuItem>
                      <MenuItem value="phone">電話番号</MenuItem>
                      <MenuItem value="order_number">注文番号</MenuItem>
                    </Select>
                  </FormControl>
                </React.Fragment>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDeliveryDialogOpen(false)}>
                キャンセル
              </Button>
              <Button
                variant="contained"
                onClick={() =>
                  selectedOrder && handleDelivery(selectedOrder.id)
                }
                disabled={
                  loading ||
                  !customerName ||
                  !customerPhone ||
                  !verificationMethod
                }
              >
                受け渡し完了
              </Button>
            </DialogActions>
          </Dialog>

          {/* QRスキャナーダイアログ */}
          <Dialog
            open={qrScannerOpen}
            onClose={() => setQrScannerOpen(false)}
            maxWidth="sm"
            fullWidth
          >
            <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <QrIcon />
              QRコードスキャン
            </DialogTitle>
            <DialogContent>
              <Box sx={{ textAlign: "center", py: 3 }}>
                <Paper
                  elevation={3}
                  sx={{
                    p: 4,
                    mb: 3,
                    bgcolor: "grey.50",
                    minHeight: 200,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <QrIcon sx={{ fontSize: 80, color: "primary.main", mb: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    QRコードをスキャン
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 3 }}
                  >
                    お客様のQRコードをカメラに向けてください
                  </Typography>

                  {/* 仮実装：手動入力で代用 */}
                  <Button
                    variant="contained"
                    onClick={() => {
                      const qrData = prompt(
                        "QRコードデータを入力してください（テスト用）:"
                      );
                      if (qrData) {
                        handleQRScan(qrData);
                        setQrScannerOpen(false);
                      }
                    }}
                  >
                    テスト入力
                  </Button>
                </Paper>

                <Alert severity="info" sx={{ textAlign: "left" }}>
                  <Typography variant="body2">
                    <strong>使用方法:</strong>
                    <br />
                    1. お客様にQRコードを表示してもらう
                    <br />
                    2. カメラでQRコードを読み取る
                    <br />
                    3. 自動的に受け渡し処理が完了します
                  </Typography>
                </Alert>
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setQrScannerOpen(false)}>
                キャンセル
              </Button>
            </DialogActions>
          </Dialog>
        </Paper>
      </Container>
    </Box>
  );
}

export default DeliveryPage;
