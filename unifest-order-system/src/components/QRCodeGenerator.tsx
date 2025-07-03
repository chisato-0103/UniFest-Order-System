import React from "react";
import QRCode from "qrcode";
import { Box, Paper, Typography, Button } from "@mui/material";
import {
  QrCodeScanner as QrIcon,
  Download as DownloadIcon,
} from "@mui/icons-material";

interface QRCodeGeneratorProps {
  orderNumber: string;
  baseUrl?: string;
  size?: number;
  showDownload?: boolean;
}

const QRCodeGenerator: React.FC<QRCodeGeneratorProps> = ({
  orderNumber,
  baseUrl = window.location.origin,
  size = 200,
  showDownload = true,
}) => {
  const [qrCodeUrl, setQrCodeUrl] = React.useState<string>("");

  // 顧客状況確認ページのURL
  const statusUrl = `${baseUrl}/customer-status?order=${orderNumber}`;

  React.useEffect(() => {
    const generateQRCode = async () => {
      try {
        const url = await QRCode.toDataURL(statusUrl, {
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
      }
    };

    generateQRCode();
  }, [statusUrl, size]);

  const handleDownload = () => {
    if (qrCodeUrl) {
      const link = document.createElement("a");
      link.href = qrCodeUrl;
      link.download = `order-${orderNumber}-qr.png`;
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
          注文状況確認QRコード
        </Typography>
        <Typography variant="body2" color="text.secondary">
          注文番号: {orderNumber}
        </Typography>
      </Box>

      {qrCodeUrl && (
        <Box sx={{ mb: 2 }}>
          <img
            src={qrCodeUrl}
            alt={`注文番号 ${orderNumber} の状況確認QRコード`}
            style={{
              border: "1px solid #e0e0e0",
              borderRadius: "8px",
            }}
          />
        </Box>
      )}

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        QRコードをスキャンして注文状況を確認できます
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
