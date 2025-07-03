import { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Chip,
  Alert,
  Badge,
  LinearProgress,
  AppBar,
  Toolbar,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import {
  Restaurant as RestaurantIcon,
  Timer as TimerIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  People as PeopleIcon,
  TrendingUp as TrendingUpIcon,
  Refresh as RefreshIcon,
  Notifications as NotificationsIcon,
  Store as StoreIcon,
} from '@mui/icons-material';
import type { Order } from '../types';

// ダミーデータ
const dummyOrders: Order[] = [
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
        created_at: '2024-01-01T10:00:00Z',
        updated_at: '2024-01-01T10:00:00Z',
      },
    ],
    total_amount: 1300,
    status: '調理待ち',
    payment_status: '未払い',
    payment_method: '現金',
    estimated_pickup_time: '2024-01-01T10:15:00Z',
    actual_pickup_time: null,
    special_instructions: '',
    created_at: '2024-01-01T10:00:00Z',
    updated_at: '2024-01-01T10:00:00Z',
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
        created_at: '2024-01-01T10:02:00Z',
        updated_at: '2024-01-01T10:02:00Z',
      },
    ],
    total_amount: 850,
    status: '調理中',
    payment_status: '未払い',
    payment_method: '現金',
    estimated_pickup_time: '2024-01-01T10:17:00Z',
    actual_pickup_time: null,
    special_instructions: '',
    created_at: '2024-01-01T10:02:00Z',
    updated_at: '2024-01-01T10:03:00Z',
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
        toppings: [],
        cooking_time: 15,
        cooking_instruction: '',
        created_at: '2024-01-01T10:01:00Z',
        updated_at: '2024-01-01T10:01:00Z',
      },
    ],
    total_amount: 1100,
    status: '調理完了',
    payment_status: '未払い',
    payment_method: '現金',
    estimated_pickup_time: '2024-01-01T10:20:00Z',
    actual_pickup_time: null,
    special_instructions: '',
    created_at: '2024-01-01T10:01:00Z',
    updated_at: '2024-01-01T10:06:00Z',
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
        quantity: 1,
        unit_price: 600,
        total_price: 600,
        toppings: [],
        cooking_time: 10,
        cooking_instruction: '',
        created_at: '2024-01-01T10:08:00Z',
        updated_at: '2024-01-01T10:08:00Z',
      },
    ],
    total_amount: 600,
    status: '受け取り済み',
    payment_status: '支払済み',
    payment_method: '現金',
    estimated_pickup_time: '2024-01-01T10:25:00Z',
    actual_pickup_time: '2024-01-01T10:22:00Z',
    special_instructions: '',
    created_at: '2024-01-01T10:08:00Z',
    updated_at: '2024-01-01T10:22:00Z',
  },
];

