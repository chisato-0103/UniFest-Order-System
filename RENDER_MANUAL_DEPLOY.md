# Render 手動デプロイ手順 🚀

## 前提条件

- GitHub にコードがプッシュされていること
- Render アカウントが作成済みであること

## ステップ 1: データベース作成

1. Render Dashboard → New + → PostgreSQL
   - **Name**: `unifest-database`
   - **Database**: `unifest_order_db`
   - **User**: `unifest_user`
   - **Plan**: Free
   - 作成完了後、**Internal Database URL** をコピー

## ステップ 2: バックエンド作成

1. New + → Web Service

   - **Repository**: `chisato-0103/UniFest-Order-System`
   - **Name**: `unifest-backend`
   - **Runtime**: Node
   - **Build Command**: `cd backend && npm install && npm run build`
   - **Start Command**: `cd backend && npm start`
   - **Plan**: Free

2. Environment Variables 設定:
   ```
   NODE_ENV=production
   PORT=10000
   DATABASE_URL=[ステップ1でコピーしたInternal Database URL]
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-12345
   FRONTEND_URL=https://unifest-frontend.onrender.com
   ```

## ステップ 3: フロントエンド作成

1. New + → Static Site

   - **Repository**: `chisato-0103/UniFest-Order-System`
   - **Name**: `unifest-frontend`
   - **Build Command**: `cd unifest-order-system && npm install && npm run build`
   - **Publish Directory**: `unifest-order-system/dist`
   - **Plan**: Free

2. Environment Variables 設定:
   ```
   VITE_API_URL=https://unifest-backend.onrender.com
   VITE_SOCKET_URL=https://unifest-backend.onrender.com
   ```

## デプロイ完了 ✅

デプロイが完了すると、以下の URL でアクセス可能になります：

- **フロントエンド**: https://unifest-frontend.onrender.com
- **バックエンド API**: https://unifest-backend.onrender.com
- **API Health Check**: https://unifest-backend.onrender.com/health

## 注意事項

- Free Plan では 15 分間非アクティブ状態が続くとスリープします
- 初回アクセス時は起動に 30 秒～ 1 分程度かかります
- データベースは 500MB、1 ヶ月間まで無料です
