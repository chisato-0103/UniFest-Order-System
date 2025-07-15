// 🎫 お客様専用の注文状況確認・QRコード表示ページ
// 注文番号を入力することで、いつでもQRコードと注文状況を確認できます
// 個人情報は一切保存せず、注文番号のみで管理します

import React, { useState, useEffect } from "react";
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Alert,
  Chip,
  Paper,
  Divider,
  CircularProgress,
} from "@mui/material";
import {
  QrCode as QrCodeIcon,
  Search as SearchIcon,
  Restaurant as RestaurantIcon,
  AccessTime as TimeIcon,
  Payment as PaymentIcon,
  LocalShipping as DeliveryIcon,
  Refresh as RefreshIcon,
} from "@mui/icons-material";
import * as QRCode from "qrcode";
import type { Order } from "../types";
import { OrderService } from "../services/apiService";

interface QRCodeData {
  orderNumber: string;
  orderId: string;
  timestamp: string;
}

function CustomerStatusPage() {
  const [orderNumber, setOrderNumber] = useState("");
  const [order, setOrder] = useState<Order | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [lastSearched, setLastSearched] = useState("");

  // URLパラメーターから注文番号を取得（QRコードアクセス用）
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const orderParam = urlParams.get("order");
    if (orderParam) {
      setOrderNumber(orderParam);
      // handleSearchを直接呼び出す代わりに、setOrderNumberと同時に検索処理を実行
      const searchOrder = async () => {
        await handleSearch(orderParam);
      };
      searchOrder();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 初回のみ実行

  // 注文検索
  const handleSearch = async (searchOrderNumber?: string) => {
    const targetOrderNumber = searchOrderNumber || orderNumber;
    if (!targetOrderNumber || targetOrderNumber.length !== 4) {
      setError("4桁の注文番号を入力してください");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // 注文情報を取得
      const orders = await OrderService.getOrders();
      const foundOrder = orders.find(
        (o) => o.order_number === targetOrderNumber
      );

      if (!foundOrder) {
        setError("該当する注文が見つかりません");
        setOrder(null);
        setQrCodeUrl("");
        return;
      }

      setOrder(foundOrder);
      setLastSearched(targetOrderNumber);

      // QRコードデータを生成
      const qrData: QRCodeData = {
        orderNumber: foundOrder.order_number,
        orderId: foundOrder.order_id || foundOrder.id,
        timestamp: new Date().toISOString(),
      };

      // QRコードを生成
      const qrCodeDataUrl = await QRCode.toDataURL(JSON.stringify(qrData), {
        width: 200,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
      });

      setQrCodeUrl(qrCodeDataUrl);

      // URLを更新（ブックマーク可能にする）
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.set("order", targetOrderNumber);
      window.history.replaceState({}, "", newUrl.toString());
    } catch (err) {
      console.error("注文検索エラー:", err);
      setError("注文情報の取得に失敗しました。しばらく後にお試しください。");
    } finally {
      setLoading(false);
    }
  };

  // 注文状況の更新
  const handleRefresh = () => {
    if (lastSearched) {
      handleSearch(lastSearched);
    }
  };

  // ステータス表示用の色とテキスト
  const getStatusInfo = (status: string) => {
    switch (status) {
      case "注文受付":
      case "調理待ち":
        return { color: "warning", text: "調理待ち", icon: <TimeIcon /> };
      case "調理中":
        return { color: "info", text: "調理中", icon: <RestaurantIcon /> };
      case "調理完了":
        return { color: "success", text: "調理完了", icon: <RestaurantIcon /> };
      case "受け渡し完了":
        return { color: "success", text: "お渡し済み", icon: <DeliveryIcon /> };
      default:
        return { color: "default", text: status, icon: <TimeIcon /> };
    }
  };

  // 支払い状況の色とテキスト
  const getPaymentInfo = (status: string) => {
    switch (status) {
      case "paid":
      case "支払い済み":
        return { color: "success", text: "支払い済み" };
      case "pending":
      case "支払い中":
        return { color: "warning", text: "支払い中" };
      case "unpaid":
      case "未払い":
        return { color: "error", text: "未払い" };
      default:
        return { color: "default", text: status };
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: { xs: 2, sm: 4 } }}>
      {/* ヘッダー */}
      <Paper
        elevation={2}
        sx={{
          p: { xs: 2, sm: 3 },
          mb: { xs: 2, sm: 3 },
          borderRadius: { xs: 2, sm: 3 },
        }}
      >
        <Box sx={{ textAlign: "center" }}>
          <Typography
            variant="h4"
            component="h1"
            gutterBottom
            sx={{
              fontSize: { xs: "1.5rem", sm: "2rem" },
              fontWeight: 700,
              color: "primary.main",
            }}
          >
            <QrCodeIcon sx={{ mr: 1, verticalAlign: "middle" }} />
            注文状況確認
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ fontSize: { xs: "0.95rem", sm: "1rem" } }}
          >
            注文番号を入力して、ご注文の状況とQRコードを確認できます
          </Typography>
        </Box>
      </Paper>

      {/* 注文番号入力 */}
      <Card sx={{ mb: { xs: 2, sm: 3 } }}>
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          <Typography
            variant="h6"
            gutterBottom
            sx={{ fontSize: { xs: "1.1rem", sm: "1.25rem" } }}
          >
            注文番号を入力
          </Typography>
          <Box sx={{ display: "flex", gap: { xs: 1, sm: 2 }, alignItems: "end" }}>
            <TextField
              label="注文番号（4桁）"
              value={orderNumber}
              onChange={(e) => {
                const value = e.target.value.replace(/[^0-9]/g, "");
                if (value.length <= 4) {
                  setOrderNumber(value);
                }
              }}
              placeholder="例: 0001"
              fullWidth
              sx={{
                "& .MuiInputBase-input": {
                  fontSize: { xs: "1.2rem", sm: "1.4rem" },
                  textAlign: "center",
                  letterSpacing: "0.3em",
                },
              }}
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  handleSearch();
                }
              }}
            />
            <Button
              variant="contained"
              onClick={() => handleSearch()}
              disabled={loading || orderNumber.length !== 4}
              sx={{
                minWidth: { xs: 100, sm: 120 },
                py: { xs: 1.5, sm: 2 },
                fontSize: { xs: "0.95rem", sm: "1rem" },
              }}
            >
              {loading ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                <>
                  <SearchIcon sx={{ mr: 0.5 }} />
                  検索
                </>
              )}
            </Button>
          </Box>
          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* 注文情報表示 */}
      {order && (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
            gap: { xs: 2, sm: 3 },
          }}
        >
          {/* QRコード表示 */}
          <Box>
            <Card>
              <CardContent sx={{ p: { xs: 2, sm: 3 }, textAlign: "center" }}>
                <Typography
                  variant="h6"
                  gutterBottom
                  sx={{ fontSize: { xs: "1.1rem", sm: "1.25rem" } }}
                >
                  あなたのQRコード
                </Typography>
                {qrCodeUrl && (
                  <Box sx={{ mb: 2 }}>
                    <img
                      src={qrCodeUrl}
                      alt="注文QRコード"
                      style={{
                        width: "100%",
                        maxWidth: "200px",
                        height: "auto",
                      }}
                    />
                  </Box>
                )}
                <Typography
                  variant="h5"
                  sx={{
                    fontSize: { xs: "1.5rem", sm: "2rem" },
                    fontWeight: 700,
                    color: "primary.main",
                    letterSpacing: "0.2em",
                    mb: 1,
                  }}
                >
                  {order.order_number}
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ fontSize: { xs: "0.9rem", sm: "1rem" } }}
                >
                  受け渡し時にこの画面をスタッフにお見せください
                </Typography>
                <Alert
                  severity="info"
                  sx={{
                    mt: 2,
                    textAlign: "left",
                    fontSize: { xs: "0.85rem", sm: "0.95rem" },
                  }}
                >
                  このページをブックマークしておくと、いつでもQRコードを確認できます
                </Alert>
              </CardContent>
            </Card>
          </Box>

          {/* 注文詳細情報 */}
          <Box>
            <Card>
              <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 2,
                  }}
                >
                  <Typography
                    variant="h6"
                    sx={{ fontSize: { xs: "1.1rem", sm: "1.25rem" } }}
                  >
                    注文詳細
                  </Typography>
                  <Button
                    size="small"
                    onClick={handleRefresh}
                    disabled={loading}
                    sx={{ fontSize: { xs: "0.85rem", sm: "0.95rem" } }}
                  >
                    <RefreshIcon sx={{ mr: 0.5, fontSize: 18 }} />
                    更新
                  </Button>
                </Box>

                {/* 調理状況 */}
                <Box sx={{ mb: 2 }}>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    gutterBottom
                    sx={{ fontSize: { xs: "0.9rem", sm: "1rem" } }}
                  >
                    調理状況
                  </Typography>
                  <Chip
                    label={getStatusInfo(order.status || "").text}
                    color={getStatusInfo(order.status || "").color as "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning"}
                    icon={getStatusInfo(order.status || "").icon}
                    sx={{
                      fontSize: { xs: "0.9rem", sm: "1rem" },
                      height: { xs: 32, sm: 36 },
                    }}
                  />
                </Box>

                {/* 支払い状況 */}
                <Box sx={{ mb: 2 }}>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    gutterBottom
                    sx={{ fontSize: { xs: "0.9rem", sm: "1rem" } }}
                  >
                    支払い状況
                  </Typography>
                  <Chip
                    label={getPaymentInfo(order.payment_status || "").text}
                    color={getPaymentInfo(order.payment_status || "").color as "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning"}
                    icon={<PaymentIcon />}
                    sx={{
                      fontSize: { xs: "0.9rem", sm: "1rem" },
                      height: { xs: 32, sm: 36 },
                    }}
                  />
                </Box>

                <Divider sx={{ my: 2 }} />

                {/* 注文内容 */}
                <Box sx={{ mb: 2 }}>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    gutterBottom
                    sx={{ fontSize: { xs: "0.9rem", sm: "1rem" } }}
                  >
                    ご注文内容
                  </Typography>
                  {order.items?.map((item, index) => (
                    <Typography
                      key={index}
                      variant="body2"
                      sx={{
                        fontSize: { xs: "0.95rem", sm: "1.05rem" },
                        mb: 0.5,
                      }}
                    >
                      • {item.product_name || item.name} × {item.quantity}
                    </Typography>
                  ))}
                </Box>

                {/* 合計金額 */}
                <Box>
                  <Typography
                    variant="h6"
                    color="primary"
                    sx={{
                      fontSize: { xs: "1.2rem", sm: "1.4rem" },
                      fontWeight: 600,
                    }}
                  >
                    合計: ¥{(order.total_amount || order.total || 0).toLocaleString()}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ fontSize: { xs: "0.85rem", sm: "0.95rem" } }}
                  >
                    注文日時: {order.created_at ? new Date(order.created_at).toLocaleString() : "不明"}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Box>
        </Box>
      )}

      {/* 使い方ガイド */}
      {!order && (
        <Card>
          <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
            <Typography
              variant="h6"
              gutterBottom
              sx={{ fontSize: { xs: "1.1rem", sm: "1.25rem" } }}
            >
              使い方
            </Typography>
            <Box sx={{ pl: 2 }}>
              <Typography
                variant="body2"
                sx={{
                  fontSize: { xs: "0.95rem", sm: "1.05rem" },
                  mb: 1,
                }}
              >
                1. 注文完了時にお渡しした4桁の注文番号を入力
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  fontSize: { xs: "0.95rem", sm: "1.05rem" },
                  mb: 1,
                }}
              >
                2. 検索ボタンを押してQRコードを表示
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  fontSize: { xs: "0.95rem", sm: "1.05rem" },
                  mb: 1,
                }}
              >
                3. 調理完了後、QRコードを店舗スタッフにお見せください
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  fontSize: { xs: "0.95rem", sm: "1.05rem" },
                }}
              >
                4. このページをブックマークすると、いつでも確認できます
              </Typography>
            </Box>
          </CardContent>
        </Card>
      )}
    </Container>
  );
}

export default CustomerStatusPage;