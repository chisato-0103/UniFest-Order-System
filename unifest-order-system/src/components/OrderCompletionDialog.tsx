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
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: { xs: 1.5, sm: 3 },
          overflow: "visible",
          boxShadow: "0 4px 24px rgba(80,80,180,0.12)",
          background: "linear-gradient(135deg, #fff 0%, #f8f9fa 100%)",
          p: { xs: 0.5, sm: 1.5 },
          m: { xs: 0.5, sm: 1.5 },
          width: { xs: "92vw", sm: "auto" },
          maxWidth: { xs: "92vw", sm: 400 },
        },
      }}
    >
      <DialogTitle sx={{ textAlign: "center", pb: 0.5 }}>
        <CheckIcon sx={{ fontSize: 36, color: "success.main", mb: 0.5 }} />
        <Typography
          variant="h6"
          component="div"
          fontWeight="bold"
          sx={{ fontSize: { xs: "1.05rem", sm: "1.15rem" } }}
        >
          ご注文ありがとうございます！
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ px: { xs: 1, sm: 2 } }}>
        {/* 注文情報 */}
        <Box sx={{ mb: { xs: 1.2, sm: 2 } }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.7, mb: 1 }}>
            <ReceiptIcon color="primary" sx={{ fontSize: 22 }} />
            <Typography
              variant="subtitle1"
              fontWeight="bold"
              sx={{ fontSize: { xs: "1rem", sm: "1.08rem" } }}
            >
              注文詳細
            </Typography>
          </Box>

          <Box
            sx={{
              bgcolor: "grey.50",
              p: 1,
              borderRadius: 1.2,
              border: "1px solid",
              borderColor: "grey.300",
              mb: 1.2,
            }}
          >
            <Typography
              variant="subtitle1"
              color="primary"
              fontWeight="bold"
              textAlign="center"
              sx={{ fontSize: { xs: "1rem", sm: "1.08rem" } }}
            >
              注文番号: {order.order_number || order.orderNumber}
            </Typography>
          </Box>

          <List dense sx={{ mb: 0.5 }}>
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
                      <Typography
                        variant="body2"
                        fontWeight="medium"
                        sx={{ fontSize: { xs: "0.95rem", sm: "1rem" } }}
                      >
                        {(
                          item as unknown as {
                            product_name?: string;
                            name?: string;
                          }
                        ).product_name || (item as OrderItem).name}{" "}
                        × {item.quantity}
                      </Typography>
                      <Typography
                        variant="body2"
                        fontWeight="bold"
                        sx={{ fontSize: { xs: "0.95rem", sm: "1rem" } }}
                      >
                        {formatPrice(
                          (
                            item as unknown as {
                              total_price?: number;
                              totalPrice?: number;
                            }
                          ).total_price || (item as OrderItem).totalPrice
                        )}
                      </Typography>
                    </Box>
                  }
                  secondary={
                    item.toppings &&
                    item.toppings.length > 0 && (
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ fontSize: { xs: "0.85rem", sm: "0.95rem" } }}
                      >
                        トッピング:{" "}
                        {item.toppings
                          .map(
                            (t) =>
                              (
                                t as unknown as {
                                  topping_name?: string;
                                  name?: string;
                                }
                              ).topping_name ||
                              (t as unknown as { name: string }).name
                          )
                          .join(", ")}
                      </Typography>
                    )
                  }
                />
              </ListItem>
            ))}
          </List>

          <Divider sx={{ my: { xs: 0.7, sm: 1.2 } }} />

          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Typography
              variant="body2"
              fontWeight="bold"
              sx={{ fontSize: { xs: "0.95rem", sm: "1rem" } }}
            >
              合計金額
            </Typography>
            <Typography
              variant="body2"
              fontWeight="bold"
              color="primary"
              sx={{ fontSize: { xs: "0.95rem", sm: "1rem" } }}
            >
              {formatPrice(order.total_amount)}
            </Typography>
          </Box>
        </Box>

        {/* 予想時間 */}
        <Alert severity="info" sx={{ mb: { xs: 1, sm: 1.5 } }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <TimeIcon />
            <Box>
              <Typography
                variant="body2"
                fontWeight="medium"
                sx={{ fontSize: { xs: "0.95rem", sm: "1rem" } }}
              >
                お渡し予定時刻: {getEstimatedReadyTime()}
              </Typography>
              <Typography
                variant="body2"
                sx={{ fontSize: { xs: "0.85rem", sm: "0.95rem" } }}
              >
                約{estimatedTime}分でお渡し予定です
              </Typography>
            </Box>
          </Box>
        </Alert>

        {/* 注意事項 */}
        <Alert severity="warning" sx={{ mb: { xs: 1, sm: 1.5 } }}>
          <Typography
            variant="body2"
            sx={{ fontSize: { xs: "0.85rem", sm: "0.95rem" } }}
          >
            <strong>⚠️ 注意事項</strong>
            <br />
            • 商品は熱々の状態でお渡しします。やけどにご注意ください
            <br />
            • 調理状況により多少お時間をいただく場合があります
            <br />• お支払いは商品受け取り時にお願いします
          </Typography>
        </Alert>

        {/* QRコード（注文情報全体をJSON化して渡す） */}
        <Box sx={{ mb: 1 }}>
          <QRCodeGenerator order={order} size={120} showDownload={true} />
          <Alert severity="success" sx={{ mt: 1 }}>
            <Typography
              variant="body2"
              sx={{ fontSize: { xs: "0.85rem", sm: "0.95rem" } }}
            >
              <strong>📱 いつでも確認できます！</strong>
              <br />
              下記リンクから注文状況とQRコードをいつでも確認できます。
              <br />
              ブックマークの保存をおすすめします。
            </Typography>
          </Alert>
          
          {/* お客様専用ページへのリンク */}
          <Box sx={{ mt: 1.5, textAlign: "center" }}>
            <Button
              variant="outlined"
              color="primary"
              href={`/customer-status?order=${order.order_number}`}
              target="_blank"
              rel="noopener noreferrer"
              fullWidth
              sx={{
                py: { xs: 1, sm: 1.2 },
                fontSize: { xs: "0.9rem", sm: "1rem" },
                fontWeight: 600,
                mb: 1,
              }}
            >
              🔗 注文状況・QRコード確認ページ
            </Button>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ fontSize: { xs: "0.8rem", sm: "0.9rem" } }}
            >
              注文番号: <strong>{order.order_number}</strong>
            </Typography>
          </Box>
        </Box>

        {/* ステータス */}
        <Box sx={{ textAlign: "center", mt: 0.5 }}>
          <Chip
            label={order.status}
            color="info"
            size="small"
            sx={{
              fontWeight: "bold",
              px: 1.2,
              fontSize: { xs: "0.85rem", sm: "0.95rem" },
            }}
          />
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: { xs: 1, sm: 2 }, pt: 0.5 }}>
        <Button
          onClick={onClose}
          variant="contained"
          fullWidth
          size="medium"
          sx={{
            py: { xs: 0.7, sm: 1 },
            fontSize: { xs: "0.95rem", sm: "1.05rem" },
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
