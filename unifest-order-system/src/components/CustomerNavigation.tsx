// 🧭 お客さん用のナビゲーション画面
// お客さんが「何をしたいか」選べるメニュー画面です
// 例：注文する、注文状況を見る、管理者ページに行く

import React from "react"; // Reactの基本道具
import {
  Box, // レイアウト用の箱
  Container, // 全体を囲む容器
  Paper, // 紙のような背景
  List, // リスト表示
  ListItem, // リストの項目
  ListItemText, // リスト項目のテキスト
  ListItemIcon, // リスト項目のアイコン
  ListItemButton, // リスト項目のボタン
  Typography, // 追加: 文字表示
} from "@mui/material";
import { Home as HomeIcon, Search as SearchIcon } from "@mui/icons-material";
import { Link } from "react-router-dom"; // ページ移動の道具

import Button from "@mui/material/Button";

// 🧭 お客さん用ナビゲーション部品
const CustomerNavigation: React.FC = () => {
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

  // デモ・テストページは非表示に
  // const demoPages = [ ... ];

  return (
    <Box sx={{ mb: 3 }}>
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
          {/* メインページカードのみ表示 */}
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

            {/* 管理者ログイン導線 */}
            <Box sx={{ mt: 3, textAlign: "center" }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                管理者の方はこちら
              </Typography>
              <Button
                variant="outlined"
                color="secondary"
                component={Link}
                to="/admin-login"
                sx={{ fontWeight: 600 }}
              >
                管理者ログイン
              </Button>
            </Box>
          </Paper>
        </Box>
      </Container>
    </Box>
  );
};

export default CustomerNavigation;
