// 👨‍🍳 キッチン画面（調理担当者が使う画面）
// 新しい注文が表示されて、「調理開始」「完成」ボタンで進捗を管理できます
// 注文が入ると音で知らせてくれるので、見逃しません

import { useState, useEffect, useCallback, useRef } from "react"; // Reactの基本機能
import {
  Container, // 全体を囲む容器
  Typography, // 文字表示
  Box, // レイアウト用の箱
  Card, // カード表示
  CardContent, // カードの中身
  Button, // ボタン
  Chip, // ステータス表示用の小さなタグ
  List, // リスト表示
  ListItem, // リストの項目
  ListItemText, // リスト項目のテキスト
  ListItemAvatar, // リスト項目のアバター
  Avatar, // 丸いアイコン
  Alert, // 警告メッセージ
  Badge, // バッジ（数字表示）
  LinearProgress, // プログレスバー
  Tab, // タブ
  Tabs, // タブグループ
  AppBar, // 上部バー
  Toolbar, // ツールバー
  Dialog, // ダイアログ
  DialogTitle, // ダイアログタイトル
  DialogContent, // ダイアログコンテンツ
  DialogActions, // ダイアログアクション
  IconButton, // アイコンボタン
  Divider, // 区切り線
} from "@mui/material";
import {
  Restaurant as RestaurantIcon, // レストランアイコン
  Timer as TimerIcon, // タイマーアイコン
  CheckCircle as CheckCircleIcon, // 完成チェックアイコン
  Warning as WarningIcon, // 警告アイコン
  PlayArrow as PlayArrowIcon, // 開始アイコン
  Refresh as RefreshIcon, // 更新アイコン
  LocalFireDepartment as FireIcon, // 火のアイコン
  BugReport as BugReportIcon, // デバッグアイコン
  Close as CloseIcon, // 閉じるアイコン
} from "@mui/icons-material";
// import WaitTimeDisplay from "../components/WaitTimeDisplay"; // 一時的に無効化
import { AudioNotificationService } from "../utils/audioNotification"; // 音の通知サービス
import {
  fetchOrders as apiFetchOrders,
  updateOrderStatus as apiUpdateOrderStatus,
} from "../utils/apiClient"; // 改良版API通信
import { API_BASE_URL } from "../config/api"; // API設定
import { apiLogger } from "../utils/logger"; // デバッグログ
// import { useSocket } from "../hooks/useSocket"; // 一時的に無効化

// 🍳 厨房管理画面用の注文データの形
interface KitchenOrder {
  order_id: number; // 注文番号
  customer_id: number | null; // お客さん番号
  order_number: string; // 注文番号（文字）
  status: string; // 状況（待機中、調理中、完成）
  payment_status: string; // 支払い状況
  total_amount: number; // 合計金額
  order_items: Array<{
    // 注文した商品のリスト
    order_item_id: number; // 注文商品番号
    product_id: number; // 商品番号
    product_name: string; // 商品名
    quantity: number; // 個数
    unit_price: number; // 単価
    total_price: number; // 小計
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
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showDebug, setShowDebug] = useState(false); // デバッグパネル表示状態

  // AbortController の管理をuseRefで行う
  const abortControllerRef = useRef<AbortController | null>(null);

  // Socket.io統合
  // const socket = useSocket(); // 一時的に無効化
  const socket = null; // 一時的にnullに設定

