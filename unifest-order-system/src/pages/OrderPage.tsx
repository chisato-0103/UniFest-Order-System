// 🍽️ 注文ページ - 統一されたアーキテクチャ版
// ===============================
// このファイルは「注文ページ」のReactコンポーネントです。
// 商品一覧の取得・表示、カートへの追加、トッピング選択など、
// ユーザーが注文を行うための主要なUIとロジックを担います。
// MUI(Material UI)のコンポーネントを多用し、
// 状態管理はAppContext(グローバル)を利用しています。
// ===============================
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

// ===============================
// 商品カードコンポーネント
// 1つの商品を表示し、数量・トッピング選択、カート追加ボタンを提供
interface ProductCardProps {
  product: Product; // 商品情報
  onAddToCart: (
    product: Product,
    quantity: number,
    toppings: Topping[]
  ) => void; // カート追加時のコールバック
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onAddToCart }) => {
  // 数量の状態
  const [quantity, setQuantity] = useState(1);
  // 選択中トッピング
  const [selectedToppings, setSelectedToppings] = useState<Topping[]>([]);
  // 全トッピング一覧
  const [toppings, setToppings] = useState<Topping[]>([]);

  // トッピング一覧をAPIから取得
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

  // トッピングの選択・解除
  const handleToppingToggle = (topping: Topping) => {
    setSelectedToppings((prev) =>
      prev.find((t) => t.id === topping.id)
        ? prev.filter((t) => t.id !== topping.id)
        : [...prev, topping]
    );
  };

  // 合計金額を計算（商品＋トッピング）
  const getTotalPrice = () => {
    const toppingsPrice = selectedToppings.reduce(
      (sum, topping) => sum + topping.price,
      0
    );
    return (product.price + toppingsPrice) * quantity;
  };

  // カート追加ボタン押下時の処理
  const handleAddToCart = () => {
    onAddToCart(product, quantity, selectedToppings);
    setQuantity(1); // 数量リセット
    setSelectedToppings([]); // トッピングリセット
  };

  // 商品カードのUI
  return (
    <Card
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        opacity: product.available ? 1 : 0.6, // 売り切れ時は薄く表示
      }}
    >
      <CardContent sx={{ flexGrow: 1 }}>
        {/* 商品名・売り切れ表示 */}
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="start"
          mb={1}
        >
          <Typography variant="h6" component="h3" gutterBottom>
            {product.name}
          </Typography>
          {/* 売り切れラベル */}
          {!product.available && (
            <Chip label="売り切れ" color="error" size="small" />
          )}
        </Box>

        {/* 商品説明 */}
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {product.description}
        </Typography>

        {/* 価格・調理時間 */}
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

        {/* トッピング選択欄（トッピングが存在する場合のみ） */}
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

        {/* 数量選択欄 */}
        <Box
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          mb={2}
        >
          <Box display="flex" alignItems="center" gap={1}>
            {/* 数量減ボタン */}
            <Button
              size="small"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              disabled={quantity <= 1 || !product.available}
            >
              <Remove />
            </Button>
            {/* 数量表示 */}
            <Typography
              variant="body1"
              sx={{ minWidth: "2ch", textAlign: "center" }}
            >
              {quantity}
            </Typography>
            {/* 数量増ボタン */}
            <Button
              size="small"
              onClick={() => setQuantity(quantity + 1)}
              disabled={!product.available}
            >
              <Add />
            </Button>
          </Box>

          {/* 合計金額表示 */}
          <Typography variant="h6" color="primary">
            ¥{getTotalPrice().toLocaleString()}
          </Typography>
        </Box>

        {/* カート追加ボタン */}
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

// ===============================
// メイン注文ページコンポーネント
// 商品一覧の取得・表示、カートへの追加、エラー表示など全体の制御を行う
const OrderPage: React.FC = () => {
  // グローバル状態（カート等）
  const { state, dispatch } = useContext(AppContext);
  // 商品一覧
  const [products, setProducts] = useState<Product[]>([]);
  // ローディング状態
  const [loading, setLoading] = useState(true);
  // エラー状態
  const [error, setError] = useState<string | null>(null);

  // 初回マウント時に商品一覧をAPIから取得
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

  // カート追加時の処理（AppContext経由でグローバルに反映）
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

  // カート内アイテム数を取得
  const getCartItemCount = () => {
    return state.cart.itemCount;
  };

  // ローディング中はスピナー表示
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

  // メインUI
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* ヘッダー部分（タイトル・カートボタン） */}
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
          {/* カートボタン（バッジで個数表示） */}
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

      {/* エラー表示（API失敗時） */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* 商品一覧グリッド */}
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

      {/* 商品が0件の場合のメッセージ */}
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

// ===============================
// エクスポート
export default OrderPage;