function StoreMonitorPage() {
  const [orders] = useState<Order[]>(dummyOrders);
  const [currentTime, setCurrentTime] = useState(new Date());

  // 現在時刻を更新
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // 統計情報を計算
  const stats = {
    totalOrders: orders.length,
    waitingOrders: orders.filter(o => o.status === '調理待ち').length,
    cookingOrders: orders.filter(o => o.status === '調理中').length,
    completedOrders: orders.filter(o => o.status === '調理完了').length,
    deliveredOrders: orders.filter(o => o.status === '受け取り済み').length,
    totalSales: orders.filter(o => o.payment_status === '支払済み').reduce((sum, o) => sum + o.total_amount, 0),
    averageOrderValue: orders.length > 0 ? orders.reduce((sum, o) => sum + o.total_amount, 0) / orders.length : 0,
  };

  // 注文の経過時間を計算
  const getElapsedTime = (createdAt: string) => {
    const now = new Date();
    const created = new Date(createdAt);
    const diffMinutes = Math.floor((now.getTime() - created.getTime()) / (1000 * 60));
    return diffMinutes;
  };

  // 状態の色を取得
  const getStatusColor = (status: string) => {
    switch (status) {
      case '調理待ち':
        return 'warning';
      case '調理中':
        return 'info';
      case '調理完了':
        return 'success';
      case '受け取り済み':
        return 'default';
      default:
        return 'default';
    }
  };

  // 緊急性の判定
  const isUrgent = (order: Order) => {
    const elapsedTime = getElapsedTime(order.created_at);
    return elapsedTime > 15 && (order.status === '調理待ち' || order.status === '調理中');
  };

  // 注文を更新
  const refreshOrders = () => {
    // TODO: APIから最新の注文データを取得
    console.log('注文データを更新中...');
  };

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <AppBar position="static" color="default" sx={{ mb: 3 }}>
        <Toolbar>
          <StoreIcon sx={{ mr: 2 }} />
          <Typography variant="h6" component="h1" sx={{ flexGrow: 1 }}>
            店舗モニター - たこ焼き屋さん
          </Typography>
          <Typography variant="body2" sx={{ mr: 2 }}>
            {currentTime.toLocaleTimeString()}
          </Typography>
          <IconButton color="inherit" onClick={refreshOrders}>
            <RefreshIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* 統計情報 */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <Card sx={{ minWidth: 200 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <PeopleIcon color="primary" />
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
              <TrendingUpIcon color="success" />
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
              <TimerIcon color="warning" />
              <Typography variant="h6">調理待ち</Typography>
            </Box>
            <Typography variant="h4" color="warning.main">
              {stats.waitingOrders}
            </Typography>
          </CardContent>
        </Card>

        <Card sx={{ minWidth: 200 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <RestaurantIcon color="info" />
              <Typography variant="h6">調理中</Typography>
            </Box>
            <Typography variant="h4" color="info.main">
              {stats.cookingOrders}
            </Typography>
          </CardContent>
        </Card>

        <Card sx={{ minWidth: 200 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CheckCircleIcon color="success" />
              <Typography variant="h6">調理完了</Typography>
            </Box>
            <Typography variant="h4" color="success.main">
              {stats.completedOrders}
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* 緊急注文の警告 */}
      {orders.some(isUrgent) && (
        <Alert severity="error" sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <WarningIcon />
            <Typography variant="h6">緊急注文あり</Typography>
          </Box>
          <Typography variant="body2">
            15分以上経過している注文があります。優先的に処理してください。
          </Typography>
        </Alert>
      )}

      {/* 注文一覧テーブル */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            注文一覧
          </Typography>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>注文番号</TableCell>
                  <TableCell>商品</TableCell>
                  <TableCell>金額</TableCell>
                  <TableCell>状態</TableCell>
                  <TableCell>支払い</TableCell>
                  <TableCell>経過時間</TableCell>
                  <TableCell>予定時刻</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {orders.map((order) => (
                  <TableRow 
                    key={order.order_id}
                    sx={{ 
                      bgcolor: isUrgent(order) ? 'error.light' : 'inherit',
                      '&:hover': { bgcolor: 'action.hover' }
                    }}
                  >
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body1" fontWeight="bold">
                          {order.order_number}
                        </Typography>
                        {isUrgent(order) && (
                          <Badge badgeContent={<WarningIcon />} color="error">
                            <NotificationsIcon />
                          </Badge>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box>
                        {order.items.map((item, index) => (
                          <Typography key={index} variant="body2">
                            {item.product_name} × {item.quantity}
                            {item.toppings.length > 0 && (
                              <Box component="span" sx={{ ml: 1 }}>
                                ({item.toppings.map(t => t.topping_name).join(', ')})
                              </Box>
                            )}
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
                        color={getStatusColor(order.status) as 'warning' | 'info' | 'success' | 'default'}
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
                      <Typography 
                        variant="body2" 
                        color={getElapsedTime(order.created_at) > 15 ? 'error' : 'text.secondary'}
                      >
                        {getElapsedTime(order.created_at)}分
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {new Date(order.estimated_pickup_time).toLocaleTimeString()}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* 進捗状況バー */}
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            調理進捗状況
          </Typography>
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2">調理完了率</Typography>
              <Typography variant="body2">
                {stats.totalOrders > 0 ? Math.round((stats.completedOrders + stats.deliveredOrders) / stats.totalOrders * 100) : 0}%
              </Typography>
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={stats.totalOrders > 0 ? (stats.completedOrders + stats.deliveredOrders) / stats.totalOrders * 100 : 0}
              sx={{ height: 10, borderRadius: 5 }}
            />
          </Box>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Chip 
              label={`調理待ち: ${stats.waitingOrders}`} 
              color="warning" 
              size="small"
            />
            <Chip 
              label={`調理中: ${stats.cookingOrders}`} 
              color="info" 
              size="small"
            />
            <Chip 
              label={`調理完了: ${stats.completedOrders}`} 
              color="success" 
              size="small"
            />
            <Chip 
              label={`受け取り済み: ${stats.deliveredOrders}`} 
              color="default" 
              size="small"
            />
          </Box>
        </CardContent>
      </Card>
    </Container>
  );
}

export default StoreMonitorPage;
