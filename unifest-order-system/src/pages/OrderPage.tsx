import { useState } from 'react';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Button,
  Badge,
  IconButton,
  Box,
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
} from '@mui/material';
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  ShoppingCart as CartIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { useAppContext } from '../hooks/useAppContext';
import type { Product, Topping } from '../types';

// ダミーデータ（後でAPIから取得）
const dummyProducts: Product[] = [
  {
    product_id: 1,
    product_name: 'たこ焼き 8個入り',
    price: 600,
    category_id: 1,
    status: '有効',
    image_url: '/images/takoyaki-8.jpg',
    description: '定番の8個入りたこ焼きです',
    allergy_info: '小麦、卵、大豆を含む',
    cooking_time: 10,
    max_simultaneous_cooking: 6,
    display_order: 1,
    deleted_flag: false,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    product_id: 2,
    product_name: 'たこ焼き 12個入り',
    price: 850,
    category_id: 1,
    status: '有効',
    image_url: '/images/takoyaki-12.jpg',
    description: 'お得な12個入りたこ焼きです',
    allergy_info: '小麦、卵、大豆を含む',
    cooking_time: 12,
    max_simultaneous_cooking: 4,
    display_order: 2,
    deleted_flag: false,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    product_id: 3,
    product_name: 'たこ焼き 16個入り',
    price: 1100,
    category_id: 1,
    status: '有効',
    image_url: '/images/takoyaki-16.jpg',
    description: 'ファミリー向け16個入りたこ焼きです',
    allergy_info: '小麦、卵、大豆を含む',
    cooking_time: 15,
    max_simultaneous_cooking: 3,
    display_order: 3,
    deleted_flag: false,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
];

const dummyToppings: Topping[] = [
  {
    topping_id: 1,
    topping_name: '青のり',
    price: 50,
    is_active: true,
    target_product_ids: [1, 2, 3],
    display_order: 1,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    topping_id: 2,
    topping_name: 'かつお節',
    price: 50,
    is_active: true,
    target_product_ids: [1, 2, 3],
    display_order: 2,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    topping_id: 3,
    topping_name: 'マヨネーズ',
    price: 30,
    is_active: true,
    target_product_ids: [1, 2, 3],
    display_order: 3,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
];

function OrderPage() {
  const { state, dispatch } = useAppContext();
  const [cartOpen, setCartOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedToppings, setSelectedToppings] = useState<Topping[]>([]);
  const [quantity, setQuantity] = useState(1);

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
    setSelectedToppings([]);
    setQuantity(1);
  };

  const handleToppingToggle = (topping: Topping) => {
    setSelectedToppings(prev => {
      const isSelected = prev.find(t => t.topping_id === topping.topping_id);
      if (isSelected) {
        return prev.filter(t => t.topping_id !== topping.topping_id);
      } else {
        return [...prev, topping];
      }
    });
  };

  const handleAddToCart = () => {
    if (selectedProduct) {
      dispatch({
        type: 'ADD_TO_CART',
        payload: {
          product: selectedProduct,
          quantity,
          toppings: selectedToppings,
        },
      });
      setSelectedProduct(null);
      setSelectedToppings([]);
      setQuantity(1);
    }
  };

  const handleRemoveFromCart = (index: number) => {
    dispatch({ type: 'REMOVE_FROM_CART', payload: index });
  };

  const calculateItemPrice = (product: Product, toppings: Topping[]) => {
    const toppingsPrice = toppings.reduce((sum, topping) => sum + topping.price, 0);
    return product.price + toppingsPrice;
  };

  const totalCartItems = state.cart.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      {/* ヘッダー */}
      <Box sx={{ mb: 3, textAlign: 'center' }}>
        <Typography variant="h4" component="h1" gutterBottom color="primary">
          🐙 UniFest たこ焼き屋
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 2 }}>
          <Chip 
            icon={<WarningIcon />} 
            label="混雑状況: 空いています" 
            color="success" 
            variant="outlined" 
          />
          <Chip 
            label="待ち時間: 約10分" 
            color="info" 
            variant="outlined" 
          />
        </Box>
        <Typography variant="body1" color="text.secondary">
          熱々でお渡しします。やけどにご注意ください🔥
        </Typography>
      </Box>

      {/* 商品一覧 */}
      <Typography variant="h5" sx={{ mb: 2 }}>
        メニュー
      </Typography>
      <Grid container spacing={3}>
        {dummyProducts.map((product) => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={product.product_id}>
            <Card 
              sx={{ 
                height: '100%', 
                cursor: 'pointer',
                '&:hover': { transform: 'translateY(-2px)', transition: 'all 0.2s' }
              }}
              onClick={() => handleProductClick(product)}
            >
              <CardMedia
                component="div"
                sx={{
                  height: 140,
                  background: 'linear-gradient(45deg, #FF6B35 30%, #FF8E53 90%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '3rem',
                }}
              >
                🐙
              </CardMedia>
              <CardContent>
                <Typography gutterBottom variant="h6" component="div">
                  {product.product_name}
                </Typography>
                <Typography variant="h5" color="primary" sx={{ fontWeight: 'bold' }}>
                  ¥{product.price.toLocaleString()}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  {product.description}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  調理時間: 約{product.cooking_time}分
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* カートFAB */}
      <Fab
        color="primary"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        onClick={() => setCartOpen(true)}
      >
        <Badge badgeContent={totalCartItems} color="secondary">
          <CartIcon />
        </Badge>
      </Fab>

      {/* 商品詳細ダイアログ */}
      <Dialog open={!!selectedProduct} onClose={() => setSelectedProduct(null)} maxWidth="sm" fullWidth>
        {selectedProduct && (
          <>
            <DialogTitle>{selectedProduct.product_name}</DialogTitle>
            <DialogContent>
              <Typography variant="h6" color="primary" sx={{ mb: 2 }}>
                ¥{selectedProduct.price.toLocaleString()}
              </Typography>
              
              {/* 数量選択 */}
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Typography sx={{ mr: 2 }}>数量:</Typography>
                <IconButton onClick={() => setQuantity(Math.max(1, quantity - 1))}>
                  <RemoveIcon />
                </IconButton>
                <Typography sx={{ mx: 2, minWidth: '2ch', textAlign: 'center' }}>
                  {quantity}
                </Typography>
                <IconButton onClick={() => setQuantity(quantity + 1)}>
                  <AddIcon />
                </IconButton>
              </Box>

              {/* トッピング選択 */}
              <Typography variant="h6" sx={{ mb: 2 }}>
                トッピング
              </Typography>
              <Grid container spacing={1}>
                {dummyToppings.map((topping) => (
                  <Grid size="auto" key={topping.topping_id}>
                    <Chip
                      label={`${topping.topping_name} (+¥${topping.price})`}
                      clickable
                      color={selectedToppings.find(t => t.topping_id === topping.topping_id) ? 'primary' : 'default'}
                      onClick={() => handleToppingToggle(topping)}
                    />
                  </Grid>
                ))}
              </Grid>

              <Typography variant="h6" sx={{ mt: 3 }}>
                小計: ¥{(calculateItemPrice(selectedProduct, selectedToppings) * quantity).toLocaleString()}
              </Typography>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setSelectedProduct(null)}>キャンセル</Button>
              <Button variant="contained" onClick={handleAddToCart}>
                カートに追加
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* カートダイアログ */}
      <Dialog open={cartOpen} onClose={() => setCartOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>ショッピングカート</DialogTitle>
        <DialogContent>
          {state.cart.items.length === 0 ? (
            <Typography>カートは空です</Typography>
          ) : (
            <List>
              {state.cart.items.map((item, index) => (
                <ListItem key={index}>
                  <ListItemText
                    primary={item.product.product_name}
                    secondary={
                      <>
                        {item.selectedToppings.length > 0 && (
                          <Typography component="span" variant="body2" color="text.secondary">
                            トッピング: {item.selectedToppings.map(t => t.topping_name).join(', ')}
                          </Typography>
                        )}
                        <br />
                        ¥{calculateItemPrice(item.product, item.selectedToppings).toLocaleString()} × {item.quantity}
                      </>
                    }
                  />
                  <ListItemSecondaryAction>
                    <Button 
                      color="error" 
                      onClick={() => handleRemoveFromCart(index)}
                      size="small"
                    >
                      削除
                    </Button>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          )}
          
          {state.cart.items.length > 0 && (
            <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid #eee' }}>
              <Typography variant="h6">
                合計: ¥{state.cart.total.toLocaleString()}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCartOpen(false)}>続けて買い物</Button>
          {state.cart.items.length > 0 && (
            <Button variant="contained" color="primary">
              注文確定
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default OrderPage;
