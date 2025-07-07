import React, { useState, useEffect } from "react";
import {
  Typography,
  Container,
  Paper,
  Button,
  Alert,
  Box,
  Chip,
  Card,
  CardContent,
  Divider,
} from "@mui/material";
import type { KitchenOrder } from "../types";
import MockApi from "../services/mockApi";

const KitchenPageSimple: React.FC = () => {
  const [orders, setOrders] = useState<KitchenOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log("🔄 厨房画面: データ取得開始");
      const response = await MockApi.getOrders();
      console.log("✅ 厨房画面: データ取得成功", response.data);
      console.log("✅ 厨房画面: 取得した注文数", response.data.length);

      // OrderをKitchenOrder型に変換
      const kitchenOrders: KitchenOrder[] = response.data.map((order) => ({
        id: order.id,
        customer_name: String(order.customer_id || "お客様"),
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
      console.log(
        "✅ 厨房画面: 注文データ設定完了",
        kitchenOrders.length,
        "件"
      );
    } catch (err) {
      console.error("❌ 厨房画面: エラー", err);
      setError("データの取得に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (
    orderId: string,
    newStatus: "pending" | "preparing" | "ready" | "completed"
  ) => {
    try {
      console.log(`🔄 注文 ${orderId} のステータスを ${newStatus} に更新`);

      // モックAPIでステータス更新
      await MockApi.updateOrderStatus(orderId, newStatus);

      // ローカル状態更新
      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order.id === orderId ? { ...order, status: newStatus } : order
        )
      );

      console.log(`✅ 注文 ${orderId} のステータス更新完了`);
    } catch (err) {
      console.error("❌ ステータス更新エラー", err);
      setError("ステータスの更新に失敗しました");
    }
  };

  // 初期データ読み込み
  useEffect(() => {
    fetchOrders();

    // 5秒ごとに自動更新
    const interval = setInterval(() => {
      console.log("🔄 厨房画面: 自動更新実行");
      fetchOrders();
    }, 5000);

    // 他のタブからの更新通知を受信
    const handleDataUpdate = () => {
      console.log("🔔 厨房画面: 他のタブからの更新通知を受信");
      fetchOrders();
    };

    window.addEventListener("unifest-data-updated", handleDataUpdate);

    return () => {
      clearInterval(interval);
      window.removeEventListener("unifest-data-updated", handleDataUpdate);
    };
  }, []);

  const getChipColor = (
    status: string
  ): "warning" | "info" | "success" | "default" => {
    switch (status) {
      case "pending":
        return "warning";
      case "preparing":
        return "info";
      case "ready":
        return "success";
      case "completed":
        return "default";
      default:
        return "default";
    }
  };

  const getButtonColor = (
    status: string
  ): "primary" | "secondary" | "success" | "warning" | "info" => {
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
        return "primary";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending":
        return "調理待ち";
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

  const getNextStatus = (
    currentStatus: string
  ): "preparing" | "ready" | "completed" => {
    switch (currentStatus) {
      case "pending":
        return "preparing";
      case "preparing":
        return "ready";
      case "ready":
        return "completed";
      default:
        return "completed";
    }
  };

  const getNextStatusLabel = (currentStatus: string) => {
    switch (currentStatus) {
      case "pending":
        return "調理開始";
      case "preparing":
        return "調理完了";
      case "ready":
        return "提供済み";
      default:
        return "";
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          厨房管理画面
        </Typography>

        <Box sx={{ mb: 3, display: "flex", gap: 2, alignItems: "center" }}>
          <Button variant="contained" onClick={fetchOrders} disabled={loading}>
            {loading ? "更新中..." : "注文リストを更新"}
          </Button>
          <Typography variant="body2" color="text.secondary">
            自動更新: 5秒ごと
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* 統計情報 */}
        <Box sx={{ mb: 3, display: "flex", gap: 2 }}>
          <Chip
            label={`調理待ち: ${
              orders.filter((o) => o.status === "pending").length
            }`}
            color="warning"
            variant="outlined"
          />
          <Chip
            label={`調理中: ${
              orders.filter((o) => o.status === "preparing").length
            }`}
            color="info"
            variant="outlined"
          />
          <Chip
            label={`調理完了: ${
              orders.filter((o) => o.status === "ready").length
            }`}
            color="success"
            variant="outlined"
          />
        </Box>

        {/* 注文リスト */}
        <Typography variant="h6" gutterBottom>
          注文一覧 ({orders.length}件)
        </Typography>

        {orders.length === 0 && !loading && (
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ py: 4, textAlign: "center" }}
          >
            現在、調理待ちの注文はありません
          </Typography>
        )}

        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {orders.map((order) => (
            <Card key={order.id} variant="outlined">
              <CardContent>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    mb: 2,
                  }}
                >
                  <Box>
                    <Typography variant="h6" component="h3">
                      注文番号: {order.id}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {order.customer_name}
                    </Typography>
                  </Box>
                  <Chip
                    label={getStatusLabel(order.status)}
                    color={getChipColor(order.status)}
                    size="small"
                  />
                </Box>

                <Typography variant="body2" color="text.secondary" gutterBottom>
                  注文時刻: {new Date(order.created_at).toLocaleString("ja-JP")}
                </Typography>

                <Typography variant="body2" color="text.secondary" gutterBottom>
                  合計金額: ¥{order.total_amount.toLocaleString()}
                </Typography>

                <Divider sx={{ my: 2 }} />

                <Typography variant="subtitle2" gutterBottom>
                  注文内容:
                </Typography>

                <Box sx={{ mb: 2 }}>
                  {order.items.map((item, index) => (
                    <Box
                      key={index}
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        py: 0.5,
                      }}
                    >
                      <Typography variant="body2">
                        {item.product_name} × {item.quantity}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        ¥{item.price.toLocaleString()}
                      </Typography>
                    </Box>
                  ))}
                </Box>

                {order.status !== "completed" && (
                  <Box sx={{ display: "flex", gap: 1 }}>
                    <Button
                      variant="contained"
                      size="small"
                      onClick={() =>
                        updateOrderStatus(order.id, getNextStatus(order.status))
                      }
                      color={getButtonColor(getNextStatus(order.status))}
                    >
                      {getNextStatusLabel(order.status)}
                    </Button>
                  </Box>
                )}
              </CardContent>
            </Card>
          ))}
        </Box>
      </Paper>
    </Container>
  );
};

export default KitchenPageSimple;
