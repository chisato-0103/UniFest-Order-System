import { Container, Typography, Box } from "@mui/material";

function ProductManagementPage() {
  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Box sx={{ textAlign: "center" }}>
        <Typography variant="h4" component="h1" gutterBottom color="primary">
          商品管理
        </Typography>
        <Typography variant="body1" color="text.secondary">
          商品管理画面（管理者用）です
        </Typography>
      </Box>
    </Container>
  );
}

export default ProductManagementPage;
