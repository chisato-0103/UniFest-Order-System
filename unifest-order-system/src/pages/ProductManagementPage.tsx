import { useState, useEffect } from "react";
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Alert,
  Snackbar,
  Tooltip,
  Divider,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Analytics as AnalyticsIcon,
  Inventory as InventoryIcon,
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon,
} from "@mui/icons-material";
import { useAppContext } from "../hooks/useAppContext";

interface ProductWithStock {
  id: string;
  name: string;
  price: number;
  category: string;
  description?: string;
  available: boolean;
  stock: number;
  lowStockThreshold: number;
  totalSold: number;
  revenue: number;
}

interface SimplifiedTopping {
  id: string;
  name: string;
  price: number;
  available: boolean;
}

interface ProductFormData {
  name: string;
  price: number;
  category: string;
  description: string;
  available: boolean;
  stock: number;
  lowStockThreshold: number;
}

interface ToppingFormData {
  name: string;
  price: number;
  available: boolean;
}

function ProductManagementPage() {
  const { state } = useAppContext();
  const { products: contextProducts, stockInfo } = state;

  const [products, setProducts] = useState<ProductWithStock[]>([]);
  const [toppings, setToppings] = useState<SimplifiedTopping[]>([]);
  const [openProductDialog, setOpenProductDialog] = useState(false);
  const [openToppingDialog, setOpenToppingDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductWithStock | null>(
    null
  );
  const [editingTopping, setEditingTopping] =
    useState<SimplifiedTopping | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<"success" | "error">(
    "success"
  );

  // ダミーデータとAppContextの統合
  useEffect(() => {
    // AppContextの商品データに在庫情報を統合
    const productsWithStock: ProductWithStock[] = contextProducts.map(
      (product) => {
        const stock = stockInfo.find(
          (s) => s.product_id === product.product_id
        );
        return {
          id: product.product_id.toString(),
          name: product.product_name,
          price: product.price,
          category: "メイン", // TODO: Productの型にcategoryを追加
          description: product.description,
          available: product.status === "有効",
          stock: stock?.current_stock || 0,
          lowStockThreshold: stock?.low_stock_threshold || 5,
          totalSold: 0, // TODO: 実際の売上データと統合
          revenue: 0, // TODO: 実際の売上データと統合
        };
      }
    );

    // AppContextにデータがない場合はダミーデータを使用
    if (productsWithStock.length === 0) {
      const dummyProducts: ProductWithStock[] = [
        {
          id: "1",
          name: "たこ焼き（6個）",
          price: 500,
          category: "メイン",
          description: "定番のたこ焼き6個セット",
          available: true,
          stock: 45,
          lowStockThreshold: 10,
          totalSold: 128,
          revenue: 64000,
        },
        {
          id: "2",
          name: "たこ焼き（8個）",
          price: 650,
          category: "メイン",
          description: "たこ焼き8個セット",
          available: true,
          stock: 32,
          lowStockThreshold: 10,
          totalSold: 89,
          revenue: 57850,
        },
        {
          id: "3",
          name: "特製たこ焼き（6個）",
          price: 700,
          category: "特製",
          description: "特製だし入りたこ焼き",
          available: true,
          stock: 15,
          lowStockThreshold: 5,
          totalSold: 67,
          revenue: 46900,
        },
        {
          id: "4",
          name: "たこ焼きセット",
          price: 800,
          category: "セット",
          description: "たこ焼き6個+ドリンク",
          available: false,
          stock: 0,
          lowStockThreshold: 3,
          totalSold: 34,
          revenue: 27200,
        },
      ];
      setProducts(dummyProducts);
    } else {
      setProducts(productsWithStock);
    }

    const dummyToppings: SimplifiedTopping[] = [
      { id: "1", name: "ソース", price: 0, available: true },
      { id: "2", name: "マヨネーズ", price: 0, available: true },
      { id: "3", name: "青のり", price: 50, available: true },
      { id: "4", name: "かつお節", price: 50, available: true },
      { id: "5", name: "チーズ", price: 100, available: true },
      { id: "6", name: "明太子", price: 150, available: false },
    ];

    setToppings(dummyToppings);
  }, [contextProducts, stockInfo]);

  const handleProductSave = (productData: ProductFormData) => {
    if (editingProduct) {
      setProducts((prev) =>
        prev.map((p) =>
          p.id === editingProduct.id ? { ...p, ...productData } : p
        )
      );
      setSnackbarMessage("商品を更新しました");
    } else {
      const newProduct: ProductWithStock = {
        ...productData,
        id: Date.now().toString(),
        stock: productData.stock || 0,
        lowStockThreshold: productData.lowStockThreshold || 5,
        totalSold: 0,
        revenue: 0,
      };
      setProducts((prev) => [...prev, newProduct]);
      setSnackbarMessage("商品を追加しました");
    }
    setSnackbarSeverity("success");
    setSnackbarOpen(true);
    setOpenProductDialog(false);
    setEditingProduct(null);
  };

  const handleToppingSave = (toppingData: ToppingFormData) => {
    if (editingTopping) {
      setToppings((prev) =>
        prev.map((t) =>
          t.id === editingTopping.id ? { ...t, ...toppingData } : t
        )
      );
      setSnackbarMessage("トッピングを更新しました");
    } else {
      const newTopping: SimplifiedTopping = {
        ...toppingData,
        id: Date.now().toString(),
      };
      setToppings((prev) => [...prev, newTopping]);
      setSnackbarMessage("トッピングを追加しました");
    }
    setSnackbarSeverity("success");
    setSnackbarOpen(true);
    setOpenToppingDialog(false);
    setEditingTopping(null);
  };

  const handleProductDelete = (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
    setSnackbarMessage("商品を削除しました");
    setSnackbarSeverity("success");
    setSnackbarOpen(true);
  };

  const handleToppingDelete = (id: string) => {
    setToppings((prev) => prev.filter((t) => t.id !== id));
    setSnackbarMessage("トッピングを削除しました");
    setSnackbarSeverity("success");
    setSnackbarOpen(true);
  };

  const toggleProductAvailability = (id: string) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, available: !p.available } : p))
    );
  };

  const toggleToppingAvailability = (id: string) => {
    setToppings((prev) =>
      prev.map((t) => (t.id === id ? { ...t, available: !t.available } : t))
    );
  };

  const lowStockProducts = products.filter(
    (p) => p.stock <= p.lowStockThreshold
  );
  const totalRevenue = products.reduce((sum, p) => sum + p.revenue, 0);
  const totalSold = products.reduce((sum, p) => sum + p.totalSold, 0);

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom color="primary">
          商品管理
        </Typography>
        <Typography variant="body1" color="text.secondary">
          商品・トッピングの管理、在庫状況、売上分析
        </Typography>
      </Box>

      {/* 統計サマリー */}
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 3, mb: 4 }}>
        <Box sx={{ minWidth: 240, flex: 1 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                <InventoryIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">商品数</Typography>
              </Box>
              <Typography variant="h4" color="primary">
                {products.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                販売中: {products.filter((p) => p.available).length}
              </Typography>
            </CardContent>
          </Card>
        </Box>
        <Box sx={{ minWidth: 240, flex: 1 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                <TrendingUpIcon color="success" sx={{ mr: 1 }} />
                <Typography variant="h6">総売上</Typography>
              </Box>
              <Typography variant="h4" color="success.main">
                ¥{totalRevenue.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                総販売数: {totalSold}
              </Typography>
            </CardContent>
          </Card>
        </Box>
        <Box sx={{ minWidth: 240, flex: 1 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                <AnalyticsIcon color="info" sx={{ mr: 1 }} />
                <Typography variant="h6">平均単価</Typography>
              </Box>
              <Typography variant="h4" color="info.main">
                ¥{totalSold > 0 ? Math.round(totalRevenue / totalSold) : 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                1商品あたり
              </Typography>
            </CardContent>
          </Card>
        </Box>
        <Box sx={{ minWidth: 240, flex: 1 }}>
          <Card
            sx={{
              border: lowStockProducts.length > 0 ? "2px solid" : "none",
              borderColor: "warning.main",
            }}
          >
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                <WarningIcon
                  color={lowStockProducts.length > 0 ? "warning" : "disabled"}
                  sx={{ mr: 1 }}
                />
                <Typography variant="h6">在庫警告</Typography>
              </Box>
              <Typography
                variant="h4"
                color={
                  lowStockProducts.length > 0
                    ? "warning.main"
                    : "text.secondary"
                }
              >
                {lowStockProducts.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                低在庫商品
              </Typography>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* 在庫警告アラート */}
      {lowStockProducts.length > 0 && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
            在庫不足の商品があります
          </Typography>
          <Typography variant="body2">
            {lowStockProducts.map((p) => p.name).join(", ")}
          </Typography>
        </Alert>
      )}

      {/* 商品管理セクション */}
      <Box sx={{ mb: 4 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
          }}
        >
          <Typography variant="h5" component="h2">
            商品一覧
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              setEditingProduct(null);
              setOpenProductDialog(true);
            }}
          >
            商品追加
          </Button>
        </Box>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>商品名</TableCell>
                <TableCell>カテゴリ</TableCell>
                <TableCell>価格</TableCell>
                <TableCell>在庫</TableCell>
                <TableCell>販売数</TableCell>
                <TableCell>売上</TableCell>
                <TableCell>状態</TableCell>
                <TableCell>操作</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>{product.name}</TableCell>
                  <TableCell>{product.category}</TableCell>
                  <TableCell>¥{product.price}</TableCell>
                  <TableCell>
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <Typography
                        color={
                          product.stock <= product.lowStockThreshold
                            ? "error"
                            : "text.primary"
                        }
                        sx={{
                          fontWeight:
                            product.stock <= product.lowStockThreshold
                              ? "bold"
                              : "normal",
                        }}
                      >
                        {product.stock}
                      </Typography>
                      {product.stock <= product.lowStockThreshold && (
                        <WarningIcon
                          color="warning"
                          sx={{ ml: 1, fontSize: 16 }}
                        />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>{product.totalSold}</TableCell>
                  <TableCell>¥{product.revenue.toLocaleString()}</TableCell>
                  <TableCell>
                    <Chip
                      label={product.available ? "販売中" : "停止中"}
                      color={product.available ? "success" : "error"}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Tooltip
                      title={product.available ? "販売停止" : "販売開始"}
                    >
                      <IconButton
                        onClick={() => toggleProductAvailability(product.id)}
                        color={product.available ? "warning" : "success"}
                      >
                        {product.available ? (
                          <VisibilityOffIcon />
                        ) : (
                          <VisibilityIcon />
                        )}
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="編集">
                      <IconButton
                        onClick={() => {
                          setEditingProduct(product);
                          setOpenProductDialog(true);
                        }}
                        color="primary"
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="削除">
                      <IconButton
                        onClick={() => handleProductDelete(product.id)}
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      <Divider sx={{ my: 4 }} />

      {/* トッピング管理セクション */}
      <Box>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
          }}
        >
          <Typography variant="h5" component="h2">
            トッピング一覧
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              setEditingTopping(null);
              setOpenToppingDialog(true);
            }}
          >
            トッピング追加
          </Button>
        </Box>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>トッピング名</TableCell>
                <TableCell>追加料金</TableCell>
                <TableCell>状態</TableCell>
                <TableCell>操作</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {toppings.map((topping) => (
                <TableRow key={topping.id}>
                  <TableCell>{topping.name}</TableCell>
                  <TableCell>
                    {topping.price > 0 ? `+¥${topping.price}` : "無料"}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={topping.available ? "利用可能" : "停止中"}
                      color={topping.available ? "success" : "error"}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Tooltip
                      title={topping.available ? "利用停止" : "利用開始"}
                    >
                      <IconButton
                        onClick={() => toggleToppingAvailability(topping.id)}
                        color={topping.available ? "warning" : "success"}
                      >
                        {topping.available ? (
                          <VisibilityOffIcon />
                        ) : (
                          <VisibilityIcon />
                        )}
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="編集">
                      <IconButton
                        onClick={() => {
                          setEditingTopping(topping);
                          setOpenToppingDialog(true);
                        }}
                        color="primary"
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="削除">
                      <IconButton
                        onClick={() => handleToppingDelete(topping.id)}
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {/* 商品編集ダイアログ */}
      <ProductDialog
        open={openProductDialog}
        onClose={() => {
          setOpenProductDialog(false);
          setEditingProduct(null);
        }}
        onSave={handleProductSave}
        product={editingProduct}
      />

      {/* トッピング編集ダイアログ */}
      <ToppingDialog
        open={openToppingDialog}
        onClose={() => {
          setOpenToppingDialog(false);
          setEditingTopping(null);
        }}
        onSave={handleToppingSave}
        topping={editingTopping}
      />

      {/* スナックバー */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
      >
        <Alert
          severity={snackbarSeverity}
          onClose={() => setSnackbarOpen(false)}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
}

// 商品編集ダイアログコンポーネント
interface ProductDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (productData: ProductFormData) => void;
  product: ProductWithStock | null;
}

function ProductDialog({ open, onClose, onSave, product }: ProductDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    category: "",
    description: "",
    available: true,
    stock: "",
    lowStockThreshold: "",
  });

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        price: product.price.toString(),
        category: product.category,
        description: product.description || "",
        available: product.available,
        stock: product.stock.toString(),
        lowStockThreshold: product.lowStockThreshold.toString(),
      });
    } else {
      setFormData({
        name: "",
        price: "",
        category: "",
        description: "",
        available: true,
        stock: "",
        lowStockThreshold: "5",
      });
    }
  }, [product]);

  const handleSubmit = () => {
    const productData = {
      name: formData.name,
      price: parseInt(formData.price),
      category: formData.category,
      description: formData.description,
      available: formData.available,
      stock: parseInt(formData.stock),
      lowStockThreshold: parseInt(formData.lowStockThreshold),
    };
    onSave(productData);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{product ? "商品編集" : "商品追加"}</DialogTitle>
      <DialogContent>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
          <TextField
            label="商品名"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            fullWidth
            required
          />
          <TextField
            label="価格"
            type="number"
            value={formData.price}
            onChange={(e) =>
              setFormData({ ...formData, price: e.target.value })
            }
            fullWidth
            required
          />
          <FormControl fullWidth>
            <InputLabel>カテゴリ</InputLabel>
            <Select
              value={formData.category}
              label="カテゴリ"
              onChange={(e) =>
                setFormData({ ...formData, category: e.target.value })
              }
            >
              <MenuItem value="メイン">メイン</MenuItem>
              <MenuItem value="特製">特製</MenuItem>
              <MenuItem value="セット">セット</MenuItem>
              <MenuItem value="サイド">サイド</MenuItem>
              <MenuItem value="ドリンク">ドリンク</MenuItem>
            </Select>
          </FormControl>
          <TextField
            label="説明"
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            fullWidth
            multiline
            rows={2}
          />
          <TextField
            label="在庫数"
            type="number"
            value={formData.stock}
            onChange={(e) =>
              setFormData({ ...formData, stock: e.target.value })
            }
            fullWidth
            required
          />
          <TextField
            label="在庫警告しきい値"
            type="number"
            value={formData.lowStockThreshold}
            onChange={(e) =>
              setFormData({ ...formData, lowStockThreshold: e.target.value })
            }
            fullWidth
            required
          />
          <FormControlLabel
            control={
              <Switch
                checked={formData.available}
                onChange={(e) =>
                  setFormData({ ...formData, available: e.target.checked })
                }
              />
            }
            label="販売中"
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>キャンセル</Button>
        <Button onClick={handleSubmit} variant="contained">
          {product ? "更新" : "追加"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// トッピング編集ダイアログコンポーネント
interface ToppingDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (toppingData: ToppingFormData) => void;
  topping: SimplifiedTopping | null;
}

function ToppingDialog({ open, onClose, onSave, topping }: ToppingDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    available: true,
  });

  useEffect(() => {
    if (topping) {
      setFormData({
        name: topping.name,
        price: topping.price.toString(),
        available: topping.available,
      });
    } else {
      setFormData({
        name: "",
        price: "0",
        available: true,
      });
    }
  }, [topping]);

  const handleSubmit = () => {
    const toppingData = {
      name: formData.name,
      price: parseInt(formData.price),
      available: formData.available,
    };
    onSave(toppingData);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{topping ? "トッピング編集" : "トッピング追加"}</DialogTitle>
      <DialogContent>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
          <TextField
            label="トッピング名"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            fullWidth
            required
          />
          <TextField
            label="追加料金"
            type="number"
            value={formData.price}
            onChange={(e) =>
              setFormData({ ...formData, price: e.target.value })
            }
            fullWidth
            required
            helperText="0円の場合は無料トッピング"
          />
          <FormControlLabel
            control={
              <Switch
                checked={formData.available}
                onChange={(e) =>
                  setFormData({ ...formData, available: e.target.checked })
                }
              />
            }
            label="利用可能"
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>キャンセル</Button>
        <Button onClick={handleSubmit} variant="contained">
          {topping ? "更新" : "追加"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default ProductManagementPage;
