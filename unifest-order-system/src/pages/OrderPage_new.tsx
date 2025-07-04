import { useState } from "react";
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  Badge,
  IconButton,
  Chip,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Alert,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Divider,
} from "@mui/material";
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  ShoppingCart as CartIcon,
  Warning as WarningIcon,
} from "@mui/icons-material";
import { useAppContext } from "../hooks/useAppContext";

interface SimpleProduct {
  id: string;
  name: string;
  price: number;
  category: string;
  description: string;
  available: boolean;
}

interface SimpleTopping {
  id: string;
  name: string;
  price: number;
  available: boolean;
}

interface CartItem {
  product: SimpleProduct;
  quantity: number;
  selectedToppings: SimpleTopping[];
}

const dummyProducts: SimpleProduct[] = [
  {
    id: "1",
    name: "たこ焼き 6個入り",
    price: 500,
    category: "メイン",
    description: "定番の6個入りたこ焼きです",
    available: true,
  },
  {
    id: "2",
    name: "たこ焼き 8個入り",
    price: 650,
    category: "メイン",
    description: "お得な8個入りたこ焼きです",
    available: true,
  },
  {
    id: "3",
    name: "特製たこ焼き 6個入り",
    price: 700,
    category: "特製",
    description: "特製だし入りのプレミアムたこ焼き",
    available: true,
  },
  {
    id: "4",
    name: "たこ焼きセット",
    price: 800,
    category: "セット",
    description: "たこ焼き6個＋ドリンク",
    available: false,
  },
];

const dummyToppings: SimpleTopping[] = [
  { id: "1", name: "ソース", price: 0, available: true },
  { id: "2", name: "マヨネーズ", price: 0, available: true },
  { id: "3", name: "青のり", price: 50, available: true },
  { id: "4", name: "かつお節", price: 50, available: true },
  { id: "5", name: "チーズ", price: 100, available: true },
  { id: "6", name: "明太子", price: 150, available: true },
];

