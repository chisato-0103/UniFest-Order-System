import { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Alert,
  Badge,
  LinearProgress,
  Tab,
  Tabs,
  AppBar,
  Toolbar,
} from '@mui/material';
import {
  Restaurant as RestaurantIcon,
  Timer as TimerIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  PlayArrow as PlayArrowIcon,
  Refresh as RefreshIcon,
  LocalFireDepartment as FireIcon,
} from '@mui/icons-material';
import type { Order, OrderStatus } from '../types';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`kitchen-tabpanel-${index}`}
      aria-labelledby={`kitchen-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

// ダミーの注文データ
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
          { topping_id: 2, topping_name: 'かつお節', price: 50, is_active: true, target_product_ids: [1], display_order: 2, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
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
        toppings: [
          { topping_id: 3, topping_name: 'マヨネーズ', price: 30, is_active: true, target_product_ids: [2], display_order: 3, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
        ],
        cooking_time: 12,
        cooking_instruction: '',
        created_at: '2024-01-01T10:02:00Z',
        updated_at: '2024-01-01T10:02:00Z',
      },
    ],
    total_amount: 880,
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
];

function KitchenPage() {
  const [orders, setOrders] = useState<Order[]>(dummyOrders);
  const [selectedTab, setSelectedTab] = useState(0);
  const [cookingTimers, setCookingTimers] = useState<Record<number, number>>({});

  // 調理状況によってフィルタリング
  const waitingOrders = orders.filter(order => order.status === '調理待ち');
  const cookingOrders = orders.filter(order => order.status === '調理中');
  const completedOrders = orders.filter(order => order.status === '調理完了');

  // タイマー管理
  useEffect(() => {
    const interval = setInterval(() => {
      setCookingTimers(prev => {
        const newTimers = { ...prev };
        Object.keys(newTimers).forEach(orderId => {
          if (newTimers[parseInt(orderId)] > 0) {
            newTimers[parseInt(orderId)]--;
          }
        });
        return newTimers;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // 注文の状態を更新
  const updateOrderStatus = (orderId: number, newStatus: OrderStatus) => {
    setOrders(prev => 
      prev.map(order => 
        order.order_id === orderId 
          ? { ...order, status: newStatus, updated_at: new Date().toISOString() }
          : order
      )
    );

    // 調理開始時にタイマーを設定
    if (newStatus === '調理中') {
      const order = orders.find(o => o.order_id === orderId);
      if (order) {
        const totalCookingTime = Math.max(...order.items.map(item => item.cooking_time));
        setCookingTimers(prev => ({ ...prev, [orderId]: totalCookingTime * 60 }));
      }
    }
  };

  // 時間のフォーマット
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // 注文の経過時間を計算
  const getElapsedTime = (createdAt: string) => {
    const now = new Date();
    const created = new Date(createdAt);
    const diffMinutes = Math.floor((now.getTime() - created.getTime()) / (1000 * 60));
    return diffMinutes;
  };

  // 注文カードのレンダリング
  const renderOrderCard = (order: Order, showActions: boolean = true) => {
    const elapsedTime = getElapsedTime(order.created_at);
    const isUrgent = elapsedTime > 15; // 15分以上経過で緊急
    const cookingTimer = cookingTimers[order.order_id];

    return (
      <Card 
        key={order.order_id} 
        sx={{ 
          mb: 2, 
          border: isUrgent ? '2px solid' : '1px solid',
          borderColor: isUrgent ? 'error.main' : 'divider',
          boxShadow: isUrgent ? 3 : 1,
        }}
      >
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="h6" component="h3">
                注文番号: {order.order_number}
              </Typography>
              {isUrgent && (
                <Badge badgeContent={<WarningIcon />} color="error">
                  <Chip label="緊急" color="error" size="small" />
                </Badge>
              )}
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip
                label={order.status}
                color={
                  order.status === '調理待ち' ? 'warning' :
                  order.status === '調理中' ? 'info' :
                  order.status === '調理完了' ? 'success' : 'default'
                }
                variant="filled"
              />
              <Typography variant="body2" color="text.secondary">
                {elapsedTime}分経過
              </Typography>
            </Box>
          </Box>

          {/* 調理タイマー */}
          {order.status === '調理中' && cookingTimer !== undefined && (
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <TimerIcon color="info" />
                <Typography variant="body2">
                  残り調理時間: {formatTime(cookingTimer)}
                </Typography>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={Math.max(0, (1 - cookingTimer / (15 * 60)) * 100)}
                sx={{ height: 8, borderRadius: 4 }}
              />
            </Box>
          )}

          {/* 注文アイテム */}
          <List dense>
            {order.items.map((item) => (
              <ListItem key={item.order_item_id} divider>
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: 'orange.light' }}>
                    <RestaurantIcon />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={`${item.product_name} × ${item.quantity}`}
                  secondary={
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        調理時間: {item.cooking_time}分
                      </Typography>
                      {item.toppings.length > 0 && (
                        <Box sx={{ mt: 0.5 }}>
                          {item.toppings.map((topping) => (
                            <Chip
                              key={topping.topping_id}
                              label={topping.topping_name}
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

          {/* 特別な指示 */}
          {order.special_instructions && (
            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="body2">
                特別な指示: {order.special_instructions}
              </Typography>
            </Alert>
          )}

          {/* アクション */}
          {showActions && (
            <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
              {order.status === '調理待ち' && (
                <Button
                  variant="contained"
                  startIcon={<PlayArrowIcon />}
                  onClick={() => updateOrderStatus(order.order_id, '調理中')}
                  sx={{ bgcolor: 'info.main' }}
                >
                  調理開始
                </Button>
              )}
              {order.status === '調理中' && (
                <Button
                  variant="contained"
                  startIcon={<CheckCircleIcon />}
                  onClick={() => updateOrderStatus(order.order_id, '調理完了')}
                  color="success"
                >
                  調理完了
                </Button>
              )}
              {order.status === '調理完了' && (
                <Button
                  variant="outlined"
                  startIcon={<RefreshIcon />}
                  onClick={() => updateOrderStatus(order.order_id, '調理中')}
                  color="warning"
                >
                  調理に戻す
                </Button>
              )}
            </Box>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <AppBar position="static" color="default" sx={{ mb: 3 }}>
        <Toolbar>
          <FireIcon sx={{ mr: 2 }} />
          <Typography variant="h6" component="h1" sx={{ flexGrow: 1 }}>
            厨房管理システム
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <Badge badgeContent={waitingOrders.length} color="warning">
              <Chip label="調理待ち" />
            </Badge>
            <Badge badgeContent={cookingOrders.length} color="info">
              <Chip label="調理中" />
            </Badge>
            <Badge badgeContent={completedOrders.length} color="success">
              <Chip label="調理完了" />
            </Badge>
          </Box>
        </Toolbar>
      </AppBar>

      <Box sx={{ width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={selectedTab} onChange={(_, newValue) => setSelectedTab(newValue)}>
            <Tab 
              label={`調理待ち (${waitingOrders.length})`} 
              icon={<TimerIcon />}
              iconPosition="start"
            />
            <Tab 
              label={`調理中 (${cookingOrders.length})`} 
              icon={<FireIcon />}
              iconPosition="start"
            />
            <Tab 
              label={`調理完了 (${completedOrders.length})`} 
              icon={<CheckCircleIcon />}
              iconPosition="start"
            />
          </Tabs>
        </Box>

        <TabPanel value={selectedTab} index={0}>
          <Typography variant="h6" gutterBottom>
            調理待ち注文
          </Typography>
          {waitingOrders.length === 0 ? (
            <Alert severity="info">調理待ちの注文はありません</Alert>
          ) : (
            waitingOrders.map(order => renderOrderCard(order))
          )}
        </TabPanel>

        <TabPanel value={selectedTab} index={1}>
          <Typography variant="h6" gutterBottom>
            調理中注文
          </Typography>
          {cookingOrders.length === 0 ? (
            <Alert severity="info">調理中の注文はありません</Alert>
          ) : (
            cookingOrders.map(order => renderOrderCard(order))
          )}
        </TabPanel>

        <TabPanel value={selectedTab} index={2}>
          <Typography variant="h6" gutterBottom>
            調理完了注文
          </Typography>
          {completedOrders.length === 0 ? (
            <Alert severity="info">調理完了の注文はありません</Alert>
          ) : (
            completedOrders.map(order => renderOrderCard(order))
          )}
        </TabPanel>
      </Box>
    </Container>
  );
}

export default KitchenPage;
