// 🧭 お客さん用のナビゲーション画面
// お客さんが「何をしたいか」選べるメニュー画面です
// 例：注文する、注文状況を見る、管理者ページに行く

import React from "react"; // Reactの基本道具
import {
  AppBar, // 上部バー
  Toolbar, // ツールバー
  Typography, // 文字表示
  Button, // ボタン
  Box, // レイアウト用の箱
  Container, // 全体を囲む容器
  Paper, // 紙のような背景
  List, // リスト表示
  ListItem, // リストの項目
  ListItemText, // リスト項目のテキスト
  ListItemIcon, // リスト項目のアイコン
  ListItemButton, // リスト項目のボタン
} from "@mui/material";
import {
  Home as HomeIcon,
  ShoppingCart as ShoppingCartIcon,
  Search as SearchIcon,
  AdminPanelSettings as AdminIcon,
} from "@mui/icons-material";
import { Link, useNavigate } from "react-router-dom"; // ページ移動の道具

// 🧭 お客さん用ナビゲーション部品
const CustomerNavigation: React.FC = () => {
  const navigate = useNavigate(); // ページ移動機能

  // 👥 お客さん用のページリスト
  const customerPages = [
    {
      path: "/order",
      label: "🏠 メイン注文画面",
      description: "たこ焼きの注文をする",
      icon: <HomeIcon />,
    },
    {
      path: "/customer-status",
      label: "📋 注文状況確認",
      description: "注文の進捗を確認",
      icon: <SearchIcon />,
    },
  ];

  const demoPages = [
    {
      path: "/order-demo",
      label: "🎨 デモ注文画面",
      description: "別デザインのデモ版",
      icon: <ShoppingCartIcon />,
    },
  ];

  // ホームでは「ホームに戻る」ボタン非表示
  return (
    <Box sx={{ mb: 3 }}>
      <AppBar position="static" sx={{ mb: 2, background: "#FF6B35" }}>
        <Toolbar sx={{ justifyContent: "center" }}>
          <Typography
            variant="h6"
            component="div"
            sx={{ fontWeight: 700, letterSpacing: 1 }}
          >
            UniFest Order System
          </Typography>
          <Box sx={{ flexGrow: 1 }} />
          <Button
            color="inherit"
            onClick={() => navigate("/admin-login")}
            startIcon={<AdminIcon />}
            sx={{ position: "absolute", right: 16 }}
          >
            管理者ログイン
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg">
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            gap: 4,
            justifyContent: "center",
            alignItems: "stretch",
            mb: 4,
          }}
        >
          {/* メインページカード */}
          <Paper
            elevation={3}
            sx={{
              flex: 1,
              minWidth: 320,
              p: 3,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
            }}
          >
            <Typography
              variant="h5"
              gutterBottom
              sx={{ fontWeight: 600, color: "#FF6B35" }}
            >
              お客様向けメインページ
            </Typography>
            <List>
              {customerPages.map((page) => (
                <ListItem
                  key={page.path}
                  disablePadding
                  sx={{
                    borderRadius: 1,
                    mb: 1,
                    "&:hover": { backgroundColor: "action.hover" },
                  }}
                >
                  <ListItemButton component={Link} to={page.path}>
                    <ListItemIcon>{page.icon}</ListItemIcon>
                    <ListItemText
                      primary={page.label}
                      secondary={page.description}
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </Paper>

          {/* デモ・テストページカード */}
          <Paper
            elevation={2}
            sx={{
              flex: 1,
              minWidth: 320,
              p: 3,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
            }}
          >
            <Typography
              variant="h5"
              gutterBottom
              sx={{ fontWeight: 600, color: "#4ECDC4" }}
            >
              デモ・テスト用ページ
            </Typography>
            <List>
              {demoPages.map((page) => (
                <ListItem
                  key={page.path}
                  disablePadding
                  sx={{
                    borderRadius: 1,
                    mb: 1,
                    "&:hover": { backgroundColor: "action.hover" },
                  }}
                >
                  <ListItemButton component={Link} to={page.path}>
                    <ListItemIcon>{page.icon}</ListItemIcon>
                    <ListItemText
                      primary={page.label}
                      secondary={page.description}
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </Paper>
        </Box>
      </Container>
    </Box>
  );
};

export default CustomerNavigation;
