import { Container, Typography, Box } from '@mui/material';

function PaymentPage() {
  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Box sx={{ textAlign: 'center' }}>
        <Typography variant="h4" component="h1" gutterBottom color="primary">
          支払い管理
        </Typography>
        <Typography variant="body1" color="text.secondary">
          支払い状況管理画面です
        </Typography>
      </Box>
    </Container>
  );
}

export default PaymentPage;
