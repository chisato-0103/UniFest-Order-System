import React from "react";
import QRCode from "qrcode";
import { Box, Paper, Typography, Button, Alert } from "@mui/material";
import {
  QrCodeScanner as QrIcon,
  Download as DownloadIcon,
} from "@mui/icons-material";

import type { Order } from "../types";

interface QRCodeGeneratorProps {
  order: Order;
  size?: number;
  showDownload?: boolean;
}

const QRCodeGenerator: React.FC<QRCodeGeneratorProps> = ({
  order,
  size = 200,
  showDownload = true,
}) => {
  const [qrCodeUrl, setQrCodeUrl] = React.useState<string>("");

  // 注文情報をJSON化（必須フィールドチェック）
  const orderNumber = order?.order_number || order?.orderNumber;
  const isOrderValid =
    order &&
    orderNumber &&
    Array.isArray(order.items) &&
    order.items.length > 0;
  const orderJson = isOrderValid
    ? JSON.stringify({
        order_number: orderNumber,
        items: order.items,
        total: order.total,
        total_amount: order.total_amount,
        payment_method: order.payment_method,
        createdAt: order.createdAt,
        customer_id: order.customer_id,
        notes: order.notes,
      })
    : "";

  React.useEffect(() => {
    const generateQRCode = async () => {
      if (!isOrderValid) {
        setQrCodeUrl("");
        return;
      }
      try {
        const url = await QRCode.toDataURL(orderJson, {
          width: size,
          margin: 2,
          color: {
            dark: "#000000",
            light: "#FFFFFF",
          },
        });
        setQrCodeUrl(url);
      } catch (error) {
        console.error("QRコード生成エラー:", error);
        setQrCodeUrl("");
      }
    };
    generateQRCode();
  }, [orderJson, size, isOrderValid]);

  const handleDownload = () => {
    if (qrCodeUrl) {
      const link = document.createElement("a");
      link.href = qrCodeUrl;
      link.download = `order-${order.order_number}-qr.png`;
      link.click();
    }
  };

  return (
    <Paper
      elevation={2}
      sx={{
        p: 3,
        textAlign: "center",
        borderRadius: 2,
        border: "2px dashed #1976d2",
      }}
    >
      <Box sx={{ mb: 2 }}>
        <QrIcon sx={{ fontSize: 32, color: "primary.main", mb: 1 }} />
        <Typography variant="h6" color="primary" gutterBottom>
          注文情報QRコード
        </Typography>
        <Typography variant="body2" color="text.secondary">
          注文番号: {orderNumber}
        </Typography>
      </Box>

      {qrCodeUrl ? (
        <Box sx={{ mb: 2 }}>
          <img
            src={qrCodeUrl}
            alt={`注文番号 ${order.order_number} の注文情報QRコード`}
            style={{
              border: "1px solid #e0e0e0",
              borderRadius: "8px",
            }}
          />
        </Box>
      ) : (
        <Alert severity="warning" sx={{ mb: 2 }}>
          注文情報が不正なためQRコードを生成できません。
          <br />
          店舗スタッフにお声かけください。
        </Alert>
      )}

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        QRコードをスキャンして注文情報を確認できます
      </Typography>

      {showDownload && qrCodeUrl && (
        <Button
          variant="outlined"
          startIcon={<DownloadIcon />}
          onClick={handleDownload}
          size="small"
        >
          QRコードをダウンロード
        </Button>
      )}
    </Paper>
  );
};

export default QRCodeGenerator;
