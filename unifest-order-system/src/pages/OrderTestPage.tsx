import { useState } from "react";
import {
  Button,
  Container,
  Typography,
  Box,
  Alert,
  CircularProgress,
  Paper,
} from "@mui/material";
import { API_ENDPOINTS } from "../config/api";
import CustomerNavigationBar from "../components/CustomerNavigationBar";

const OrderTestPage = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);

  const testOrder = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const orderData = {
        items: [
          {
            product_id: 1,
            quantity: 1,
            toppings: [],
            cooking_instruction: "",
          },
        ],
        payment_method: "現金",
        special_instructions: "",
      };

      console.log("注文データ:", orderData);
      console.log("API URL:", API_ENDPOINTS.orders);

      const response = await fetch(API_ENDPOINTS.orders, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderData),
      });

      console.log("レスポンス状態:", response.status);
      console.log("レスポンスヘッダー:", response.headers);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("エラーレスポンス:", errorText);
        throw new Error(`API Error: ${response.status} - ${errorText}`);
      }

      const responseText = await response.text();
      console.log("レスポンステキスト:", responseText);

      let parsedResponse;
      try {
        parsedResponse = JSON.parse(responseText);
      } catch (parseError) {
        console.error("JSONパースエラー:", parseError);
        throw new Error("Invalid JSON response");
      }

      console.log("パースされた注文レスポンス:", parsedResponse);
      setResult(parsedResponse);
    } catch (err) {
      console.error("注文テストエラー:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <CustomerNavigationBar title="テスト" />
      <Container maxWidth="md" sx={{ py: 4 }}>
        <CustomerNavigationBar />
        <Typography variant="h4" component="h1" gutterBottom>
          注文API テスト
        </Typography>

        <Box sx={{ mb: 3 }}>
          <Button
            variant="contained"
            onClick={testOrder}
            disabled={loading}
            sx={{ mr: 2 }}
          >
            {loading ? <CircularProgress size={24} /> : "注文テスト実行"}
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {result && (
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              注文結果:
            </Typography>
            <pre style={{ fontSize: "12px", overflow: "auto" }}>
              {JSON.stringify(result, null, 2)}
            </pre>
          </Paper>
        )}
      </Container>
    </>
  );
};

export default OrderTestPage;
