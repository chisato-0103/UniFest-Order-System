// 🛒 カート専用ページ
// お客さんがカートの中身を確認して、注文を確定できるページです
// 商品の追加・削除、合計金額の確認、注文確定ができます

import React, { useState } from "react"; // Reactの基本機能
import OrderCompletionDialog from "../components/OrderCompletionDialog";
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
// ナビゲーションバーはApp.tsxで共通表示
import { OrderService, ApiError } from "../services/apiService"; // 統一API通信サービス
import type { OrderItemForApi } from "./../services/orderTypes";

// 🛒 カートページの部品
const CartPage: React.FC = () => {
  const navigate = useNavigate(); // ページ移動機能
  const { state, dispatch } = useAppContext(); // アプリ状態管理
  const [isOrdering, setIsOrdering] = useState(false); // 注文処理中かどうか

  const cart = state.cart; // カート情報を取得

  // 注文完了ダイアログ表示用
  const [orderDialogOpen, setOrderDialogOpen] = useState(false);
  const [completedOrder, setCompletedOrder] = useState(null);
  const [estimatedTime] = useState(10); // 仮: 10分

  // 🧪 テスト用：ダミー商品をカートに追加（本番では未使用のため削除）

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
      // デバッグ: カート内idの型と値を全て出力
      cart.items.forEach((item, idx) => {
        const isInvalid = isNaN(Number(item.id));
        console.log(
          `cart.items[${idx}].id:`,
          item.id,
          "typeof:",
          typeof item.id,
          "isNaN:",
          isInvalid
        );
      });
      // テスト商品やidが数値でない商品が含まれていないかチェック
      const invalidItem = cart.items.find((item) => isNaN(Number(item.id)));
      if (invalidItem) {
        alert(
          "カート内に本番商品でない商品（テスト商品やidが数値でない商品）が含まれています。注文できません。"
        );
        setIsOrdering(false);
        return;
      }

      // デバッグ: cart.itemsの中身を出力
      console.log("[DEBUG] cart.items:", JSON.stringify(cart.items, null, 2));

      // toppingsをバックエンド期待形式（topping_id付き）に変換
      const itemsForApi = cart.items.map((item) => {
        // product_idはCartItemのid（string）またはproduct.id（string）から取得
        let product_id: number | undefined = undefined;
        if (typeof item.id === "string" && !isNaN(Number(item.id))) {
          product_id = Number(item.id);
        } else if (
          item.product &&
          typeof item.product.id === "string" &&
          !isNaN(Number(item.product.id))
        ) {
          product_id = Number(item.product.id);
        }
        if (typeof product_id !== "number" || isNaN(product_id)) {
          console.error("cart.items: product_idが不正です", item);
          throw new Error("不正な商品IDです");
        }
        return {
          product_id,
          quantity: item.quantity,
          toppings: Array.isArray(item.toppings)
            ? item.toppings
                .filter(
                  (t) =>
                    (typeof t.topping_id === "string" &&
                      !isNaN(Number(t.topping_id))) ||
                    (typeof t.id === "string" && !isNaN(Number(t.id)))
                )
                .map((t) => ({
                  topping_id:
                    typeof t.topping_id === "string" &&
                    !isNaN(Number(t.topping_id))
                      ? Number(t.topping_id)
                      : Number(t.id),
                  name: t.name,
                  price: t.price,
                }))
            : [],
          cooking_instruction: "",
        };
      });
      console.log(
        "[API送信直前] itemsForApi:",
        JSON.stringify(itemsForApi, null, 2)
      );

      const orderRequestBody = {
        items: itemsForApi as OrderItemForApi[],
        totalAmount: calculateTotal(),
        paymentMethod: "現金", // DBの許容値に合わせて修正
        specialInstructions: "",
      };
      console.log(
        "[注文API送信直前] orderRequestBody:",
        JSON.stringify(orderRequestBody, null, 2)
      );
      const order = await OrderService.createOrder(orderRequestBody);
      console.log("[DEBUG] OrderService.createOrder result:", order);

      // カートをクリア
      dispatch({ type: "CLEAR_CART" });

      // 注文完了ダイアログ表示
      setCompletedOrder(order);
      setOrderDialogOpen(true);
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
      {/* 注文完了ダイアログ（QRコード表示） */}
      <OrderCompletionDialog
        open={orderDialogOpen}
        onClose={() => setOrderDialogOpen(false)}
        order={completedOrder}
        estimatedTime={estimatedTime}
      />
      {/* ナビゲーションバーはApp.tsxで共通表示 */}
      <Container maxWidth="md" sx={{ py: { xs: 2, sm: 4 } }}>
        {/* 🎯 ページタイトル */}
        <Box
          sx={{
            mb: { xs: 1.5, sm: 3 },
            display: "flex",
            alignItems: "center",
            gap: { xs: 1, sm: 2 },
          }}
        >
          <IconButton
            onClick={() => navigate("/order")}
            color="primary"
            sx={{ p: { xs: 0.5, sm: 1 } }}
          >
            <BackIcon sx={{ fontSize: { xs: 22, sm: 28 } }} />
          </IconButton>
          <Typography
            variant="h6"
            component="h1"
            sx={{
              fontWeight: "bold",
              fontSize: { xs: "1.1rem", sm: "1.5rem" },
            }}
          >
            🛒 カート
          </Typography>
          {/* 🧪 テスト用ボタン（本番では非表示） */}
          {/* <Button
            variant="outlined"
            size="small"
            onClick={addTestProduct}
            sx={{ ml: "auto" }}
          >
            テスト商品追加
          </Button> */}
        </Box>

        {/* 📦 カートの中身 */}
        {cart.items.length === 0 ? (
          // 🈳 カートが空の場合
          <Card>
            <CardContent sx={{ textAlign: "center", py: { xs: 3, sm: 6 } }}>
              <CartIcon
                sx={{ fontSize: { xs: 36, sm: 64 }, color: "grey.300", mb: 2 }}
              />
              <Typography
                variant="subtitle1"
                color="textSecondary"
                gutterBottom
                sx={{ fontSize: { xs: "1rem", sm: "1.2rem" } }}
              >
                カートは空です
              </Typography>
              <Typography
                variant="body2"
                color="textSecondary"
                sx={{
                  mb: { xs: 2, sm: 3 },
                  fontSize: { xs: "0.95rem", sm: "1rem" },
                }}
              >
                商品を選んでカートに追加してください
              </Typography>
              <Button
                variant="contained"
                onClick={() => navigate("/order")}
                size="medium"
                sx={{
                  py: { xs: 0.7, sm: 1.2 },
                  px: { xs: 2, sm: 4 },
                  fontSize: { xs: "0.95rem", sm: "1.05rem" },
                  fontWeight: 600,
                }}
              >
                商品を選ぶ
              </Button>
            </CardContent>
          </Card>
        ) : (
          // 🛍️ カートに商品がある場合
          <>
            <Card sx={{ mb: { xs: 1.5, sm: 3 } }}>
              <CardContent sx={{ p: { xs: 1, sm: 2 } }}>
                <Typography
                  variant="subtitle1"
                  gutterBottom
                  sx={{
                    fontSize: { xs: "1rem", sm: "1.15rem" },
                    fontWeight: 600,
                  }}
                >
                  注文内容（{cart.items.length}品目）
                </Typography>
                <List sx={{ py: { xs: 0, sm: 0 } }}>
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
                              <Typography
                                variant="body2"
                                fontWeight="bold"
                                sx={{
                                  fontSize: { xs: "0.95rem", sm: "1.05rem" },
                                }}
                              >
                                {item.name}
                              </Typography>
                              <Chip
                                label={`${item.quantity}個`}
                                size="small"
                                color="primary"
                                sx={{
                                  fontSize: { xs: "0.85rem", sm: "1rem" },
                                  height: { xs: 22, sm: 28 },
                                }}
                              />
                            </Box>
                          }
                          secondary={
                            <Box>
                              <Typography
                                variant="body2"
                                color="textSecondary"
                                sx={{ fontSize: { xs: "0.9rem", sm: "1rem" } }}
                              >
                                単価: ¥{item.price.toLocaleString()}
                              </Typography>
                              {item.toppings && item.toppings.length > 0 && (
                                <Typography
                                  variant="body2"
                                  color="textSecondary"
                                  sx={{
                                    fontSize: { xs: "0.9rem", sm: "1rem" },
                                  }}
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
                                sx={{
                                  fontSize: { xs: "0.95rem", sm: "1.05rem" },
                                }}
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
                              gap: { xs: 0.5, sm: 1 },
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
                              sx={{ p: { xs: 0.5, sm: 1 } }}
                            >
                              <RemoveIcon
                                sx={{ fontSize: { xs: 18, sm: 22 } }}
                              />
                            </IconButton>
                            <Typography
                              sx={{
                                minWidth: { xs: 22, sm: 30 },
                                textAlign: "center",
                                fontSize: { xs: "0.95rem", sm: "1.1rem" },
                                fontWeight: 600,
                              }}
                            >
                              {item.quantity}
                            </Typography>
                            <IconButton
                              size="small"
                              onClick={() =>
                                updateCartItemQuantity(index, item.quantity + 1)
                              }
                              sx={{ p: { xs: 0.5, sm: 1 } }}
                            >
                              <AddIcon sx={{ fontSize: { xs: 18, sm: 22 } }} />
                            </IconButton>
                            {/* 削除ボタン */}
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => removeFromCart(index)}
                              sx={{
                                ml: { xs: 0.5, sm: 1 },
                                p: { xs: 0.5, sm: 1 },
                              }}
                            >
                              <DeleteIcon
                                sx={{ fontSize: { xs: 18, sm: 22 } }}
                              />
                            </IconButton>
                          </Box>
                        </ListItemSecondaryAction>
                      </ListItem>
                      {index < cart.items.length - 1 && (
                        <Divider sx={{ my: { xs: 0.5, sm: 1 } }} />
                      )}
                    </React.Fragment>
                  ))}
                </List>
              </CardContent>
            </Card>

            {/* 💰 合計金額 */}
            <Paper
              sx={{
                p: { xs: 1.5, sm: 3 },
                mb: { xs: 1.5, sm: 3 },
                bgcolor: "primary.50",
              }}
            >
              <Typography
                variant="subtitle1"
                align="center"
                fontWeight="bold"
                color="primary"
                sx={{ fontSize: { xs: "1.1rem", sm: "1.3rem" } }}
              >
                合計: ¥{calculateTotal().toLocaleString()}
              </Typography>
            </Paper>

            {/* 🎮 操作ボタン */}
            <Box
              sx={{
                display: "flex",
                gap: { xs: 1, sm: 2 },
                justifyContent: "space-between",
                flexDirection: { xs: "column", sm: "row" },
              }}
            >
              <Button
                variant="outlined"
                color="error"
                onClick={clearCart}
                disabled={isOrdering}
                sx={{
                  py: { xs: 0.7, sm: 1.2 },
                  px: { xs: 2, sm: 4 },
                  fontSize: { xs: "0.95rem", sm: "1.05rem" },
                  fontWeight: 600,
                }}
              >
                カートを空にする
              </Button>

              <Box sx={{ display: "flex", gap: { xs: 1, sm: 2 } }}>
                <Button
                  variant="outlined"
                  onClick={() => navigate("/order")}
                  disabled={isOrdering}
                  sx={{
                    py: { xs: 0.7, sm: 1.2 },
                    px: { xs: 2, sm: 4 },
                    fontSize: { xs: "0.95rem", sm: "1.05rem" },
                    fontWeight: 600,
                  }}
                >
                  買い物を続ける
                </Button>

                <Button
                  variant="contained"
                  size="medium"
                  onClick={handlePlaceOrder}
                  disabled={isOrdering}
                  sx={{
                    px: { xs: 2, sm: 4 },
                    py: { xs: 0.7, sm: 1.2 },
                    fontSize: { xs: "0.95rem", sm: "1.05rem" },
                    fontWeight: 600,
                  }}
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
