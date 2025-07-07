import { useState, useEffect, useCallback } from "react";
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Alert,
  Badge,
  LinearProgress,
  Tab,
  Tabs,
  AppBar,
  Toolbar,
} from "@mui/material";
import {
  Restaurant as RestaurantIcon,
  Timer as TimerIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  PlayArrow as PlayArrowIcon,
  Refresh as RefreshIcon,
  LocalFireDepartment as FireIcon,
} from "@mui/icons-material";
// import WaitTimeDisplay from "../components/WaitTimeDisplay"; // 一時的に無効化
import { AudioNotificationService } from "../utils/audioNotification";
// import { useSocket } from "../hooks/useSocket"; // 一時的に無効化

// 厨房管理画面用の型定義
interface KitchenOrder {
  order_id: number;
  customer_id: number | null;
  order_number: string;
  status: string;
  payment_status: string;
  total_amount: number;
  order_items: Array<{
    order_item_id: number;
    product_id: number;
    product_name: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    toppings: Array<{
      topping_id: number;
      topping_name: string;
      price: number;
    }>;
    cooking_time: number;
    cooking_instruction: string;
  }>;
  payment_method: string;
  estimated_pickup_time: string;
  actual_pickup_time: string | null;
  special_instructions: string;
  created_at: string;
  updated_at: string;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`kitchen-tabpanel-${index}`}
      aria-labelledby={`kitchen-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

function KitchenPage() {
  const [orders, setOrders] = useState<KitchenOrder[]>([]);
  const [selectedTab, setSelectedTab] = useState(0);
  const [cookingTimers, setCookingTimers] = useState<Record<number, number>>(
    {}
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [retryCount, setRetryCount] = useState(0);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Socket.io統合
  // const socket = useSocket(); // 一時的に無効化
  const socket = null; // 一時的にnullに設定

  // 音声通知サービス
  const [audioService] = useState(() => new AudioNotificationService());

  // APIからデータを取得（エラーハンドリング強化版）
  const fetchOrders = useCallback(
    async (showErrorAlert = true) => {
      try {
        setError("");
        if (!navigator.onLine) {
          throw new Error("インターネット接続がありません");
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10秒タイムアウト

        const response = await fetch("http://localhost:3001/api/orders", {
          signal: controller.signal,
          headers: {
            "Cache-Control": "no-cache",
          },
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error("APIエンドポイントが見つかりません");
          } else if (response.status === 500) {
            throw new Error("サーバーエラーが発生しました");
          } else if (response.status >= 400) {
            throw new Error(`HTTPエラー: ${response.status}`);
          }
          throw new Error("データの取得に失敗しました");
        }

        const result = await response.json();

        if (!result.success || !Array.isArray(result.data)) {
          throw new Error("不正なデータ形式です");
        }

        // APIレスポンス型定義
        interface ApiOrder {
          order_id: number;
          customer_id: number | null;
          order_number: string;
          status: string;
          payment_status: string;
          total_amount: string;
          items: Array<{
            order_item_id?: number;
            product_id: number;
            product_name: string;
            quantity: number;
            unit_price: number;
            total_price: number;
            toppings?: Array<{
              topping_id: number;
              topping_name: string;
              price: number;
            }>;
            cooking_time: number;
            cooking_instruction?: string;
          }>;
          payment_method: string;
          estimated_pickup_time: string;
          actual_pickup_time: string | null;
          special_instructions: string | null;
          created_at: string;
          updated_at: string;
        }

        // APIデータをKitchenOrder形式に変換
        const formattedOrders: KitchenOrder[] = result.data.map(
          (order: ApiOrder) => ({
            order_id: order.order_id,
            customer_id: order.customer_id,
            order_number: order.order_number,
            status: order.status,
            payment_status: order.payment_status,
            total_amount: parseFloat(order.total_amount),
            order_items: order.items.map((item) => ({
              order_item_id: item.order_item_id || 0,
              product_id: item.product_id,
              product_name: item.product_name,
              quantity: item.quantity,
              unit_price: item.unit_price,
              total_price: item.total_price,
              toppings: item.toppings || [],
              cooking_time: item.cooking_time,
              cooking_instruction: item.cooking_instruction || "",
            })),
            payment_method: order.payment_method,
            estimated_pickup_time: order.estimated_pickup_time,
            actual_pickup_time: order.actual_pickup_time,
            special_instructions: order.special_instructions || "",
            created_at: order.created_at,
            updated_at: order.updated_at,
          })
        );

        setOrders(formattedOrders);
        setRetryCount(0);
      } catch (err: unknown) {
        console.error("注文データ取得エラー:", err);

        let errorMessage = "注文データの取得に失敗しました";

        if (err instanceof Error) {
          if (err.name === "AbortError") {
            errorMessage = "通信がタイムアウトしました";
          } else if (err.message.includes("Failed to fetch")) {
            errorMessage = "サーバーに接続できません";
          } else if (err.message) {
            errorMessage = err.message;
          }
        }

        setError(errorMessage);

        if (showErrorAlert) {
          // 自動リトライ
          if (retryCount < 3) {
            setTimeout(() => {
              setRetryCount((prev) => prev + 1);
              fetchOrders(false);
            }, 2000 + retryCount * 1000); // 指数バックオフ
          }
        }
      } finally {
        setLoading(false);
      }
    },
    [retryCount]
  );

  // 初回データ取得とネットワーク状態監視
  useEffect(() => {
    setLoading(true);
    fetchOrders();

    // ネットワーク状態の監視
    const handleOnline = () => {
      setIsOnline(true);
      fetchOrders(false);
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // 定期的にデータを更新
    const interval = setInterval(() => {
      if (navigator.onLine) {
        fetchOrders(false);
      }
    }, 5000);

    return () => {
      clearInterval(interval);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [fetchOrders]);

  // Socket.io統合とリアルタイム更新
  useEffect(() => {
    if (!socket) return;

    // 厨房に参加
    socket.emit("join-kitchen");

    // 新しい注文の通知
    socket.on("new-order", (orderData) => {
      console.log("新しい注文:", orderData);
      fetchOrders(false);
      audioService.playNewOrder();
    });

    // 注文状況の更新
    socket.on("order-status-updated", (data) => {
      console.log("注文状況更新:", data);
      setOrders((prev) =>
        prev.map((order) =>
          order.order_id === data.orderId
            ? {
                ...order,
                status: data.status,
                updated_at: new Date().toISOString(),
              }
            : order
        )
      );
    });

    // 調理完了通知
    socket.on("cooking-completed", (data) => {
      console.log("調理完了:", data);
      audioService.playOrderReady(data.orderNumber);
    });

    // 緊急通知
    socket.on("emergency-notification", (data) => {
      console.log("緊急通知:", data);
      // 緊急通知音を再生（playEmergencyメソッドがない場合は警告音で代替）
      audioService.playNewOrder();
    });

    return () => {
      socket.off("new-order");
      socket.off("order-status-updated");
      socket.off("cooking-completed");
      socket.off("emergency-notification");
    };
  }, [socket, audioService, fetchOrders]);

  // 手動更新
  const handleRefresh = () => {
    setLoading(true);
    fetchOrders();
  };

  // 調理状況によってフィルタリング
  const waitingOrders = orders.filter(
    (order) => order.status === "注文受付" || order.status === "調理待ち"
  );
  const cookingOrders = orders.filter((order) => order.status === "調理中");
  const completedOrders = orders.filter((order) => order.status === "調理完了");

  // タイマー管理
  useEffect(() => {
    const interval = setInterval(() => {
      setCookingTimers((prev) => {
        const newTimers = { ...prev };
        Object.keys(newTimers).forEach((orderId) => {
          if (newTimers[parseInt(orderId)] > 0) {
            newTimers[parseInt(orderId)]--;
          }
        });
        return newTimers;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // 注文の状態を更新
  const updateOrderStatus = async (orderId: number, newStatus: string) => {
    try {
      const response = await fetch(
        `http://localhost:3001/api/orders/${orderId}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      if (response.ok) {
        // 成功時にローカルステートを更新
        setOrders((prev) =>
          prev.map((order) =>
            order.order_id === orderId
              ? {
                  ...order,
                  status: newStatus,
                  updated_at: new Date().toISOString(),
                }
              : order
          )
        );

        // 音声通知
        if (newStatus === "調理完了") {
          const order = orders.find((o) => o.order_id === orderId);
          if (order) {
            await audioService.playOrderReady(order.order_number);
          }
        } else if (newStatus === "調理中") {
          await audioService.playNewOrder();
        }
      } else {
        console.error("ステータス更新に失敗しました");
        alert("ステータスの更新に失敗しました");
      }
    } catch (error) {
      console.error("ステータス更新エラー:", error);
      alert("ネットワークエラーが発生しました");
    }
  };

  // 時間のフォーマット
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // 注文の経過時間を計算
  const getElapsedTime = (createdAt: string) => {
    const now = new Date();
    const created = new Date(createdAt);
    const diffMinutes = Math.floor(
      (now.getTime() - created.getTime()) / (1000 * 60)
    );
    return diffMinutes;
  };

  // 注文カードのレンダリング
  const renderOrderCard = (
    order: KitchenOrder,
    showActions: boolean = true
  ) => {
    const elapsedTime = getElapsedTime(order.created_at);
    const isUrgent = elapsedTime > 15; // 15分以上経過で緊急
    const cookingTimer = cookingTimers[order.order_id];

    return (
      <Card
        key={order.order_id}
        sx={{
          mb: 2,
          border: isUrgent ? "2px solid" : "1px solid",
          borderColor: isUrgent ? "error.main" : "divider",
          boxShadow: isUrgent ? 3 : 1,
        }}
      >
        <CardContent>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 2,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Typography variant="h6" component="h3">
                注文番号: {order.order_number}
              </Typography>
              {isUrgent && (
                <Badge badgeContent={<WarningIcon />} color="error">
                  <Chip label="緊急" color="error" size="small" />
                </Badge>
              )}
            </Box>

            {/* 待ち時間表示（コンパクト表示） */}
            <Box sx={{ my: 1 }}>
              {/* <WaitTimeDisplay orderId={order.order_id} compact={true} /> */}
              <Typography variant="caption" color="text.secondary">
                待ち時間表示（一時的に無効化）
              </Typography>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Chip
                label={order.status}
                color={
                  order.status === "注文受付" || order.status === "調理待ち"
                    ? "warning"
                    : order.status === "調理中"
                    ? "info"
                    : order.status === "調理完了"
                    ? "success"
                    : "default"
                }
                variant="filled"
              />
              <Typography variant="body2" color="text.secondary">
                {elapsedTime}分経過
              </Typography>
            </Box>
          </Box>

          {/* 調理タイマー */}
          {order.status === "調理中" && cookingTimer !== undefined && (
            <Box sx={{ mb: 2 }}>
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}
              >
                <TimerIcon color="info" />
                <Typography variant="body2">
                  残り調理時間: {formatTime(cookingTimer)}
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={Math.max(0, (1 - cookingTimer / (15 * 60)) * 100)}
                sx={{ height: 8, borderRadius: 4 }}
              />
            </Box>
          )}

          {/* 注文アイテム */}
          <List dense>
            {order.order_items.map((item) => (
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
                        調理時間: {item.cooking_time}分
                      </Typography>
                      {item.toppings.length > 0 && (
                        <Box sx={{ mt: 0.5 }}>
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

          {/* 特別な指示 */}
          {order.special_instructions && (
            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="body2">
                特別な指示: {order.special_instructions}
              </Typography>
            </Alert>
          )}

          {/* アクション */}
          {showActions && (
            <Box sx={{ display: "flex", gap: 1, mt: 2 }}>
              {(order.status === "注文受付" || order.status === "調理待ち") && (
                <Button
                  variant="contained"
                  startIcon={<PlayArrowIcon />}
                  onClick={() => updateOrderStatus(order.order_id, "調理中")}
                  sx={{ bgcolor: "info.main" }}
                >
                  調理開始
                </Button>
              )}
              {order.status === "調理中" && (
                <Button
                  variant="contained"
                  startIcon={<CheckCircleIcon />}
                  onClick={() => updateOrderStatus(order.order_id, "調理完了")}
                  color="success"
                >
                  調理完了
                </Button>
              )}
              {order.status === "調理完了" && (
                <Button
                  variant="outlined"
                  startIcon={<RefreshIcon />}
                  onClick={() => updateOrderStatus(order.order_id, "cooking")}
                  color="warning"
                >
                  調理に戻す
                </Button>
              )}
            </Box>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <AppBar position="static" color="default" sx={{ mb: 3 }}>
        <Toolbar>
          <FireIcon sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            厨房管理
          </Typography>
          {!isOnline && (
            <Chip
              icon={<WarningIcon />}
              label="オフライン"
              color="error"
              variant="outlined"
              size="small"
              sx={{ mr: 2 }}
            />
          )}
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
            disabled={loading}
            size="small"
          >
            更新
          </Button>
        </Toolbar>
      </AppBar>

      {/* エラー表示 */}
      {error && (
        <Alert
          severity="error"
          sx={{ mb: 2 }}
          action={
            <Button color="inherit" size="small" onClick={handleRefresh}>
              再試行
            </Button>
          }
        >
          {error}
          {retryCount > 0 && ` (再試行中: ${retryCount}/3)`}
        </Alert>
      )}

      {/* ローディング表示 */}
      {loading && !error && (
        <Box sx={{ mb: 2 }}>
          <LinearProgress />
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mt: 1, textAlign: "center" }}
          >
            注文データを読み込み中...
          </Typography>
        </Box>
      )}

      <Box sx={{ width: "100%" }}>
        <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
          <Tabs
            value={selectedTab}
            onChange={(_, newValue) => setSelectedTab(newValue)}
          >
            <Tab
              label={`調理待ち (${waitingOrders.length})`}
              icon={<TimerIcon />}
              iconPosition="start"
            />
            <Tab
              label={`調理中 (${cookingOrders.length})`}
              icon={<FireIcon />}
              iconPosition="start"
            />
            <Tab
              label={`調理完了 (${completedOrders.length})`}
              icon={<CheckCircleIcon />}
              iconPosition="start"
            />
          </Tabs>
        </Box>

        <TabPanel value={selectedTab} index={0}>
          <Typography variant="h6" gutterBottom>
            調理待ち注文
          </Typography>
          {waitingOrders.length === 0 ? (
            <Alert severity="info">調理待ちの注文はありません</Alert>
          ) : (
            waitingOrders.map((order) => renderOrderCard(order))
          )}
        </TabPanel>

        <TabPanel value={selectedTab} index={1}>
          <Typography variant="h6" gutterBottom>
            調理中注文
          </Typography>
          {cookingOrders.length === 0 ? (
            <Alert severity="info">調理中の注文はありません</Alert>
          ) : (
            cookingOrders.map((order) => renderOrderCard(order))
          )}
        </TabPanel>

        <TabPanel value={selectedTab} index={2}>
          <Typography variant="h6" gutterBottom>
            調理完了注文
          </Typography>
          {completedOrders.length === 0 ? (
            <Alert severity="info">調理完了の注文はありません</Alert>
          ) : (
            completedOrders.map((order) => renderOrderCard(order))
          )}
        </TabPanel>
      </Box>
    </Container>
  );
}

export default KitchenPage;
