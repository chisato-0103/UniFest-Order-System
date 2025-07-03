import React, { createContext, useReducer } from 'react';
import type { ReactNode } from 'react';
import type { Order, Product, Category, Topping, Cart, SystemState, Notification } from '../types';

// State型定義
interface AppState {
  orders: Order[];
  products: Product[];
  categories: Category[];
  toppings: Topping[];
  cart: Cart;
  systemState: SystemState;
  notifications: Notification[];
  currentUser?: {
    id: string;
    name: string;
    role: 'customer' | 'staff' | 'admin';
  };
}

// Action型定義
type AppAction =
  | { type: 'SET_ORDERS'; payload: Order[] }
  | { type: 'ADD_ORDER'; payload: Order }
  | { type: 'UPDATE_ORDER'; payload: Order }
  | { type: 'SET_PRODUCTS'; payload: Product[] }
  | { type: 'ADD_PRODUCT'; payload: Product }
  | { type: 'UPDATE_PRODUCT'; payload: Product }
  | { type: 'SET_CATEGORIES'; payload: Category[] }
  | { type: 'SET_TOPPINGS'; payload: Topping[] }
  | { type: 'ADD_TO_CART'; payload: { product: Product; quantity: number; toppings: Topping[] } }
  | { type: 'REMOVE_FROM_CART'; payload: number }
  | { type: 'UPDATE_CART_ITEM'; payload: { index: number; quantity: number } }
  | { type: 'CLEAR_CART' }
  | { type: 'SET_SYSTEM_STATE'; payload: Partial<SystemState> }
  | { type: 'ADD_NOTIFICATION'; payload: Notification }
  | { type: 'MARK_NOTIFICATION_READ'; payload: number }
  | { type: 'SET_CURRENT_USER'; payload: AppState['currentUser'] };

// 初期状態
const initialState: AppState = {
  orders: [],
  products: [],
  categories: [],
  toppings: [],
  cart: {
    items: [],
    total: 0
  },
  systemState: {
    混雑状況: '空いている',
    待ち件数: 0,
    緊急停止状態: false,
    営業状況: '準備中',
    手動運用モード: false
  },
  notifications: [],
  currentUser: undefined
};

// Reducer関数
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_ORDERS':
      return { ...state, orders: action.payload };
    
    case 'ADD_ORDER':
      return { ...state, orders: [...state.orders, action.payload] };
    
    case 'UPDATE_ORDER':
      return {
        ...state,
        orders: state.orders.map(order =>
          order.order_id === action.payload.order_id ? action.payload : order
        )
      };
    
    case 'SET_PRODUCTS':
      return { ...state, products: action.payload };
    
    case 'ADD_PRODUCT':
      return { ...state, products: [...state.products, action.payload] };
    
    case 'UPDATE_PRODUCT':
      return {
        ...state,
        products: state.products.map(product =>
          product.product_id === action.payload.product_id ? action.payload : product
        )
      };
    
    case 'SET_CATEGORIES':
      return { ...state, categories: action.payload };
    
    case 'SET_TOPPINGS':
      return { ...state, toppings: action.payload };
    
    case 'ADD_TO_CART': {
      const newItem = {
        product: action.payload.product,
        quantity: action.payload.quantity,
        selectedToppings: action.payload.toppings
      };
      const newItems = [...state.cart.items, newItem];
      const newTotal = newItems.reduce((total, item) => {
        const toppingsPrice = item.selectedToppings.reduce((sum, topping) => sum + topping.price, 0);
        return total + (item.product.price + toppingsPrice) * item.quantity;
      }, 0);
      
      return {
        ...state,
        cart: {
          items: newItems,
          total: newTotal
        }
      };
    }
    
    case 'REMOVE_FROM_CART': {
      const filteredItems = state.cart.items.filter((_, index) => index !== action.payload);
      const updatedTotal = filteredItems.reduce((total, item) => {
        const toppingsPrice = item.selectedToppings.reduce((sum, topping) => sum + topping.price, 0);
        return total + (item.product.price + toppingsPrice) * item.quantity;
      }, 0);
      
      return {
        ...state,
        cart: {
          items: filteredItems,
          total: updatedTotal
        }
      };
    }
    
    case 'UPDATE_CART_ITEM': {
      const updatedItems = state.cart.items.map((item, index) =>
        index === action.payload.index ? { ...item, quantity: action.payload.quantity } : item
      );
      const recalculatedTotal = updatedItems.reduce((total, item) => {
        const toppingsPrice = item.selectedToppings.reduce((sum, topping) => sum + topping.price, 0);
        return total + (item.product.price + toppingsPrice) * item.quantity;
      }, 0);
      
      return {
        ...state,
        cart: {
          items: updatedItems,
          total: recalculatedTotal
        }
      };
    }
    
    case 'CLEAR_CART':
      return {
        ...state,
        cart: {
          items: [],
          total: 0
        }
      };
    
    case 'SET_SYSTEM_STATE':
      return {
        ...state,
        systemState: { ...state.systemState, ...action.payload }
      };
    
    case 'ADD_NOTIFICATION':
      return {
        ...state,
        notifications: [action.payload, ...state.notifications]
      };
    
    case 'MARK_NOTIFICATION_READ':
      return {
        ...state,
        notifications: state.notifications.map(notification =>
          notification.notification_id === action.payload
            ? { ...notification, is_confirmed: true }
            : notification
        )
      };
    
    case 'SET_CURRENT_USER':
      return { ...state, currentUser: action.payload };
    
    default:
      return state;
  }
}

// Context作成
export const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
} | null>(null);

// Provider Component
export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}
