import { Container, Typography, Box } from "@mui/material";

function SystemSettingsPage() {
  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Box sx={{ textAlign: "center" }}>
        <Typography variant="h4" component="h1" gutterBottom color="primary">
          システム設定
        </Typography>
        <Typography variant="body1" color="text.secondary">
          システム設定画面（管理者用）です
        </Typography>
      </Box>
    </Container>
  );
}

export default SystemSettingsPage;
