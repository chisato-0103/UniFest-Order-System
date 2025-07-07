import React, { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  LinearProgress,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  Tooltip,
} from "@mui/material";
import {
  Inventory as InventoryIcon,
  Edit as EditIcon,
  History as HistoryIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
} from "@mui/icons-material";
import { useAppContext } from "../hooks/useAppContext";
import type { StockInfo } from "../types";

interface StockManagementProps {
  compact?: boolean;
}

const StockManagement: React.FC<StockManagementProps> = ({
  compact = false,
}) => {
  const { state, dispatch } = useAppContext();
  const { stockInfo, stockAlerts, products } = state;

  const [adjustDialogOpen, setAdjustDialogOpen] = useState(false);
  const [selectedStock, setSelectedStock] = useState<StockInfo | null>(null);
  const [adjustQuantity, setAdjustQuantity] = useState(0);
  const [adjustReason, setAdjustReason] = useState("");
  const [adjustType, setAdjustType] = useState<"add" | "subtract">("add");

  // 商品名を取得
  const getProductName = (productId: string | number) => {
    const product = products.find((p) => p.product_id === String(productId));
    return product?.product_name || `商品ID: ${productId}`;
  };

  // 在庫状況の色とラベルを取得
  const getStockStatus = (stock: StockInfo) => {
    if (stock.current_stock === 0) {
      return {
        color: "error" as const,
        label: "在庫切れ",
        severity: "error" as const,
      };
    } else if (stock.current_stock <= stock.low_stock_threshold) {
      return {
        color: "warning" as const,
        label: "在庫少",
        severity: "warning" as const,
      };
    } else if (stock.current_stock > stock.initial_stock * 0.8) {
      return {
        color: "success" as const,
        label: "在庫充分",
        severity: "success" as const,
      };
    } else {
      return {
        color: "info" as const,
        label: "在庫あり",
        severity: "info" as const,
      };
    }
  };

  // 在庫調整ダイアログを開く
  const handleOpenAdjustDialog = (stock: StockInfo) => {
    setSelectedStock(stock);
    setAdjustQuantity(0);
    setAdjustReason("");
    setAdjustType("add");
    setAdjustDialogOpen(true);
  };

  // 在庫調整を実行
  const handleStockAdjust = () => {
    if (!selectedStock) return;

    const finalQuantity =
      adjustType === "add" ? adjustQuantity : -adjustQuantity;

    // 在庫更新をdispatch
    dispatch({
      type: "UPDATE_STOCK",
      payload: {
        product_id: Number(selectedStock.product_id),
        quantity: finalQuantity,
        reason: adjustReason,
      },
    });

    setAdjustDialogOpen(false);
  };

  // 在庫アラートを解決
  const handleResolveAlert = (alertId: string | number) => {
    dispatch({
      type: "RESOLVE_STOCK_ALERT",
      payload: Number(alertId),
    });
  };

  // 在庫率の計算
  const getStockPercentage = (stock: StockInfo) => {
    return (stock.current_stock / stock.initial_stock) * 100;
  };

  // 未解決のアラート数
  const unresolvedAlerts = stockAlerts.filter(
    (alert) => !alert.is_resolved
  ).length;

  if (compact) {
    // コンパクト表示（ダッシュボード用）
    return (
      <Card>
        <CardContent>
          <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
            <InventoryIcon color="primary" sx={{ mr: 1 }} />
            <Typography variant="h6">在庫状況</Typography>
            {unresolvedAlerts > 0 && (
              <Chip
                label={`${unresolvedAlerts}件のアラート`}
                color="error"
                size="small"
                sx={{ ml: "auto" }}
              />
            )}
          </Box>

          {stockInfo.slice(0, 3).map((stock) => {
            const status = getStockStatus(stock);
            const percentage = getStockPercentage(stock);

            return (
              <Box key={stock.product_id} sx={{ mb: 2 }}>
                <Box sx={{ display: "flex", alignItems: "center", mb: 0.5 }}>
                  <Typography variant="body2" sx={{ flex: 1 }}>
                    {getProductName(stock.product_id)}
                  </Typography>
                  <Chip
                    label={status.label}
                    color={status.color}
                    size="small"
                  />
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={Math.min(percentage, 100)}
                  color={status.color}
                  sx={{ height: 6, borderRadius: 3 }}
                />
                <Typography variant="caption" color="text.secondary">
                  {stock.current_stock} / {stock.initial_stock}
                </Typography>
              </Box>
            );
          })}
        </CardContent>
      </Card>
    );
  }

  // フル表示
  return (
    <Box>
      {/* アラート表示 */}
      {unresolvedAlerts > 0 && (
        <Box sx={{ mb: 2 }}>
          {stockAlerts
            .filter((alert) => !alert.is_resolved)
            .map((alert) => (
              <Alert
                key={alert.alert_id || alert.id}
                severity={
                  (alert.alert_type || alert.alertType) === "在庫切れ"
                    ? "error"
                    : "warning"
                }
                sx={{ mb: 1 }}
                action={
                  <Button
                    color="inherit"
                    size="small"
                    onClick={() =>
                      handleResolveAlert(alert.alert_id || alert.id)
                    }
                  >
                    解決
                  </Button>
                }
              >
                <Box>
                  <Typography variant="body2" fontWeight="medium">
                    {getProductName(alert.product_id || alert.productId)} -{" "}
                    {alert.message}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {new Date(
                      alert.created_at || alert.timestamp
                    ).toLocaleString()}
                  </Typography>
                </Box>
              </Alert>
            ))}
        </Box>
      )}

      {/* 在庫一覧テーブル */}
      <Card>
        <CardContent>
          <Typography
            variant="h6"
            sx={{ mb: 2, display: "flex", alignItems: "center" }}
          >
            <InventoryIcon color="primary" sx={{ mr: 1 }} />
            在庫管理
          </Typography>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>商品名</TableCell>
                  <TableCell>現在在庫</TableCell>
                  <TableCell>利用可能在庫</TableCell>
                  <TableCell>初期在庫</TableCell>
                  <TableCell>在庫率</TableCell>
                  <TableCell>状況</TableCell>
                  <TableCell>操作</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {stockInfo.map((stock) => {
                  const status = getStockStatus(stock);
                  const percentage = getStockPercentage(stock);

                  return (
                    <TableRow key={stock.product_id}>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {getProductName(stock.product_id)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {stock.current_stock}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography
                          variant="body2"
                          color={
                            (stock.available_stock || stock.current_stock) === 0
                              ? "error"
                              : "textPrimary"
                          }
                        >
                          {stock.available_stock || stock.current_stock}
                          {(stock.reserved_stock || 0) > 0 && (
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ ml: 1 }}
                            >
                              (予約: {stock.reserved_stock || 0})
                            </Typography>
                          )}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {stock.initial_stock}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ width: 100 }}>
                          <LinearProgress
                            variant="determinate"
                            value={Math.min(percentage, 100)}
                            color={status.color}
                            sx={{ mb: 0.5 }}
                          />
                          <Typography variant="caption">
                            {percentage.toFixed(0)}%
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={status.label}
                          color={status.color}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: "flex", gap: 0.5 }}>
                          <Tooltip title="在庫調整">
                            <IconButton
                              size="small"
                              onClick={() => handleOpenAdjustDialog(stock)}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="履歴">
                            <IconButton size="small">
                              <HistoryIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* 在庫調整ダイアログ */}
      <Dialog
        open={adjustDialogOpen}
        onClose={() => setAdjustDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          在庫調整 - {selectedStock && getProductName(selectedStock.product_id)}
        </DialogTitle>
        <DialogContent>
          {selectedStock && (
            <Box sx={{ pt: 1 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                現在在庫: {selectedStock.current_stock}個
              </Typography>

              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>調整タイプ</InputLabel>
                <Select
                  value={adjustType}
                  onChange={(e) =>
                    setAdjustType(e.target.value as "add" | "subtract")
                  }
                  label="調整タイプ"
                >
                  <MenuItem value="add">
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <TrendingUpIcon sx={{ mr: 1, color: "success.main" }} />
                      在庫追加
                    </Box>
                  </MenuItem>
                  <MenuItem value="subtract">
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <TrendingDownIcon sx={{ mr: 1, color: "error.main" }} />
                      在庫減少
                    </Box>
                  </MenuItem>
                </Select>
              </FormControl>

              <TextField
                fullWidth
                label="調整数量"
                type="number"
                value={adjustQuantity}
                onChange={(e) =>
                  setAdjustQuantity(parseInt(e.target.value) || 0)
                }
                inputProps={{ min: 0 }}
                sx={{ mb: 2 }}
              />

              <TextField
                fullWidth
                label="調整理由"
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
                placeholder="例：廃棄、補充、棚卸し等"
                sx={{ mb: 2 }}
              />

              <Alert severity="info">
                調整後在庫:{" "}
                {selectedStock.current_stock +
                  (adjustType === "add" ? adjustQuantity : -adjustQuantity)}
                個
              </Alert>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAdjustDialogOpen(false)}>キャンセル</Button>
          <Button
            onClick={handleStockAdjust}
            variant="contained"
            disabled={adjustQuantity === 0 || !adjustReason.trim()}
          >
            調整実行
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default StockManagement;
