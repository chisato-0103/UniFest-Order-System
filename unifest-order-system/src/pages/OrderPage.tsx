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
import { Link as RouterLink } from "react-router-dom";
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
        opacity: product.available ? 1 : 0.6,
        p: { xs: 0.7, sm: 2 },
        mb: { xs: 1, sm: 2 },
        borderRadius: { xs: 2, sm: 3 },
        boxShadow: { xs: 1, sm: 3 },
      }}
    >
      <CardContent sx={{ flexGrow: 1, p: { xs: 0.7, sm: 2 } }}>
        {/* 商品名・売り切れ表示 */}
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="start"
          mb={{ xs: 0.5, sm: 1 }}
        >
          <Typography
            variant="subtitle1"
            component="h3"
            gutterBottom
            sx={{ fontSize: { xs: "1rem", sm: "1.25rem" }, fontWeight: 600 }}
          >
            {product.name}
          </Typography>
          {/* 売り切れラベル */}
          {!product.available && (
            <Chip
              label="売り切れ"
              color="error"
              size="small"
              sx={{
                fontSize: { xs: "0.8rem", sm: "0.95rem" },
                height: { xs: 20, sm: 24 },
                px: { xs: 1, sm: 2 },
              }}
            />
          )}
        </Box>

        {/* 商品説明 */}
        <Typography
          variant="body2"
          color="text.secondary"
          gutterBottom
          sx={{
            fontSize: { xs: "0.85rem", sm: "1rem" },
            lineHeight: 1.5,
            mb: { xs: 0.5, sm: 1 },
          }}
        >
          {product.description}
        </Typography>

        {/* 価格・調理時間 */}
        <Box display="flex" alignItems="center" gap={1} mb={{ xs: 1, sm: 2 }}>
          <Typography
            variant="subtitle1"
            color="primary"
            sx={{ fontSize: { xs: "1rem", sm: "1.15rem" }, fontWeight: 600 }}
          >
            ¥{product.price.toLocaleString()}
          </Typography>
          <Chip
            icon={<AccessTime sx={{ fontSize: { xs: 16, sm: 20 } }} />}
            label={`${product.preparationTime || 10}分`}
            size="small"
            variant="outlined"
            sx={{
              fontSize: { xs: "0.8rem", sm: "0.95rem" },
              height: { xs: 20, sm: 24 },
              px: { xs: 1, sm: 2 },
            }}
          />
        </Box>

        {/* トッピング選択欄（トッピングが存在する場合のみ） */}
        {toppings.length > 0 && (
          <Box mb={{ xs: 1, sm: 2 }}>
            <Typography
              variant="subtitle2"
              gutterBottom
              sx={{
                fontSize: { xs: "0.9rem", sm: "1rem" },
                fontWeight: 500,
                mb: { xs: 0.5, sm: 1 },
              }}
            >
              トッピング
            </Typography>
            <Box display="flex" flexWrap="wrap" gap={{ xs: 0.5, sm: 1 }}>
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
                  sx={{
                    fontSize: { xs: "0.8rem", sm: "0.95rem" },
                    height: { xs: 20, sm: 24 },
                    px: { xs: 1, sm: 2 },
                  }}
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
          mb={{ xs: 1, sm: 2 }}
        >
          <Box display="flex" alignItems="center" gap={{ xs: 0.5, sm: 1 }}>
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
              variant="body2"
              sx={{
                minWidth: "2ch",
                textAlign: "center",
                fontSize: { xs: "0.95rem", sm: "1.05rem" },
                fontWeight: 600,
                px: { xs: 0.5, sm: 1 },
              }}
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
          <Typography
            variant="subtitle1"
            color="primary"
            sx={{ fontSize: { xs: "1rem", sm: "1.15rem" }, fontWeight: 600 }}
          >
            ¥{getTotalPrice().toLocaleString()}
          </Typography>
        </Box>

        {/* カート追加ボタン */}
        <Button
          variant="contained"
          fullWidth
          startIcon={<ShoppingCart sx={{ fontSize: { xs: 18, sm: 22 } }} />}
          onClick={handleAddToCart}
          disabled={!product.available}
          sx={{
            py: { xs: 0.5, sm: 1 },
            fontSize: { xs: "0.9rem", sm: "1rem" },
            fontWeight: 600,
            borderRadius: { xs: 2, sm: 3 },
          }}
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
        
        // 在庫情報を含む商品データを取得し、利用可能な商品のみフィルタリング
        const availableProducts = productsData.filter(product => {
          // 商品が有効で在庫がある場合のみ表示
          return product.status === "active" && 
                 product.is_available !== false && 
                 (product.stock_quantity === undefined || product.stock_quantity > 0);
        });
        
        setProducts(availableProducts);
      } catch (err) {
        console.error("商品読み込みエラー:", err);
        setError("商品の読み込みに失敗しました");
      } finally {
        setLoading(false);
      }
    };
    loadProducts();
    
    // 30秒ごとに商品情報を更新（在庫状況の変化を反映）
    const interval = setInterval(loadProducts, 30000);
    
    return () => clearInterval(interval);
  }, []);

  // カート追加時の処理（AppContext経由でグローバルに反映）
  const handleAddToCart = (
    product: Product,
    quantity: number,
    toppings: Topping[]
  ) => {
    // 商品IDが空文字・inull・NaNの場合はカート追加不可
    if (!product.id || isNaN(Number(product.id))) {
      alert(
        "商品IDが不正なためカートに追加できません。管理者にご連絡ください。"
      );
      return;
    }
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
      <Container maxWidth="xl" sx={{ py: { xs: 2, sm: 4 } }}>
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight={{ xs: "40vh", sm: "50vh" }}
        >
          <CircularProgress size={32} />
        </Box>
      </Container>
    );
  }

  // メインUI
  return (
    <Container maxWidth="xl" sx={{ py: { xs: 2, sm: 4 } }}>
      {/* ヘッダー部分（タイトル・カートボタン） */}
      <Paper
        elevation={2}
        sx={{
          p: { xs: 1, sm: 2 },
          mb: { xs: 1.5, sm: 3 },
          borderRadius: { xs: 2, sm: 3 },
        }}
      >
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography
              variant="h5"
              component="h1"
              gutterBottom
              sx={{
                fontSize: { xs: "1.1rem", sm: "1.7rem", lg: "2rem" },
                fontWeight: 700,
                mb: { xs: 0.5, sm: 1 },
              }}
            >
              <Restaurant
                sx={{
                  mr: 1,
                  verticalAlign: "middle",
                  fontSize: { xs: 18, sm: 28, lg: 32 },
                }}
              />
              メニュー
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                fontSize: { xs: "0.9rem", sm: "1rem" },
                mb: { xs: 0.5, sm: 1 },
              }}
            >
              お好みの商品をお選びください
            </Typography>
          </Box>
          {/* カートボタン（バッジで個数表示） */}
          <Badge
            badgeContent={getCartItemCount()}
            color="primary"
            sx={{
              "& .MuiBadge-badge": {
                fontSize: { xs: "0.8rem", sm: "1rem" },
                minWidth: { xs: 18, sm: 22 },
                height: { xs: 18, sm: 22 },
              },
            }}
          >
            <Button
              component={RouterLink}
              to="/cart"
              variant="outlined"
              startIcon={<ShoppingCart sx={{ fontSize: { xs: 16, sm: 22 } }} />}
              size="small"
              sx={{
                py: { xs: 0.4, sm: 0.8 },
                px: { xs: 1, sm: 2 },
                fontSize: { xs: "0.85rem", sm: "1rem" },
                fontWeight: 600,
                borderRadius: { xs: 2, sm: 3 },
              }}
            >
              カート
            </Button>
          </Badge>
        </Box>
      </Paper>

      {/* エラー表示（API失敗時） */}
      {error && (
        <Alert
          severity="error"
          sx={{
            mb: { xs: 1.5, sm: 2.5 },
            fontSize: { xs: "0.9rem", sm: "1rem" },
            py: { xs: 0.7, sm: 1.2 },
            px: { xs: 1, sm: 2 },
            alignItems: "center",
            icon: { fontSize: { xs: 20, sm: 24 } },
          }}
        >
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
          lg: "repeat(4, 1fr)",
          xl: "repeat(5, 1fr)",
        }}
        sx={{ gap: { xs: 1, sm: 2 }, mb: { xs: 1, sm: 2 } }}
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
        <Box textAlign="center" py={{ xs: 2, sm: 4 }}>
          <Typography
            variant="subtitle1"
            color="text.secondary"
            sx={{ fontSize: { xs: "0.95rem", sm: "1.1rem" }, fontWeight: 500 }}
          >
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
