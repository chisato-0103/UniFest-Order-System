// 📊 管理者ダッシュボードページ
// 目的: 管理者がシステム全体を管理するためのメインページ
// 機能: 各管理ページへのナビゲーション、注文履歴リセット、ログアウト
// 使用者: 店長や管理者がシステムを管理するために使用

import React, { useState } from "react"; // Reactの基本機能と状態管理
import {
  Box,              // レイアウト用のコンテナ
  Card,             // カード表示コンポーネント
  CardContent,      // カード内のコンテンツ
  Typography,       // テキスト表示コンポーネント
  Button,           // ボタンコンポーネント
  Container,        // ページ全体を囲むコンテナ
  Paper,            // 紙のような背景を持つコンポーネント
  Chip,             // ステータス表示用の小さなタグ
  IconButton,       // アイコン付きボタン
  Dialog,           // ポップアップダイアログ
  DialogTitle,      // ダイアログのタイトル
  DialogContent,    // ダイアログのメインコンテンツ
  DialogActions,    // ダイアログのボタンエリア
  Alert,            // 警告メッセージ表示
  CircularProgress, // ローディングスピナー
} from "@mui/material";
import {
  Restaurant,      // レストランアイコン（商品管理用）
  Kitchen,         // キッチンアイコン（調理管理用）
  Payment,         // 支払いアイコン（会計管理用）
  LocalShipping,   // 配送アイコン（受け渡し用）
  History,         // 履歴アイコン（注文履歴用）
  Settings,        // 設定アイコン（システム設定用）
  Monitor,         // モニターアイコン（監視用）
  ExitToApp,       // ログアウトアイコン
  TrendingUp,      // トレンドアイコン（売上統計用）
  People,          // 人アイコン（顧客管理用）
  Inventory,       // 在庫アイコン（在庫管理用）
  DeleteSweep,     // 削除アイコン（リセット用）
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom"; // ページ遷移用のフック
import { useAuth } from "../hooks/useAuth"; // 認証関連のフック
import PageLayout from "../components/PageLayout"; // 共通レイアウトコンポーネント

// 📊 管理者ダッシュボードコンポーネント
const AdminDashboard: React.FC = () => {
  // 📱 ページ遷移用のフック（他のページに移動するため）
  const navigate = useNavigate();
  // 🔐 認証関連の機能（ログアウト処理など）
  const { logout } = useAuth();

  // 🗑️ 注文履歴リセット関連の状態管理
  const [resetDialogOpen, setResetDialogOpen] = useState(false); // リセットダイアログの開閉状態
  const [resetLoading, setResetLoading] = useState(false);       // リセット処理中かどうか
  const [resetError, setResetError] = useState<string>("");     // リセット時のエラーメッセージ

  // 🚪 ログアウト処理
  // 目的: 管理者がシステムからログアウトして、メインページに戻る
  const handleLogout = () => {
    logout();        // ログアウト処理を実行
    navigate("/");   // メインページに遷移
  };

  // 🗑️ 注文履歴リセット処理
  // 目的: 全ての注文データを削除して、新しい日の営業準備をする
  // 警告: この処理は元に戻すことができないため、慎重に実行する
  const handleResetOrders = async () => {
    setResetLoading(true);  // ローディング開始
    setResetError("");     // エラーメッセージをクリア
    try {
      // 🌍 バックエンドAPIにリセットリクエストを送信
      const response = await fetch('/api/orders/admin/reset', {
        method: 'POST',        // POSTメソッドでデータ変更を通知
        headers: {
          'Content-Type': 'application/json', // JSON形式でデータを送信することを通知
        },
      });

      // 🚨 エラーチェック
      if (!response.ok) {
        throw new Error('注文履歴のリセットに失敗しました');
      }

      // ✅ 成功時の処理
      setResetDialogOpen(false);  // ダイアログを閉じる

      // 🔄 ページをリロードして最新状態を反映
      window.location.reload();
    } catch (error) {
      // ❌ エラーが発生した場合の処理
      setResetError(error instanceof Error ? error.message : '予期しないエラーが発生しました');
    } finally {
      // 📍 最後に必ず実行される処理（成功でも失敗でも）
      setResetLoading(false); // ローディング終了
    }
  };

  // 📜 管理者メニュー項目の定義
  // 目的: ダッシュボードに表示される各管理機能の情報を定義
  const adminMenuItems = [
    {
      title: "商品管理",           // メニュー項目名
      description: "メニュー・価格・在庫管理", // 機能の説明
      icon: <Restaurant />,     // 表示されるアイコン
      color: "#FF6B35",        // カードのカラーテーマ
      path: "/admin/products", // クリック時の遷移先URL
      stats: "12品目",         // 現在の状況情報
    },
    {
      title: "調理管理",           // 厨房管理機能
      description: "注文受付・調理状況管理",
      icon: <Kitchen />,
      color: "#4ECDC4",
      path: "/admin/kitchen",
      stats: "待機中: 3件",
    },
    {
      title: "会計管理",           // 支払い・売上管理機能
      description: "支払い確認・売上管理",
      icon: <Payment />,
      color: "#45B7D1",
      path: "/admin/payment",
      stats: "本日: ¥25,400",
    },
    {
      title: "受け渡し管理",       // 商品受け渡し管理機能
      description: "受け渡し状況管理",
      icon: <LocalShipping />,
      color: "#96CEB4",
      path: "/admin/delivery",
      stats: "配達待ち: 2件",
    },
    {
      title: "注文履歴",           // 過去の注文データ確認機能
      description: "全注文履歴・分析",
      icon: <History />,
      color: "#FFEAA7",
      path: "/admin/history",
      stats: "本日: 47件",
    },
    {
      title: "システム設定",       // システム全体の設定機能
      description: "店舗設定・システム管理",
      icon: <Settings />,
      color: "#DDA0DD",
      path: "/admin/settings",
      stats: "設定済み",
    },
    {
      title: "店舗モニター",       // リアルタイム監視機能
      description: "リアルタイム店舗状況",
      icon: <Monitor />,
      color: "#FFB347",
      path: "/admin/monitor",
      stats: "稼働中",
    },
  ];

  // 📊 クイック統計情報の定義
  // 目的: ダッシュボード上部に表示される重要な数値情報
  const quickStats = [
    {
      label: "本日の注文数",      // 今日の注文総数
      value: "47",              // 実際の数値
      icon: <TrendingUp />,     // 表示アイコン
      color: "#FF6B35",        // カードのカラー
    },
    {
      label: "待機中の注文",      // 現在処理待ちの注文数
      value: "3",
      icon: <People />,
      color: "#4ECDC4",
    },
    {
      label: "在庫商品",            // 管理している商品種類数
      value: "12",
      icon: <Inventory />,
      color: "#45B7D1",
    },
  ];

  // 🎨 メインUIの描画処理
  // 【React JSX構文の説明】
  // return文内のJSXは、HTMLのような書き方でUIを定義する
  // 各コンポーネントは<Component>タグで囲み、propsで設定を渡す
  // {}内ではJavaScriptの式を記述でき、変数や関数を埋め込める
  return (
    <PageLayout title="管理者ダッシュボード"> {/* 共通レイアウトでページのタイトル設定 */}
      <Container maxWidth="lg"> {/* Material-UIのコンテナでページの最大幅を制限 */}
        {/* 🎆 ヘッダーセクション */}
        {/* 【Material-UIのスタイリングシステムについて】 */}
        {/* sx prop: Material-UIのスタイリング方式 */}
        {/* - CSS-in-JSで直接スタイルを記述 */}
        {/* - レスポンシブデザインに対応 */}
        {/* - テーマシステムと連携可能 */}
        <Box sx={{ mb: 4 }}> {/* Boxコンポーネント：レイアウト用の万能コンテナ */}
          <Paper
            elevation={3} // Paperコンポーネント：影付きの紙のような背景、elevation値で影の深さを指定
            sx={{
              p: 3, // padding: 内側の余白を3単位に設定
              background: "linear-gradient(135deg, #FF6B35 0%, #F7931E 100%)", // CSS グラデーション背景
              color: "white", // 文字色を白に設定
              borderRadius: 3, // 角を丸く（3単位の丸み）
            }}
          >
            {/* 📝 タイトルとコントロールボタンのエリア */}
            <Box
              sx={{
                display: "flex", // 横並びレイアウト
                justifyContent: "space-between", // 左右に要素を配置
                alignItems: "center", // 縦方向の中央揃え
                mb: 2, // 下部マージン
              }}
            >
              {/* 🏷️ システムタイトル */}
              <Typography variant="h4" sx={{ fontWeight: 600 }}>
                UniFest たこ焼き店舗管理
              </Typography>
              {/* ⚙️ コントロールボタングループ */}
              <Box sx={{ display: "flex", gap: 1 }}> {/* ボタン間の隙間を設定 */}
                {/* 🗑️ リセットボタン */}
                <IconButton
                  onClick={() => setResetDialogOpen(true)} // リセットダイアログを開く
                  sx={{
                    color: "white",
                    backgroundColor: "rgba(255, 255, 255, 0.2)", // 半透明の背景
                    "&:hover": {
                      backgroundColor: "rgba(255, 255, 255, 0.3)", // ホバー時の背景
                    },
                  }}
                  title="注文履歴をリセット" // ホバー時のツールチップ
                >
                  <DeleteSweep />
                </IconButton>
                {/* 🚪 ログアウトボタン */}
                <IconButton
                  onClick={handleLogout} // ログアウト処理を実行
                  sx={{
                    color: "white",
                    backgroundColor: "rgba(255, 255, 255, 0.2)",
                    "&:hover": {
                      backgroundColor: "rgba(255, 255, 255, 0.3)",
                    },
                  }}
                  title="システムからログアウト" // ホバー時のツールチップテキスト
                >
                  <ExitToApp />
                </IconButton>
              </Box>
            </Box>

            {/* 📊 クイック統計カード群の表示エリア */}
            <Box
              sx={{
                display: "grid",                              // グリッドレイアウトを使用
                gridTemplateColumns: {                        // 画面サイズに応じたカラム数の設定
                  xs: "1fr",                                  // 小さな画面では1列
                  sm: "repeat(3, 1fr)",                       // 中程度の画面では3列
                },
                gap: 2,                                       // カード間の隙間
              }}
            >
              {/* 📈 各統計情報カードの繰り返し表示 */}
              {quickStats.map((stat) => (
                <Card
                  key={stat.label}                            // Reactの一意キー（統計項目名を使用）
                  sx={{
                    backgroundColor: "rgba(255, 255, 255, 0.15)",  // 半透明の白い背景
                    backdropFilter: "blur(10px)",                  // 背景をぼかしてガラス効果
                    color: "white",                                // テキストを白色に
                  }}
                >
                  <CardContent sx={{ p: 2 }}>               {/* カード内のコンテンツ */}
                    <Box sx={{ display: "flex", alignItems: "center" }}> {/* 横並びレイアウト */}
                      {/* 🎨 アイコンを表示するボックス */}
                      <Box
                        sx={{
                          backgroundColor: stat.color,       // 統計項目ごとの色
                          borderRadius: 1,                   // 角を丸く
                          p: 1,                             // 内側の余白
                          mr: 2,                            // 右側のマージン
                        }}
                      >
                        {stat.icon}                         {/* アイコンコンポーネントを表示 */}
                      </Box>
                      {/* 📝 数値と説明文を表示するボックス */}
                      <Box>
                        <Typography variant="h4" sx={{ fontWeight: 600 }}>
                          {stat.value}                      {/* 統計の数値（例：47件） */}
                        </Typography>
                        <Typography variant="body2" sx={{ opacity: 0.9 }}>
                          {stat.label}                      {/* 統計の説明（例：本日の注文数） */}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Box>
          </Paper>
        </Box>

        {/* 🎯 管理メニューカード群の表示エリア */}
        <Box
          sx={{
            display: "grid",                             // グリッドレイアウトを使用
            gridTemplateColumns: {                       // レスポンシブデザインでカラム数を調整
              xs: "1fr",                                 // 小さな画面（スマホ）では1列
              sm: "repeat(2, 1fr)",                      // 中程度の画面（タブレット）では2列
              md: "repeat(3, 1fr)",                      // 大きな画面（デスクトップ）では3列
            },
            gap: 3,                                      // カード間の隙間
          }}
        >
          {/* 🔄 管理メニューの繰り返し表示 */}
          {adminMenuItems.map((item) => (
            <Card
              key={item.title}                           // Reactの一意キー（メニュー項目名を使用）
              sx={{
                height: "100%",                          // カードの高さを100%に設定
                cursor: "pointer",                       // マウスポインタを指の形に変更
                transition: "all 0.3s ease",            // 全てのスタイル変更を0.3秒でスムーズに
                "&:hover": {                             // マウスホバー時のアニメーション
                  transform: "translateY(-4px)",         // カードを上に4px移動
                  boxShadow: "0 8px 25px rgba(0,0,0,0.15)", // 影を濃くして浮いた感じを演出
                },
                borderRadius: 3,                         // カードの角を丸く
                overflow: "hidden",                      // カード外にはみ出る部分を隠す
              }}
              onClick={() => navigate(item.path)}       // クリック時にそのページに遷移
            >
              {/* 🎨 カードのヘッダー部分 */}
              <Box
                sx={{
                  // グラデーション背景（項目ごとの色で薄く着色）
                  background: `linear-gradient(135deg, ${item.color}15, ${item.color}25)`,
                  p: 2,                                  // 内側の余白
                  borderBottom: `3px solid ${item.color}`, // 下部に色付きの境界線
                }}
              >
                {/* 🔧 アイコンとステータスチップの横並びエリア */}
                <Box
                  sx={{
                    display: "flex",                     // 横並びレイアウト
                    alignItems: "center",               // 縦方向の中央揃え
                    justifyContent: "space-between",    // 左右に要素を配置
                    mb: 1,                              // 下部のマージン
                  }}
                >
                  {/* 🎯 アイコンボックス */}
                  <Box
                    sx={{
                      backgroundColor: item.color,      // 項目ごとの色で背景を設定
                      borderRadius: 2,                  // 角を丸く
                      p: 1,                            // 内側の余白
                      color: "white",                  // アイコンの色を白に
                    }}
                  >
                    {item.icon}                        {/* アイコンコンポーネントを表示 */}
                  </Box>
                  {/* 📊 ステータスチップ（現在の状況を表示） */}
                  <Chip
                    label={item.stats}                 // 表示するテキスト（例：12品目）
                    size="small"                       // 小さいサイズ
                    sx={{
                      backgroundColor: `${item.color}20`, // 項目色の20%透明度で背景
                      color: item.color,               // テキストの色
                      fontWeight: 600,                 // 太字
                    }}
                  />
                </Box>
                {/* 📝 タイトルと説明文 */}
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                  {item.title}                         {/* メニュー項目名 */}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {item.description}                   {/* 機能の説明文 */}
                </Typography>
              </Box>
              {/* 🎛️ カードの下部：アクションボタンエリア */}
              <CardContent sx={{ p: 2 }}>
                <Button
                  fullWidth                            // ボタンをカードの幅いっぱいに
                  variant="outlined"                   // 枠線付きボタン
                  sx={{
                    borderColor: item.color,           // 枠線の色
                    color: item.color,                 // テキストの色
                    "&:hover": {                       // ホバー時のスタイル
                      backgroundColor: `${item.color}10`, // 背景色を薄く
                      borderColor: item.color,         // 枠線の色を維持
                    },
                  }}
                >
                  管理画面を開く
                </Button>
              </CardContent>
            </Card>
          ))}
        </Box>

        {/* 🗑️ 注文履歴リセット確認ダイアログ */}
        {/* 目的: 管理者が注文履歴をリセットする前に確認を求める重要なダイアログ */}
        <Dialog
          open={resetDialogOpen}                        // ダイアログの開閉状態を管理
          onClose={() => setResetDialogOpen(false)}     // ダイアログの外をクリック/ESCでダイアログを閉じる
          maxWidth="sm"                                 // ダイアログの最大幅を中程度に設定
          fullWidth                                     // 設定した最大幅まで横幅を広げる
        >
          {/* 🚨 ダイアログのタイトル（警告色で目立たせる） */}
          <DialogTitle sx={{ color: "error.main" }}>
            <DeleteSweep sx={{ mr: 1 }} />              {/* アイコンを右に1単位のマージンで表示 */}
            注文履歴をリセット
          </DialogTitle>

          {/* 📝 ダイアログのメインコンテンツ */}
          <DialogContent>
            {/* ⚠️ 重要な警告メッセージ */}
            <Alert severity="warning" sx={{ mb: 2 }}>
              この操作は元に戻すことができません！
            </Alert>

            {/* 📋 削除される内容の説明 */}
            <Typography variant="body1" sx={{ mb: 2 }}>
              以下のデータが完全に削除されます：
            </Typography>

            {/* 📄 削除対象のリスト表示 */}
            <Box component="ul" sx={{ pl: 2 }}>          {/* ulタグとして表示、左に2単位のパディング */}
              <Typography component="li" variant="body2">
                すべての注文履歴
              </Typography>
              <Typography component="li" variant="body2">
                注文アイテムデータ
              </Typography>
              <Typography component="li" variant="body2">
                支払い履歴
              </Typography>
            </Box>

            {/* 📌 保持されるデータの説明 */}
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              ※ 商品・カテゴリ・トッピングデータは保持されます
            </Typography>

            {/* 🚫 エラーメッセージの表示（エラーがある場合のみ） */}
            {resetError && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {resetError}                            {/* 実際のエラーメッセージを表示 */}
              </Alert>
            )}
          </DialogContent>

          {/* 🎮 ダイアログのアクションボタン群 */}
          <DialogActions>
            {/* ❌ キャンセルボタン */}
            <Button
              onClick={() => setResetDialogOpen(false)} // ダイアログを閉じる
              disabled={resetLoading}                   // リセット処理中は無効化
            >
              キャンセル
            </Button>

            {/* 🗑️ リセット実行ボタン */}
            <Button
              onClick={handleResetOrders}               // リセット処理を実行
              color="error"                            // 危険な操作なので赤色
              variant="contained"                      // 背景色付きボタン
              disabled={resetLoading}                  // リセット処理中は無効化
              startIcon={resetLoading ? <CircularProgress size={16} /> : <DeleteSweep />} // 処理中はローディングスピナー、通常時はリセットアイコン
            >
              {resetLoading ? "リセット中..." : "リセット実行"}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </PageLayout>
  );
};

export default AdminDashboard;
