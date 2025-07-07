import React from "react";
import { Box, Typography, Alert } from "@mui/material";
import CustomerNavigationBar from "../components/CustomerNavigationBar";

const SimpleOrderPageTest: React.FC = () => {
  console.log("SimpleOrderPageTest component is rendering");

  return (
    <>
      <CustomerNavigationBar title="テスト" />
      <Box sx={{ p: 3, maxWidth: 1200, mx: "auto" }}>
        <CustomerNavigationBar />
        <Typography variant="h4" component="h1" gutterBottom textAlign="center">
          🍟 大学祭たこ焼き注文システム - テスト版
        </Typography>
        <Alert severity="success" sx={{ mb: 2 }}>
          ✅
          このメッセージが表示されていれば、基本的なコンポーネントは正常に動作しています
        </Alert>
        <Typography variant="body1" textAlign="center">
          現在時刻: {new Date().toLocaleString()}
        </Typography>
      </Box>
    </>
  );
};

export default SimpleOrderPageTest;
