// バックエンドAPI送信用の型（グローバルに定義）
export type OrderItemForApi = {
  product_id: number;
  quantity: number;
  toppings: { topping_id: number; name: string; price: number }[];
  // 必要に応じてcooking_instruction等も追加
  [key: string]: string | number | boolean | object | undefined;
};
