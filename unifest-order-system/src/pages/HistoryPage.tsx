import { Container, Typography, Box } from "@mui/material";

function HistoryPage() {
  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Box sx={{ textAlign: "center" }}>
        <Typography variant="h4" component="h1" gutterBottom color="primary">
          オーダー履歴
        </Typography>
        <Typography variant="body1" color="text.secondary">
          全てのオーダー履歴管理画面です
        </Typography>
      </Box>
    </Container>
  );
}

export default HistoryPage;
