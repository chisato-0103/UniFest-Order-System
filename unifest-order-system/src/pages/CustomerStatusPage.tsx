import { useState, useEffect, useCallback } from "react";
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  LinearProgress,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Alert,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  IconButton,
} from "@mui/material";
import {
  ShoppingCart as CartIcon,
  Restaurant as RestaurantIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon,
  QrCode as QrCodeIcon,
  Refresh as RefreshIcon,
} from "@mui/icons-material";
import type { Order, OrderStatus } from "../types";

// ダミーデータ（後でAPIから取得）
const dummyOrder: Order = {
  order_id: 1,
  customer_id: 1,
  order_number: "A001",
  items: [
    {
      order_item_id: 1,
      order_id: 1,
      product_id: 1,
      product_name: "たこ焼き 8個入り",
      quantity: 2,
      unit_price: 600,
      total_price: 1200,
      toppings: [
        {
          topping_id: 1,
          topping_name: "青のり",
          price: 50,
          is_active: true,
          target_product_ids: [1, 2, 3],
          display_order: 1,
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
        },
        {
          topping_id: 2,
          topping_name: "かつお節",
          price: 50,
          is_active: true,
          target_product_ids: [1, 2, 3],
          display_order: 2,
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
        },
      ],
      cooking_time: 10,
      cooking_instruction: "",
      created_at: "2024-01-01T10:00:00Z",
      updated_at: "2024-01-01T10:00:00Z",
    },
    {
      order_item_id: 2,
      order_id: 1,
      product_id: 2,
      product_name: "たこ焼き 12個入り",
      quantity: 1,
      unit_price: 850,
      total_price: 850,
      toppings: [
        {
          topping_id: 3,
          topping_name: "マヨネーズ",
          price: 30,
          is_active: true,
          target_product_ids: [1, 2, 3],
          display_order: 3,
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
        },
      ],
      cooking_time: 12,
      cooking_instruction: "",
      created_at: "2024-01-01T10:00:00Z",
      updated_at: "2024-01-01T10:00:00Z",
    },
  ],
  total_amount: 2250,
  status: "調理中",
  payment_status: "未払い",
  payment_method: "現金",
  estimated_pickup_time: "2024-01-01T10:15:00Z",
  actual_pickup_time: null,
  special_instructions: "",
  created_at: "2024-01-01T10:00:00Z",
  updated_at: "2024-01-01T10:05:00Z",
};

const orderSteps = [
  { label: "注文受付", status: "完了" },
  { label: "調理中", status: "進行中" },
  { label: "調理完了", status: "待機" },
  { label: "受け取り", status: "待機" },
];

