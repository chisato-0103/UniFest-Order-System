// 🛒 カート専用ページ
// お客さんがカートの中身を確認して、注文を確定できるページです
// 商品の追加・削除、合計金額の確認、注文確定ができます

import React, { useState } from "react"; // Reactの基本機能
import {
  Container, // 全体を囲む容器
  Typography, // 文字表示
  Box, // レイアウト用の箱
  Card, // カード表示
  CardContent, // カードの中身
  Button, // ボタン
  List, // リスト表示
  ListItem, // リストの項目
  ListItemText, // リスト項目のテキスト
  ListItemSecondaryAction, // リスト項目の右側
  IconButton, // アイコンボタン
  Divider, // 区切り線
  Chip, // 小さなタグ
  Paper, // 紙のような背景
} from "@mui/material";
import {
  Add as AddIcon, // プラスアイコン
  Remove as RemoveIcon, // マイナスアイコン
  Delete as DeleteIcon, // 削除アイコン
  ShoppingCart as CartIcon, // カートアイコン
  ArrowBack as BackIcon, // 戻るアイコン
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom"; // ページ移動の道具
import { useAppContext } from "../hooks/useAppContext"; // カート状態管理
import CustomerNavigationBar from "../components/CustomerNavigationBar"; // お客さん用ナビバー
import { OrderService, ApiError } from "../services/apiService"; // 統一API通信サービス
import type { OrderItemForApi } from "./../services/orderTypes";

// 🛒 カートページの部品
const CartPage: React.FC = () => {
  const navigate = useNavigate(); // ページ移動機能
  const { state, dispatch } = useAppContext(); // アプリ状態管理
  const [isOrdering, setIsOrdering] = useState(false); // 注文処理中かどうか

  const cart = state.cart; // カート情報を取得

  // 🧪 テスト用：ダミー商品をカートに追加
  const addTestProduct = () => {
    dispatch({
      type: "ADD_TO_CART",
      payload: {
        product: {
          id: "test-1",
          name: "テスト用たこ焼き 8個入り",
          price: 650,
          category: "メイン",
          description: "テスト用商品です",
          available: true,
        },
        quantity: 1,
        toppings: [
          {
            id: "topping-1",
            name: "青のり",
            price: 50,
            available: true,
          },
        ],
      },
    });
  };

  // 🔧 カート操作関数
  const updateCartItemQuantity = (index: number, quantity: number) => {
    dispatch({
      type: "UPDATE_CART_ITEM",
      payload: { index, quantity },
    });
  };

  const removeFromCart = (index: number) => {
    dispatch({
      type: "REMOVE_FROM_CART",
      payload: index,
    });
  };

  const clearCart = () => {
    dispatch({ type: "CLEAR_CART" });
  };

  //  合計金額を計算する関数
  const calculateTotal = () => {
    return cart.items.reduce((total, item) => {
      const itemTotal = item.price * item.quantity;
      const toppingsTotal =
        item.toppings?.reduce((sum, topping) => sum + topping.price, 0) || 0;
      return total + itemTotal + toppingsTotal * item.quantity;
    }, 0);
  };

  // 📝 注文確定処理（統一APIサービス使用）
  const handlePlaceOrder = async () => {
    if (cart.items.length === 0) {
      alert("カートが空です！");
      return;
    }

    setIsOrdering(true);

    try {
      // � テスト商品やidが数値でない商品が含まれていないかチェック
      const invalidItem = cart.items.find((item) => isNaN(Number(item.id)));
      if (invalidItem) {
        alert(
          "カート内に本番商品でない商品（テスト商品やidが数値でない商品）が含まれています。注文できません。"
        );
        setIsOrdering(false);
        return;
      }

      // toppingsをバックエンド期待形式（topping_id付き）に変換
      const itemsForApi = cart.items.map((item) => ({
        ...item,
        product_id: Number(item.id), // 数値型に変換
        toppings: (item.toppings || []).map((t) => ({
          topping_id: t.id,
          name: t.name,
          price: t.price,
        })),
        // 必要ならcooking_instruction等もここで付与
      }));

      const order = await OrderService.createOrder({
        items: itemsForApi as OrderItemForApi[], // 型安全にAPI送信
        totalAmount: calculateTotal(),
        paymentMethod: "cash",
        specialInstructions: "",
      });

      console.log("注文完了:", order);

      // カートをクリア
      dispatch({ type: "CLEAR_CART" });

      alert(`注文が完了しました！\n注文番号: ${order.orderNumber || order.id}`);

      // 支払い画面に移動（注文番号を渡す）
      navigate(`/payment?order=${order.orderNumber || order.id}`);
    } catch (error) {
      console.error("注文エラー:", error);

      let errorMessage = "注文に失敗しました。もう一度お試しください。";
      if (error instanceof ApiError) {
        errorMessage = `注文エラー: ${error.message}`;
      } else if (error instanceof Error) {
        errorMessage = `注文エラー: ${error.message}`;
      }

      alert(errorMessage);
    } finally {
      setIsOrdering(false);
    }
  };

  return (
    <>
      <CustomerNavigationBar />
      <Container maxWidth="md" sx={{ py: 4 }}>
        {/* 🎯 ページタイトル */}
        <Box sx={{ mb: 3, display: "flex", alignItems: "center", gap: 2 }}>
          <IconButton onClick={() => navigate("/order")} color="primary">
            <BackIcon />
          </IconButton>
          <Typography variant="h4" component="h1" sx={{ fontWeight: "bold" }}>
            🛒 カート
          </Typography>
          {/* 🧪 テスト用ボタン */}
          <Button
            variant="outlined"
            size="small"
            onClick={addTestProduct}
            sx={{ ml: "auto" }}
          >
            テスト商品追加
          </Button>
        </Box>

        {/* 📦 カートの中身 */}
        {cart.items.length === 0 ? (
          // 🈳 カートが空の場合
          <Card>
            <CardContent sx={{ textAlign: "center", py: 6 }}>
              <CartIcon sx={{ fontSize: 64, color: "grey.300", mb: 2 }} />
              <Typography variant="h6" color="textSecondary" gutterBottom>
                カートは空です
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                商品を選んでカートに追加してください
              </Typography>
              <Button
                variant="contained"
                onClick={() => navigate("/order")}
                size="large"
              >
                商品を選ぶ
              </Button>
            </CardContent>
          </Card>
        ) : (
          // 🛍️ カートに商品がある場合
          <>
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  注文内容（{cart.items.length}品目）
                </Typography>
                <List>
                  {cart.items.map((item, index) => (
                    <React.Fragment key={index}>
                      <ListItem>
                        <ListItemText
                          primary={
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                              }}
                            >
                              <Typography variant="subtitle1" fontWeight="bold">
                                {item.name}
                              </Typography>
                              <Chip
                                label={`${item.quantity}個`}
                                size="small"
                                color="primary"
                              />
                            </Box>
                          }
                          secondary={
                            <Box>
                              <Typography variant="body2" color="textSecondary">
                                単価: ¥{item.price.toLocaleString()}
                              </Typography>
                              {item.toppings && item.toppings.length > 0 && (
                                <Typography
                                  variant="body2"
                                  color="textSecondary"
                                >
                                  トッピング:{" "}
                                  {item.toppings.map((t) => t.name).join(", ")}
                                  (+¥
                                  {item.toppings
                                    .reduce((sum, t) => sum + t.price, 0)
                                    .toLocaleString()}
                                  )
                                </Typography>
                              )}
                              <Typography
                                variant="subtitle2"
                                color="primary"
                                fontWeight="bold"
                              >
                                小計: ¥
                                {(
                                  item.price * item.quantity +
                                  (item.toppings?.reduce(
                                    (sum, t) => sum + t.price,
                                    0
                                  ) || 0) *
                                    item.quantity
                                ).toLocaleString()}
                              </Typography>
                            </Box>
                          }
                        />
                        <ListItemSecondaryAction>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                            }}
                          >
                            {/* 数量変更ボタン */}
                            <IconButton
                              size="small"
                              onClick={() =>
                                updateCartItemQuantity(
                                  index,
                                  Math.max(1, item.quantity - 1)
                                )
                              }
                              disabled={item.quantity <= 1}
                            >
                              <RemoveIcon />
                            </IconButton>
                            <Typography
                              sx={{ minWidth: 30, textAlign: "center" }}
                            >
                              {item.quantity}
                            </Typography>
                            <IconButton
                              size="small"
                              onClick={() =>
                                updateCartItemQuantity(index, item.quantity + 1)
                              }
                            >
                              <AddIcon />
                            </IconButton>
                            {/* 削除ボタン */}
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => removeFromCart(index)}
                              sx={{ ml: 1 }}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Box>
                        </ListItemSecondaryAction>
                      </ListItem>
                      {index < cart.items.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              </CardContent>
            </Card>

            {/* 💰 合計金額 */}
            <Paper sx={{ p: 3, mb: 3, bgcolor: "primary.50" }}>
              <Typography
                variant="h5"
                align="center"
                fontWeight="bold"
                color="primary"
              >
                合計: ¥{calculateTotal().toLocaleString()}
              </Typography>
            </Paper>

            {/* 🎮 操作ボタン */}
            <Box
              sx={{ display: "flex", gap: 2, justifyContent: "space-between" }}
            >
              <Button
                variant="outlined"
                color="error"
                onClick={clearCart}
                disabled={isOrdering}
              >
                カートを空にする
              </Button>

              <Box sx={{ display: "flex", gap: 2 }}>
                <Button
                  variant="outlined"
                  onClick={() => navigate("/order")}
                  disabled={isOrdering}
                >
                  買い物を続ける
                </Button>

                <Button
                  variant="contained"
                  size="large"
                  onClick={handlePlaceOrder}
                  disabled={isOrdering}
                  sx={{ px: 4 }}
                >
                  {isOrdering ? "注文中..." : "注文確定"}
                </Button>
              </Box>
            </Box>
          </>
        )}
      </Container>
    </>
  );
};

export default CartPage;
