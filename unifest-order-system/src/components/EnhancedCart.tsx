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
          bottom: { xs: 12, sm: 24 },
          right: { xs: 12, sm: 24 },
          zIndex: 1000,
          width: { xs: 48, sm: 56 },
          height: { xs: 48, sm: 56 },
          minHeight: { xs: 48, sm: 56 },
          background: "linear-gradient(45deg, #FF6B35, #F7931E)",
          boxShadow: "0 4px 12px rgba(255, 107, 53, 0.25)",
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
              fontSize: { xs: "0.7rem", sm: "0.8rem" },
              minWidth: { xs: 18, sm: 24 },
              height: { xs: 18, sm: 24 },
              top: 6,
              right: 6,
            },
          }}
        >
          <CartIcon sx={{ fontSize: { xs: 24, sm: 28 } }} />
        </Badge>
      </Fab>

      {/* カートダイアログ */}
      <Dialog
        open={isOpen}
        onClose={onClose}
        maxWidth="xs"
        fullWidth
        TransitionComponent={Transition}
        PaperProps={{
          sx: {
            borderRadius: { xs: 2, sm: 3 },
            maxHeight: { xs: "80vh", sm: "90vh" },
            m: { xs: 1, sm: 2 },
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
            py: { xs: 1.5, sm: 2 },
            fontSize: { xs: "1.1rem", sm: "1.25rem" },
          }}
        >
          <Typography
            variant="h6"
            sx={{ fontWeight: 600, fontSize: { xs: "1rem", sm: "1.25rem" } }}
          >
            🛒 注文内容
          </Typography>
          <IconButton
            onClick={onClose}
            sx={{
              position: "absolute",
              right: { xs: 4, sm: 8 },
              top: { xs: 4, sm: 8 },
              color: "white",
              p: { xs: 0.5, sm: 1 },
              "&:hover": {
                backgroundColor: "rgba(255, 255, 255, 0.1)",
              },
            }}
          >
            <CloseIcon sx={{ fontSize: { xs: 20, sm: 24 } }} />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: { xs: 0, sm: 0 } }}>
          {cartItems.length === 0 ? (
            <Box sx={{ p: { xs: 2, sm: 4 }, textAlign: "center" }}>
              <Typography
                variant="subtitle1"
                color="textSecondary"
                sx={{ fontSize: { xs: "0.95rem", sm: "1.1rem" } }}
              >
                カートに商品がありません
              </Typography>
              <Typography
                variant="body2"
                sx={{ mt: 1, fontSize: { xs: "0.85rem", sm: "1rem" } }}
              >
                商品を選んでカートに追加してください
              </Typography>
            </Box>
          ) : (
            <List sx={{ py: { xs: 0, sm: 0 } }}>
              {cartItems.map((item, index) => (
                <React.Fragment key={item.id}>
                  <ListItem
                    sx={{
                      py: { xs: 1, sm: 2 },
                      "&:hover": {
                        backgroundColor: "#f8f9fa",
                      },
                    }}
                  >
                    <ListItemText
                      primary={
                        <Typography
                          variant="subtitle2"
                          sx={{
                            fontWeight: 600,
                            fontSize: { xs: "0.95rem", sm: "1.05rem" },
                          }}
                        >
                          {item.name}
                        </Typography>
                      }
                      secondary={
                        <Typography
                          variant="body2"
                          color="textSecondary"
                          sx={{ fontSize: { xs: "0.85rem", sm: "1rem" } }}
                        >
                          ¥{item.price.toLocaleString()} × {item.quantity}個
                        </Typography>
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
                        <IconButton
                          onClick={() => onRemoveFromCart(item.id)}
                          size="small"
                          sx={{
                            backgroundColor: "#FF6B35",
                            color: "white",
                            p: { xs: 0.5, sm: 1 },
                            "&:hover": {
                              backgroundColor: "#E55A2B",
                            },
                          }}
                        >
                          <RemoveIcon sx={{ fontSize: { xs: 18, sm: 22 } }} />
                        </IconButton>
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 600,
                            minWidth: { xs: 22, sm: 30 },
                            textAlign: "center",
                            fontSize: { xs: "0.95rem", sm: "1.1rem" },
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
                            p: { xs: 0.5, sm: 1 },
                            "&:hover": {
                              backgroundColor: "#3BA59F",
                            },
                          }}
                        >
                          <AddIcon sx={{ fontSize: { xs: 18, sm: 22 } }} />
                        </IconButton>
                      </Box>
                    </ListItemSecondaryAction>
                  </ListItem>
                  {index < cartItems.length - 1 && (
                    <Divider sx={{ my: { xs: 0.5, sm: 1 } }} />
                  )}
                </React.Fragment>
              ))}
            </List>
          )}

          {/* 合計金額 */}
          {cartItems.length > 0 && (
            <Paper
              elevation={0}
              sx={{
                p: { xs: 1.5, sm: 3 },
                backgroundColor: "#f8f9fa",
                borderTop: "1px solid #e9ecef",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: { xs: 1, sm: 2 },
                }}
              >
                <Typography
                  variant="subtitle2"
                  sx={{
                    fontWeight: 600,
                    fontSize: { xs: "1rem", sm: "1.15rem" },
                  }}
                >
                  小計
                </Typography>
                <Typography
                  variant="subtitle2"
                  sx={{
                    fontWeight: 600,
                    fontSize: { xs: "1rem", sm: "1.15rem" },
                  }}
                >
                  ¥{totalPrice.toLocaleString()}
                </Typography>
              </Box>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: { xs: 1, sm: 2 },
                }}
              >
                <Typography
                  variant="body2"
                  color="textSecondary"
                  sx={{ fontSize: { xs: "0.85rem", sm: "1rem" } }}
                >
                  商品数量: {totalItems}個
                </Typography>
                <Typography
                  variant="body2"
                  color="textSecondary"
                  sx={{ fontSize: { xs: "0.85rem", sm: "1rem" } }}
                >
                  税込価格
                </Typography>
              </Box>
            </Paper>
          )}
        </DialogContent>

        <DialogActions sx={{ p: { xs: 1, sm: 3 }, pt: 0 }}>
          <Button
            onClick={onClose}
            variant="outlined"
            sx={{
              borderColor: "#ccc",
              color: "#666",
              fontSize: { xs: "0.95rem", sm: "1.05rem" },
              py: { xs: 0.7, sm: 1.5 },
              px: { xs: 1.5, sm: 3 },
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
              ml: { xs: 1, sm: 2 },
              background: "linear-gradient(45deg, #FF6B35, #F7931E)",
              fontSize: { xs: "0.95rem", sm: "1.05rem" },
              py: { xs: 0.7, sm: 1.5 },
              px: { xs: 2, sm: 4 },
              fontWeight: 600,
              "&:hover": {
                background: "linear-gradient(45deg, #E55A2B, #E6841A)",
              },
              "&:disabled": {
                background: "#ccc",
              },
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
