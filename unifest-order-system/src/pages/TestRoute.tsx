import React from "react";
import { Typography, Container } from "@mui/material";

const TestRoute: React.FC = () => {
  return (
    <Container>
      <Typography variant="h4" sx={{ mt: 4, mb: 2 }}>
        テストルート
      </Typography>
      <Typography variant="body1">
        この画面が表示されれば、ルーティングは正常に動作しています。
      </Typography>
    </Container>
  );
};

export default TestRoute;
