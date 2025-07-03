# フロントエンド用Dockerfile（マルチステージビルド）
FROM node:18-alpine AS builder

# 作業ディレクトリの設定
WORKDIR /app

# パッケージファイルをコピー
COPY package*.json ./

# 依存関係のインストール
RUN npm ci

# ソースコードをコピー
COPY . .

# 本番ビルド
RUN npm run build

# 本番用軽量イメージ
FROM nginx:alpine

# Nginxの設定ファイルをコピー
COPY nginx.conf /etc/nginx/conf.d/default.conf

# ビルドしたファイルをコピー
COPY --from=builder /app/dist /usr/share/nginx/html

# ポート設定
EXPOSE 80

# Nginx起動
CMD ["nginx", "-g", "daemon off;"]