  // 音声通知サービス
  const [audioService] = useState(() => new AudioNotificationService()); // APIからデータを取得（AbortController競合回避版）
  const fetchOrders = useCallback(
    async (showErrorAlert = true) => {
      // 既存のリクエストがあればキャンセル
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }

      // 新しいAbortControllerを作成
      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        setError("");

        // コントローラーがすでに中止されているかチェック
        if (controller.signal.aborted) {
          return;
        }

        // 改良版APIクライアントを使用
        const result = await apiFetchOrders(API_BASE_URL);

        // 処理中にキャンセルされた場合は結果を無視
        if (controller.signal.aborted) {
          return;
        }

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

        // 最終チェック：処理完了直前にキャンセルされていないか確認
        if (controller.signal.aborted) {
          return;
        }

        setOrders(formattedOrders);

        // 正常完了時にAbortControllerをクリア
        abortControllerRef.current = null;
      } catch (err: unknown) {
        console.error("注文データ取得エラー:", err);

        // AbortErrorの場合は静かに終了（ユーザーにエラー表示しない）
        if (err instanceof Error && err.name === "AbortError") {
          return;
        }

        // 詳細エラー情報をログに記録
        const errorInfo = {
          timestamp: new Date().toISOString(),
          url: `${API_BASE_URL}/api/orders`,
          error:
            err instanceof Error
              ? {
                  name: err.name,
                  message: err.message,
                  stack: err.stack,
                }
              : String(err),
          userAgent: navigator.userAgent,
          online: navigator.onLine,
          connectionType:
            (
              navigator as Navigator & {
                connection?: { effectiveType?: string };
              }
            ).connection?.effectiveType || "unknown",
        };

        apiLogger.log(
          "ERROR",
          "KITCHEN_FETCH",
          "厨房画面でのデータ取得エラー",
          errorInfo
        );

        let errorMessage = "注文データの取得に失敗しました";
        if (err instanceof Error) {
          errorMessage = err.message;
        }

        if (showErrorAlert) {
          setError(errorMessage);
        }
      } finally {
        setLoading(false);
        // エラーが発生した場合もAbortControllerをクリア
        if (
          abortControllerRef.current &&
          !abortControllerRef.current.signal.aborted
        ) {
          abortControllerRef.current = null;
        }
      }
    },
    [] // retryCountから依存関係を除去（無限ループ防止）
  );

  // 初回データ取得とネットワーク状態監視
  useEffect(() => {
    let mounted = true; // コンポーネントがマウントされているかチェック

    const initializeData = async () => {
      if (!mounted) return;
      setLoading(true);
      await fetchOrders();
    };

    initializeData();

    // ネットワーク状態の監視
    const handleOnline = () => {
      if (!mounted) return;
      setIsOnline(true);
      fetchOrders(false);
    };
    const handleOffline = () => {
      if (!mounted) return;
      setIsOnline(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // 定期的にデータを更新（負荷軽減のため頻度を大幅削減）
    const intervalId = setInterval(() => {
      if (!mounted || !navigator.onLine) return;
      fetchOrders(false);
    }, 60000); // 1分間隔に変更

    return () => {
      mounted = false;
      clearInterval(intervalId);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);

      // アクティブなAPIリクエストをキャンセル
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // fetchOrdersへの依存関係を意図的に除去（無限ループ防止）

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, audioService]); // fetchOrdersへの依存関係を除去

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

  // 注文の状態を更新（改良版APIクライアント使用）
  const updateOrderStatus = async (orderId: number, newStatus: string) => {
    try {
      // 改良版APIクライアントを使用
      const result = await apiUpdateOrderStatus(
        API_BASE_URL,
        orderId,
        newStatus
      );

      if (result.success) {
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

      // 詳細エラー情報をログに記録
      apiLogger.log("ERROR", "STATUS_UPDATE", "注文ステータス更新エラー", {
        orderId,
        newStatus,
        error:
          error instanceof Error
            ? {
                name: error.name,
                message: error.message,
                stack: error.stack,
              }
            : String(error),
        timestamp: new Date().toISOString(),
      });

      if (error instanceof Error) {
        alert(`エラー: ${error.message}`);
      } else {
        alert("ネットワークエラーが発生しました");
      }
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
          mb: { xs: 1.5, sm: 2 },
          border: isUrgent ? "2px solid" : "1px solid",
          borderColor: isUrgent ? "error.main" : "divider",
          boxShadow: isUrgent ? 3 : 1,
        }}
      >
        <CardContent sx={{ p: { xs: 1, sm: 2 } }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: { xs: 1, sm: 2 },
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: { xs: 0.5, sm: 1 },
              }}
            >
              <Typography
                variant="subtitle1"
                component="h3"
                sx={{
                  fontSize: { xs: "1rem", sm: "1.15rem" },
                  fontWeight: 600,
                }}
              >
                注文番号: {order.order_number}
              </Typography>
              {isUrgent && (
                <Badge
                  badgeContent={
                    <WarningIcon sx={{ fontSize: { xs: 18, sm: 22 } }} />
                  }
                  color="error"
                >
                  <Chip
                    label="緊急"
                    color="error"
                    size="small"
                    sx={{
                      fontSize: { xs: "0.85rem", sm: "1rem" },
                      height: { xs: 22, sm: 28 },
                    }}
                  />
                </Badge>
              )}
            </Box>
            <Box sx={{ my: { xs: 0.5, sm: 1 } }}>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ fontSize: { xs: "0.8rem", sm: "0.9rem" } }}
              >
                待ち時間表示（一時的に無効化）
              </Typography>
            </Box>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: { xs: 0.5, sm: 1 },
              }}
            >
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
                sx={{
                  fontSize: { xs: "0.85rem", sm: "1rem" },
                  height: { xs: 22, sm: 28 },
                }}
              />
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ fontSize: { xs: "0.9rem", sm: "1rem" } }}
              >
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
              <ListItem
                key={item.order_item_id}
                divider
                sx={{
                  py: { xs: 0.3, sm: 0.7 },
                  px: { xs: 0.5, sm: 1.5 },
                  minHeight: { xs: 38, sm: 48 },
                }}
              >
                <ListItemAvatar>
                  <Avatar
                    sx={{
                      bgcolor: "orange.light",
                      width: { xs: 28, sm: 40 },
                      height: { xs: 28, sm: 40 },
                      fontSize: { xs: "0.95rem", sm: "1.2rem" },
                    }}
                  >
                    <RestaurantIcon sx={{ fontSize: { xs: 18, sm: 24 } }} />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Typography
                      variant="body2"
                      sx={{
                        fontSize: { xs: "0.9rem", sm: "1.05rem" },
                        fontWeight: 500,
                        lineHeight: 1.2,
                      }}
                    >
                      {item.product_name} × {item.quantity}
                    </Typography>
                  }
                  secondary={
                    item.toppings && item.toppings.length > 0 ? (
                      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.3 }}>
                        {item.toppings.map((topping) => (
                          <Chip
                            key={topping.topping_id}
                            label={topping.topping_name}
                            size="small"
                            sx={{
                              fontSize: { xs: "0.75rem", sm: "0.9rem" },
                              height: { xs: 18, sm: 24 },
                              px: { xs: 0.7, sm: 1.2 },
                              mr: 0.3,
                            }}
                          />
                        ))}
                      </Box>
                    ) : null
                  }
                />
                <Box sx={{ ml: { xs: 0.5, sm: 1 } }}>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{
                      fontSize: { xs: "0.75rem", sm: "0.9rem" },
                      fontWeight: 400,
                    }}
                  >
                    ¥{item.total_price}
                  </Typography>
                </Box>
              </ListItem>
            ))}
          </List>

          {/* 注文メモ・特記事項 */}
          {order.special_instructions && (
            <Box sx={{ mt: { xs: 0.5, sm: 1 } }}>
              <Chip
                icon={<WarningIcon sx={{ fontSize: { xs: 18, sm: 22 } }} />}
                label={order.special_instructions}
                color="warning"
                size="small"
                sx={{
                  fontSize: { xs: "0.8rem", sm: "0.95rem" },
                  height: { xs: 22, sm: 28 },
                }}
              />
            </Box>
          )}

          {/* アクションボタン */}
          {showActions && (
            <Box
              sx={{
                display: "flex",
                gap: { xs: 0.7, sm: 2 },
                mt: { xs: 0.7, sm: 2 },
                flexWrap: "wrap",
              }}
            >
              {(order.status === "注文受付" || order.status === "調理待ち") && (
                <Button
                  variant="contained"
                  startIcon={
                    <PlayArrowIcon sx={{ fontSize: { xs: 18, sm: 22 } }} />
                  }
                  onClick={() => updateOrderStatus(order.order_id, "調理中")}
                  color="info"
                  size="small"
                  sx={{
                    fontSize: { xs: "0.85rem", sm: "1rem" },
                    py: { xs: 0.4, sm: 1 },
                    minWidth: { xs: 70, sm: 120 },
                    height: { xs: 32, sm: 40 },
                  }}
                >
                  調理開始
                </Button>
              )}
              {order.status === "調理中" && (
                <Button
                  variant="contained"
                  startIcon={
                    <CheckCircleIcon sx={{ fontSize: { xs: 18, sm: 22 } }} />
                  }
                  onClick={() => updateOrderStatus(order.order_id, "調理完了")}
                  color="success"
                  size="small"
                  sx={{
                    fontSize: { xs: "0.85rem", sm: "1rem" },
                    py: { xs: 0.4, sm: 1 },
                    minWidth: { xs: 70, sm: 120 },
                    height: { xs: 32, sm: 40 },
                  }}
                >
                  調理完了
                </Button>
              )}
              {order.status === "調理完了" && (
                <Button
                  variant="outlined"
                  startIcon={
                    <RefreshIcon sx={{ fontSize: { xs: 18, sm: 22 } }} />
                  }
                  onClick={() => updateOrderStatus(order.order_id, "調理中")}
                  color="warning"
                  size="small"
                  sx={{
                    fontSize: { xs: "0.85rem", sm: "1rem" },
                    py: { xs: 0.4, sm: 1 },
                    minWidth: { xs: 70, sm: 120 },
                    height: { xs: 32, sm: 40 },
                  }}
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
          {/* デバッグボタン（開発時のみ表示） */}
          {import.meta.env.DEV && (
            <IconButton
              onClick={() => setShowDebug(true)}
              color="inherit"
              size="small"
              sx={{ ml: 1 }}
              title="デバッグ情報を表示"
            >
              <BugReportIcon />
            </IconButton>
          )}
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
            variant="fullWidth"
            sx={{
              minHeight: { xs: 36, sm: 48 },
              ".MuiTabs-indicator": { height: { xs: 2, sm: 3 } },
            }}
          >
            <Tab
              label={
                <span
                  style={{
                    fontSize: "clamp(0.85rem, 2vw, 1.05rem)",
                    fontWeight: 500,
                  }}
                >
                  調理待ち ({waitingOrders.length})
                </span>
              }
              icon={<TimerIcon sx={{ fontSize: { xs: 18, sm: 22 } }} />}
              iconPosition="start"
              sx={{
                minHeight: { xs: 36, sm: 48 },
                px: { xs: 0.5, sm: 2 },
                fontSize: { xs: "0.85rem", sm: "1rem" },
                gap: { xs: 0.5, sm: 1 },
              }}
            />
            <Tab
              label={
                <span
                  style={{
                    fontSize: "clamp(0.85rem, 2vw, 1.05rem)",
                    fontWeight: 500,
                  }}
                >
                  調理中 ({cookingOrders.length})
                </span>
              }
              icon={<FireIcon sx={{ fontSize: { xs: 18, sm: 22 } }} />}
              iconPosition="start"
              sx={{
                minHeight: { xs: 36, sm: 48 },
                px: { xs: 0.5, sm: 2 },
                fontSize: { xs: "0.85rem", sm: "1rem" },
                gap: { xs: 0.5, sm: 1 },
              }}
            />
            <Tab
              label={
                <span
                  style={{
                    fontSize: "clamp(0.85rem, 2vw, 1.05rem)",
                    fontWeight: 500,
                  }}
                >
                  調理完了 ({completedOrders.length})
                </span>
              }
              icon={<CheckCircleIcon sx={{ fontSize: { xs: 18, sm: 22 } }} />}
              iconPosition="start"
              sx={{
                minHeight: { xs: 36, sm: 48 },
                px: { xs: 0.5, sm: 2 },
                fontSize: { xs: "0.85rem", sm: "1rem" },
                gap: { xs: 0.5, sm: 1 },
              }}
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
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  lg: "repeat(2, 1fr)",
                },
                gap: { xs: 1.5, sm: 2 },
              }}
            >
              {waitingOrders.map((order) => renderOrderCard(order))}
            </Box>
          )}
        </TabPanel>

        <TabPanel value={selectedTab} index={1}>
          <Typography variant="h6" gutterBottom>
            調理中注文
          </Typography>
          {cookingOrders.length === 0 ? (
            <Alert severity="info">調理中の注文はありません</Alert>
          ) : (
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  lg: "repeat(2, 1fr)",
                },
                gap: { xs: 1.5, sm: 2 },
              }}
            >
              {cookingOrders.map((order) => renderOrderCard(order))}
            </Box>
          )}
        </TabPanel>

        <TabPanel value={selectedTab} index={2}>
          <Typography variant="h6" gutterBottom>
            調理完了注文
          </Typography>
          {completedOrders.length === 0 ? (
            <Alert severity="info">調理完了の注文はありません</Alert>
          ) : (
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  lg: "repeat(2, 1fr)",
                },
                gap: { xs: 1.5, sm: 2 },
              }}
            >
              {completedOrders.map((order) => renderOrderCard(order))}
            </Box>
          )}
        </TabPanel>
      </Box>

      {/* 🐛 デバッグダイアログ */}
      <Dialog
        open={showDebug}
        onClose={() => setShowDebug(false)}
        maxWidth="md"
        fullWidth
        sx={{
          ".MuiDialog-paper": {
            p: { xs: 1, sm: 2 },
            borderRadius: 2,
          },
        }}
      >
        <DialogTitle
          sx={{ p: { xs: 1, sm: 2 }, fontSize: { xs: "1rem", sm: "1.2rem" } }}
        >
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
          >
            デバッグ情報
            <IconButton
              onClick={() => setShowDebug(false)}
              size="small"
              sx={{ ml: 1 }}
            >
              <CloseIcon sx={{ fontSize: { xs: 20, sm: 24 } }} />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: { xs: 1, sm: 2 } }}>
          <Box>
            <Typography
              variant="h6"
              gutterBottom
              sx={{ fontSize: { xs: "1rem", sm: "1.15rem" } }}
            >
              API統計 (過去1時間)
            </Typography>
            {(() => {
              const stats = apiLogger.getStats();
              return (
                <Box
                  component="pre"
                  sx={{
                    backgroundColor: "#f5f5f5",
                    p: { xs: 1, sm: 2 },
                    borderRadius: 1,
                    fontSize: { xs: "0.8rem", sm: "0.875rem" },
                    overflow: "auto",
                    mb: 2,
                  }}
                >
                  {JSON.stringify(stats, null, 2)}
                </Box>
              );
            })()}

            <Divider sx={{ my: { xs: 1, sm: 2 } }} />

            <Typography
              variant="h6"
              gutterBottom
              sx={{ fontSize: { xs: "1rem", sm: "1.15rem" } }}
            >
              最新ログ (最新10件)
            </Typography>
            <Box
              component="pre"
              sx={{
                backgroundColor: "#f5f5f5",
                p: { xs: 1, sm: 2 },
                borderRadius: 1,
                fontSize: { xs: "0.8rem", sm: "0.875rem" },
                overflow: "auto",
                maxHeight: { xs: 180, sm: 300 },
              }}
            >
              {apiLogger
                .exportLogs()
                .logs.slice(-10)
                .map(
                  (log) =>
                    `[${log.timestamp}] ${log.level} - ${log.category}: ${
                      log.message
                    }\n${
                      log.data ? JSON.stringify(log.data, null, 2) + "\n" : ""
                    }---\n`
                )
                .join("")}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: { xs: 1, sm: 2 }, gap: { xs: 1, sm: 2 } }}>
          <Button
            onClick={() => apiLogger.clearLogs()}
            color="warning"
            sx={{
              fontSize: { xs: "0.85rem", sm: "1rem" },
              minWidth: { xs: 70, sm: 120 },
              height: { xs: 32, sm: 40 },
            }}
          >
            ログクリア
          </Button>
          <Button
            onClick={() => setShowDebug(false)}
            sx={{
              fontSize: { xs: "0.85rem", sm: "1rem" },
              minWidth: { xs: 70, sm: 120 },
              height: { xs: 32, sm: 40 },
            }}
          >
            閉じる
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default KitchenPage;
