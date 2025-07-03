import { Container, Typography, Box } from "@mui/material";

function DeliveryPage() {
  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Box sx={{ textAlign: "center" }}>
        <Typography variant="h4" component="h1" gutterBottom color="primary">
          受け渡し管理
        </Typography>
        <Typography variant="body1" color="text.secondary">
          商品受け渡し管理画面です
        </Typography>
      </Box>
    </Container>
  );
}

export default DeliveryPage;
