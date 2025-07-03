# Render 手動デプロイ手順

## データベース作成

1. New + → PostgreSQL
   - Name: unifest-database
   - Database: unifest_order_db
   - User: unifest_user
   - Plan: Free

## バックエンド作成

1. New + → Web Service

   - Repository: chisato-0103/UniFest-Order-System
   - Name: unifest-backend
   - Runtime: Node
   - Build Command: cd backend && npm install && npm run build
   - Start Command: cd backend && npm start
   - Plan: Free

   Environment Variables:

   - NODE_ENV=production
   - PORT=10000
   - DATABASE_URL=[Connect Database unifest-database]
   - JWT_SECRET=[Generate]
   - FRONTEND_URL=https://unifest-frontend.onrender.com

## フロントエンド作成

1. New + → Static Site

   - Repository: chisato-0103/UniFest-Order-System
   - Name: unifest-frontend
   - Build Command: cd unifest-order-system && npm install && npm run build
   - Publish Directory: unifest-order-system/dist
   - Plan: Free

   Environment Variables:

   - VITE_API_URL=https://unifest-backend.onrender.com
   - VITE_SOCKET_URL=https://unifest-backend.onrender.com
