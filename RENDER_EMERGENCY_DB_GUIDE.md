# 🚨 Render Database 緊急初期化ガイド

## 現在の状況

- orders テーブルが存在しない状態が継続
- サーバーは正常起動するが統計機能が動作しない

## 🔧 緊急対応手順

### 1️⃣ Render ダッシュボードでの手動実行

1. [Render Dashboard](https://dashboard.render.com) にログイン
2. **Web Service** (unifest-backend) を選択
3. **Shell** タブを開く
4. 以下のコマンドを実行:

```bash
# データベース強制初期化スクリプトを実行
npm run force-init-render
```

### 2️⃣ 環境変数の確認

**必要な環境変数:**

```
DATABASE_URL=postgresql://unifest_db_user:PASSWORD@dpg-d1jj1424d50c7382va8g-a:5432/unifest_db
```

**確認方法:**

1. Web Service → **Environment** タブ
2. DATABASE_URL が正しく設定されているか確認

### 3️⃣ ローカルからの手動実行（代替手段）

```bash
# .envファイルにDATABASE_URLを設定後
DATABASE_URL="postgresql://..." npm run force-init-render
```

## 📊 実行後の確認

### 成功時のログ例:

```
🎉 データベース強制初期化完了！
✅ ordersテーブルが利用可能になりました
```

### 確認すべきポイント:

1. ✅ orders テーブルが作成される
2. ✅ 統計ポーリングエラーが解消される
3. ✅ API エンドポイントが正常応答

## 🔍 詳細デバッグ情報

### サーバー起動時のログで確認:

```
🔄 実行中: CREATE TABLE orders...
✅ 成功
```

### まだ問題が続く場合:

1. DATABASE_URL の接続先確認
2. PostgreSQL サービスの状態確認
3. 権限問題の確認

## 💡 予防策

今後このような問題を防ぐため:

1. データベース接続の事前テスト
2. スキーマファイルの定期検証
3. 環境変数の二重チェック

---

**緊急時連絡先:** このガイドで解決しない場合は、Render サポートまたは開発チームにお問い合わせください。
