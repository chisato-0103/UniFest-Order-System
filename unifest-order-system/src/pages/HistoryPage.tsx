import { useState, useEffect, useMemo } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  Chip,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  AppBar,
  Toolbar,
  IconButton,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  History as HistoryIcon,
  Search as SearchIcon,
  Receipt as ReceiptIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  FilterList as FilterIcon,
  TrendingUp as TrendingUpIcon,
  AttachMoney as MoneyIcon,
  ShoppingCart as CartIcon,
  Cancel as CancelIcon,
  CheckCircle as CheckCircleIcon,
  ExpandMore as ExpandMoreIcon,
} from '@mui/icons-material';
import type { Order } from '../types';

// ダミーの注文履歴データ
const dummyHistoryOrders: Order[] = [
  {
    order_id: 1,
    customer_id: 1,
    order_number: 'A001',
    items: [
      {
        order_item_id: 1,
        order_id: 1,
        product_id: 1,
        product_name: 'たこ焼き 8個入り',
        quantity: 2,
        unit_price: 600,
        total_price: 1200,
        toppings: [
          { topping_id: 1, topping_name: '青のり', price: 50, is_active: true, target_product_ids: [1], display_order: 1, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
        ],
        cooking_time: 10,
        cooking_instruction: '',
        created_at: '2024-01-01T09:00:00Z',
        updated_at: '2024-01-01T09:00:00Z',
      },
    ],
    total_amount: 1300,
    status: '受け取り済み',
    payment_status: '支払済み',
    payment_method: '現金',
    estimated_pickup_time: '2024-01-01T09:15:00Z',
    actual_pickup_time: '2024-01-01T09:12:00Z',
    special_instructions: '',
    created_at: '2024-01-01T09:00:00Z',
    updated_at: '2024-01-01T09:12:00Z',
  },
  {
    order_id: 2,
    customer_id: 2,
    order_number: 'A002',
    items: [
      {
        order_item_id: 2,
        order_id: 2,
        product_id: 2,
        product_name: 'たこ焼き 12個入り',
        quantity: 1,
        unit_price: 850,
        total_price: 850,
        toppings: [],
        cooking_time: 12,
        cooking_instruction: '',
        created_at: '2024-01-01T09:30:00Z',
        updated_at: '2024-01-01T09:30:00Z',
      },
    ],
    total_amount: 850,
    status: '受け取り済み',
    payment_status: '支払済み',
    payment_method: '現金',
    estimated_pickup_time: '2024-01-01T09:45:00Z',
    actual_pickup_time: '2024-01-01T09:43:00Z',
    special_instructions: '',
    created_at: '2024-01-01T09:30:00Z',
    updated_at: '2024-01-01T09:43:00Z',
  },
  {
    order_id: 3,
    customer_id: 3,
    order_number: 'A003',
    items: [
      {
        order_item_id: 3,
        order_id: 3,
        product_id: 3,
        product_name: 'たこ焼き 16個入り',
        quantity: 1,
        unit_price: 1100,
        total_price: 1100,
        toppings: [
          { topping_id: 3, topping_name: 'マヨネーズ', price: 30, is_active: true, target_product_ids: [3], display_order: 3, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
        ],
        cooking_time: 15,
        cooking_instruction: '',
        created_at: '2024-01-01T10:00:00Z',
        updated_at: '2024-01-01T10:00:00Z',
      },
    ],
    total_amount: 1130,
    status: 'キャンセル',
    payment_status: '未払い',
    payment_method: '現金',
    estimated_pickup_time: '2024-01-01T10:20:00Z',
    actual_pickup_time: null,
    special_instructions: '',
    created_at: '2024-01-01T10:00:00Z',
    updated_at: '2024-01-01T10:05:00Z',
  },
  {
    order_id: 4,
    customer_id: 4,
    order_number: 'A004',
    items: [
      {
        order_item_id: 4,
        order_id: 4,
        product_id: 1,
        product_name: 'たこ焼き 8個入り',
        quantity: 3,
        unit_price: 600,
        total_price: 1800,
        toppings: [],
        cooking_time: 10,
        cooking_instruction: '',
        created_at: '2024-01-01T11:00:00Z',
        updated_at: '2024-01-01T11:00:00Z',
      },
    ],
    total_amount: 1800,
    status: '受け取り済み',
    payment_status: '支払済み',
    payment_method: '現金',
    estimated_pickup_time: '2024-01-01T11:15:00Z',
    actual_pickup_time: '2024-01-01T11:13:00Z',
    special_instructions: '',
    created_at: '2024-01-01T11:00:00Z',
    updated_at: '2024-01-01T11:13:00Z',
  },
];

function HistoryPage() {
  const [orders, setOrders] = useState<Order[]>(dummyHistoryOrders);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [detailDialog, setDetailDialog] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // 現在時刻を更新
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // フィルタリングされた注文
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const matchesSearch = order.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           order.items.some(item => 
                             item.product_name.toLowerCase().includes(searchQuery.toLowerCase())
                           );
      
      const matchesStatus = statusFilter === 'all' || 
                           (statusFilter === 'completed' && order.status === '受け取り済み') ||
                           (statusFilter === 'cancelled' && order.status === 'キャンセル');
      
      return matchesSearch && matchesStatus;
    });
  }, [orders, searchQuery, statusFilter]);

  // 統計情報
  const stats = useMemo(() => {
    const totalOrders = filteredOrders.length;
    const completedOrders = filteredOrders.filter(o => o.status === '受け取り済み').length;
    const cancelledOrders = filteredOrders.filter(o => o.status === 'キャンセル').length;
    const totalSales = filteredOrders
      .filter(o => o.payment_status === '支払済み')
      .reduce((sum, o) => sum + o.total_amount, 0);
    const averageOrderValue = completedOrders > 0 ? totalSales / completedOrders : 0;

    return {
      totalOrders,
      completedOrders,
      cancelledOrders,
      totalSales,
      averageOrderValue,
    };
  }, [filteredOrders]);

  // 注文詳細表示
  const handleOrderDetail = (order: Order) => {
    setSelectedOrder(order);
    setDetailDialog(true);
  };

  // CSVエクスポート
  const exportToCSV = () => {
    const csvData = [
      ['注文番号', '商品名', '数量', '金額', '状態', '支払い状況', '注文時刻', '完了時刻'],
      ...filteredOrders.map(order => [
        order.order_number,
        order.items.map(item => `${item.product_name}×${item.quantity}`).join('; '),
        order.items.reduce((sum, item) => sum + item.quantity, 0),
        order.total_amount,
        order.status,
        order.payment_status,
        new Date(order.created_at).toLocaleString(),
        order.actual_pickup_time ? new Date(order.actual_pickup_time).toLocaleString() : '-'
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `order_history_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  // 状態の色を取得
  const getStatusColor = (status: string) => {
    switch (status) {
      case '受け取り済み':
        return 'success';
      case 'キャンセル':
        return 'error';
      default:
        return 'default';
    }
  };

  // データ更新
  const refreshData = () => {
    // TODO: APIから最新データを取得
    console.log('履歴データを更新中...');
  };

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <AppBar position="static" color="default" sx={{ mb: 3 }}>
        <Toolbar>
          <HistoryIcon sx={{ mr: 2 }} />
          <Typography variant="h6" component="h1" sx={{ flexGrow: 1 }}>
            注文履歴管理システム
          </Typography>
          <Typography variant="body2" sx={{ mr: 2 }}>
            {currentTime.toLocaleTimeString()}
          </Typography>
          <IconButton color="inherit" onClick={refreshData}>
            <RefreshIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* 統計情報 */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <Card sx={{ minWidth: 200 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CartIcon color="primary" />
              <Typography variant="h6">総注文数</Typography>
            </Box>
            <Typography variant="h4" color="primary">
              {stats.totalOrders}
            </Typography>
          </CardContent>
        </Card>

        <Card sx={{ minWidth: 200 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CheckCircleIcon color="success" />
              <Typography variant="h6">完了注文</Typography>
            </Box>
            <Typography variant="h4" color="success.main">
              {stats.completedOrders}
            </Typography>
          </CardContent>
        </Card>

        <Card sx={{ minWidth: 200 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CancelIcon color="error" />
              <Typography variant="h6">キャンセル</Typography>
            </Box>
            <Typography variant="h4" color="error.main">
              {stats.cancelledOrders}
            </Typography>
          </CardContent>
        </Card>

        <Card sx={{ minWidth: 200 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <MoneyIcon color="success" />
              <Typography variant="h6">総売上</Typography>
            </Box>
            <Typography variant="h4" color="success.main">
              ¥{stats.totalSales.toLocaleString()}
            </Typography>
          </CardContent>
        </Card>

        <Card sx={{ minWidth: 200 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <TrendingUpIcon color="info" />
              <Typography variant="h6">平均注文額</Typography>
            </Box>
            <Typography variant="h4" color="info.main">
              ¥{Math.round(stats.averageOrderValue).toLocaleString()}
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* フィルタとアクション */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            <TextField
              placeholder="注文番号または商品名で検索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              sx={{ minWidth: 300 }}
            />
            
            <FormControl sx={{ minWidth: 150 }}>
              <InputLabel>状態フィルタ</InputLabel>
              <Select
                value={statusFilter}
                label="状態フィルタ"
                onChange={(e) => setStatusFilter(e.target.value)}
                startAdornment={<FilterIcon sx={{ mr: 1 }} />}
              >
                <MenuItem value="all">すべて</MenuItem>
                <MenuItem value="completed">完了済み</MenuItem>
                <MenuItem value="cancelled">キャンセル</MenuItem>
              </Select>
            </FormControl>

            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={exportToCSV}
            >
              CSVエクスポート
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* 注文履歴一覧 */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            注文履歴一覧 ({filteredOrders.length}件)
          </Typography>
          
          {filteredOrders.length === 0 ? (
            <Alert severity="info">
              {searchQuery || statusFilter !== 'all' 
                ? '検索条件に該当する注文がありません' 
                : '注文履歴がありません'}
            </Alert>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>注文番号</TableCell>
                    <TableCell>商品</TableCell>
                    <TableCell>金額</TableCell>
                    <TableCell>状態</TableCell>
                    <TableCell>支払い</TableCell>
                    <TableCell>注文時刻</TableCell>
                    <TableCell>完了時刻</TableCell>
                    <TableCell>詳細</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredOrders.map((order) => (
                    <TableRow key={order.order_id} hover>
                      <TableCell>
                        <Typography variant="body1" fontWeight="bold">
                          {order.order_number}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box>
                          {order.items.map((item, index) => (
                            <Typography key={index} variant="body2">
                              {item.product_name} × {item.quantity}
                            </Typography>
                          ))}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body1" fontWeight="bold">
                          ¥{order.total_amount.toLocaleString()}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={order.status}
                          color={getStatusColor(order.status) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={order.payment_status}
                          color={order.payment_status === '支払済み' ? 'success' : 'warning'}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {new Date(order.created_at).toLocaleString()}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {order.actual_pickup_time 
                            ? new Date(order.actual_pickup_time).toLocaleString()
                            : '-'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="small"
                          startIcon={<ReceiptIcon />}
                          onClick={() => handleOrderDetail(order)}
                        >
                          詳細
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* 注文詳細ダイアログ */}
      <Dialog open={detailDialog} onClose={() => setDetailDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ReceiptIcon />
            注文詳細 - {selectedOrder?.order_number}
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedOrder && (
            <Box>
              <Accordion defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="h6">基本情報</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">注文番号:</Typography>
                      <Typography variant="body1" fontWeight="bold">{selectedOrder.order_number}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">状態:</Typography>
                      <Chip
                        label={selectedOrder.status}
                        color={getStatusColor(selectedOrder.status) as any}
                        size="small"
                      />
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">支払い状況:</Typography>
                      <Chip
                        label={selectedOrder.payment_status}
                        color={selectedOrder.payment_status === '支払済み' ? 'success' : 'warning'}
                        size="small"
                        variant="outlined"
                      />
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">支払い方法:</Typography>
                      <Typography variant="body1">{selectedOrder.payment_method}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">注文時刻:</Typography>
                      <Typography variant="body1">
                        {new Date(selectedOrder.created_at).toLocaleString()}
                      </Typography>
                    </Box>
                    {selectedOrder.actual_pickup_time && (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">完了時刻:</Typography>
                        <Typography variant="body1">
                          {new Date(selectedOrder.actual_pickup_time).toLocaleString()}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </AccordionDetails>
              </Accordion>

              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="h6">注文商品</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <List>
                    {selectedOrder.items.map((item) => (
                      <ListItem key={item.order_item_id} divider>
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: 'orange.light' }}>
                            <ReceiptIcon />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={`${item.product_name} × ${item.quantity}`}
                          secondary={
                            <Box>
                              <Typography variant="body2" color="text.secondary">
                                単価: ¥{item.unit_price.toLocaleString()} | 
                                小計: ¥{item.total_price.toLocaleString()}
                              </Typography>
                              {item.toppings.length > 0 && (
                                <Box sx={{ mt: 0.5 }}>
                                  {item.toppings.map((topping) => (
                                    <Chip
                                      key={topping.topping_id}
                                      label={`${topping.topping_name} (+¥${topping.price})`}
                                      size="small"
                                      sx={{ mr: 0.5, mb: 0.5 }}
                                    />
                                  ))}
                                </Box>
                              )}
                            </Box>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>

                  <Divider sx={{ my: 2 }} />

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6">合計金額</Typography>
                    <Typography variant="h6" color="primary">
                      ¥{selectedOrder.total_amount.toLocaleString()}
                    </Typography>
                  </Box>
                </AccordionDetails>
              </Accordion>

              {selectedOrder.special_instructions && (
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="h6">特別指示</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Alert severity="info">
                      {selectedOrder.special_instructions}
                    </Alert>
                  </AccordionDetails>
                </Accordion>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailDialog(false)}>
            閉じる
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default HistoryPage;
