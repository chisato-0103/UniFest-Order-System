import React, { createContext, useReducer } from "react";
import type { ReactNode } from "react";
import type { Order, Product, Cart, AppAction } from "../types";

// 簡素化されたState型定義
interface SimpleAppState {
  orders: Order[];
  products: Product[];
  cart: Cart;
  loading: boolean;
  error: string | null;
}

// 簡素化されたContext型定義
interface SimpleAppContextType {
  state: SimpleAppState;
  dispatch: React.Dispatch<AppAction>;
}

const initialState: SimpleAppState = {
  orders: [],
  products: [],
  cart: {
    items: [],
    total: 0,
    itemCount: 0,
  },
  loading: false,
  error: null,
};

// シンプルなReducer
function simpleAppReducer(
  state: SimpleAppState,
  action: AppAction
): SimpleAppState {
  switch (action.type) {
    case "SET_PRODUCTS":
      return { ...state, products: action.payload };
    case "ADD_ORDER":
      return { ...state, orders: [...state.orders, action.payload] };
    case "UPDATE_ORDER":
      return {
        ...state,
        orders: state.orders.map((order) =>
          order.id === action.payload.id
            ? { ...order, ...action.payload.updates }
            : order
        ),
      };
    case "UPDATE_CART":
      return { ...state, cart: action.payload };
    case "CLEAR_CART":
      return { ...state, cart: initialState.cart };
    case "SET_LOADING":
      return { ...state, loading: action.payload };
    case "SET_ERROR":
      return { ...state, error: action.payload };
    default:
      return state;
  }
}

const SimpleAppContext = createContext<SimpleAppContextType | null>(null);

export { SimpleAppContext };

interface SimpleAppProviderProps {
  children: ReactNode;
}

export const SimpleAppProvider: React.FC<SimpleAppProviderProps> = ({
  children,
}) => {
  const [state, dispatch] = useReducer(simpleAppReducer, initialState);

  return (
    <SimpleAppContext.Provider value={{ state, dispatch }}>
      {children}
    </SimpleAppContext.Provider>
  );
};
