import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  Paper,
  Container,
  Alert,
  CircularProgress,
} from "@mui/material";
import { CheckCircle as CheckCircleIcon } from "@mui/icons-material";
// ナビゲーションバーはApp.tsxで共通表示
import MockApi from "../services/mockApi";
import type { Order } from "../types";

function HistoryPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  // APIから注文履歴を取得
  const fetchOrderHistory = async () => {
    try {
      setLoading(true);
      setError("");
      const result = await MockApi.getOrders();
      // 完了した注文のみフィルター
      const completedOrders = result.data.filter(
        (order) =>
          order.status === "completed" ||
          order.status === "picked_up" ||
          order.status === "受け取り済み"
      );
      setOrders(completedOrders);
    } catch (err) {
      console.error("注文履歴の取得に失敗:", err);
      setError("注文履歴の取得に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderHistory();

    // データ更新イベントリスナーを追加
    const handleDataUpdate = () => {
      fetchOrderHistory();
    };

    window.addEventListener("unifest-data-updated", handleDataUpdate);

    return () => {
      window.removeEventListener("unifest-data-updated", handleDataUpdate);
    };
  }, []);

  return (
    <Box>
      {/* ナビゲーションバーはApp.tsxで共通表示 */}
      <Container maxWidth="lg" sx={{ py: 2 }}>
        <Paper elevation={3} sx={{ p: 3 }}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h4" gutterBottom>
              注文履歴
            </Typography>
            <Typography variant="body1" color="text.secondary">
              過去の注文履歴を確認できます
            </Typography>
          </Box>

          {/* 統計情報 */}
          <Box sx={{ mb: 3 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  総注文数
                </Typography>
                <Typography variant="h4" color="primary">
                  {orders.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  件
                </Typography>
              </CardContent>
            </Card>
          </Box>

          {/* ローディング表示 */}
          {loading && (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress />
            </Box>
          )}

          {/* エラー表示 */}
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {/* 注文履歴一覧 */}
          {!loading && !error && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                注文履歴
              </Typography>

              {orders.length === 0 ? (
                <Alert severity="info" sx={{ mb: 2 }}>
                  注文履歴はありません。
                </Alert>
              ) : (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  {orders.map((order) => (
                    <Card key={order.id}>
                      <CardContent>
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            mb: 2,
                          }}
                        >
                          <Typography variant="h6">
                            注文番号: {order.orderNumber}
                          </Typography>
                          <Chip
                            label="完了"
                            color="success"
                            icon={<CheckCircleIcon />}
                          />
                        </Box>

                        <Box sx={{ mb: 2 }}>
                          <Typography variant="body2" color="text.secondary">
                            合計金額: ¥{order.total?.toLocaleString() || 0}
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              )}
            </Box>
          )}
        </Paper>
      </Container>
    </Box>
  );
}

export default HistoryPage;
