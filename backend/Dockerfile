# バックエンド用Dockerfile
FROM node:18-alpine

# 作業ディレクトリの設定
WORKDIR /app

# パッケージファイルをコピー
COPY package*.json ./

# 依存関係のインストール
RUN npm ci --only=production

# TypeScriptの依存関係をインストール（ビルド用）
RUN npm install -g typescript

# ソースコードをコピー
COPY . .

# TypeScriptをビルド
RUN npm run build

# ポート設定
EXPOSE 3001

# ヘルスチェック
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

# アプリケーション起動
CMD ["npm", "start"]
