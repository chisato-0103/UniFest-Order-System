import React from "react";
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
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import PageLayout from "../components/PageLayout";

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/");
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
      title: "配達管理",
      description: "受け渡し・配達状況管理",
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
            gap: { xs: 2, sm: 3 },
            mb: 4,
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
      </Container>
    </PageLayout>
  );
};

export default AdminDashboard;
