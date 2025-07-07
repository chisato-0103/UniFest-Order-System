import React from "react";
import { Typography, Container } from "@mui/material";

const KitchenPageSimpleTest: React.FC = () => {
  return (
    <Container>
      <Typography variant="h4" sx={{ mt: 4, mb: 2 }}>
        厨房画面 - シンプルテスト
      </Typography>
      <Typography variant="body1">
        この画面が表示されれば、厨房画面のルーティングは正常に動作しています。
      </Typography>
    </Container>
  );
};

export default KitchenPageSimpleTest;
