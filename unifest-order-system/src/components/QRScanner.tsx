import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Paper,
  CircularProgress,
} from "@mui/material";
import {
  QrCodeScanner as QrIcon,
  CameraAlt as CameraIcon,
  Close as CloseIcon,
} from "@mui/icons-material";

interface QRScannerProps {
  open: boolean;
  onClose: () => void;
  onScan: (data: string) => void;
  title?: string;
}

const QRScanner: React.FC<QRScannerProps> = ({
  open,
  onClose,
  onScan,
  title = "QRコードをスキャン",
}) => {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string>("");
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const scannerRef = useRef<HTMLDivElement>(null);
  const html5QrCodeScannerRef = useRef<{
    render: (
      successCallback: (decodedText: string) => void,
      errorCallback: (error: unknown) => void
    ) => void;
    clear: () => void;
  } | null>(null);
  const scannerId = `qr-scanner-${Date.now()}`;

  const stopScanning = useCallback(() => {
    setIsScanning(false);

    if (html5QrCodeScannerRef.current) {
      try {
        html5QrCodeScannerRef.current.clear();
        html5QrCodeScannerRef.current = null;
      } catch (error) {
        console.warn("QRスキャナー停止エラー:", error);
      }
    }
  }, []);

  const startScanning = useCallback(async () => {
    try {
      setError("");
      setIsScanning(true);
      setHasPermission(true);

      // 少し待ってからスキャナーを初期化（DOM要素が確実に存在するように）
      await new Promise(resolve => setTimeout(resolve, 100));

      // html5-qrcode を動的にインポートして使用
      const { Html5QrcodeScanner } = await import("html5-qrcode");

      const scannerElement = document.getElementById(scannerId);
      if (scannerElement && !html5QrCodeScannerRef.current) {
        const config = {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
          experimentalFeatures: {
            useBarCodeDetectorIfSupported: true
          }
        };

        html5QrCodeScannerRef.current = new Html5QrcodeScanner(
          scannerId,
          config,
          false
        );

        html5QrCodeScannerRef.current.render(
          (decodedText: string) => {
            console.log("QRコード読み取り成功:", decodedText);
            onScan(decodedText);
            stopScanning();
            onClose();
          },
          (error: unknown) => {
            // エラーログを出力するが、UIには表示しない（継続的にスキャンするため）
            console.warn("QRスキャンエラー:", error);
          }
        );
      }
    } catch (err) {
      console.error("QRスキャナー初期化エラー:", err);
      setHasPermission(false);
      setError(
        "カメラにアクセスできません。ブラウザの設定でカメラの許可を確認してください。"
      );
      setIsScanning(false);
    }
  }, [onScan, onClose, stopScanning]);

  useEffect(() => {
    if (open) {
      startScanning();
    } else {
      stopScanning();
    }

    return () => {
      stopScanning();
    };
  }, [open, startScanning, stopScanning]);

  const handleRetry = () => {
    setError("");
    setHasPermission(null);
    startScanning();
  };

  const handleManualInput = () => {
    // 手動入力モードに切り替え
    const manualOrderNumber = prompt("注文番号を入力してください:");
    if (manualOrderNumber) {
      // 注文番号からQRコードデータを生成
      const qrData = JSON.stringify({
        type: "pickup",
        orderNumber: manualOrderNumber,
        timestamp: new Date().toISOString(),
      });
      onScan(qrData);
      onClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { bgcolor: "background.default" },
      }}
    >
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <QrIcon />
        {title}
      </DialogTitle>

      <DialogContent>
        <Box sx={{ textAlign: "center" }}>
          {error ? (
            // エラー表示
            <Box>
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
              <Button
                variant="contained"
                onClick={handleRetry}
                startIcon={<CameraIcon />}
                sx={{ mb: 2 }}
              >
                再試行
              </Button>
            </Box>
          ) : hasPermission === false ? (
            // カメラ許可が拒否された場合
            <Box>
              <Alert severity="warning" sx={{ mb: 2 }}>
                カメラの許可が必要です。ブラウザの設定でカメラへのアクセスを許可してください。
              </Alert>
              <Button
                variant="contained"
                onClick={handleRetry}
                startIcon={<CameraIcon />}
              >
                カメラを許可
              </Button>
            </Box>
          ) : (
            // QRスキャナー表示エリア
            <Box>
              <Paper
                elevation={3}
                sx={{
                  p: 2,
                  mb: 2,
                  bgcolor: "grey.50",
                  minHeight: 350,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <div
                  id={scannerId}
                  ref={scannerRef}
                  style={{ width: "100%", maxWidth: "400px" }}
                />

                {/* ローディング表示 */}
                {isScanning && !scannerRef.current?.querySelector("video") && (
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 2,
                      p: 3,
                    }}
                  >
                    <CircularProgress size={40} />
                    <Typography variant="body2" color="text.secondary">
                      カメラを初期化中...
                    </Typography>
                  </Box>
                )}
              </Paper>

              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                QRコードをカメラに向けてください
              </Typography>
            </Box>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ justifyContent: "space-between" }}>
        <Button onClick={handleManualInput} variant="outlined" size="small">
          手動入力
        </Button>
        <Button onClick={onClose} variant="contained" startIcon={<CloseIcon />}>
          閉じる
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default QRScanner;
