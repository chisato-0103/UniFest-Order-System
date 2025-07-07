#!/bin/bash

# 🚀 UniFest Order System デプロイメントスクリプト
# このファイルは、アプリを本番環境に公開するためのスクリプトです
# 使用方法: ./deploy.sh [環境] [オプション]
# 環境: dev（開発）, staging（テスト）, production（本番）
# オプション: --build-only（ビルドのみ）, --no-cache（キャッシュなし）, --logs（ログ表示）

set -e # エラーが起きたらすぐに止まる

# 🌈 色付きメッセージ（見やすくするため）
RED='\033[0;31m'    # 赤色（エラー用）
GREEN='\033[0;32m'  # 緑色（成功用）
YELLOW='\033[1;33m' # 黄色（警告用）
BLUE='\033[0;34m'   # 青色（情報用）
NC='\033[0m'        # 色なし（リセット）

# 📝 コマンドの引数を解析
ENVIRONMENT=${1:-dev}  # 環境（デフォルトは dev）
BUILD_ONLY=false       # ビルドのみかどうか
NO_CACHE=false         # キャッシュを使わないかどうか
SHOW_LOGS=false        # ログを表示するかどうか

# 🔍 オプションをチェック
for arg in "$@"
do
    case $arg in
        --build-only)
        BUILD_ONLY=true    # ビルドのみフラグをオンにする
        shift
        ;;
        --no-cache)
        NO_CACHE=true
        shift
        ;;
        --logs)
        SHOW_LOGS=true
        shift
        ;;
    esac
done

echo -e "${BLUE}🚀 UniFest Order System デプロイメント開始${NC}"
echo -e "${YELLOW}環境: $ENVIRONMENT${NC}"
echo "========================================"

# 環境チェック
if [ ! -f "docker-compose.yml" ]; then
    echo -e "${RED}❌ docker-compose.yml が見つかりません${NC}"
    exit 1
fi

if [ ! -f ".env.production" ] && [ "$ENVIRONMENT" = "production" ]; then
    echo -e "${RED}❌ .env.production が見つかりません${NC}"
    exit 1
fi

# Docker及びDocker Composeの確認
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker がインストールされていません${NC}"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose がインストールされていません${NC}"
    exit 1
fi

# 既存のコンテナを停止
echo -e "${YELLOW}🛑 既存のコンテナを停止中...${NC}"
docker-compose down --remove-orphans

# ビルドオプション設定
BUILD_ARGS=""
if [ "$NO_CACHE" = true ]; then
    BUILD_ARGS="--no-cache"
fi

# ビルド実行
echo -e "${YELLOW}🔨 コンテナをビルド中...${NC}"
docker-compose build $BUILD_ARGS

if [ "$BUILD_ONLY" = true ]; then
    echo -e "${GREEN}✅ ビルド完了${NC}"
    exit 0
fi

# データベースのボリューム確認
if [ ! "$(docker volume ls -q -f name=unifest-order-system_postgres_data)" ]; then
    echo -e "${YELLOW}📦 データベースボリュームを初期化中...${NC}"
fi

# サービス起動
echo -e "${YELLOW}🚀 サービスを起動中...${NC}"
if [ "$ENVIRONMENT" = "production" ]; then
    docker-compose --env-file .env.production up -d
else
    docker-compose up -d
fi

# ヘルスチェック待機
echo -e "${YELLOW}⏳ サービスの起動を待機中...${NC}"
sleep 10

# ヘルスチェック実行
check_health() {
    local service=$1
    local url=$2
    local max_attempts=30
    local attempt=1

    echo -e "${BLUE}🏥 $service のヘルスチェック中...${NC}"

    while [ $attempt -le $max_attempts ]; do
        if curl -f -s "$url" > /dev/null 2>&1; then
            echo -e "${GREEN}✅ $service が正常に起動しました${NC}"
            return 0
        fi

        echo -n "."
        sleep 2
        attempt=$((attempt + 1))
    done

    echo -e "${RED}❌ $service の起動に失敗しました${NC}"
    return 1
}

# 各サービスのヘルスチェック
check_health "バックエンド" "http://localhost:3001/health"
check_health "フロントエンド" "http://localhost:8080"

# 最終確認
echo ""
echo -e "${GREEN}🎉 デプロイメント完了！${NC}"
echo "========================================"
echo -e "${BLUE}📱 フロントエンド:${NC} http://localhost:8080"
echo -e "${BLUE}🔧 バックエンドAPI:${NC} http://localhost:3001"
echo -e "${BLUE}🏥 ヘルスチェック:${NC} http://localhost:3001/health"
echo -e "${BLUE}📊 データベース:${NC} localhost:5432"
echo ""

# ログ表示オプション
if [ "$SHOW_LOGS" = true ]; then
    echo -e "${YELLOW}📋 サービスログを表示中...${NC}"
    docker-compose logs -f
else
    echo -e "${YELLOW}💡 ログを表示するには: docker-compose logs -f${NC}"
    echo -e "${YELLOW}💡 サービスを停止するには: docker-compose down${NC}"
fi
