# UniFest Order System - 大学祭オーダー管理システム

大学祭のたこ焼き店舗向けのオーダー管理システムです。注文から受け渡しまでのプロセスを効率化し、お客様とスタッフの双方にスムーズな体験を提供します。

## 🎯 主な機能

### お客様向け
- **注文画面**: 直感的な商品選択とカスタマイズ（ソース、青のりなど）
- **注文状況確認**: リアルタイムで調理状況を確認
- **受け取り番号**: QRコードとともに表示

### スタッフ向け
- **店舗モニター**: 全注文の状況を一覧表示
- **厨房画面**: 調理待ち・調理中の注文管理
- **支払い処理**: 現金決済の管理
- **受け渡し管理**: 完成した注文の受け渡し処理

### 管理者向け
- **商品管理**: メニュー・価格・在庫の管理
- **システム設定**: 店舗情報・営業時間・各種設定
- **注文履歴**: 売上統計と注文履歴の確認

## 🚀 技術スタック

### フロントエンド
- **React 18** + **TypeScript** + **Vite**
- **Material-UI (MUI)** - UIコンポーネント
- **React Router** - ルーティング
- **React Hook Form** - フォーム管理
- **Context API** - グローバル状態管理
- **Socket.io Client** - リアルタイム通信

### バックエンド（予定）
- **Node.js** + **Express**
- **PostgreSQL** - データベース
- **Socket.io** - リアルタイム通信
- **QR Code Generator** - QRコード生成

### インフラ
- **Render** - デプロイ・ホスティング（無料枠）

## 🛠️ セットアップ

### 必要な環境
- Node.js 18.0.0 以上
- npm または yarn

### インストール
```bash
# リポジトリをクローン
git clone https://github.com/chisato-0103/UniFest-Order-System.git
cd UniFest-Order-System/unifest-order-system

# 依存関係をインストール
npm install
```

### 開発サーバーの起動
```bash
npm run dev
```

ブラウザで `http://localhost:5173` を開くとアプリケーションが表示されます。

## 📱 画面構成

- `/` - 注文画面（メイン）
- `/customer-status` - 注文状況確認画面
- `/store-monitor` - 店舗モニター画面
- `/kitchen` - 厨房画面
- `/payment` - 支払い画面
- `/delivery` - 受け渡し画面
- `/history` - 注文履歴画面
- `/product-management` - 商品管理画面
- `/system-settings` - システム設定画面

## 🔧 開発コマンド

```bash
# 開発サーバー起動
npm run dev

# ビルド
npm run build

# ビルド結果をプレビュー
npm run preview

# 型チェック
npm run type-check

# Lint
npm run lint
```

## 📁 プロジェクト構造

```
src/
├── components/     # 再利用可能なコンポーネント
├── pages/         # ページコンポーネント
├── contexts/      # Context API（グローバル状態）
├── hooks/         # カスタムフック
├── types/         # TypeScript型定義
├── utils/         # ユーティリティ関数
└── assets/        # 静的ファイル
```

## 🎨 デザインガイドライン

- **カラーパレット**: 温かみのあるオレンジ・赤系統
- **フォント**: 日本語に最適化された読みやすいフォント
- **レスポンシブ**: タブレット・モバイル対応
- **アクセシビリティ**: WCAG 2.1 準拠を目指す

## 📄 ライセンス

このプロジェクトは MIT ライセンスの下で公開されています。

## 👥 コントリビューション

プルリクエストやイシューの報告を歓迎します！開発に参加する際は、以下のガイドラインに従ってください：

1. フォークしてブランチを作成
2. 変更をコミット
3. プルリクエストを送信

## 📞 サポート

質問やバグ報告は [GitHub Issues](https://github.com/chisato-0103/UniFest-Order-System/issues) からお願いします。
