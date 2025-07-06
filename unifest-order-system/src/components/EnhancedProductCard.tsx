import React from "react";
import {
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  IconButton,
  Badge,
  Chip,
  Zoom,
} from "@mui/material";
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  Restaurant as RestaurantIcon,
} from "@mui/icons-material";

interface EnhancedProductCardProps {
  product: {
    id: string;
    name: string;
    price: number;
    category: string;
    description: string;
    available: boolean;
  };
  quantity: number;
  onAddToCart: (productId: string) => void;
  onRemoveFromCart: (productId: string) => void;
  isAnimating?: boolean;
}

const EnhancedProductCard: React.FC<EnhancedProductCardProps> = ({
  product,
  quantity,
  onAddToCart,
  onRemoveFromCart,
  isAnimating = false,
}) => {
  const getCategoryColor = (category: string) => {
    switch (category) {
      case "たこ焼き":
        return "#FF6B35";
      case "ドリンク":
        return "#4ECDC4";
      case "サイドメニュー":
        return "#45B7D1";
      default:
        return "#96CEB4";
    }
  };

  const categoryColor = getCategoryColor(product.category);

  return (
    <Zoom in={true} timeout={300}>
      <Card
        sx={{
          height: "100%",
          cursor: "pointer",
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          "&:hover": {
            transform: "translateY(-8px)",
            boxShadow: "0 12px 35px rgba(0,0,0,0.15)",
          },
          borderRadius: 4,
          overflow: "hidden",
          position: "relative",
          background: product.available
            ? "linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)"
            : "linear-gradient(135deg, #f5f5f5 0%, #e9ecef 100%)",
          opacity: product.available ? 1 : 0.6,
        }}
      >
        {/* カテゴリバッジ */}
        <Box
          sx={{
            position: "absolute",
            top: 12,
            left: 12,
            zIndex: 1,
          }}
        >
          <Chip
            label={product.category}
            size="small"
            sx={{
              backgroundColor: categoryColor,
              color: "white",
              fontWeight: 600,
              fontSize: "0.75rem",
            }}
          />
        </Box>

        {/* 数量バッジ */}
        {quantity > 0 && (
          <Box
            sx={{
              position: "absolute",
              top: 12,
              right: 12,
              zIndex: 1,
            }}
          >
            <Badge
              badgeContent={quantity}
              sx={{
                "& .MuiBadge-badge": {
                  backgroundColor: "#FF6B35",
                  color: "white",
                  fontWeight: 600,
                  fontSize: "0.8rem",
                  minWidth: 24,
                  height: 24,
                },
              }}
            >
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  backgroundColor: "transparent",
                }}
              />
            </Badge>
          </Box>
        )}

        <CardContent sx={{ p: 3, height: "100%" }}>
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              height: "100%",
            }}
          >
            {/* 商品アイコン */}
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                mb: 2,
                mt: 2,
              }}
            >
              <Box
                sx={{
                  width: 60,
                  height: 60,
                  borderRadius: "50%",
                  backgroundColor: `${categoryColor}20`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.3s ease",
                  transform: isAnimating ? "scale(1.1)" : "scale(1)",
                }}
              >
                <RestaurantIcon
                  sx={{
                    fontSize: 30,
                    color: categoryColor,
                  }}
                />
              </Box>
            </Box>

            {/* 商品名 */}
            <Typography
              variant="h6"
              sx={{
                fontWeight: 600,
                textAlign: "center",
                mb: 1,
                color: product.available ? "#333" : "#999",
              }}
            >
              {product.name}
            </Typography>

            {/* 商品説明 */}
            <Typography
              variant="body2"
              sx={{
                textAlign: "center",
                color: product.available ? "#666" : "#aaa",
                mb: 2,
                flexGrow: 1,
              }}
            >
              {product.description}
            </Typography>

            {/* 価格 */}
            <Typography
              variant="h5"
              sx={{
                fontWeight: 700,
                textAlign: "center",
                mb: 3,
                color: product.available ? categoryColor : "#999",
              }}
            >
              ¥{product.price.toLocaleString()}
            </Typography>

            {/* 操作ボタン */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 1,
              }}
            >
              {product.available ? (
                <>
                  <IconButton
                    onClick={() => onRemoveFromCart(product.id)}
                    disabled={quantity === 0}
                    sx={{
                      backgroundColor: quantity > 0 ? "#FF6B35" : "#f0f0f0",
                      color: quantity > 0 ? "white" : "#ccc",
                      "&:hover": {
                        backgroundColor: quantity > 0 ? "#E55A2B" : "#f0f0f0",
                      },
                      transition: "all 0.3s ease",
                    }}
                  >
                    <RemoveIcon />
                  </IconButton>

                  <Box
                    sx={{
                      minWidth: 40,
                      textAlign: "center",
                    }}
                  >
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 600,
                        color: quantity > 0 ? "#FF6B35" : "#999",
                      }}
                    >
                      {quantity}
                    </Typography>
                  </Box>

                  <IconButton
                    onClick={() => onAddToCart(product.id)}
                    sx={{
                      backgroundColor: "#4ECDC4",
                      color: "white",
                      "&:hover": {
                        backgroundColor: "#3BA59F",
                      },
                      transition: "all 0.3s ease",
                    }}
                  >
                    <AddIcon />
                  </IconButton>
                </>
              ) : (
                <Button
                  variant="outlined"
                  disabled
                  sx={{
                    borderColor: "#ccc",
                    color: "#999",
                    width: "100%",
                  }}
                >
                  売り切れ
                </Button>
              )}
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Zoom>
  );
};

export default EnhancedProductCard;
