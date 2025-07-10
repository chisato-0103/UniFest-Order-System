import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
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
  TextField,
  Button,
  Paper,
} from "@mui/material";
import {
  ShoppingCart as CartIcon,
  Restaurant as RestaurantIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon,
  QrCode as QrCodeIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
} from "@mui/icons-material";
import MockApi from "../services/mockApi";
// ナビゲーションバーはApp.tsxで共通表示
// WaitTimeDisplayコンポーネントをインポートしない（AppProvider依存のため）
// import WaitTimeDisplay from "../components/WaitTimeDisplay";
import PageLayout from "../components/PageLayout";

// APIから取得する注文データの型定義
interface ApiOrderItem {
  order_item_id: number;
  product_id: number;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  toppings: Array<{
    price: number;
    topping_id: number;
    topping_name?: string;
  }>;
  cooking_time: number;
}

interface ApiOrder {
  order_id: number;
  customer_id: number | null;
  order_number: string;
  total_amount: string;
  status: string;
  payment_status: string;
  payment_method: string;
  estimated_pickup_time: string;
  actual_pickup_time: string | null;
  special_instructions: string | null;
  cooking_start_time: string | null;
  cooking_completion_time: string | null;
  cancel_reason: string | null;
  qr_code: string;
  created_at: string;
  updated_at: string;
  items: ApiOrderItem[];
}

const orderSteps = [
  { label: "注文受付", status: "完了" },
  { label: "調理中", status: "進行中" },
  { label: "調理完了", status: "待機" },
  { label: "受け取り", status: "待機" },
];

