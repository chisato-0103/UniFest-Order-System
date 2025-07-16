import React, { useState } from "react";
import { OrderService } from "../services/apiService";
import { Box, Typography, Paper, Alert, Button } from "@mui/material";
import {
  QrCodeScanner as QrIcon,
  CheckCircle as CheckIcon,
} from "@mui/icons-material";
import QRScanner from "../components/QRScanner";
import type { Order, OrderItem } from "../types";

// 受け渡し管理画面（QRコード読み取り→注文受け渡し）
const PickupPage: React.FC = () => {
  const [orderInfo, setOrderInfo] = useState<Order | null>(null);
  const [error, setError] = useState<string>("");
  const [confirmed, setConfirmed] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);

  // QRコード読み取り時の処理
  const handleScan = (data: string) => {
    try {
      const info: Order = JSON.parse(data);
      // order_number必須チェック
      if (!info.order_number || !info.items) {
        throw new Error("注文情報が不正です");
      }
      setOrderInfo(info);
      setError("");
      setScannerOpen(false);
    } catch {
      setOrderInfo(null);
      setError(
        "QRコードの内容が不正です。正しい注文QRコードを提示してください。"
      );
    }
  };

  // 受け渡し確定処理
  const handleConfirm = async () => {
    if (!orderInfo?.order_number) return;
    setConfirmed(false);
    setError("");
    try {
      // サーバーに受け渡し完了を通知（注文ステータスを「受け取り済み」に更新）
      await OrderService.updateOrderStatus(orderInfo.order_number, "受け取り済み");
      setConfirmed(true);
    } catch (err) {
      setError("受け渡し完了API通信に失敗しました: " + String(err));
      setConfirmed(false);
    }
  };

  // 新しいスキャンを開始
  const handleStartScan = () => {
    setOrderInfo(null);
    setError("");
    setConfirmed(false);
    setScannerOpen(true);
  };

  return (
    <Box sx={{ minHeight: "100vh", background: "#f8f9fa", py: 5 }}>
      <Paper
        elevation={3}
        sx={{ maxWidth: 480, mx: "auto", p: 4, borderRadius: 4 }}
      >
        <Box sx={{ textAlign: "center", mb: 3 }}>
          <QrIcon sx={{ fontSize: 48, color: "primary.main" }} />
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            受け渡し管理
          </Typography>
          <Typography variant="body1" color="text.secondary">
            お客様のQRコードをカメラで読み取ってください
          </Typography>
        </Box>

        {/* QRスキャナー開始ボタン */}
        {!orderInfo && !confirmed && (
          <Box sx={{ mb: 2, textAlign: "center" }}>
            <Button
              variant="contained"
              startIcon={<QrIcon />}
              onClick={handleStartScan}
              size="large"
              sx={{ py: 1.5, px: 3 }}
            >
              QRコードをスキャン
            </Button>
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {orderInfo && !confirmed && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="h6" color="primary" gutterBottom>
              注文番号: {orderInfo.order_number}
            </Typography>
            <Typography variant="body2" gutterBottom>
              合計金額:{" "}
              {orderInfo.total_amount ? `¥${orderInfo.total_amount}` : "-"}
            </Typography>
            <Typography variant="body2" gutterBottom>
              商品:
            </Typography>
            <ul>
              {orderInfo.items &&
                orderInfo.items.map((item: OrderItem, idx: number) => {
                  // product_nameが存在する場合はそれを優先
                  const displayName =
                    typeof item.product_name === "string" &&
                    item.product_name.length > 0
                      ? item.product_name
                      : item.name;
                  return (
                    <li key={idx}>
                      {displayName} × {item.quantity}
                    </li>
                  );
                })}
            </ul>
            <Button
              variant="contained"
              color="success"
              startIcon={<CheckIcon />}
              fullWidth
              sx={{ mt: 2 }}
              onClick={handleConfirm}
            >
              受け渡し完了
            </Button>
          </Box>
        )}

        {confirmed && (
          <Box sx={{ textAlign: "center" }}>
            <Alert severity="success" sx={{ mb: 2 }}>
              <CheckIcon sx={{ mr: 1 }} />
              受け渡し処理が完了しました！
            </Alert>
            <Button
              variant="outlined"
              onClick={handleStartScan}
              startIcon={<QrIcon />}
            >
              次の注文をスキャン
            </Button>
          </Box>
        )}

        {/* QRスキャナーコンポーネント */}
        <QRScanner
          open={scannerOpen}
          onClose={() => setScannerOpen(false)}
          onScan={handleScan}
          title="注文QRコードをスキャン"
        />
      </Paper>
    </Box>
  );
};

export default PickupPage;
