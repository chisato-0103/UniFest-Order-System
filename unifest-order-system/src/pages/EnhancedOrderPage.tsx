import { API_ENDPOINTS } from "../config/api";
import { useState, useEffect } from "react";
import {
  Typography,
  Box,
  Alert,
  Container,
  Skeleton,
  Fade,
} from "@mui/material";
import { useAppContext } from "../hooks/useAppContext";
import OrderCompletionDialog from "../components/OrderCompletionDialog";
import EnhancedHeader from "../components/EnhancedHeader";
import EnhancedProductCard from "../components/EnhancedProductCard";
import EnhancedCart from "../components/EnhancedCart";
import type { Order } from "../types";

interface SimpleProduct {
  id: string;
  name: string;
  price: number;
  category: string;
  description: string;
  available: boolean;
}

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

const EnhancedOrderPage: React.FC = () => {
  const { dispatch } = useAppContext();
  const [products, setProducts] = useState<SimpleProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cart, setCart] = useState<{ [key: string]: number }>({});
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);
  const [isOrderLoading, setIsOrderLoading] = useState(false);

  // 商品データの取得
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const response = await fetch(API_ENDPOINTS.products);
        if (!response.ok) {
          throw new Error("商品データの取得に失敗しました");
        }
        const data = await response.json();
        setProducts(data);
      } catch (err) {
        console.error("商品取得エラー:", err);
        setError(
          err instanceof Error ? err.message : "予期しないエラーが発生しました"
        );

        // フォールバック用のダミーデータ
        const fallbackProducts = [
          {
            id: "1",
            name: "たこ焼き 8個入り",
            price: 500,
            category: "たこ焼き",
            description: "定番のたこ焼き、アツアツでお届け",
            available: true,
          },
          {
            id: "2",
            name: "たこ焼き 12個入り",
            price: 700,
            category: "たこ焼き",
            description: "お得な12個入り、家族で楽しめる",
            available: true,
          },
          {
            id: "3",
            name: "特製たこ焼き 6個入り",
            price: 600,
            category: "たこ焼き",
            description: "特製だし入りのプレミアムたこ焼き",
            available: true,
          },
          {
            id: "4",
            name: "コーラ",
            price: 150,
            category: "ドリンク",
            description: "キンキンに冷えたコーラ",
            available: true,
          },
          {
            id: "5",
            name: "オレンジジュース",
            price: 150,
            category: "ドリンク",
            description: "100%オレンジジュース",
            available: true,
          },
          {
            id: "6",
            name: "焼きそば",
            price: 400,
            category: "サイドメニュー",
            description: "もちもち麺の特製焼きそば",
            available: false,
          },
        ];
        setProducts(fallbackProducts);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // カート操作
  const addToCart = (productId: string) => {
    setCart((prev) => ({
      ...prev,
      [productId]: (prev[productId] || 0) + 1,
    }));
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => {
      const newCart = { ...prev };
      if (newCart[productId] > 1) {
        newCart[productId] -= 1;
      } else {
        delete newCart[productId];
      }
      return newCart;
    });
  };

  // カート情報の計算
  const cartItems: CartItem[] = Object.entries(cart)
    .filter(([, quantity]) => quantity > 0)
    .map(([productId, quantity]) => {
      const product = products.find((p) => p.id === productId);
      return {
        id: productId,
        name: product?.name || "不明な商品",
        price: product?.price || 0,
        quantity,
      };
    });

  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  // 注文処理
  const handleOrder = async () => {
    if (cartItems.length === 0) return;

    setIsOrderLoading(true);
    try {
      // バックエンドのAPIで期待される形式に合わせて修正
      const orderData = {
        items: cartItems.map((item) => ({
          product_id: parseInt(item.id),
          quantity: item.quantity,
          toppings: [],
          cooking_instruction: "",
        })),
        payment_method: "現金",
        special_instructions: "",
      };

      console.log("注文データ:", orderData);

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
        console.error("レスポンスエラー:", errorText);
        throw new Error(`注文の処理に失敗しました: ${response.status}`);
      }

      // レスポンスボディを一度にすべて読み込み
      const responseText = await response.text();
      console.log("レスポンステキスト長:", responseText.length);
      console.log(
        "レスポンステキスト（最初の500文字）:",
        responseText.substring(0, 500)
      );

      let order;
      try {
        order = JSON.parse(responseText);
      } catch (parseError) {
        console.error("JSONパースエラー:", parseError);
        console.error(
          "レスポンス内容（最初の200文字）:",
          responseText.substring(0, 200)
        );

        // 簡易的なバックアップオブジェクトを作成
        const backupOrder = {
          success: true,
          data: {
            order_id: Date.now(),
            order_number: `BACKUP-${Date.now()}`,
            total_amount: totalPrice,
            status: "注文受付",
            payment_status: "未払い",
            items: cartItems,
            created_at: new Date().toISOString(),
          },
        };

        console.log("バックアップ注文データを使用します");
        order = backupOrder;
      }

      console.log("パースされた注文レスポンス:", order);

      // 注文完了（itemsをOrderItem型に変換して渡す）
      const rawOrder = order.data || order;
      const convertedOrder = {
        ...rawOrder,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        items: (rawOrder.items || []).map((item: any) => ({
          product_name: item.product_name || item.name || "",
          quantity: item.quantity,
          unit_price: item.unit_price || item.price || 0,
          total_price: item.total_price || item.price * item.quantity || 0,
          toppings: item.toppings || [],
          cooking_time: item.cooking_time || 0,
          cooking_instruction: item.cooking_instruction || "",
        })),
      };
      setCompletedOrder(convertedOrder);
      setCart({});
      setIsCartOpen(false);

      // グローバル状態を更新
      dispatch({
        type: "ADD_ORDER",
        payload: convertedOrder,
      });

      setError(null); // エラーをクリア
    } catch (err) {
      console.error("注文エラー:", err);
      const errorMessage =
        err instanceof Error ? err.message : "注文処理中にエラーが発生しました";
      setError(errorMessage);

      // エラーが発生した場合もある程度処理を続行する選択肢を提供
      if (
        errorMessage.includes("JSON") ||
        errorMessage.includes("無効なレスポンス")
      ) {
        setError(
          "サーバーとの通信に問題が発生しましたが、注文は受け付けられた可能性があります。店舗にお声かけください。"
        );
      }
    } finally {
      setIsOrderLoading(false);
    }
  };

  // カテゴリー別商品の整理
  const productsByCategory = products.reduce((acc, product) => {
    if (!acc[product.category]) {
      acc[product.category] = [];
    }
    acc[product.category].push(product);
    return acc;
  }, {} as { [key: string]: SimpleProduct[] });

  return (
    <Box
      sx={{
        minHeight: "100vh",
        backgroundColor: "#f8f9fa",
        width: "100%",
        margin: 0,
        padding: 0,
      }}
    >
      {/* ヘッダー */}
      <EnhancedHeader />

      <Container
        maxWidth="xl"
        sx={{
          pb: 10,
          px: { xs: 2, sm: 3, md: 4 },
          width: "100%",
          maxWidth: "100%",
        }}
      >
        {/* エラー表示 */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* 商品一覧 */}
        {loading ? (
          // ローディング表示
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "repeat(1, 1fr)",
                sm: "repeat(2, 1fr)",
                md: "repeat(3, 1fr)",
                lg: "repeat(4, 1fr)",
              },
              gap: 3,
              justifyItems: "center",
              width: "100%",
            }}
          >
            {[...Array(8)].map((_, index) => (
              <Skeleton
                key={index}
                variant="rectangular"
                width="100%"
                height={400}
                sx={{
                  borderRadius: 4,
                  maxWidth: 300,
                }}
              />
            ))}
          </Box>
        ) : (
          <Box sx={{ width: "100%" }}>
            {Object.entries(productsByCategory).map(
              ([category, categoryProducts]) => (
                <Fade in={true} timeout={800} key={category}>
                  <Box sx={{ mb: 6, width: "100%" }}>
                    <Typography
                      variant="h4"
                      sx={{
                        fontWeight: 600,
                        mb: 4,
                        textAlign: "center",
                        color: "#333",
                      }}
                    >
                      {category}
                    </Typography>
                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns: {
                          xs: "repeat(1, 1fr)",
                          sm: "repeat(2, 1fr)",
                          md: "repeat(3, 1fr)",
                          lg: "repeat(4, 1fr)",
                        },
                        gap: 3,
                        justifyContent: "center",
                        alignItems: "start",
                        width: "100%",
                        mx: "auto",
                        maxWidth: "1400px",
                      }}
                    >
                      {categoryProducts.map((product) => (
                        <Box
                          key={product.id}
                          sx={{
                            width: "100%",
                            maxWidth: 320,
                            mx: "auto",
                          }}
                        >
                          <EnhancedProductCard
                            product={product}
                            quantity={cart[product.id] || 0}
                            onAddToCart={addToCart}
                            onRemoveFromCart={removeFromCart}
                          />
                        </Box>
                      ))}
                    </Box>
                  </Box>
                </Fade>
              )
            )}
          </Box>
        )}
      </Container>

      {/* エンハンスドカート */}
      <EnhancedCart
        cartItems={cartItems}
        isOpen={isCartOpen}
        onOpen={() => setIsCartOpen(true)}
        onClose={() => setIsCartOpen(false)}
        onAddToCart={addToCart}
        onRemoveFromCart={removeFromCart}
        onOrder={handleOrder}
        totalItems={totalItems}
        totalPrice={totalPrice}
        isOrderLoading={isOrderLoading}
      />

      {/* 注文完了ダイアログ */}
      {completedOrder && (
        <OrderCompletionDialog
          order={completedOrder}
          open={!!completedOrder}
          onClose={() => setCompletedOrder(null)}
          estimatedTime={15}
        />
      )}
    </Box>
  );
};

export default EnhancedOrderPage;