function CustomerStatusPage() {
  const [searchParams] = useSearchParams();
  const [order, setOrder] = useState<ApiOrder | null>(null);
  const [activeStep, setActiveStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [orderNotFound, setOrderNotFound] = useState(false);
  const [searchOrderNumber, setSearchOrderNumber] = useState("");

  // URLパラメータから注文番号を取得
  const orderNumberFromUrl = searchParams.get("order");

  // Order型をApiOrder型に変換する関数
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const convertToApiOrder = (order: any): ApiOrder => ({
    order_id: parseInt(order.id || order.order_id || "1"),
    customer_id: parseInt(order.customer_id || "1"),
    order_number: order.orderNumber || order.order_number,
    total_amount: (order.total_amount || order.total || 0).toString(),
    status: order.status,
    payment_status: order.payment_status || "pending",
    payment_method: order.payment_method || "cash",
    estimated_pickup_time:
      order.estimated_pickup_time ||
      order.estimatedCompletionTime?.toISOString() ||
      new Date().toISOString(),
    actual_pickup_time:
      order.actual_pickup_time ||
      (order.actual_pickup_time instanceof Date
        ? order.actual_pickup_time.toISOString()
        : null),
    special_instructions: order.special_instructions || order.notes || null,
    cooking_start_time: order.cooking_start_time || null,
    cooking_completion_time: order.cooking_completion_time || null,
    cancel_reason: order.cancel_reason || null,
    qr_code:
      order.qr_code ||
      order.qrCode ||
      `QR-${order.orderNumber || order.order_number}`,
    created_at:
      order.created_at ||
      order.createdAt?.toISOString() ||
      new Date().toISOString(),
    updated_at:
      order.updated_at ||
      order.updatedAt?.toISOString() ||
      new Date().toISOString(),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    items: (order.items || order.order_items || []).map((item: any) => ({
      order_item_id: parseInt(
        item.id || item.order_item_id || Date.now().toString()
      ),
      product_id: parseInt(
        item.product_id || item.product?.id || Date.now().toString()
      ),
      product_name: item.product_name || item.name || "商品名不明",
      quantity: item.quantity || 1,
      unit_price: item.unit_price || item.price || 0,
      total_price: item.total_price || item.totalPrice || 0,
      cooking_time: item.cooking_time || 5,
      toppings: item.toppings || item.selectedToppings || [],
    })),
  });

  // 注文データを取得する関数
  const fetchOrderData = useCallback(async (orderNumber: string) => {
    setLoading(true);
    setOrderNotFound(false);

    try {
      // MockAPIから注文データを取得
      const result = await MockApi.getOrderByNumber(orderNumber);
      // 取得したAPIレスポンスをコンソールに出力
      console.log("[CustomerStatusPage] APIレスポンス:", result);

      if (result.success && result.data) {
        const apiOrder = convertToApiOrder(result.data);
        setOrder(apiOrder);
        // ステータスに応じてステップを設定
        switch (apiOrder.status) {
          case "注文受付":
          case "pending":
            setActiveStep(0);
            break;
          case "調理中":
          case "preparing":
            setActiveStep(1);
            break;
          case "調理完了":
          case "ready":
            setActiveStep(2);
            break;
          case "受け取り済み":
          case "completed":
          case "picked_up":
            setActiveStep(3);
            break;
          default:
            setActiveStep(0);
        }
      } else {
        setOrderNotFound(true);
        setOrder(null);
      }
    } catch (error) {
      console.error("注文データの取得に失敗:", error);
      setOrderNotFound(true);
      setOrder(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // ページ読み込み時にURLパラメータの注文番号で検索
  useEffect(() => {
    if (orderNumberFromUrl) {
      setSearchOrderNumber(orderNumberFromUrl);
      fetchOrderData(orderNumberFromUrl);
    }
  }, [orderNumberFromUrl, fetchOrderData]);

  // 手動検索処理
  const handleSearch = () => {
    if (searchOrderNumber.trim()) {
      fetchOrderData(searchOrderNumber.trim());
    }
  };

  // 注文状況の更新（リアルタイム通信で実装予定）
  const handleRefresh = useCallback(() => {
    if (order) {
      fetchOrderData(order.order_number);
    }
  }, [order, fetchOrderData]);

  // 自動更新（30秒ごと）
  useEffect(() => {
    const interval = setInterval(() => {
      handleRefresh();
    }, 30000);

    return () => clearInterval(interval);
  }, [handleRefresh]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "注文受付":
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
    if (!order) return 0;
    const now = new Date();
    const pickupTime = new Date(order.estimated_pickup_time);
    const diffMinutes = Math.max(
      0,
      Math.ceil((pickupTime.getTime() - now.getTime()) / (1000 * 60))
    );
    return diffMinutes;
  };

  // 注文が見つからない場合の検索UI
  if (!order && !loading) {
    return (
      <Box>
        {/* ナビゲーションバーはApp.tsxで共通表示 */}
        <Container maxWidth="lg" sx={{ py: 3 }}>
          <Box sx={{ textAlign: "center", mb: 3 }}>
            <QrCodeIcon sx={{ fontSize: 64, color: "primary.main", mb: 2 }} />
            <Typography
              variant="h4"
              component="h1"
              gutterBottom
              color="primary"
            >
              注文状況確認
            </Typography>
            <Typography variant="body1" color="text.secondary">
              注文番号を入力するか、QRコードからアクセスしてください
            </Typography>
          </Box>

          <Paper sx={{ p: 4, maxWidth: 400, mx: "auto" }}>
            <TextField
              fullWidth
              label="注文番号"
              value={searchOrderNumber}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setSearchOrderNumber(e.target.value)
              }
              placeholder="例：A001"
              sx={{ mb: 3 }}
              onKeyPress={(e: React.KeyboardEvent<HTMLInputElement>) => {
                if (e.key === "Enter") {
                  handleSearch();
                }
              }}
            />
            <Button
              fullWidth
              variant="contained"
              size="large"
              onClick={handleSearch}
              startIcon={<SearchIcon />}
              disabled={!searchOrderNumber.trim()}
            >
              注文状況を確認
            </Button>

            {orderNotFound && (
              <Alert severity="error" sx={{ mt: 2 }}>
                注文番号「{searchOrderNumber}」が見つかりません。
                <br />
                注文番号をご確認ください。
              </Alert>
            )}
          </Paper>
        </Container>
      </Box>
    );
  }

  // ローディング中
  if (loading) {
    return (
      <Box>
        {/* ナビゲーションバーはApp.tsxで共通表示 */}
        <Container maxWidth="lg" sx={{ py: 3 }}>
          <Box sx={{ textAlign: "center" }}>
            <LinearProgress sx={{ mb: 2 }} />
            <Typography variant="h6">注文情報を取得中...</Typography>
          </Box>
        </Container>
      </Box>
    );
  }

  // 注文データが存在する場合の表示
  if (!order) return null;

  return (
    <Box>
      {/* ナビゲーションバーはApp.tsxで共通表示 */}
      <PageLayout maxWidth="lg">
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
                        StepIconComponent={({
                          active,
                          completed,
                        }: {
                          active?: boolean;
                          completed?: boolean;
                        }) => (
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

                {/* 待ち時間表示 */}
                <Box sx={{ mb: 3 }}>
                  <Card variant="outlined" sx={{ mb: 2 }}>
                    <CardContent>
                      <Box
                        sx={{ display: "flex", alignItems: "center", mb: 1 }}
                      >
                        <ScheduleIcon sx={{ mr: 1, color: "primary.main" }} />
                        <Typography variant="h6">お待ち時間</Typography>
                      </Box>
                      <Typography
                        variant="h4"
                        color="primary.main"
                        gutterBottom
                      >
                        約 {getEstimatedWaitTime()} 分
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {order.status === "調理完了"
                          ? "調理が完了しました！カウンターでお受け取りください"
                          : "美味しいたこ焼きを調理中です"}
                      </Typography>
                    </CardContent>
                  </Card>
                </Box>

                <List>
                  {order.items.map((item: ApiOrderItem) => (
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
                            {item.toppings && item.toppings.length > 0 && (
                              <Box sx={{ mt: 1 }}>
                                {item.toppings.map(
                                  (topping: {
                                    price: number;
                                    topping_id: number;
                                    topping_name?: string;
                                  }) => (
                                    <Chip
                                      key={topping.topping_id}
                                      label={`トッピング${topping.topping_id}${
                                        topping.price > 0
                                          ? ` (+¥${topping.price})`
                                          : ""
                                      }`}
                                      size="small"
                                      sx={{ mr: 0.5, mb: 0.5 }}
                                    />
                                  )
                                )}
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
                    ¥{parseFloat(order.total_amount).toLocaleString()}
                  </Typography>
                </Box>

                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    支払い方法: {order.payment_method}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    注文時刻: {new Date(order.created_at).toLocaleTimeString()}
                  </Typography>
                  {/* 支払い状況の表示 */}
                  <Box
                    sx={{
                      mt: 1,
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                    }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      支払い状況:
                    </Typography>
                    {order.payment_status === "completed" ||
                    order.payment_status === "paid" ? (
                      <Chip label="支払い済み" color="success" size="small" />
                    ) : (
                      <Chip label="未払い" color="warning" size="small" />
                    )}
                  </Box>
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
      </PageLayout>
    </Box>
  );
}

export default CustomerStatusPage;