function CustomerStatusPage() {
  const [order] = useState<Order>(dummyOrder);
  const [activeStep, setActiveStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // 注文状況の更新（リアルタイム通信で実装予定）
  const handleRefresh = useCallback(() => {
    setLoading(true);
    // TODO: API呼び出し
    setTimeout(() => {
      setLoading(false);
      // ダミーの状況更新
      if (activeStep < 3) {
        setActiveStep((prev) => prev + 1);
      }
    }, 1000);
  }, [activeStep]);

  // 自動更新（30秒ごと）
  useEffect(() => {
    const interval = setInterval(() => {
      handleRefresh();
    }, 30000);

    return () => clearInterval(interval);
  }, [handleRefresh]);

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case "調理待ち":
        return "warning";
      case "調理中":
        return "info";
      case "調理完了":
        return "success";
      case "受け取り済み":
        return "default";
      default:
        return "default";
    }
  };

  const getEstimatedWaitTime = () => {
    const now = new Date();
    const pickupTime = new Date(order.estimated_pickup_time);
    const diffMinutes = Math.max(
      0,
      Math.ceil((pickupTime.getTime() - now.getTime()) / (1000 * 60))
    );
    return diffMinutes;
  };

  return (
    <Container maxWidth="md" sx={{ py: 3 }}>
      <Box sx={{ textAlign: "center", mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom color="primary">
          注文状況確認
        </Typography>
        <Typography variant="h6" color="text.secondary">
          注文番号: {order.order_number}
        </Typography>
      </Box>

      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          gap: 3,
        }}
      >
        {/* 注文状況の進捗 */}
        <Box sx={{ flex: 1 }}>
          <Card>
            <CardContent>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 2,
                }}
              >
                <Typography variant="h6">調理状況</Typography>
                <IconButton onClick={handleRefresh} disabled={loading}>
                  <RefreshIcon />
                </IconButton>
              </Box>

              <Box
                sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}
              >
                <Chip
                  label={order.status}
                  color={getStatusColor(order.status)}
                  variant="filled"
                />
                <Typography variant="body2" color="text.secondary">
                  あと約 {getEstimatedWaitTime()} 分
                </Typography>
              </Box>

              <Stepper activeStep={activeStep} orientation="vertical">
                {orderSteps.map((step) => (
                  <Step key={step.label}>
                    <StepLabel
                      StepIconComponent={({ active, completed }) => (
                        <Avatar
                          sx={{
                            bgcolor: completed
                              ? "success.main"
                              : active
                              ? "primary.main"
                              : "grey.300",
                            width: 32,
                            height: 32,
                          }}
                        >
                          {completed ? (
                            <CheckCircleIcon />
                          ) : step.label === "注文受付" ? (
                            <CartIcon />
                          ) : step.label === "調理中" ? (
                            <RestaurantIcon />
                          ) : step.label === "調理完了" ? (
                            <ScheduleIcon />
                          ) : (
                            <QrCodeIcon />
                          )}
                        </Avatar>
                      )}
                    >
                      {step.label}
                    </StepLabel>
                    <StepContent>
                      <Typography variant="body2" color="text.secondary">
                        {step.label === "注文受付" && "注文を受け付けました"}
                        {step.label === "調理中" &&
                          "美味しいたこ焼きを調理中です"}
                        {step.label === "調理完了" && "調理が完了しました"}
                        {step.label === "受け取り" &&
                          "カウンターでお受け取りください"}
                      </Typography>
                    </StepContent>
                  </Step>
                ))}
              </Stepper>

              {loading && <LinearProgress sx={{ mt: 2 }} />}
            </CardContent>
          </Card>
        </Box>

        {/* 注文詳細 */}
        <Box sx={{ flex: 1 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                注文詳細
              </Typography>

              <List>
                {order.items.map((item) => (
                  <ListItem key={item.order_item_id} divider>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: "orange.light" }}>
                        <RestaurantIcon />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={`${item.product_name} × ${item.quantity}`}
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            ¥{item.total_price.toLocaleString()}
                          </Typography>
                          {item.toppings.length > 0 && (
                            <Box sx={{ mt: 1 }}>
                              {item.toppings.map((topping) => (
                                <Chip
                                  key={topping.topping_id}
                                  label={topping.topping_name}
                                  size="small"
                                  sx={{ mr: 0.5, mb: 0.5 }}
                                />
                              ))}
                            </Box>
                          )}
                        </Box>
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
                <Typography variant="h6">合計金額</Typography>
                <Typography variant="h6" color="primary">
                  ¥{order.total_amount.toLocaleString()}
                </Typography>
              </Box>

              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  支払い方法: {order.payment_method}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  注文時刻: {new Date(order.created_at).toLocaleTimeString()}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* 受け取り案内 */}
      {order.status === "調理完了" && (
        <Alert severity="success" sx={{ mt: 3 }}>
          <Typography variant="h6">
            調理完了！カウンターでお受け取りください
          </Typography>
          <Typography variant="body2">
            注文番号「{order.order_number}」をスタッフにお伝えください
          </Typography>
        </Alert>
      )}
    </Container>
  );
}

export default CustomerStatusPage;
