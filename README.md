# UniFest Order System

大学祭での店舗運営を効率化するオーダー管理システム

## 概要

UniFest Order System は、大学祭での店舗運営に特化したオーダー管理システムです。
注文受付から調理、支払い、受け渡しまでの一連の流れを統合的に管理し、効率的な店舗運営をサポートします。

## 主な機能

### 基本機能

- 📱 **注文管理**: スマートフォン対応の注文受付システム
- �‍🍳 **厨房管理**: 調理状況のリアルタイム管理
- 🔔 **通知システム**: 音声・視覚通知による効率的な連絡
- � **決済・受け渡し**: 支払い処理と受け渡し管理
- �📊 **売上管理**: リアルタイム売上集計・履歴管理

### 高度機能

- ⏱️ **待ち時間表示**: 動的な待ち時間計算・混雑状況表示
- 📱 **QR コード**: 注文完了時の自動生成・顧客ページアクセス
- � **音声通知**: Web Audio API/Speech Synthesis による音声アラート
- 📦 **在庫管理**: 自動在庫計算・低在庫アラート・在庫履歴
- 🍳 **たこ焼き器管理**: 調理器具の稼働状況・メンテナンス管理
- � **緊急時対応**: システム緊急停止・手動運用モード・緊急メッセージ

## 技術スタック

- **フロントエンド**: React 18 + TypeScript + Material-UI (MUI)
- **状態管理**: React Context API + useReducer
- **ルーティング**: React Router
- **ビルドツール**: Vite
- **開発ツール**: ESLint + TypeScript
- **バージョン管理**: Git + GitHub

## 開発状況

- [x] **要件定義書作成**
- [x] **プロジェクト初期化** (Vite + React + TypeScript)
- [x] **基本画面実装** (注文・厨房・監視・決済・受け渡し・履歴・商品管理・設定)
- [x] **ナビゲーション** (全画面共通・状況表示・通知バッジ)
- [x] **型定義整備** (TypeScript 型安全性)
- [x] **リアルタイム機能** (Context API・自動更新)
- [x] **QR コード機能** (注文完了時生成・顧客ページ連携)
- [x] **音声通知システム** (設定・テスト・実行機能)
- [x] **在庫管理機能** (自動計算・アラート・履歴)
- [x] **待ち時間表示機能** (動的計算・混雑度表示)
- [x] **たこ焼き器管理** (稼働状況・温度管理・メンテナンス)
- [x] **緊急時対応機能** (緊急停止・手動運用・メッセージ管理)
- [x] **ビルド・動作確認**
- [ ] バックエンド API 連携
- [ ] テスト (ユニット・結合・E2E)
- [ ] 本番デプロイ

## 画面構成

1. **注文ページ** (`/`) - 商品選択・カート・注文送信
2. **顧客状況ページ** (`/status/:orderNumber`) - 待ち時間・進捗確認
3. **厨房ページ** (`/kitchen`) - 調理管理・進捗更新
4. **店舗監視ページ** (`/monitor`) - 全体状況・在庫・機器管理
5. **決済ページ** (`/payment`) - 支払い処理
6. **受け渡しページ** (`/delivery`) - 受け渡し管理
7. **履歴ページ** (`/history`) - 注文履歴・売上集計
8. **商品管理ページ** (`/products`) - 商品・在庫管理
9. **システム設定ページ** (`/settings`) - 設定・緊急時対応

## 開発・実行方法

```bash
# プロジェクトクローン
git clone https://github.com/chisato-0103/UniFest-Order-System.git
cd UniFest-Order-System/unifest-order-system

# 依存関係インストール
npm install

# 開発サーバー起動
npm run dev

# ビルド
npm run build

# プレビュー
npm run preview
```

## ディレクトリ構造

```
unifest-order-system/
├── src/
│   ├── components/          # 再利用可能コンポーネント
│   ├── pages/              # ページコンポーネント
│   ├── contexts/           # React Context (状態管理)
│   ├── hooks/              # カスタムフック
│   ├── types/              # TypeScript型定義
│   ├── utils/              # ユーティリティ関数
│   └── App.tsx             # メインアプリケーション
├── public/                 # 静的ファイル
└── package.json           # 依存関係・スクリプト
```

## 今後の予定

- **バックエンド API**: Node.js/Express + SQLite/PostgreSQL
- **リアルタイム通信**: Socket.io
- **認証システム**: JWT + ユーザー管理
- **本番デプロイ**: Vercel/Netlify (フロント) + Railway/Heroku (バック)
- **テスト**: Jest + React Testing Library + Playwright

## ドキュメント

- [システム要件書](オーダー管理システムシステム要件書.md)

## ライセンス

MIT License

## 🚀 デプロイメント

### 前提条件

- Docker 20.10+
- Docker Compose 2.0+
- Git

### 本番環境デプロイ

1. **リポジトリをクローン**

