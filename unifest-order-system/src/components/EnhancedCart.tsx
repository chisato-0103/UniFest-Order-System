import React from "react";
import {
  Fab,
  Badge,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Button,
  Typography,
  Box,
  IconButton,
  Divider,
  Slide,
  Paper,
} from "@mui/material";
import {
  ShoppingCart as CartIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  Close as CloseIcon,
} from "@mui/icons-material";
import type { TransitionProps } from "@mui/material/transitions";

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface EnhancedCartProps {
  cartItems: CartItem[];
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  onAddToCart: (productId: string) => void;
  onRemoveFromCart: (productId: string) => void;
  onOrder: () => void;
  totalItems: number;
  totalPrice: number;
  isOrderLoading?: boolean;
}

const Transition = React.forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement;
  },
  ref: React.Ref<unknown>
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const EnhancedCart: React.FC<EnhancedCartProps> = ({
  cartItems,
  isOpen,
  onOpen,
  onClose,
  onAddToCart,
  onRemoveFromCart,
  onOrder,
  totalItems,
  totalPrice,
  isOrderLoading = false,
}) => {
  return (
    <>
      {/* カートボタン */}
      <Fab
        color="primary"
        onClick={onOpen}
        sx={{
          position: "fixed",
          bottom: 24,
          right: 24,
          zIndex: 1000,
          background: "linear-gradient(45deg, #FF6B35, #F7931E)",
          boxShadow: "0 8px 25px rgba(255, 107, 53, 0.4)",
          transition: "all 0.3s ease",
          "&:hover": {
            background: "linear-gradient(45deg, #E55A2B, #E6841A)",
            transform: "scale(1.05)",
          },
        }}
      >
        <Badge
          badgeContent={totalItems}
          sx={{
            "& .MuiBadge-badge": {
              backgroundColor: "#4ECDC4",
              color: "white",
              fontWeight: 600,
              fontSize: "0.8rem",
              minWidth: 24,
              height: 24,
            },
          }}
        >
          <CartIcon />
        </Badge>
      </Fab>

      {/* カートダイアログ */}
      <Dialog
        open={isOpen}
        onClose={onClose}
        maxWidth="sm"
        fullWidth
        TransitionComponent={Transition}
        PaperProps={{
          sx: {
            borderRadius: 3,
            maxHeight: "90vh",
          },
        }}
      >
        <DialogTitle
          sx={{
            background: "linear-gradient(135deg, #FF6B35 0%, #F7931E 100%)",
            color: "white",
            position: "relative",
            textAlign: "center",
            fontWeight: 600,
          }}
        >
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            🛒 注文内容
          </Typography>
          <IconButton
            onClick={onClose}
            sx={{
              position: "absolute",
              right: 8,
              top: 8,
              color: "white",
              "&:hover": {
                backgroundColor: "rgba(255, 255, 255, 0.1)",
              },
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 0 }}>
          {cartItems.length === 0 ? (
            <Box sx={{ p: 4, textAlign: "center" }}>
              <Typography variant="h6" color="textSecondary">
                カートに商品がありません
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                商品を選んでカートに追加してください
              </Typography>
            </Box>
          ) : (
            <List sx={{ py: 0 }}>
              {cartItems.map((item, index) => (
                <React.Fragment key={item.id}>
                  <ListItem
                    sx={{
                      py: 2,
                      "&:hover": {
                        backgroundColor: "#f8f9fa",
                      },
                    }}
                  >
                    <ListItemText
                      primary={
                        <Typography
                          variant="subtitle1"
                          sx={{ fontWeight: 600 }}
                        >
                          {item.name}
                        </Typography>
                      }
                      secondary={
                        <Typography variant="body2" color="textSecondary">
                          ¥{item.price.toLocaleString()} × {item.quantity}個
                        </Typography>
                      }
                    />
                    <ListItemSecondaryAction>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <IconButton
                          onClick={() => onRemoveFromCart(item.id)}
                          size="small"
                          sx={{
                            backgroundColor: "#FF6B35",
                            color: "white",
                            "&:hover": {
                              backgroundColor: "#E55A2B",
                            },
                          }}
                        >
                          <RemoveIcon />
                        </IconButton>
                        <Typography
                          variant="body1"
                          sx={{
                            fontWeight: 600,
                            minWidth: 30,
                            textAlign: "center",
                          }}
                        >
                          {item.quantity}
                        </Typography>
                        <IconButton
                          onClick={() => onAddToCart(item.id)}
                          size="small"
                          sx={{
                            backgroundColor: "#4ECDC4",
                            color: "white",
                            "&:hover": {
                              backgroundColor: "#3BA59F",
                            },
                          }}
                        >
                          <AddIcon />
                        </IconButton>
                      </Box>
                    </ListItemSecondaryAction>
                  </ListItem>
                  {index < cartItems.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          )}

          {/* 合計金額 */}
          {cartItems.length > 0 && (
            <Paper
              elevation={0}
              sx={{
                p: 3,
                backgroundColor: "#f8f9fa",
                borderTop: "1px solid #e9ecef",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 2,
                }}
              >
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  小計
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  ¥{totalPrice.toLocaleString()}
                </Typography>
              </Box>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 2,
                }}
              >
                <Typography variant="body2" color="textSecondary">
                  商品数量: {totalItems}個
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  税込価格
                </Typography>
              </Box>
            </Paper>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button
            onClick={onClose}
            variant="outlined"
            sx={{
              borderColor: "#ccc",
              color: "#666",
              "&:hover": {
                borderColor: "#999",
                backgroundColor: "#f8f9fa",
              },
            }}
          >
            買い物を続ける
          </Button>
          <Button
            onClick={onOrder}
            variant="contained"
            disabled={cartItems.length === 0 || isOrderLoading}
            sx={{
              ml: 2,
              background: "linear-gradient(45deg, #FF6B35, #F7931E)",
              "&:hover": {
                background: "linear-gradient(45deg, #E55A2B, #E6841A)",
              },
              "&:disabled": {
                background: "#ccc",
              },
              fontWeight: 600,
              py: 1.5,
              px: 4,
            }}
          >
            {isOrderLoading ? "注文処理中..." : "注文する"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default EnhancedCart;
