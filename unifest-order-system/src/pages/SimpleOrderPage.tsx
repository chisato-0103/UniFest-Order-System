import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Chip,
  IconButton,
  Divider,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  ShoppingCart as CartIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";
import { useState, useEffect } from "react";
import QRCodeGenerator from "../components/QRCodeGenerator";
import MockApi from "../services/mockApi";
import CustomerNavigationBar from "../components/CustomerNavigationBar";

interface Product {
  product_id: number;
  product_name: string;
  price: string;
  category_name: string;
  stock_quantity: number;
  status: string;
  description?: string;
  cooking_time: number;
  available_toppings: Array<{
    topping_id: number;
    topping_name: string;
    price: number;
  }>;
}

interface CartItem {
  product_id: number;
  product_name: string;
  price: number;
  quantity: number;
  total: number;
}

interface CompletedOrder {
  order_number: string;
  total_amount: number;
  order_id: number;
  status: string;
  created_at: string;
}

const SimpleOrderPage: React.FC = () => {
  const [count, setCount] = useState(0);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [orderLoading, setOrderLoading] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<CompletedOrder | null>(
    null
  );

  // カートの合計金額を計算
  const cartTotal = cart.reduce((total, item) => total + item.total, 0);
  const cartItemCount = cart.reduce((total, item) => total + item.quantity, 0);

  // カートに商品を追加
  const addToCart = (product: Product) => {
    console.log("🛒 カートに追加クリック:", product);
    console.log("🛒 現在のカート:", cart);
    console.log("🛒 商品の価格:", product.price, "型:", typeof product.price);

    const price = parseFloat(product.price);
    console.log("🛒 変換後の価格:", price);

    const existingItem = cart.find(
      (item) => item.product_id === product.product_id
    );
    console.log("🛒 既存アイテム:", existingItem);

    if (existingItem) {
      // 既存の商品の場合、数量を増やす
      console.log("🛒 既存商品の数量を増やします");
      setCart(
        cart.map((item) =>
          item.product_id === product.product_id
            ? {
                ...item,
                quantity: item.quantity + 1,
                total: (item.quantity + 1) * price,
              }
            : item
        )
      );
    } else {
      // 新しい商品の場合、カートに追加
      console.log("🛒 新しい商品をカートに追加します");
      const newItem = {
        product_id: product.product_id,
        product_name: product.product_name,
        price: price,
        quantity: 1,
        total: price,
      };
      console.log("🛒 新しいアイテム:", newItem);
      setCart([...cart, newItem]);
    }

    console.log("🛒 カート追加処理完了");
  };

  // カートから商品を削除
  const removeFromCart = (productId: number) => {
    setCart(cart.filter((item) => item.product_id !== productId));
  };

  // カートの商品数量を変更
  const updateCartQuantity = (productId: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setCart(
      cart.map((item) =>
        item.product_id === productId
          ? { ...item, quantity: newQuantity, total: newQuantity * item.price }
          : item
      )
    );
  };

  // カートをクリア
  const clearCart = () => {
    setCart([]);
  };

  // 注文確定処理
  const handleOrderSubmit = async () => {
    if (cart.length === 0) {
      alert("カートが空です");
      return;
    }

    try {
      setOrderLoading(true);

      // 注文データの準備（個人情報なし）
      const orderData = {
        items: cart.map((item) => ({
          id: item.product_id.toString(),
          name: item.product_name,
          price: item.price,
          quantity: item.quantity,
          totalPrice: item.total,
          toppings: [], // 必須フィールドを追加
          category: "たこ焼き",
          description: item.product_name,
          available: true,
        })),
        total: cartTotal,
      };

      console.log("注文データ:", orderData);

      // モックAPIを使用
      const result = await MockApi.createOrder(orderData);
      console.log("注文結果:", result);
      console.log(
        "🔔 注文が正常に作成されました - 他のページが自動で更新されます"
      );

      // CompletedOrder形式に変換
      const completedOrder: CompletedOrder = {
        order_id: parseInt(result.data.id),
        order_number: result.data.orderNumber,
        total_amount: result.data.total,
        status: result.data.status,
        created_at: result.data.createdAt.toISOString(),
      };

      setCompletedOrder(completedOrder);
      setOrderComplete(true);
      clearCart();
      alert(
        `注文が確定しました！注文番号: ${result.data.orderNumber}\n\n厨房画面や店舗監視画面で確認できます。`
      );

      console.log(
        "🔔 注文完了処理が終了しました。他のページで注文が表示されるまで数秒お待ちください。"
      );
    } catch (err) {
      console.error("注文エラー:", err);
      alert(
        `注文に失敗しました: ${
          err instanceof Error ? err.message : "不明なエラー"
        }`
      );
    } finally {
      setOrderLoading(false);
    }
  };

  // データリセット機能（デバッグ用）
  const handleResetData = async () => {
    if (window.confirm("全ての注文データをリセットしますか？")) {
      try {
        await MockApi.resetData();
        alert("データがリセットされました！");
        // ページをリロード
        window.location.reload();
      } catch (error) {
        console.error("データリセットエラー:", error);
        alert("データリセットに失敗しました");
      }
    }
  };

  // カートの変更を監視
  useEffect(() => {
    console.log("🛒 カート状態が変更されました:", cart);
    console.log("🛒 カート内のアイテム数:", cart.length);
    console.log("🛒 カート内の商品数:", cartItemCount);
    console.log("🛒 カート合計金額:", cartTotal);
  }, [cart, cartItemCount, cartTotal]);

  // 商品データを取得
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        console.log("商品データの取得を開始します...");
        setLoading(true);

        // モックAPIを使用
        const response = await MockApi.getProducts();
        console.log("取得したデータ:", response.data);

        // モックデータをコンポーネントの型に変換
        const convertedProducts: Product[] = response.data.map((product) => ({
          product_id: parseInt(product.id),
          product_name: product.name,
          price: product.price.toString(),
          category_name: product.category,
          stock_quantity: 100, // デフォルト値
          status: product.available ? "有効" : "無効",
          description: product.description,
          cooking_time: product.preparationTime || 5,
          available_toppings: [], // 空配列
        }));

        setProducts(convertedProducts);
        console.log("商品データ設定完了:", convertedProducts.length, "件");
        console.log("変換後の商品データ:", convertedProducts);
      } catch (err) {
        console.error("商品データの取得に失敗しました:", err);
        setError(
          err instanceof Error ? err.message : "不明なエラーが発生しました"
        );
      } finally {
        setLoading(false);
        console.log("商品データ取得処理完了");
      }
    };

    fetchProducts();
  }, []);

  console.log(
    "Component render - loading:",
    loading,
    "error:",
    error,
    "products:",
    products.length
  );

  return (
    <>
      <CustomerNavigationBar title="注文" />
      <Box sx={{ p: 3, maxWidth: 1200, mx: "auto" }}>
        <Typography variant="h4" component="h1" gutterBottom textAlign="center">
          🥢 UniFest たこ焼き注文システム
        </Typography>
        <Typography
          variant="h6"
          color="text.secondary"
          gutterBottom
          textAlign="center"
        >
          美味しいたこ焼きをご注文ください 🐙
        </Typography>

        {/* デバッグ情報 */}
        <Alert severity="info" sx={{ mb: 2 }}>
          Debug Info - Loading: {loading ? "true" : "false"}, Error:{" "}
          {error || "none"}, Products: {products.length}
          <Button
            size="small"
            color="error"
            onClick={handleResetData}
            sx={{ ml: 2 }}
          >
            データリセット
          </Button>
          <Button
            size="small"
            color="primary"
            onClick={() => (window.location.href = "/navigation")}
            sx={{ ml: 1 }}
          >
            📋 全ページ一覧
          </Button>
          <Button
            size="small"
            color="secondary"
            onClick={() => (window.location.href = "/admin-login")}
            sx={{ ml: 1 }}
          >
            🛠️ 管理者
          </Button>
        </Alert>

        {/* カート表示ボタン */}
        <Box sx={{ textAlign: "center", mb: 3 }}>
          <Button
            variant="contained"
            startIcon={<CartIcon />}
            onClick={() => setShowCart(!showCart)}
            sx={{ mr: 2 }}
          >
            カート ({cartItemCount})
          </Button>
          {cartTotal > 0 && (
            <Chip
              label={`合計: ¥${cartTotal.toLocaleString()}`}
              color="primary"
              variant="outlined"
            />
          )}
        </Box>

        {/* クイックナビゲーション */}
        <Box sx={{ textAlign: "center", mb: 3 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            他のページをご覧になりたい場合は：
          </Typography>
          <Button
            variant="outlined"
            size="small"
            onClick={() => (window.location.href = "/")}
            sx={{ mr: 1, mb: 1 }}
          >
            📋 全ページ一覧
          </Button>
          <Button
            variant="outlined"
            size="small"
            onClick={() => (window.location.href = "/customer-status")}
            sx={{ mr: 1, mb: 1 }}
          >
            📱 注文状況確認
          </Button>
          <Button
            variant="outlined"
            size="small"
            onClick={() => (window.location.href = "/admin-login")}
            sx={{ mb: 1 }}
          >
            🛠️ 管理者画面
          </Button>
        </Box>

        {/* カート表示部分 */}
        {showCart && (
          <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              カート内容
            </Typography>
            {cart.length === 0 ? (
              <Typography color="text.secondary">カートは空です</Typography>
            ) : (
              <>
                {cart.map((item) => (
                  <Box
                    key={item.product_id}
                    sx={{ display: "flex", alignItems: "center", mb: 2 }}
                  >
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="subtitle1">
                        {item.product_name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        ¥{item.price.toLocaleString()} × {item.quantity} = ¥
                        {item.total.toLocaleString()}
                      </Typography>
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <IconButton
                        size="small"
                        onClick={() =>
                          updateCartQuantity(item.product_id, item.quantity - 1)
                        }
                      >
                        <RemoveIcon />
                      </IconButton>
                      <Typography>{item.quantity}</Typography>
                      <IconButton
                        size="small"
                        onClick={() =>
                          updateCartQuantity(item.product_id, item.quantity + 1)
                        }
                      >
                        <AddIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => removeFromCart(item.product_id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </Box>
                ))}
                <Divider sx={{ my: 2 }} />
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Typography variant="h6">
                    合計: ¥{cartTotal.toLocaleString()}
                  </Typography>
                  <Box>
                    <Button
                      onClick={clearCart}
                      sx={{ mr: 1 }}
                      disabled={orderLoading}
                    >
                      カートをクリア
                    </Button>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={handleOrderSubmit}
                      disabled={orderLoading || cart.length === 0}
                      startIcon={
                        orderLoading ? <CircularProgress size={20} /> : null
                      }
                    >
                      {orderLoading ? "注文中..." : "注文する"}
                    </Button>
                  </Box>
                </Box>
              </>
            )}
          </Paper>
        )}

        <Box sx={{ mt: 3, mb: 4, textAlign: "center" }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            テストカウンター: {count}
          </Typography>
          <Button
            variant="contained"
            onClick={() => setCount(count + 1)}
            sx={{ mr: 2 }}
          >
            +1
          </Button>
          <Button variant="outlined" onClick={() => setCount(0)}>
            リセット
          </Button>
        </Box>

        {/* 商品一覧セクション */}
        <Typography variant="h5" component="h2" gutterBottom sx={{ mt: 4 }}>
          商品一覧
        </Typography>

        {loading && (
          <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
            <CircularProgress />
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            商品データの読み込みに失敗しました: {error}
          </Alert>
        )}

        {!loading && !error && products.length === 0 && (
          <Alert severity="info" sx={{ mb: 2 }}>
            商品データが見つかりません
          </Alert>
        )}

        {!loading && !error && products.length > 0 && (
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: 3,
              mt: 2,
            }}
          >
            {products.map((product) => (
              <Card key={product.product_id} sx={{ height: "100%" }}>
                <CardContent>
                  <Typography variant="h6" component="h3" gutterBottom>
                    {product.product_name}
                  </Typography>
                  <Typography variant="h5" color="primary" gutterBottom>
                    ¥{parseFloat(product.price).toLocaleString()}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    gutterBottom
                  >
                    カテゴリ: {product.category_name}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    gutterBottom
                  >
                    調理時間: {product.cooking_time}分
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    gutterBottom
                  >
                    在庫: {product.stock_quantity}個
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    gutterBottom
                  >
                    ステータス: {product.status}
                  </Typography>
                  {product.description && (
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      {product.description}
                    </Typography>
                  )}
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      利用可能なトッピング:
                    </Typography>
                    {product.available_toppings.map((topping) => (
                      <Typography
                        key={topping.topping_id}
                        variant="body2"
                        sx={{ ml: 1 }}
                      >
                        • {topping.topping_name}
                        {topping.price > 0 && ` (+¥${topping.price})`}
                      </Typography>
                    ))}
                  </Box>
                  <Box sx={{ mt: 2, textAlign: "center" }}>
                    <Button
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={() => {
                        console.log("🛒 ボタンクリック - 商品:", product);
                        console.log(
                          "🛒 ボタンクリック - 在庫:",
                          product.stock_quantity
                        );
                        console.log(
                          "🛒 ボタンクリック - ステータス:",
                          product.status
                        );
                        addToCart(product);
                      }}
                      disabled={
                        product.stock_quantity === 0 ||
                        product.status !== "有効"
                      }
                      fullWidth
                    >
                      カートに追加
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>
        )}

        {/* 注文完了ダイアログ */}
        <Dialog
          open={orderComplete}
          onClose={() => setOrderComplete(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            <Typography
              variant="h5"
              component="div"
              sx={{ textAlign: "center", color: "success.main" }}
            >
              🎉 注文完了！
            </Typography>
          </DialogTitle>
          <DialogContent>
            {completedOrder && (
              <Box sx={{ textAlign: "center", py: 2 }}>
                <Typography variant="h6" gutterBottom>
                  注文番号: <strong>{completedOrder.order_number}</strong>
                </Typography>
                <Typography variant="body1" gutterBottom>
                  合計金額: ¥{completedOrder.total_amount?.toLocaleString()}
                </Typography>

                {/* QRコード表示 */}
                <Box sx={{ my: 3 }}>
                  <QRCodeGenerator
                    orderNumber={completedOrder.order_number}
                    size={180}
                    showDownload={false}
                  />
                </Box>

                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: 2 }}
                >
                  上記のQRコードを受取時にスタッフにお見せください。
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  調理完了時に注文番号でお呼びします。
                </Typography>
              </Box>
            )}
          </DialogContent>
          <DialogActions sx={{ justifyContent: "center", pb: 3 }}>
            <Button
              variant="contained"
              onClick={() => setOrderComplete(false)}
              size="large"
            >
              OK
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </>
  );
};

export default SimpleOrderPage;