```bash
git clone https://github.com/chisato-0103/UniFest-Order-System.git
cd UniFest-Order-System
```

2. **環境変数を設定**

```bash
# 本番環境用の環境変数をコピー・編集
cp .env.production .env
# 必要に応じて値を変更（JWT_SECRET、データベースパスワード等）
nano .env
```

3. **Docker コンテナでデプロイ**

```bash
# 簡単デプロイ
./deploy.sh production

# または手動デプロイ
docker-compose --env-file .env.production up -d
```

### 開発環境セットアップ

1. **必要な依存関係をインストール**

```bash
# バックエンド
cd backend
npm install

# フロントエンド
cd ../unifest-order-system
npm install
```

2. **データベースセットアップ**

```bash
# PostgreSQLをインストール・起動
brew install postgresql@15
brew services start postgresql@15

# データベース作成
createdb unifest_order_system
psql -d unifest_order_system -f backend/src/database/init.sql
psql -d unifest_order_system -f backend/src/database/init-settings.sql
```

3. **環境変数設定**

```bash
# バックエンド
cd backend
cp .env.example .env
# .envファイルを編集

# フロントエンド
cd ../unifest-order-system
echo "VITE_API_URL=http://localhost:3001" > .env
```

4. **アプリケーション起動**

```bash
# バックエンド（別ターミナル）
cd backend
npm run dev

# フロントエンド（別ターミナル）
cd unifest-order-system
npm run dev
```

### サービス起動確認

- 📱 **フロントエンド**: http://localhost:8080 (本番) / http://localhost:5173 (開発)
- 🔧 **バックエンド API**: http://localhost:3001
- 🏥 **ヘルスチェック**: http://localhost:3001/health
- 📊 **データベース**: localhost:5432

### Docker コマンド

```bash
# サービス起動
docker-compose up -d

# ログ確認
docker-compose logs -f

# サービス停止
docker-compose down

# ボリューム含めて完全削除
docker-compose down -v

# 個別サービスの再起動
docker-compose restart backend
```

### モニタリング

```bash
# システム状態確認
curl http://localhost:3001/health

# リアルタイム統計
curl http://localhost:3001/api/stats/realtime

# 接続状況確認
docker-compose ps
```

### トラブルシューティング

- **ポート競合**: 他のサービスが同じポートを使用している場合は、docker-compose.yml でポート番号を変更
- **データベース接続エラー**: PostgreSQL コンテナの起動完了を待つか、ヘルスチェックを確認
- **Socket.io 接続エラー**: CORS 設定とフロントエンドの API URL を確認

## 🚀 Render デプロイ手順（設計書準拠）

### 前提条件

- GitHub アカウント
- コードが GitHub にプッシュ済み
- render.yaml 設定済み

### ステップ 1: Render アカウント作成

1. [Render.com](https://render.com) にアクセス
2. **「Get Started for Free」** をクリック
3. **GitHub アカウント** でサインアップ

### ステップ 2: リポジトリ接続

1. Render ダッシュボードで **「New +」** → **「Blueprint」**
2. **「Connect GitHub」** をクリック
3. リポジトリ選択: `chisato-0103/UniFest-Order-System`
4. **「Connect」** をクリック

### ステップ 3: render.yaml 自動認識

1. render.yaml が自動検出される
2. 以下の 3 つのサービスが作成される：
   - `unifest-backend` (Node.js API)
   - `unifest-frontend` (React Static Site)
   - `unifest-database` (PostgreSQL)

### ステップ 4: 環境変数の確認

自動設定される環境変数：

```bash
# Backend
NODE_ENV=production
PORT=10000
DATABASE_URL=<自動生成>
JWT_SECRET=<自動生成>
FRONTEND_URL=https://unifest-frontend.onrender.com

# Frontend
VITE_API_URL=https://unifest-backend.onrender.com
VITE_SOCKET_URL=https://unifest-backend.onrender.com
```

### ステップ 5: デプロイ実行

1. **「Apply」** をクリック
2. 自動的にビルド・デプロイ開始
3. 進捗は各サービスのログで確認可能

### ステップ 6: データベース初期化

1. バックエンドデプロイ完了後
2. PostgreSQL に自動接続
3. 初期テーブル作成は自動実行

### ステップ 7: 動作確認

- **フロントエンド**: https://unifest-frontend.onrender.com
- **バックエンド API**: https://unifest-backend.onrender.com/health
- **ヘルスチェック**: 緑色のステータス確認

### 無料枠の制限

- **フロントエンド**: 制限なし
- **バックエンド**: 750 時間/月（十分）
- **データベース**: 1GB、90 日間
- **帯域幅**: 100GB/月

### トラブルシューティング

1. **ビルドエラー**: ログで詳細確認
2. **環境変数エラー**: 設定の再確認
3. **データベース接続エラー**: DATABASE_URL の確認
