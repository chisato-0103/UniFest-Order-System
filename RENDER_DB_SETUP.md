# 🔧 Render データベース設定ガイド

## 現在の問題

- `ERROR: relation "orders" does not exist` が発生
- データベースのテーブルが作成されていない状態

## 解決手順

### 1️⃣ Render ダッシュボードで情報取得

1. [Render Dashboard](https://dashboard.render.com) にログイン
2. **PostgreSQL サービス** (unifest-database) を選択
3. **Connect** タブをクリック
4. **Internal Database URL** をコピー

### 2️⃣ バックエンドサービスの環境変数設定

1. **Web Service** (unifest-backend) を選択
2. **Environment** タブを開く
3. 環境変数を設定:
   ```
   Key: DATABASE_URL
   Value: (上記でコピーしたInternal Database URL)
   ```

### 3️⃣ 手動でのデータベース初期化

オプション 1: Render サービス再デプロイ後の自動初期化

- 環境変数設定後、**Manual Deploy** をクリック
- サーバー起動時に自動でテーブルが作成される

オプション 2: ローカルからの手動初期化

```bash
# .env.renderファイルに正しいDATABASE_URLを設定後
DATABASE_URL="正しいURL" node scripts/init-db-improved.js
```

### 4️⃣ 確認方法

**成功時のログ例:**

```
🔄 データベーススキーマを初期化中...
📋 既存テーブル: なし
✅ データベーススキーマ作成完了
📋 作成されたテーブル:
  - categories
  - products
  - toppings
  - orders
  - order_items
  - notifications
  - system_settings
✅ ordersテーブルが利用可能です
🚀 Server running on port 10000
```

### 5️⃣ トラブルシューティング

**接続エラーの場合:**

- DATABASE_URL が正しく設定されているか確認
- Render ダッシュボードで最新の接続情報を確認

**権限エラーの場合:**

- ユーザーに CREATE TABLE 権限があるか確認
- スーパーユーザー権限が必要な場合がある

## 📁 追加したスクリプト

- `scripts/init-db-improved.js` - 詳細ログ付き DB 初期化
- `scripts/test-render-db.js` - Render への接続テスト
- `scripts/check-env.js` - 環境変数確認
- `.env.render` - Render 環境用設定テンプレート

## 🎯 次のステップ

1. Render ダッシュボードで正確な DATABASE_URL を取得
2. バックエンドサービスの環境変数に設定
3. Manual Deploy を実行
4. ログで「orders テーブルが利用可能です」を確認
