import React, { useState, useEffect, useCallback } from "react";
import {
  Typography,
  Container,
  Paper,
  Button,
  Alert,
  CircularProgress,
  Box,
  Chip,
  Card,
  CardContent,
  Divider,
  List,
  ListItem,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import type { KitchenOrder } from "../types";
import MockApi from "../services/mockApi";
import AdminNavigationBar from "../components/AdminNavigationBar";

const KitchenPageTest: React.FC = () => {
  const [orders, setOrders] = useState<KitchenOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [selectedOrder, setSelectedOrder] = useState<KitchenOrder | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const fetchOrders = useCallback(async () => {
    try {
      console.log("🔄 厨房画面: fetchOrders() 開始");
      setLoading(true);
      setError(null);

      // モックAPIを使用（実際のAPIは呼び出さない）
      console.log("🔄 厨房画面: MockApi.getOrders() 呼び出し");
      const response = await MockApi.getOrders();
      console.log("✅ 厨房画面: MockApi.getOrders() 成功", response.data);

      // OrderをKitchenOrder型に変換
      const kitchenOrders: KitchenOrder[] = response.data.map((order) => ({
        id: order.id,
        customer_name: String(order.customer_id || "Unknown"),
        items: (order.items || []).map((item) => ({
          id: item.id,
          product_id: item.id,
          product_name: item.name,
          quantity: item.quantity,
          price: item.price,
        })),
        status: order.status as KitchenOrder["status"],
        created_at: order.createdAt.toISOString(),
        total_amount: order.total,
      }));

      setOrders(kitchenOrders);
      setRetryCount(0);
      console.log(
        "✅ 厨房画面: 注文データ設定完了",
        kitchenOrders.length,
        "件"
      );
    } catch (err) {
      console.error("❌ 厨房画面: fetchOrders() エラー", err);
      setError(
        err instanceof Error ? err.message : "データの取得に失敗しました"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedOrder(null);
  };

  const updateOrderStatus = async (
    orderId: string,
    newStatus: "pending" | "preparing" | "ready" | "completed" | "cancelled"
  ) => {
    try {
      console.log(`🔄 注文 ${orderId} のステータスを ${newStatus} に更新中...`);

      // selectedOrderのチェック
      if (!selectedOrder) {
        console.error("❌ selectedOrderが見つかりません");
        return;
      }

      // モックAPIを使用してステータス更新
      await MockApi.updateOrderStatus(orderId, newStatus);

      // ローカル状態も更新
      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order.id === orderId ? { ...order, status: newStatus } : order
        )
      );

      console.log(`✅ 注文 ${orderId} のステータスを ${newStatus} に更新完了`);

      // ダイアログを閉じる
      setDialogOpen(false);
      setSelectedOrder(null);

      // 他のページに更新を通知
      console.log("🔔 ステータス更新完了 - 他のページが自動で更新されます");
    } catch (err) {
      console.error("❌ ステータス更新エラー:", err);
      setError(
        err instanceof Error ? err.message : "ステータス更新に失敗しました"
      );
    }
  };

  const getStatusColor = (
    status: string
  ): "warning" | "info" | "success" | "default" | "primary" | "secondary" => {
    switch (status) {
      case "pending":
        return "warning";
      case "preparing":
        return "info";
      case "ready":
        return "success";
      case "completed":
        return "secondary";
      default:
        return "default";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending":
        return "注文受付";
      case "preparing":
        return "調理中";
      case "ready":
        return "調理完了";
      case "completed":
        return "提供済み";
      default:
        return status;
    }
  };

  useEffect(() => {
    fetchOrders();

    // 定期的にデータを更新（新しい注文を取得するため）
    const interval = setInterval(() => {
      console.log("📊 厨房画面: 注文データを自動更新中...");
      fetchOrders();
    }, 5000); // 5秒ごと

    return () => clearInterval(interval);
  }, [fetchOrders]);

  const handleOrderClick = (order: KitchenOrder) => {
    setSelectedOrder(order);
    setDialogOpen(true);
  };

  if (loading) {
    return (
      <Container
        maxWidth="lg"
        sx={{ mt: 4, display: "flex", justifyContent: "center" }}
      >
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>
          注文データを読み込み中...
        </Typography>
      </Container>
    );
  }

  return (
    <Box>
      <AdminNavigationBar currentPage="厨房管理（テスト版）" />
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Paper elevation={3} sx={{ p: 3 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            厨房管理画面（テスト版）
          </Typography>

          <Box sx={{ mb: 3, display: "flex", gap: 2 }}>
            <Button
              variant="contained"
              onClick={fetchOrders}
              disabled={loading}
            >
              注文リストを更新
            </Button>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                エラーが発生しました
              </Typography>
              <Typography variant="body2">エラー内容: {error}</Typography>
              {retryCount > 0 && (
                <Typography variant="body2" sx={{ mt: 1 }}>
                  リトライ回数: {retryCount}
                </Typography>
              )}
              <Typography variant="body2" sx={{ mt: 1 }}>
                デバッグ情報: MockAPIを使用してデータを取得中
              </Typography>
              <Typography variant="body2">
                現在の注文数: {orders.length}
              </Typography>
            </Alert>
          )}

          {orders.length === 0 ? (
            <Alert severity="info">現在、注文はありません。</Alert>
          ) : (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
              {orders.map((order) => (
                <Card
                  key={order.id}
                  sx={{
                    cursor: "pointer",
                    "&:hover": { boxShadow: 6 },
                  }}
                  onClick={() => handleOrderClick(order)}
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
                      <Typography variant="h6">注文ID: {order.id}</Typography>
                      <Chip
                        label={getStatusLabel(order.status)}
                        color={getStatusColor(order.status)}
                        size="small"
                      />
                    </Box>

                    <Typography
                      variant="body2"
                      color="text.secondary"
                      gutterBottom
                    >
                      お客様: {order.customer_name}
                    </Typography>

                    <Typography
                      variant="body2"
                      color="text.secondary"
                      gutterBottom
                    >
                      注文時刻:{" "}
                      {new Date(order.created_at).toLocaleString("ja-JP")}
                    </Typography>

                    <Typography
                      variant="body2"
                      color="text.secondary"
                      gutterBottom
                    >
                      合計金額: ¥{order.total_amount.toLocaleString()}
                    </Typography>

                    <Divider sx={{ my: 1 }} />

                    <Typography variant="subtitle2" gutterBottom>
                      注文内容:
                    </Typography>

                    <List dense>
                      {order.items.map((item, index) => (
                        <ListItem key={index} sx={{ py: 0.5 }}>
                          <ListItemText
                            primary={`${item.product_name} × ${item.quantity}`}
                            secondary={`¥${item.price.toLocaleString()}`}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </CardContent>
                </Card>
              ))}
            </Box>
          )}

          {/* 注文詳細ダイアログ */}
          <Dialog
            open={dialogOpen}
            onClose={handleCloseDialog}
            maxWidth="md"
            fullWidth
          >
            <DialogTitle>注文詳細 - ID: {selectedOrder?.id}</DialogTitle>
            <DialogContent>
              {selectedOrder && (
                <Box>
                  <Typography variant="body1" gutterBottom>
                    <strong>お客様:</strong> {selectedOrder.customer_name}
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    <strong>注文時刻:</strong>{" "}
                    {new Date(selectedOrder.created_at).toLocaleString("ja-JP")}
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    <strong>現在のステータス:</strong>{" "}
                    {getStatusLabel(selectedOrder.status)}
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    <strong>合計金額:</strong> ¥
                    {selectedOrder.total_amount.toLocaleString()}
                  </Typography>

                  <Divider sx={{ my: 2 }} />

                  <Typography variant="h6" gutterBottom>
                    注文内容:
                  </Typography>

                  <List>
                    {selectedOrder.items.map((item, index) => (
                      <ListItem key={index}>
                        <ListItemText
                          primary={`${item.product_name} × ${item.quantity}`}
                          secondary={`単価: ¥${item.price.toLocaleString()}`}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDialog} color="inherit">
                閉じる
              </Button>

              {selectedOrder?.status === "pending" && (
                <Button
                  variant="contained"
                  onClick={() =>
                    updateOrderStatus(selectedOrder.id, "preparing")
                  }
                  color="primary"
                >
                  調理開始
                </Button>
              )}

              {selectedOrder?.status === "preparing" && (
                <Button
                  variant="contained"
                  onClick={() => updateOrderStatus(selectedOrder.id, "ready")}
                  color="success"
                >
                  調理完了
                </Button>
              )}

              {selectedOrder?.status === "ready" && (
                <Button
                  variant="contained"
                  onClick={() =>
                    updateOrderStatus(selectedOrder.id, "completed")
                  }
                  color="secondary"
                >
                  提供済み
                </Button>
              )}
            </DialogActions>
          </Dialog>
        </Paper>
      </Container>
    </Box>
  );
};

export default KitchenPageTest;
