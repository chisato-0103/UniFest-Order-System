// 🍽️ 注文ページ - 統一されたアーキテクチャ版
import React, { useState, useEffect, useContext } from "react";
import {
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  Box,
  CircularProgress,
  Alert,
  Badge,
  Chip,
  Paper,
} from "@mui/material";
import {
  Add,
  Remove,
  ShoppingCart,
  AccessTime,
  Restaurant,
} from "@mui/icons-material";
import { AppContext } from "../contexts/AppContext";
import { ProductService } from "../services/apiService";
import type { Product, Topping } from "../types";

// 商品カードコンポーネント
interface ProductCardProps {
  product: Product;
  onAddToCart: (
    product: Product,
    quantity: number,
    toppings: Topping[]
  ) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onAddToCart }) => {
  const [quantity, setQuantity] = useState(1);
  const [selectedToppings, setSelectedToppings] = useState<Topping[]>([]);
  const [toppings, setToppings] = useState<Topping[]>([]);

  useEffect(() => {
    const loadToppings = async () => {
      try {
        const toppingsData = await ProductService.getToppings();
        setToppings(toppingsData);
      } catch (error) {
        console.error("トッピング読み込みエラー:", error);
      }
    };
    loadToppings();
  }, []);

  const handleToppingToggle = (topping: Topping) => {
    setSelectedToppings((prev) =>
      prev.find((t) => t.id === topping.id)
        ? prev.filter((t) => t.id !== topping.id)
        : [...prev, topping]
    );
  };

  const getTotalPrice = () => {
    const toppingsPrice = selectedToppings.reduce(
      (sum, topping) => sum + topping.price,
      0
    );
    return (product.price + toppingsPrice) * quantity;
  };

  const handleAddToCart = () => {
    onAddToCart(product, quantity, selectedToppings);
    setQuantity(1);
    setSelectedToppings([]);
  };

  return (
    <Card
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        opacity: product.available ? 1 : 0.6,
      }}
    >
      <CardContent sx={{ flexGrow: 1 }}>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="start"
          mb={1}
        >
          <Typography variant="h6" component="h3" gutterBottom>
            {product.name}
          </Typography>
          {!product.available && (
            <Chip label="売り切れ" color="error" size="small" />
          )}
        </Box>

        <Typography variant="body2" color="text.secondary" gutterBottom>
          {product.description}
        </Typography>

        <Box display="flex" alignItems="center" gap={1} mb={2}>
          <Typography variant="h6" color="primary">
            ¥{product.price.toLocaleString()}
          </Typography>
          <Chip
            icon={<AccessTime />}
            label={`${product.preparationTime || 10}分`}
            size="small"
            variant="outlined"
          />
        </Box>

        {/* トッピング選択 */}
        {toppings.length > 0 && (
          <Box mb={2}>
            <Typography variant="subtitle2" gutterBottom>
              トッピング
            </Typography>
            <Box display="flex" flexWrap="wrap" gap={1}>
              {toppings.map((topping) => (
                <Chip
                  key={topping.id}
                  label={`${topping.name} ${
                    topping.price > 0 ? `+¥${topping.price}` : ""
                  }`}
                  variant={
                    selectedToppings.find((t) => t.id === topping.id)
                      ? "filled"
                      : "outlined"
                  }
                  color={
                    selectedToppings.find((t) => t.id === topping.id)
                      ? "primary"
                      : "default"
                  }
                  onClick={() => handleToppingToggle(topping)}
                  disabled={!product.available || !topping.available}
                  size="small"
                />
              ))}
            </Box>
          </Box>
        )}

        {/* 数量選択 */}
        <Box
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          mb={2}
        >
          <Box display="flex" alignItems="center" gap={1}>
            <Button
              size="small"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              disabled={quantity <= 1 || !product.available}
            >
              <Remove />
            </Button>
            <Typography
              variant="body1"
              sx={{ minWidth: "2ch", textAlign: "center" }}
            >
              {quantity}
            </Typography>
            <Button
              size="small"
              onClick={() => setQuantity(quantity + 1)}
              disabled={!product.available}
            >
              <Add />
            </Button>
          </Box>

          <Typography variant="h6" color="primary">
            ¥{getTotalPrice().toLocaleString()}
          </Typography>
        </Box>

        <Button
          variant="contained"
          fullWidth
          startIcon={<ShoppingCart />}
          onClick={handleAddToCart}
          disabled={!product.available}
        >
          カートに追加
        </Button>
      </CardContent>
    </Card>
  );
};

// メイン注文ページコンポーネント
const OrderPage: React.FC = () => {
  const { state, dispatch } = useContext(AppContext);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        const productsData = await ProductService.getProducts();
        setProducts(productsData);
      } catch (err) {
        console.error("商品読み込みエラー:", err);
        setError("商品の読み込みに失敗しました");
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, []);

  const handleAddToCart = (
    product: Product,
    quantity: number,
    toppings: Topping[]
  ) => {
    dispatch({
      type: "ADD_TO_CART",
      payload: { product, quantity, toppings },
    });
  };

  const getCartItemCount = () => {
    return state.cart.itemCount;
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight="50vh"
        >
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* ヘッダー */}
      <Paper elevation={1} sx={{ p: 3, mb: 4 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              <Restaurant sx={{ mr: 1, verticalAlign: "middle" }} />
              メニュー
            </Typography>
            <Typography variant="body1" color="text.secondary">
              お好みの商品をお選びください
            </Typography>
          </Box>
          <Badge badgeContent={getCartItemCount()} color="primary">
            <Button
              variant="outlined"
              startIcon={<ShoppingCart />}
              href="/cart"
              size="large"
            >
              カート
            </Button>
          </Badge>
        </Box>
      </Paper>

      {/* エラー表示 */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* 商品一覧 */}
      <Box
        display="grid"
        gridTemplateColumns={{
          xs: "1fr",
          sm: "repeat(2, 1fr)",
          md: "repeat(3, 1fr)",
        }}
        gap={3}
      >
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onAddToCart={handleAddToCart}
          />
        ))}
      </Box>

      {/* 商品がない場合のメッセージ */}
      {!loading && products.length === 0 && (
        <Box textAlign="center" py={8}>
          <Typography variant="h6" color="text.secondary">
            現在利用できる商品がありません
          </Typography>
        </Box>
      )}
    </Container>
  );
};

export default OrderPage;