function OrderPage() {
  const context = useAppContext();
  const { state } = context;
  const { systemState, connectionStatus } = state;

  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<SimpleProduct | null>(
    null
  );
  const [selectedToppings, setSelectedToppings] = useState<SimpleTopping[]>([]);
  const [cartDialogOpen, setCartDialogOpen] = useState(false);
  const [productDialogOpen, setProductDialogOpen] = useState(false);

  const handleProductClick = (product: SimpleProduct) => {
    if (!product.available) return;
    setSelectedProduct(product);
    setSelectedToppings([]);
    setProductDialogOpen(true);
  };

  const handleToppingToggle = (topping: SimpleTopping) => {
    setSelectedToppings((prev) => {
      const exists = prev.find((t) => t.id === topping.id);
      if (exists) {
        return prev.filter((t) => t.id !== topping.id);
      } else {
        return [...prev, topping];
      }
    });
  };

  const handleAddToCart = () => {
    if (!selectedProduct) return;

    const newItem: CartItem = {
      product: selectedProduct,
      quantity: 1,
      selectedToppings: [...selectedToppings],
    };

    setCart((prev) => [...prev, newItem]);
    setProductDialogOpen(false);
    setSelectedProduct(null);
    setSelectedToppings([]);
  };

  const handleRemoveFromCart = (index: number) => {
    setCart((prev) => prev.filter((_, i) => i !== index));
  };

  const handleQuantityChange = (index: number, delta: number) => {
    setCart((prev) =>
      prev.map((item, i) => {
        if (i === index) {
          const newQuantity = Math.max(1, item.quantity + delta);
          return { ...item, quantity: newQuantity };
        }
        return item;
      })
    );
  };

  const calculateItemPrice = (
    product: SimpleProduct,
    toppings: SimpleTopping[]
  ) => {
    return (
      product.price + toppings.reduce((sum, topping) => sum + topping.price, 0)
    );
  };

  const calculateCartTotal = () => {
    return cart.reduce((total, item) => {
      const itemPrice = calculateItemPrice(item.product, item.selectedToppings);
      return total + itemPrice * item.quantity;
    }, 0);
  };

  const handleOrder = () => {
    // ここで実際の注文処理を行う
    alert(
      `注文を受け付けました！\n合計: ¥${calculateCartTotal().toLocaleString()}`
    );
    setCart([]);
    setCartDialogOpen(false);
  };

  // 営業状況に応じた表示制御
  const isOrderingAvailable =
    systemState.営業状況 === "営業中" && !systemState.緊急停止状態;

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      {/* ヘッダー */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom color="primary">
          注文画面
        </Typography>
        <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", mb: 2 }}>
          <Chip
            label={systemState.営業状況}
            color={systemState.営業状況 === "営業中" ? "success" : "warning"}
            variant="filled"
          />
          <Chip
            label={systemState.混雑状況}
            color={
              systemState.混雑状況 === "混雑"
                ? "error"
                : systemState.混雑状況 === "普通"
                ? "warning"
                : "success"
            }
            variant="outlined"
          />
          {systemState.待ち件数 > 0 && (
            <Chip
              label={`待ち時間: 約${systemState.待ち件数 * 8}分`}
              color="info"
              variant="outlined"
            />
          )}
        </Box>

        {!isOrderingAvailable && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography variant="body1" sx={{ fontWeight: "bold" }}>
              現在注文を受け付けていません
            </Typography>
            <Typography variant="body2">
              {systemState.営業状況 === "準備中" &&
                "営業準備中です。しばらくお待ちください。"}
              {systemState.営業状況 === "営業終了" &&
                "本日の営業は終了いたしました。"}
              {systemState.緊急停止状態 && "システムメンテナンス中です。"}
            </Typography>
          </Alert>
        )}

        {connectionStatus !== "connected" && (
          <Alert severity="error" sx={{ mb: 2 }}>
            ネットワークに接続できません。注文機能が利用できない可能性があります。
          </Alert>
        )}
      </Box>

      {/* 商品一覧 */}
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
        {dummyProducts.map((product) => (
          <Card
            key={product.id}
            sx={{
              minWidth: 280,
              maxWidth: 320,
              flex: "1 1 280px",
              opacity: !product.available || !isOrderingAvailable ? 0.6 : 1,
              cursor:
                product.available && isOrderingAvailable
                  ? "pointer"
                  : "default",
              "&:hover":
                product.available && isOrderingAvailable
                  ? {
                      boxShadow: 4,
                      transform: "translateY(-2px)",
                      transition: "all 0.2s ease-in-out",
                    }
                  : {},
            }}
            onClick={() =>
              product.available &&
              isOrderingAvailable &&
              handleProductClick(product)
            }
          >
            <CardContent>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  mb: 1,
                }}
              >
                <Typography variant="h6" component="h2" color="primary">
                  {product.name}
                </Typography>
                <Chip
                  label={product.category}
                  size="small"
                  color="secondary"
                  variant="outlined"
                />
              </Box>

              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {product.description}
              </Typography>

              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Typography
                  variant="h5"
                  color="primary"
                  sx={{ fontWeight: "bold" }}
                >
                  ¥{product.price.toLocaleString()}
                </Typography>

                {!product.available && (
                  <Chip
                    label="売り切れ"
                    color="error"
                    size="small"
                    icon={<WarningIcon />}
                  />
                )}

                {product.available && !isOrderingAvailable && (
                  <Chip label="注文停止中" color="warning" size="small" />
                )}
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* カート FAB */}
      {cart.length > 0 && (
        <Fab
          color="primary"
          aria-label="cart"
          sx={{
            position: "fixed",
            bottom: 24,
            right: 24,
            zIndex: 1000,
          }}
          onClick={() => setCartDialogOpen(true)}
        >
          <Badge badgeContent={cart.length} color="error">
            <CartIcon />
          </Badge>
        </Fab>
      )}

      {/* 商品選択ダイアログ */}
      <Dialog
        open={productDialogOpen}
        onClose={() => setProductDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{selectedProduct?.name}</DialogTitle>
        <DialogContent>
          {selectedProduct && (
            <Box>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                {selectedProduct.description}
              </Typography>

              <Typography variant="h6" color="primary" sx={{ mb: 2 }}>
                基本価格: ¥{selectedProduct.price.toLocaleString()}
              </Typography>

              <Divider sx={{ my: 2 }} />

              <Typography variant="h6" sx={{ mb: 2 }}>
                トッピング選択
              </Typography>

              <FormGroup>
                {dummyToppings
                  .filter((t) => t.available)
                  .map((topping) => (
                    <FormControlLabel
                      key={topping.id}
                      control={
                        <Checkbox
                          checked={selectedToppings.some(
                            (t) => t.id === topping.id
                          )}
                          onChange={() => handleToppingToggle(topping)}
                        />
                      }
                      label={
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            width: "100%",
                          }}
                        >
                          <span>{topping.name}</span>
                          <span>
                            {topping.price > 0 ? `+¥${topping.price}` : "無料"}
                          </span>
                        </Box>
                      }
                    />
                  ))}
              </FormGroup>

              <Divider sx={{ my: 2 }} />

              <Typography variant="h6" color="primary">
                合計: ¥
                {calculateItemPrice(
                  selectedProduct,
                  selectedToppings
                ).toLocaleString()}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setProductDialogOpen(false)}>
            キャンセル
          </Button>
          <Button onClick={handleAddToCart} variant="contained">
            カートに追加
          </Button>
        </DialogActions>
      </Dialog>

      {/* カートダイアログ */}
      <Dialog
        open={cartDialogOpen}
        onClose={() => setCartDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>注文内容確認</DialogTitle>
        <DialogContent>
          {cart.length === 0 ? (
            <Typography variant="body1" color="text.secondary">
              カートは空です
            </Typography>
          ) : (
            <List>
              {cart.map((item, index) => (
                <ListItem key={index} divider>
                  <ListItemText
                    primary={item.product.name}
                    secondary={
                      <Box>
                        {item.selectedToppings.length > 0 && (
                          <Typography variant="body2" color="text.secondary">
                            トッピング:{" "}
                            {item.selectedToppings
                              .map((t) => t.name)
                              .join(", ")}
                          </Typography>
                        )}
                        <Typography variant="body2" color="primary">
                          ¥
                          {calculateItemPrice(
                            item.product,
                            item.selectedToppings
                          ).toLocaleString()}{" "}
                          × {item.quantity}
                        </Typography>
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <IconButton
                        size="small"
                        onClick={() => handleQuantityChange(index, -1)}
                        disabled={item.quantity <= 1}
                      >
                        <RemoveIcon />
                      </IconButton>
                      <Typography
                        variant="body1"
                        sx={{ minWidth: 24, textAlign: "center" }}
                      >
                        {item.quantity}
                      </Typography>
                      <IconButton
                        size="small"
                        onClick={() => handleQuantityChange(index, 1)}
                      >
                        <AddIcon />
                      </IconButton>
                      <Button
                        size="small"
                        color="error"
                        onClick={() => handleRemoveFromCart(index)}
                        sx={{ ml: 1 }}
                      >
                        削除
                      </Button>
                    </Box>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          )}

          {cart.length > 0 && (
            <Box sx={{ mt: 2, p: 2, bgcolor: "grey.100", borderRadius: 2 }}>
              <Typography
                variant="h5"
                color="primary"
                sx={{ fontWeight: "bold" }}
              >
                合計金額: ¥{calculateCartTotal().toLocaleString()}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCartDialogOpen(false)}>閉じる</Button>
          {cart.length > 0 && (
            <Button onClick={handleOrder} variant="contained" color="primary">
              注文する
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default OrderPage;
