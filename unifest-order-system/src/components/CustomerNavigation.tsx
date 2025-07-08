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

  // デモ・テストページからSimpleOrderPage関連を削除
  const demoPages = [
    {
      path: "/order-demo",
      label: "🎨 デモ注文画面",
      description: "別デザインのデモ版",
      icon: <ShoppingCartIcon />,
    },
    // SimpleOrderPage関連は廃止
  ];

  return (
    <Box sx={{ mb: 3 }}>
      <AppBar position="static" sx={{ mb: 2 }}>
        <Toolbar>
          <Button
            color="inherit"
            onClick={() => navigate("/")}
            startIcon={<HomeIcon />}
            sx={{ mr: 2 }}
          >
            ホームに戻る
          </Button>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            🥢 UniFest たこ焼き注文システム - お客様画面
          </Typography>
          <Button
            color="inherit"
            onClick={() => navigate("/admin-login")}
            startIcon={<AdminIcon />}
          >
            管理者ログイン
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg">
        {/* メインページ */}
        <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            🎯 お客様向けメインページ
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
                    secondary={`${page.description} (${page.path})`}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Paper>

        {/* デモ・テストページ */}
        <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            🧪 デモ・テスト用ページ
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
                    secondary={`${page.description} (${page.path})`}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Paper>
      </Container>
    </Box>
  );
};

export default CustomerNavigation;
