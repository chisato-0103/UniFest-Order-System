#!/bin/bash

# UniFest Order System API テストスクリプト
# 要件定義書に基づいた主要機能をテスト

API_BASE="http://localhost:3001/api"

echo "🚀 UniFest Order System API テスト開始"
echo "======================================"

# サーバーヘルスチェック
echo "📡 1. ヘルスチェック"
curl -s "$API_BASE/../health" | jq '.'
echo ""

# システム設定取得
echo "⚙️ 2. システム設定取得"
curl -s "$API_BASE/settings" | jq '.data | length'
echo ""

# 商品一覧取得
echo "🍽️ 3. 商品一覧取得"
curl -s "$API_BASE/products" | jq '.data | length'
echo ""

# 在庫状況取得
echo "📦 4. 在庫状況取得"
curl -s "$API_BASE/stock/status" | jq '.data | length'
echo ""

# リアルタイム統計取得
echo "📊 5. リアルタイム統計取得"
curl -s "$API_BASE/stats/realtime" | jq '.data.orders'
echo ""

# システム状態取得
echo "🚨 6. システム状態取得"
curl -s "$API_BASE/emergency/status" | jq '.data.status'
echo ""

# 新規注文テスト
echo "📝 7. 新規注文テスト"
ORDER_DATA='{
  "items": [
    {
      "product_id": 1,
      "quantity": 2,
      "toppings": [1, 2]
    }
  ],
  "customer_name": "テストユーザー",
  "notes": "テスト注文"
}'

ORDER_RESPONSE=$(curl -s -X POST \
  -H "Content-Type: application/json" \
  -d "$ORDER_DATA" \
  "$API_BASE/orders")

ORDER_ID=$(echo $ORDER_RESPONSE | jq -r '.data.order_id // empty')

if [ ! -z "$ORDER_ID" ]; then
  echo "✅ 注文作成成功: Order ID $ORDER_ID"

  # 注文ステータス更新テスト
  echo "🔄 8. 注文ステータス更新テスト"
  curl -s -X PATCH \
    -H "Content-Type: application/json" \
    -d '{"status": "preparing", "updated_by": "テストスタッフ"}' \
    "$API_BASE/orders/$ORDER_ID/status" | jq '.success'

  # 注文詳細取得
  echo "📋 9. 注文詳細取得"
  curl -s "$API_BASE/orders/$ORDER_ID" | jq '.data.status'
else
  echo "❌ 注文作成失敗"
fi

echo ""

# 在庫更新テスト
echo "📦 10. 在庫更新テスト"
curl -s -X PATCH \
  -H "Content-Type: application/json" \
  -d '{
    "change_type": "decrease",
    "quantity": 1,
    "reason": "テスト消費",
    "staff_name": "テストスタッフ"
  }' \
  "$API_BASE/stock/1" | jq '.success'

echo ""

# 通知作成テスト
echo "🔔 11. 通知作成テスト"
curl -s -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "notification_type": "test",
    "content": "システムテスト通知",
    "priority": "通常"
  }' \
  "$API_BASE/emergency/notifications" | jq '.success'

echo ""

# 営業状態変更テスト
echo "🏪 12. 営業状態変更テスト"
curl -s -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "status": "open",
    "staff_name": "テストスタッフ"
  }' \
  "$API_BASE/settings/store/status" | jq '.success'

echo ""
echo "✅ APIテスト完了"
echo "======================================"
echo "📱 フロントエンド接続テスト:"
echo "   http://localhost:5173 でReactアプリを起動してください"
echo ""
echo "🔗 Socket.io接続テスト:"
echo "   ブラウザでWebSocketコンソールを確認してください"
echo ""
echo "📊 統計ポーリング確認:"
echo "   30秒ごとに統計データが更新されていることを確認してください"
