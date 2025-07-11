import React, { useState } from "react";
import { Box, Typography, Paper, Alert, Button } from "@mui/material";
import { QrCodeScanner as QrIcon, CheckCircle as CheckIcon } from "@mui/icons-material";
import { useEffect } from "react";
// QrReaderは動的importで型エラー回避
import type { Order, OrderItem } from "../types";

// 受け渡し管理画面（QRコード読み取り→注文受け渡し）
const PickupPage: React.FC = () => {
  const [orderInfo, setOrderInfo] = useState<Order | null>(null);
  const [error, setError] = useState<string>("");
  const [confirmed, setConfirmed] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [QrReader, setQrReader] = useState<any>(null);

  useEffect(() => {
    import("react-qr-reader").then((mod) => setQrReader(mod.default));
  }, []);

  // QRコード読み取り時の処理
  const handleScan = (data: string | null) => {
    if (data) {
      try {
        const info: Order = JSON.parse(data);
        // order_number必須チェック
        if (!info.order_number || !info.items) {
          throw new Error("注文情報が不正です");
        }
        setOrderInfo(info);
        setError("");
      } catch {
        setOrderInfo(null);
        setError("QRコードの内容が不正です。正しい注文QRコードを提示してください。");
      }
    }
  };

  const handleError = (err: unknown) => {
    setError("QRコードの読み取りに失敗しました: " + String(err));
  };

  // 受け渡し確定処理（API連携は後で追加可能）
  const handleConfirm = () => {
    setConfirmed(true);
    // TODO: ここでAPIに受け渡し完了を通知する処理を追加
  };

  return (
    <Box sx={{ minHeight: "100vh", background: "#f8f9fa", py: 5 }}>
      <Paper elevation={3} sx={{ maxWidth: 480, mx: "auto", p: 4, borderRadius: 4 }}>
        <Box sx={{ textAlign: "center", mb: 3 }}>
          <QrIcon sx={{ fontSize: 48, color: "primary.main" }} />
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            受け渡し管理
          </Typography>
          <Typography variant="body1" color="text.secondary">
            お客様のQRコードをカメラで読み取ってください
          </Typography>
        </Box>

        {!orderInfo && !confirmed && QrReader && (
          <Box sx={{ mb: 2 }}>
            <QrReader
              delay={300}
              onError={handleError}
              onScan={handleScan}
              style={{ width: "100%" }}
            />
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
              合計金額: {orderInfo.total_amount ? `¥${orderInfo.total_amount}` : "-"}
            </Typography>
            <Typography variant="body2" gutterBottom>
              商品:
            </Typography>
            <ul>
              {orderInfo.items && orderInfo.items.map((item: OrderItem, idx: number) => {
                // product_nameが存在する場合はそれを優先
                const displayName = typeof item.product_name === "string" && item.product_name.length > 0
                  ? item.product_name
                  : item.name;
                return (
                  <li key={idx}>
                    {displayName} × {item.quantity}
                  </li>
                );
              })}
            </ul>
            <Button variant="contained" color="success" startIcon={<CheckIcon />} fullWidth sx={{ mt: 2 }} onClick={handleConfirm}>
              受け渡し完了
            </Button>
          </Box>
        )}

        {confirmed && (
          <Alert severity="success" sx={{ mt: 3 }}>
            <CheckIcon sx={{ mr: 1 }} />
            受け渡し処理が完了しました！
          </Alert>
        )}
      </Paper>
    </Box>
  );
};

export default PickupPage;
