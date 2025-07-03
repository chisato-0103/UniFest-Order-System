import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Divider,
  Chip,
  List,
  ListItem,
  ListItemText,
  Alert,
} from "@mui/material";
import {
  CheckCircle as CheckIcon,
  AccessTime as TimeIcon,
  Receipt as ReceiptIcon,
} from "@mui/icons-material";
import QRCodeGenerator from "./QRCodeGenerator";
import type { Order, OrderItem } from "../types";

interface OrderCompletionDialogProps {
  open: boolean;
  onClose: () => void;
  order: Order | null;
  estimatedTime: number; // 予想調理時間（分）
}

const OrderCompletionDialog: React.FC<OrderCompletionDialogProps> = ({
  open,
  onClose,
  order,
  estimatedTime,
}) => {
  if (!order) return null;

  const formatPrice = (price: number) => `¥${price.toLocaleString()}`;

  const getEstimatedReadyTime = () => {
    const now = new Date();
    const readyTime = new Date(now.getTime() + estimatedTime * 60 * 1000);
    return readyTime.toLocaleTimeString("ja-JP", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          overflow: "visible",
        },
      }}
    >
      <DialogTitle sx={{ textAlign: "center", pb: 1 }}>
        <CheckIcon sx={{ fontSize: 48, color: "success.main", mb: 1 }} />
        <Typography variant="h5" component="div" fontWeight="bold">
          ご注文ありがとうございます！
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ px: 3 }}>
        {/* 注文情報 */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
            <ReceiptIcon color="primary" />
            <Typography variant="h6" fontWeight="bold">
              注文詳細
            </Typography>
          </Box>

          <Box
            sx={{
              bgcolor: "grey.50",
              p: 2,
              borderRadius: 2,
              border: "1px solid",
              borderColor: "grey.300",
              mb: 2,
            }}
          >
            <Typography
              variant="h4"
              color="primary"
              fontWeight="bold"
              textAlign="center"
            >
              注文番号: {order.order_number}
            </Typography>
          </Box>

          <List dense>
            {order.items.map((item: OrderItem, index) => (
              <ListItem key={index} sx={{ px: 0 }}>
                <ListItemText
                  primary={
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <Typography variant="body1" fontWeight="medium">
                        {item.product_name} × {item.quantity}
                      </Typography>
                      <Typography variant="body1" fontWeight="bold">
                        {formatPrice(item.total_price)}
                      </Typography>
                    </Box>
                  }
                  secondary={
                    item.toppings &&
                    item.toppings.length > 0 && (
                      <Typography variant="body2" color="text.secondary">
                        トッピング:{" "}
                        {item.toppings.map((t) => t.topping_name).join(", ")}
                      </Typography>
                    )
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
            }}
          >
            <Typography variant="h6" fontWeight="bold">
              合計金額
            </Typography>
            <Typography variant="h6" fontWeight="bold" color="primary">
              {formatPrice(order.total_amount)}
            </Typography>
          </Box>
        </Box>

        {/* 予想時間 */}
        <Alert severity="info" sx={{ mb: 3 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <TimeIcon />
            <Box>
              <Typography variant="body1" fontWeight="medium">
                お渡し予定時刻: {getEstimatedReadyTime()}
              </Typography>
              <Typography variant="body2">
                約{estimatedTime}分でお渡し予定です
              </Typography>
            </Box>
          </Box>
        </Alert>

        {/* 注意事項 */}
        <Alert severity="warning" sx={{ mb: 3 }}>
          <Typography variant="body2">
            <strong>⚠️ 注意事項</strong>
            <br />
            • 商品は熱々の状態でお渡しします。やけどにご注意ください
            <br />
            • 調理状況により多少お時間をいただく場合があります
            <br />• お支払いは商品受け取り時にお願いします
          </Typography>
        </Alert>

        {/* QRコード */}
        <Box sx={{ mb: 2 }}>
          <QRCodeGenerator
            orderNumber={order.order_number}
            size={180}
            showDownload={false}
          />
        </Box>

        {/* ステータス */}
        <Box sx={{ textAlign: "center" }}>
          <Chip
            label={order.status}
            color="info"
            size="medium"
            sx={{ fontWeight: "bold", px: 2 }}
          />
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 1 }}>
        <Button
          onClick={onClose}
          variant="contained"
          fullWidth
          size="large"
          sx={{
            py: 1.5,
            fontSize: "1.1rem",
            fontWeight: "bold",
          }}
        >
          確認しました
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default OrderCompletionDialog;
