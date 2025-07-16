import React, { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Container,
  Paper,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
} from "@mui/material";
import {
  Restaurant,
  Kitchen,
  Payment,
  LocalShipping,
  History,
  Settings,
  Monitor,
  ExitToApp,
  TrendingUp,
  People,
  Inventory,
  DeleteSweep,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import PageLayout from "../components/PageLayout";

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState<string>("");

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  // 注文履歴リセット処理
  const handleResetOrders = async () => {
    setResetLoading(true);
    setResetError("");
    try {
      // APIエンドポイント
      const response = await fetch('/api/orders/admin/reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('注文履歴のリセットに失敗しました');
      }

      // 成功時はダイアログを閉じる
      setResetDialogOpen(false);
      
      // ページをリロードして最新状態を反映
      window.location.reload();
    } catch (error) {
      setResetError(error instanceof Error ? error.message : '予期しないエラーが発生しました');
    } finally {
      setResetLoading(false);
    }
  };

  const adminMenuItems = [
    {
      title: "商品管理",
      description: "メニュー・価格・在庫管理",
      icon: <Restaurant />,
      color: "#FF6B35",
      path: "/admin/products",
      stats: "12品目",
    },
    {
      title: "調理管理",
      description: "注文受付・調理状況管理",
      icon: <Kitchen />,
      color: "#4ECDC4",
      path: "/admin/kitchen",
      stats: "待機中: 3件",
    },
    {
      title: "会計管理",
      description: "支払い確認・売上管理",
      icon: <Payment />,
      color: "#45B7D1",
      path: "/admin/payment",
      stats: "本日: ¥25,400",
    },
    {
      title: "受け渡し管理",
      description: "受け渡し状況管理",
      icon: <LocalShipping />,
      color: "#96CEB4",
      path: "/admin/delivery",
      stats: "配達待ち: 2件",
    },
    {
      title: "注文履歴",
      description: "全注文履歴・分析",
      icon: <History />,
      color: "#FFEAA7",
      path: "/admin/history",
      stats: "本日: 47件",
    },
    {
      title: "システム設定",
      description: "店舗設定・システム管理",
      icon: <Settings />,
      color: "#DDA0DD",
      path: "/admin/settings",
      stats: "設定済み",
    },
    {
      title: "店舗モニター",
      description: "リアルタイム店舗状況",
      icon: <Monitor />,
      color: "#FFB347",
      path: "/admin/monitor",
      stats: "稼働中",
    },
  ];

  const quickStats = [
    {
      label: "本日の注文数",
      value: "47",
      icon: <TrendingUp />,
      color: "#FF6B35",
    },
    {
      label: "待機中の注文",
      value: "3",
      icon: <People />,
      color: "#4ECDC4",
    },
    {
      label: "在庫商品",
      value: "12",
      icon: <Inventory />,
      color: "#45B7D1",
    },
  ];

  return (
    <PageLayout title="管理者ダッシュボード">
      <Container maxWidth="lg">
        <Box sx={{ mb: 4 }}>
          <Paper
            elevation={3}
            sx={{
              p: 3,
              background: "linear-gradient(135deg, #FF6B35 0%, #F7931E 100%)",
              color: "white",
              borderRadius: 3,
            }}
          >
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 2,
              }}
            >
              <Typography variant="h4" sx={{ fontWeight: 600 }}>
                UniFest たこ焼き店舗管理
              </Typography>
              <Box sx={{ display: "flex", gap: 1 }}>
                <IconButton
                  onClick={() => setResetDialogOpen(true)}
                  sx={{
                    color: "white",
                    backgroundColor: "rgba(255, 255, 255, 0.2)",
                    "&:hover": {
                      backgroundColor: "rgba(255, 255, 255, 0.3)",
                    },
                  }}
                  title="注文履歴をリセット"
                >
                  <DeleteSweep />
                </IconButton>
                <IconButton
                  onClick={handleLogout}
                  sx={{
                    color: "white",
                    backgroundColor: "rgba(255, 255, 255, 0.2)",
                    "&:hover": {
                      backgroundColor: "rgba(255, 255, 255, 0.3)",
                    },
                  }}
                >
                  <ExitToApp />
                </IconButton>
              </Box>
            </Box>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "repeat(3, 1fr)",
                },
                gap: 2,
              }}
            >
              {quickStats.map((stat) => (
                <Card
                  key={stat.label}
                  sx={{
                    backgroundColor: "rgba(255, 255, 255, 0.15)",
                    backdropFilter: "blur(10px)",
                    color: "white",
                  }}
                >
                  <CardContent sx={{ p: 2 }}>
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <Box
                        sx={{
                          backgroundColor: stat.color,
                          borderRadius: 1,
                          p: 1,
                          mr: 2,
                        }}
                      >
                        {stat.icon}
                      </Box>
                      <Box>
                        <Typography variant="h4" sx={{ fontWeight: 600 }}>
                          {stat.value}
                        </Typography>
                        <Typography variant="body2" sx={{ opacity: 0.9 }}>
                          {stat.label}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Box>
          </Paper>
        </Box>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, 1fr)",
              md: "repeat(3, 1fr)",
            },
            gap: 3,
          }}
        >
          {adminMenuItems.map((item) => (
            <Card
              key={item.title}
              sx={{
                height: "100%",
                cursor: "pointer",
                transition: "all 0.3s ease",
                "&:hover": {
                  transform: "translateY(-4px)",
                  boxShadow: "0 8px 25px rgba(0,0,0,0.15)",
                },
                borderRadius: 3,
                overflow: "hidden",
              }}
              onClick={() => navigate(item.path)}
            >
              <Box
                sx={{
                  background: `linear-gradient(135deg, ${item.color}15, ${item.color}25)`,
                  p: 2,
                  borderBottom: `3px solid ${item.color}`,
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    mb: 1,
                  }}
                >
                  <Box
                    sx={{
                      backgroundColor: item.color,
                      borderRadius: 2,
                      p: 1,
                      color: "white",
                    }}
                  >
                    {item.icon}
                  </Box>
                  <Chip
                    label={item.stats}
                    size="small"
                    sx={{
                      backgroundColor: `${item.color}20`,
                      color: item.color,
                      fontWeight: 600,
                    }}
                  />
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                  {item.title}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {item.description}
                </Typography>
              </Box>
              <CardContent sx={{ p: 2 }}>
                <Button
                  fullWidth
                  variant="outlined"
                  sx={{
                    borderColor: item.color,
                    color: item.color,
                    "&:hover": {
                      backgroundColor: `${item.color}10`,
                      borderColor: item.color,
                    },
                  }}
                >
                  管理画面を開く
                </Button>
              </CardContent>
            </Card>
          ))}
        </Box>

        {/* 注文履歴リセット確認ダイアログ */}
        <Dialog
          open={resetDialogOpen}
          onClose={() => setResetDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle sx={{ color: "error.main" }}>
            <DeleteSweep sx={{ mr: 1 }} />
            注文履歴をリセット
          </DialogTitle>
          <DialogContent>
            <Alert severity="warning" sx={{ mb: 2 }}>
              この操作は元に戻すことができません！
            </Alert>
            <Typography variant="body1" sx={{ mb: 2 }}>
              以下のデータが完全に削除されます：
            </Typography>
            <Box component="ul" sx={{ pl: 2 }}>
              <Typography component="li" variant="body2">
                すべての注文履歴
              </Typography>
              <Typography component="li" variant="body2">
                注文アイテムデータ
              </Typography>
              <Typography component="li" variant="body2">
                支払い履歴
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              ※ 商品・カテゴリ・トッピングデータは保持されます
            </Typography>
            
            {resetError && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {resetError}
              </Alert>
            )}
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => setResetDialogOpen(false)}
              disabled={resetLoading}
            >
              キャンセル
            </Button>
            <Button
              onClick={handleResetOrders}
              color="error"
              variant="contained"
              disabled={resetLoading}
              startIcon={resetLoading ? <CircularProgress size={16} /> : <DeleteSweep />}
            >
              {resetLoading ? "リセット中..." : "リセット実行"}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </PageLayout>
  );
};

export default AdminDashboard;
