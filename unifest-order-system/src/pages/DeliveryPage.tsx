// 📦 受け渡し管理ページ
// 目的: 調理が完了した商品をお客さんに渡すための管理画面
// 機能: QRコードスキャン、手動確認、受け渡し完了処理
// 使用者: 受け渡し担当スタッフが使用

import React, { useState, useEffect, useCallback, useRef } from "react"; // Reactの基本機能と状態管理
import { Html5QrcodeScanner } from "html5-qrcode";
import {
  Box, // レイアウト用コンテナ
  Typography, // テキスト表示コンポーネント
  Card, // カード表示コンポーネント
  CardContent, // カード内のコンテンツ
  Button, // ボタンコンポーネント
  Chip, // ステータス表示用タグ
  Paper, // 紙のような背景コンポーネント
  Container, // ページ全体を囲むコンテナ
  Alert, // 警告メッセージ表示
  Dialog, // ポップアップダイアログ
  DialogTitle, // ダイアログのタイトル
  DialogContent, // ダイアログのメインコンテンツ
  DialogActions, // ダイアログのボタンエリア
  TextField, // テキスト入力欄
} from "@mui/material";
import {
  CheckCircle as CheckCircleIcon, // チェックマークアイコン（完了時使用）
  Refresh as RefreshIcon, // 更新アイコン（データ更新用）
  QrCodeScanner as QrIcon, // QRコードスキャンアイコン
  Person as PersonIcon, // 人アイコン（顧客表示用）
} from "@mui/icons-material";
import type { Order } from "../types"; // 注文データの型定義
import MockApi from "../services/mockApi"; // テスト用モックAPI
import { OrderService } from "../services/apiService"; // 本番用APIサービス

// 📦 受け渡しページコンポーネント
function DeliveryPage() {
  // 📝 状態管理（コンポーネントが記憶しておく情報）
  const [orders, setOrders] = useState<Order[]>([]); // 受け渡し待ちの注文リスト
  const [loading, setLoading] = useState(false); // 処理中かどうかのフラグ
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null); // 現在選択されている注文
  const [deliveryDialogOpen, setDeliveryDialogOpen] = useState(false); // 受け渡し確認ダイアログの開閉状態
  const [qrScannerOpen, setQrScannerOpen] = useState(false); // QRコードスキャナーの開閉状態
  const [orderNumberInput, setOrderNumberInput] = useState(""); // 手動入力された注文番号
  const [refreshing, setRefreshing] = useState(false); // データ更新中かどうか
  const [error, setError] = useState<string | null>(null); // エラーメッセージ
  const [qrScanner, setQrScanner] = useState<Html5QrcodeScanner | null>(null); // QRスキャナーインスタンス
  const qrReaderRef = useRef<HTMLDivElement>(null); // QRリーダー要素への参照
  const [cameraPermission, setCameraPermission] = useState<string>('checking'); // カメラ権限状態
  const [showCameraPreview, setShowCameraPreview] = useState(false); // カメラプレビュー表示状態
  const cameraPreviewRef = useRef<HTMLVideoElement>(null); // カメラプレビュー要素への参照
  const [isQRScanMode, setIsQRScanMode] = useState(false); // QRスキャンモード状態
  const [currentStream, setCurrentStream] = useState<MediaStream | null>(null); // 現在のカメラストリーム
  const [isScanning, setIsScanning] = useState(false); // QRスキャン実行中状態
  const canvasRef = useRef<HTMLCanvasElement>(null); // Canvas要素への参照

  // 📶 注文データ取得関数
  // 目的: 受け渡し待ちの注文をサーバーから取得して画面に表示
  // useCallback: 関数をメモ化して、不要な再作成を防ぐ
  const fetchOrders = useCallback(async () => {
    setRefreshing(true); // 更新中スピナーを表示
    setError(null); // 前回のエラーをクリア
    try {
      // 🌍 環境によってAPIを切り替え（本番はOrderService、開発はMockApi）
      if (process.env.NODE_ENV === "production") {
        const result = await OrderService.getOrders(); // 本番用APIでデータ取得
        setOrders(result);
      } else {
        const result = await MockApi.getOrders(); // テスト用APIでデータ取得
        setOrders(result.data);
      }
    } catch (err: unknown) {
      // ❌ エラーハンドリング（ネットワークエラー、サーバーエラーなど）
      if (err instanceof Error) {
        setError("注文データの取得に失敗しました: " + err.message);
      } else {
        setError("注文データの取得に失敗しました");
      }
    } finally {
      // 📍 最後に必ず実行される処理（成功でも失敗でも）
      setRefreshing(false); // ローディング状態を終了
    }
  }, []); // 依存配列が空なので、コンポーネントの生存期間中は関数が変わらない

  // 🚀 初期化処理（コンポーネントが読み込まれた時に1回だけ実行）
  // useEffect: コンポーネントのライフサイクルに合わせて処理を実行
  useEffect(() => {
    fetchOrders(); // 最初に一度データを取得

    // ⏰ 定期的な自動更新の設定（60秒ごとにデータを更新）
    const interval = setInterval(() => {
      console.log("📦 受け渡し画面: 注文データを自動更新中...");
      fetchOrders(); // 60秒ごとに新しい注文をチェック
    }, 60000); // 60秒 = 60,000ミリ秒

    // 📱 他のタブからの更新通知を受信する仕組み
    // 例: 厨房ページで「調理完了」ボタンが押された時に、自動でこの画面も更新
    const handleDataUpdate = () => {
      console.log("🔔 受け渡し画面: 他のタブからの更新通知を受信");
      fetchOrders(); // 通知を受けてすぐにデータを更新
    };

    // 🔊 カスタムイベントリスナーを登録
    window.addEventListener("unifest-data-updated", handleDataUpdate);

    // 🗑️ クリーンアップ関数（コンポーネントが破棄される時に実行）
    return () => {
      clearInterval(interval); // タイマーを停止（メモリリーク防止）
      window.removeEventListener("unifest-data-updated", handleDataUpdate); // イベントリスナーを削除
    };
  }, [fetchOrders]); // fetchOrdersが変更された時に再実行

  // カメラ権限の事前チェック
  const checkCameraPermission = async () => {
    try {
      console.log("カメラ権限をチェック中...");
      
      // navigator.mediaDevices.getUserMediaを直接テスト
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: "environment",
          width: { min: 640, ideal: 1280, max: 1920 },
          height: { min: 480, ideal: 720, max: 1080 }
        }
      });
      
      console.log("カメラ権限取得成功:", stream);
      setCameraPermission('granted');
      setCurrentStream(stream); // ストリームを保存
      
      // カメラプレビューを表示
      setShowCameraPreview(true);
      
      // 少し待ってからvideo要素にストリームを設定
      setTimeout(() => {
        if (cameraPreviewRef.current) {
          console.log("video要素にストリームを設定:", cameraPreviewRef.current);
          cameraPreviewRef.current.srcObject = stream;
          
          // play()の呼び出しをPromiseとして扱う
          cameraPreviewRef.current.play().then(() => {
            console.log("video再生開始成功");
          }).catch((playError) => {
            console.error("video再生エラー:", playError);
            // 再生エラーの場合でもストリームは有効なので継続
          });
          
          // プレビューを表示したままにする（手動で停止するまで）
          console.log("カメラプレビューを表示中（手動停止まで継続）");
        } else {
          console.error("video要素が見つかりません");
          // プレビューが表示できない場合はすぐに停止
          stream.getTracks().forEach(track => track.stop());
          setShowCameraPreview(false);
          setCurrentStream(null);
        }
      }, 100); // 100ms待機
      
      return true;
    } catch (error) {
      console.error("カメラ権限エラー:", error);
      setCameraPermission('denied');
      
      const errorStr = String(error);
      if (errorStr.includes('NotAllowedError') || errorStr.includes('Permission')) {
        setError("カメラの使用を許可してください。ブラウザのアドレスバーのカメラアイコンをクリックするか、設定 {'>'}  Safari {'>'}  カメラでアクセスを許可してください。");
      } else if (errorStr.includes('NotFoundError')) {
        setError("カメラが見つかりません。デバイスにカメラが搭載されていることを確認してください。");
      } else if (errorStr.includes('NotSupportedError')) {
        setError("このブラウザではカメラがサポートされていません。Safari または Chrome をお使いください。");
      } else {
        setError("カメラの起動に失敗しました。ブラウザを更新してもう一度お試しください。");
      }
      
      return false;
    }
  };

  // BarcodeDetector APIを使用してQRコードをスキャンする関数
  const scanQRCode = async () => {
    if (!cameraPreviewRef.current || !canvasRef.current || !currentStream) {
      console.error("QRスキャンに必要な要素が見つかりません");
      return;
    }

    const video = cameraPreviewRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    
    if (!context) {
      console.error("Canvas context が取得できません");
      return;
    }

    // BarcodeDetector APIのサポートを確認
    if (!('BarcodeDetector' in window)) {
      console.error("BarcodeDetector API がサポートされていません");
      setError("このブラウザではQRコードスキャンがサポートされていません。Chrome または Edge をお使いください。");
      return;
    }

    try {
      // @ts-ignore - BarcodeDetectorはTypeScriptの型定義にない場合があります
      const barcodeDetector = new BarcodeDetector({ formats: ['qr_code'] });
      
      // videoのフレームをcanvasに描画
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // BarcodeDetectorでQRコードを検出
      const barcodes = await barcodeDetector.detect(canvas);
      
      if (barcodes.length > 0) {
        console.log("QRコードを検出:", barcodes[0].rawValue);
        handleQRScan(barcodes[0].rawValue);
        setIsQRScanMode(false);
        setShowCameraPreview(false);
        setIsScanning(false);
        
        // ストリームを停止
        if (currentStream) {
          currentStream.getTracks().forEach(track => track.stop());
          setCurrentStream(null);
        }
      }
    } catch (error) {
      console.error("QRコードスキャンエラー:", error);
    }
  };

  // QRスキャンモードでの連続スキャン
  useEffect(() => {
    if (isQRScanMode && isScanning) {
      const interval = setInterval(() => {
        scanQRCode();
      }, 500); // 500ms間隔でスキャン

      return () => clearInterval(interval);
    }
  }, [isQRScanMode, isScanning]);

  // QRスキャナーを手動で起動する関数
  const startQRScanner = async () => {
    if (!qrReaderRef.current) {
      console.error("QRリーダー要素が見つかりません");
      setError("QRスキャナーの初期化に失敗しました");
      return;
    }

    try {
      // 要素にユニークIDを設定
      const uniqueId = `qr-reader-${Date.now()}`;
      qrReaderRef.current.id = uniqueId;
      
      const scanner = new Html5QrcodeScanner(
        uniqueId,
        { 
          fps: 10, 
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
          // iOS対応のためのカメラ設定
          videoConstraints: {
            width: { min: 640, ideal: 1280, max: 1920 },
            height: { min: 480, ideal: 720, max: 1080 },
            facingMode: "environment" // 背面カメラを優先
          }
        },
        false
      );
      
      scanner.render(
        (decodedText) => {
          handleQRScan(decodedText);
          setQrScannerOpen(false);
          scanner.clear();
        },
        (error) => {
          console.error("QRスキャンエラー:", error);
          const errorStr = String(error);
          if (errorStr.includes('NotAllowedError') || errorStr.includes('Permission')) {
            setError("カメラの使用を許可してください。ブラウザのアドレスバーのカメラアイコンをクリックするか、設定 {'>'}  Safari {'>'}  カメラでアクセスを許可してください。");
          } else {
            setError("カメラの起動に失敗しました。ブラウザを更新してもう一度お試しください。");
          }
        }
      );
      
      setQrScanner(scanner);
    } catch (error) {
      console.error("QRスキャナー初期化エラー:", error);
      setError("QRスキャナーの初期化に失敗しました");
    }
  };

  // QRスキャナーのセットアップ
  useEffect(() => {
    if (qrScannerOpen && qrReaderRef.current) {
      // まずカメラ権限をチェック
      checkCameraPermission().then((hasPermission) => {
        if (!hasPermission) {
          console.log("カメラ権限がありません");
          return;
        }
        
        // useRefを使用してDOM要素の存在確認
        const element = qrReaderRef.current;
        if (!element) {
          console.error("QRリーダー要素が見つかりません");
          setError("QRスキャナーの初期化に失敗しました");
          return;
        }

        // 少し遅延を追加してDOMの描画を待つ
        const timer = setTimeout(() => {
          try {
            // 要素にユニークIDを設定
            const uniqueId = `qr-reader-${Date.now()}`;
            element.id = uniqueId;
            
            const scanner = new Html5QrcodeScanner(
              uniqueId,
              { 
                fps: 10, 
                qrbox: { width: 250, height: 250 },
                aspectRatio: 1.0,
                // iOS対応のためのカメラ設定
                videoConstraints: {
                  width: { min: 640, ideal: 1280, max: 1920 },
                  height: { min: 480, ideal: 720, max: 1080 },
                  facingMode: "environment" // 背面カメラを優先
                }
              },
              false
            );
            
            scanner.render(
              (decodedText) => {
                handleQRScan(decodedText);
                setQrScannerOpen(false);
                scanner.clear();
              },
              (error) => {
                console.error("QRスキャンエラー:", error);
                const errorStr = String(error);
                if (errorStr.includes('NotAllowedError') || errorStr.includes('Permission')) {
                  setError("カメラの使用を許可してください。ブラウザのアドレスバーのカメラアイコンをクリックするか、設定 {'>'}  Safari {'>'}  カメラでアクセスを許可してください。");
                } else {
                  setError("カメラの起動に失敗しました。ブラウザを更新してもう一度お試しください。");
                }
              }
            );
            
            setQrScanner(scanner);
          } catch (error) {
            console.error("QRスキャナー初期化エラー:", error);
            setError("QRスキャナーの初期化に失敗しました");
          }
        }, 500); // 500ms遅延に延長

        return () => clearTimeout(timer);
      });
    }
    
    return () => {
      if (qrScanner) {
        qrScanner.clear();
        setQrScanner(null);
      }
    };
  }, [qrScannerOpen]);

  // 🎁 受け渡し処理
  // 目的: お客さんに商品を渡して、注文を完了状態に変更する
  const handleDelivery = async (orderId: string) => {
    try {
      setLoading(true); // ローディング開始（ボタンが無効化される）

      // 🌍 API呼び出し（現在はテスト用に1秒待機）
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // 📋 ローカル状態を更新（渡した注文をリストから削除）
      setOrders((prev) => prev.filter((order) => order.id !== orderId));
      setDeliveryDialogOpen(false); // ダイアログを閉じる
      setSelectedOrder(null); // 選択状態をクリア
      setOrderNumberInput(""); // 入力欄をクリア
    } catch (error) {
      // ❌ エラーが発生した場合のログ出力
      console.error("受け渡し処理エラー:", error);
    } finally {
      // 📍 最後に必ず実行される処理
      setLoading(false); // ローディング終了（ボタンが再び有効化）
    }
  };

  // 📱 QRコード読み取り処理
  // 目的: お客さんのQRコードを読み取って自動的に受け渡し処理を行う
  // 引数: qrData - QRコードから読み取ったデータ（JSON形式または注文番号）
  const handleQRScan = (qrData: string) => {
    try {
      console.log("QRコード読み取り:", qrData);

      // 📋 QRコードデータを解析
      // QRコードには注文情報がJSON形式で含まれている場合と、
      // 単純な注文番号文字列の場合がある
      let orderInfo;
      try {
        // 1. まずJSON形式として解析を試行
        orderInfo = JSON.parse(qrData);
      } catch {
        // 2. JSON解析に失敗した場合は、単純な注文番号として扱う
        orderInfo = { orderNumber: qrData };
      }

      // 🔍 注文番号で注文を検索
      // 複数の形式の注文番号フィールドに対応
      // （データベースの変更に対応するため）
      const foundOrder = orders.find(
        (order) =>
          order.orderNumber === orderInfo.orderNumber || // 新しい形式
          order.order_number === orderInfo.orderNumber || // 古い形式
          order.id === orderInfo.orderNumber // ID形式
      );

      if (foundOrder) {
        // ✅ 注文が見つかった場合の処理
        setSelectedOrder(foundOrder);
        // QRコード読み取り成功時は自動的に受け渡し完了とする
        // （手動確認を省略してスピードアップ）
        handleDelivery(foundOrder.id);
      } else {
        // ❌ 注文が見つからなかった場合のエラー表示
        setError(`注文番号 ${orderInfo.orderNumber} が見つかりません。`);
      }
    } catch (error) {
      // ❌ QRコード処理全般のエラーハンドリング
      console.error("QRコード処理エラー:", error);
      setError("QRコードの読み取りに失敗しました。");
    }
  };

  // 👤 手動確認ダイアログを開く
  // 目的: QRコードが使えない場合の手動での注文番号確認処理
  // 引数: order - 確認対象の注文データ
  const handleManualVerification = (order: Order) => {
    setSelectedOrder(order); // 選択された注文を状態に保存
    setDeliveryDialogOpen(true); // 手動確認ダイアログを開く
  };

  // 🔄 データ更新処理
  // 目的: ユーザーが手動で「更新」ボタンを押した時の処理
  // 新しい注文が追加されたかどうかを確認する
  const handleRefresh = async () => {
    console.log("📦 受け渡し画面: 手動リフレッシュ実行");
    await fetchOrders(); // 最新の注文データを取得
  };

  return (
    <Box>
      {/* 🧭 ナビゲーションバーはApp.tsxで共通表示 */}
      {/* Container: Material-UIのレスポンシブコンテナ */}
      {/* maxWidth="xl": 最大幅を設定（xs < sm < md < lg < xl） */}
      {/* sx: Material-UIのスタイルプロパティ（CSSのようなもの） */}
      {/* py: paddingのY軸（上下）方向の設定 */}
      <Container maxWidth="xl" sx={{ py: { xs: 1.5, sm: 2 } }}>
        {/* Paper: 紙のような背景と影を持つコンテナ */}
        {/* elevation={3}: 影の深さを設定（0-24） */}
        {/* p: paddingの設定 */}
        <Paper elevation={3} sx={{ p: { xs: 2, sm: 3 } }}>
          {/* 📋 ページヘッダー部分 */}
          <Box sx={{ mb: { xs: 2, sm: 3 } }}>
            {/* Typography: テキスト表示用のMaterial-UIコンポーネント */}
            {/* variant="h4": 見出しレベル4のスタイル */}
            {/* gutterBottom: 下にマージンを自動で追加 */}
            <Typography
              variant="h4"
              gutterBottom
              sx={{
                fontSize: { xs: "1.5rem", sm: "2rem" }, // レスポンシブなフォントサイズ
                fontWeight: { xs: 600, sm: 400 }, // レスポンシブなフォントの太さ
              }}
            >
              受け渡し管理
            </Typography>
            {/* サブタイトル: このページの説明 */}
            <Typography
              variant="body1"
              color="text.secondary" // セカンダリーテキストの色
              sx={{ fontSize: { xs: "0.95rem", sm: "1rem" } }}
            >
              調理完了した注文の受け渡しを管理します
            </Typography>
          </Box>

          {/* 📊 統計情報カード */}
          {/* 現在の受け渡し待ち件数を大きく表示 */}
          <Box sx={{ mb: { xs: 2, sm: 3 } }}>
            {/* Card: Material-UIのカードコンポーネント */}
            <Card>
              {/* CardContent: カードの内容部分 */}
              <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                {/* 統計のタイトル */}
                <Typography
                  variant="h6"
                  gutterBottom
                  sx={{ fontSize: { xs: "1.1rem", sm: "1.25rem" } }}
                >
                  受け渡し待ち
                </Typography>
                {/* 件数を大きく表示 */}
                <Typography
                  variant="h4"
                  color="primary" // テーマのプライマリーカラー
                  sx={{ fontSize: { xs: "2rem", sm: "2.5rem" } }}
                >
                  {orders.length} {/* 配列の長さ = 受け渡し待ち件数 */}
                </Typography>
                {/* 単位 */}
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ fontSize: { xs: "0.9rem", sm: "1rem" } }}
                >
                  件
                </Typography>
              </CardContent>
            </Card>
          </Box>

          {/* ⚠️ エラー表示 */}
          {/* error状態がnullでない場合のみ表示される */}
          {/* &&演算子: 左側がtrueの場合のみ右側を実行 */}
          {error && (
            <Alert
              severity="error" // エラーのアラート（赤色）
              sx={{
                mb: { xs: 1.5, sm: 2 }, // 下マージン
                fontSize: { xs: "0.9rem", sm: "1rem" }, // フォントサイズ
              }}
            >
              {error} {/* エラーメッセージを表示 */}
            </Alert>
          )}

          {/* 📋 受け渡し待ち注文一覧 */}
          <Box sx={{ mb: { xs: 2, sm: 3 } }}>
            {/* セクションヘッダー：タイトルと更新ボタン */}
            <Box
              sx={{
                display: "flex", // フレックスボックスレイアウト
                justifyContent: "space-between", // 左右に要素を配置
                alignItems: "center", // 垂直方向の中央揃え
                mb: { xs: 1.5, sm: 2 }, // 下マージン
                flexDirection: { xs: "column", sm: "row" }, // スマホでは縦並び、PCでは横並び
                gap: { xs: 1, sm: 0 }, // 要素間のスペース
              }}
            >
              {/* セクションタイトル */}
              <Typography
                variant="h6"
                sx={{ fontSize: { xs: "1.1rem", sm: "1.25rem" } }}
              >
                受け渡し待ち注文
              </Typography>
              {/* 更新ボタン */}
              <Button
                variant="outlined" // 枠線スタイル
                startIcon={
                  <RefreshIcon sx={{ fontSize: { xs: 18, sm: 22 } }} />
                } // 左にアイコン
                onClick={handleRefresh} // クリック時の処理
                disabled={refreshing} // 更新中は無効化
                sx={{
                  py: { xs: 0.7, sm: 1 }, // 上下パディング
                  px: { xs: 2, sm: 3 }, // 左右パディング
                  fontSize: { xs: "0.95rem", sm: "1rem" }, // フォントサイズ
                  minHeight: { xs: 40, sm: 48 }, // 最小高さ
                  width: { xs: "100%", sm: "auto" }, // スマホでは全幅、PCでは自動
                }}
              >
                更新
              </Button>
            </Box>

            {/* 📄 注文リスト表示の条件分岐 */}
            {/* 三項演算子: 条件 ? 真の場合 : 偽の場合 */}
            {orders.length === 0 ? (
              // 📭 注文がない場合のメッセージ
              <Alert
                severity="info" // 情報アラート（青色）
                sx={{
                  mb: { xs: 1.5, sm: 2 },
                  fontSize: { xs: "0.9rem", sm: "1rem" },
                }}
              >
                現在、受け渡し待ちの注文はありません。
              </Alert>
            ) : (
              // 📋 注文がある場合のカード一覧
              <Box
                sx={{
                  display: "grid", // CSS Grid レイアウト
                  gridTemplateColumns: {
                    // グリッドの列数
                    xs: "1fr", // スマホ: 1列
                    lg: "repeat(2, 1fr)", // 大画面: 2列
                  },
                  gap: { xs: 1.5, sm: 2 }, // カード間のスペース
                }}
              >
                {/* 📝 各注文をカードとして表示 */}
                {/* map関数: 配列の各要素に対して処理を実行 */}
                {orders.map((order) => (
                  <Card key={order.id}>
                    {" "}
                    {/* key: React の一意識別子 */}
                    <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                      {/* 📋 注文番号とステータス表示 */}
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between", // 左右に要素を配置
                          alignItems: "center",
                          mb: { xs: 1.5, sm: 2 },
                          flexDirection: { xs: "column", sm: "row" },
                          gap: { xs: 1, sm: 0 },
                        }}
                      >
                        {/* 注文番号 */}
                        <Typography
                          variant="h6"
                          sx={{
                            fontSize: { xs: "1.1rem", sm: "1.25rem" },
                            textAlign: { xs: "center", sm: "left" },
                          }}
                        >
                          注文番号: {order.orderNumber}
                        </Typography>
                        {/* ステータスチップ */}
                        <Chip
                          label="受け渡し待ち"
                          color="success" // 成功カラー（緑色）
                          icon={
                            <CheckCircleIcon
                              sx={{ fontSize: { xs: 18, sm: 22 } }}
                            />
                          }
                          sx={{
                            fontSize: { xs: "0.85rem", sm: "0.95rem" },
                            height: { xs: 28, sm: 32 },
                          }}
                        />
                      </Box>

                      {/* 💰 注文詳細情報 */}
                      <Box sx={{ mb: { xs: 1.5, sm: 2 } }}>
                        {/* 合計金額 */}
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{
                            fontSize: { xs: "0.9rem", sm: "1rem" },
                            mb: { xs: 0.5, sm: 0 },
                          }}
                        >
                          合計金額: ¥{order.total?.toLocaleString() || 0}
                          {/* toLocaleString(): 数値を3桁区切りで表示 */}
                          {/* オプショナルチェーン(?.): nullの場合は0を表示 */}
                        </Typography>
                        {/* 注文時刻 */}
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ fontSize: { xs: "0.9rem", sm: "1rem" } }}
                        >
                          注文時刻:{" "}
                          {order.createdAt
                            ? new Date(order.createdAt).toLocaleString() // 日時を読みやすい形式に変換
                            : ""}
                        </Typography>
                      </Box>

                      {/* 🎛️ 受け渡し操作ボタン */}
                      <Box
                        sx={{
                          display: "flex",
                          gap: { xs: 1, sm: 2 }, // ボタン間のスペース
                          flexDirection: { xs: "column", sm: "row" }, // レスポンシブ配置
                        }}
                      >
                        {/* 📱 QRスキャンボタン */}
                        <Button
                          variant="contained" // 塗りつぶしスタイル
                          color="primary" // プライマリーカラー
                          startIcon={
                            <QrIcon sx={{ fontSize: { xs: 18, sm: 22 } }} />
                          }
                          sx={{
                            flex: 1, // 均等に幅を取る
                            py: { xs: 1, sm: 1.2 }, // 上下パディング
                            fontSize: { xs: "0.95rem", sm: "1rem" },
                            minHeight: { xs: 44, sm: 48 },
                          }}
                          onClick={() => {
                            setSelectedOrder(order); // 選択した注文を設定
                            setQrScannerOpen(true); // QRスキャナーダイアログを開く
                          }}
                        >
                          QRスキャン
                        </Button>
                        {/* 👤 手動確認ボタン */}
                        <Button
                          variant="outlined" // 枠線スタイル
                          color="primary"
                          startIcon={
                            <PersonIcon sx={{ fontSize: { xs: 18, sm: 22 } }} />
                          }
                          sx={{
                            flex: 1,
                            py: { xs: 1, sm: 1.2 },
                            fontSize: { xs: "0.95rem", sm: "1rem" },
                            minHeight: { xs: 44, sm: 48 },
                          }}
                          onClick={() => handleManualVerification(order)} // 手動確認ダイアログを開く
                        >
                          注文番号確認
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            )}
          </Box>

          {/* 🗂️ 受け渡し確認ダイアログ */}
          {/* 手動で注文番号を確認するためのポップアップ */}
          <Dialog
            open={deliveryDialogOpen} // ダイアログの開閉状態
            onClose={() => setDeliveryDialogOpen(false)} // 閉じる処理
            maxWidth="sm" // 最大幅（small）
            fullWidth // 幅を最大まで使用
            PaperProps={{
              // ダイアログ本体のスタイル
              sx: {
                borderRadius: { xs: 2, sm: 3 }, // 角の丸み
                maxHeight: { xs: "85vh", sm: "90vh" }, // 最大高さ
                m: { xs: 1, sm: 2 }, // 外側のマージン
              },
            }}
          >
            {/* ダイアログタイトル */}
            <DialogTitle
              sx={{
                display: "flex",
                alignItems: "center",
                gap: { xs: 0.5, sm: 1 }, // アイコンとテキストの間隔
                py: { xs: 1.5, sm: 2 }, // 上下パディング
                fontSize: { xs: "1.1rem", sm: "1.25rem" },
              }}
            >
              <PersonIcon sx={{ fontSize: { xs: 20, sm: 24 } }} />
              手動注文番号確認
            </DialogTitle>
            {/* ダイアログの内容 */}
            <DialogContent sx={{ p: { xs: 2, sm: 3 } }}>
              {/* 選択された注文がある場合のみ内容を表示 */}
              {/* &&演算子: 左側がtrueの場合のみ右側を実行 */}
              {selectedOrder && (
                <React.Fragment>
                  {/* 📋 注文詳細情報 */}
                  <Box sx={{ mb: { xs: 1.5, sm: 2 } }}>
                    {/* 合計金額 */}
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        fontSize: { xs: "0.9rem", sm: "1rem" },
                        mb: { xs: 0.5, sm: 0 },
                      }}
                    >
                      合計金額: ¥{selectedOrder.total?.toLocaleString() || 0}
                    </Typography>
                    {/* 注文時刻 */}
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        fontSize: { xs: "0.9rem", sm: "1rem" },
                        mb: { xs: 0.5, sm: 0 },
                      }}
                    >
                      注文時刻:{" "}
                      {selectedOrder.createdAt
                        ? new Date(selectedOrder.createdAt).toLocaleString()
                        : ""}
                    </Typography>
                    {/* 💳 支払い状況表示 */}
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        mt: { xs: 0.5, sm: 1 },
                        fontSize: { xs: "0.9rem", sm: "1rem" },
                      }}
                    >
                      <span>
                        支払い状況:{" "}
                        {/* 即座に実行される関数式（IIFE）で支払い状況を判定 */}
                        {(() => {
                          // switch文で支払い状況に応じて色分けされたChipを返す
                          switch (selectedOrder.payment_status) {
                            case "paid":
                            case "支払い済み":
                              return (
                                <Chip
                                  label="支払い済み"
                                  color="primary" // 青色
                                  size="small"
                                  sx={{
                                    fontSize: { xs: "0.75rem", sm: "0.85rem" },
                                    height: { xs: 24, sm: 28 },
                                  }}
                                />
                              );
                            case "pending":
                            case "支払い中":
                              return (
                                <Chip
                                  label="支払い中"
                                  color="warning" // 黄色
                                  size="small"
                                  sx={{
                                    fontSize: { xs: "0.75rem", sm: "0.85rem" },
                                    height: { xs: 24, sm: 28 },
                                  }}
                                />
                              );
                            case "unpaid":
                            case "未払い":
                              return (
                                <Chip
                                  label="未払い"
                                  color="error" // 赤色
                                  size="small"
                                  sx={{
                                    fontSize: { xs: "0.75rem", sm: "0.85rem" },
                                    height: { xs: 24, sm: 28 },
                                  }}
                                />
                              );
                            case "refunded":
                            case "返金済み":
                              return (
                                <Chip
                                  label="返金済み"
                                  color="info" // 水色
                                  size="small"
                                  sx={{
                                    fontSize: { xs: "0.75rem", sm: "0.85rem" },
                                    height: { xs: 24, sm: 28 },
                                  }}
                                />
                              );
                            default:
                              // 不明な状態の場合
                              return (
                                <Chip
                                  label={selectedOrder.payment_status || "不明"}
                                  color="default" // グレー
                                  size="small"
                                  sx={{
                                    fontSize: { xs: "0.75rem", sm: "0.85rem" },
                                    height: { xs: 24, sm: 28 },
                                  }}
                                />
                              );
                          }
                        })()}
                      </span>
                    </Typography>
                  </Box>
                  {/* 👤 お客様への指示メッセージ */}
                  <Typography
                    variant="body1"
                    gutterBottom
                    sx={{
                      fontSize: { xs: "1rem", sm: "1.1rem" },
                      fontWeight: 600, // 太字
                      color: "primary.main", // プライマリーカラー
                      mb: { xs: 2, sm: 3 },
                    }}
                  >
                    お客様に注文番号の確認をお願いします
                  </Typography>

                  {/* 🔢 注文番号入力フィールド */}
                  <TextField
                    label="注文番号（4桁）"
                    value={orderNumberInput} // 入力値を状態と同期
                    onChange={(e) => setOrderNumberInput(e.target.value)} // 入力時の処理
                    fullWidth // 全幅使用
                    placeholder="例: 0001"
                    inputProps={{
                      maxLength: 4, // 最大4文字
                      pattern: "[0-9]*", // 数字のみ
                    }}
                    sx={{
                      mb: { xs: 2, sm: 3 },
                      "& .MuiInputBase-input": {
                        // 入力フィールドのスタイル
                        fontSize: { xs: "1.2rem", sm: "1.4rem" }, // 大きな文字
                        textAlign: "center", // 中央揃え
                        letterSpacing: "0.2em", // 文字間隔
                      },
                      "& .MuiInputLabel-root": {
                        // ラベルのスタイル
                        fontSize: { xs: "1rem", sm: "1.1rem" },
                      },
                    }}
                  />

                  {/* 📋 操作手順の案内 */}
                  <Alert
                    severity="info" // 情報アラート（青色）
                    sx={{
                      mb: { xs: 1.5, sm: 2 },
                      fontSize: { xs: "0.9rem", sm: "1rem" },
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{ fontSize: { xs: "0.9rem", sm: "1rem" } }}
                    >
                      <strong>確認手順:</strong>
                      <br />
                      1. お客様に注文番号を口頭で確認
                      <br />
                      2. 上記に注文番号を入力
                      <br />
                      3. 「受け渡し完了」ボタンを押して完了
                    </Typography>
                  </Alert>
                </React.Fragment>
              )}
            </DialogContent>
            {/* 🎛️ ダイアログのアクションボタン */}
            <DialogActions
              sx={{
                p: { xs: 2, sm: 3 }, // パディング
                gap: { xs: 1, sm: 2 }, // ボタン間のスペース
                flexDirection: { xs: "column", sm: "row" }, // レスポンシブ配置
              }}
            >
              {/* キャンセルボタン */}
              <Button
                onClick={() => setDeliveryDialogOpen(false)} // ダイアログを閉じる
                sx={{
                  py: { xs: 1, sm: 1.2 },
                  px: { xs: 3, sm: 4 },
                  fontSize: { xs: "0.95rem", sm: "1rem" },
                  minHeight: { xs: 44, sm: 48 },
                  width: { xs: "100%", sm: "auto" },
                }}
              >
                キャンセル
              </Button>
              {/* 受け渡し完了ボタン */}
              <Button
                variant="contained" // 塗りつぶしスタイル
                onClick={
                  () => selectedOrder && handleDelivery(selectedOrder.id) // 受け渡し処理を実行
                }
                disabled={
                  // ボタンが無効化される条件
                  loading || // 処理中
                  !orderNumberInput || // 入力が空
                  orderNumberInput.length !== 4 || // 4桁でない
                  orderNumberInput !== selectedOrder?.orderNumber // 注文番号が一致しない
                }
                sx={{
                  py: { xs: 1, sm: 1.2 },
                  px: { xs: 3, sm: 4 },
                  fontSize: { xs: "0.95rem", sm: "1rem" },
                  minHeight: { xs: 44, sm: 48 },
                  width: { xs: "100%", sm: "auto" },
                }}
              >
                受け渡し完了
              </Button>
            </DialogActions>
          </Dialog>

          {/* 📱 QRスキャナーダイアログ */}
          {/* QRコードを読み取るためのポップアップ */}
          <Dialog
            open={qrScannerOpen} // ダイアログの開閉状態
            onClose={() => setQrScannerOpen(false)} // 閉じる処理
            maxWidth="sm" // 最大幅
            fullWidth // 幅を最大まで使用
            PaperProps={{
              sx: {
                borderRadius: { xs: 2, sm: 3 }, // 角の丸み
                maxHeight: { xs: "85vh", sm: "90vh" }, // 最大高さ
                m: { xs: 1, sm: 2 }, // 外側のマージン
              },
            }}
          >
            {/* ダイアログタイトル */}
            <DialogTitle
              sx={{
                display: "flex",
                alignItems: "center",
                gap: { xs: 0.5, sm: 1 },
                py: { xs: 1.5, sm: 2 },
                fontSize: { xs: "1.1rem", sm: "1.25rem" },
              }}
            >
              <QrIcon sx={{ fontSize: { xs: 20, sm: 24 } }} />
              QRコードスキャン
            </DialogTitle>
            {/* ダイアログの内容 */}
            <DialogContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Box sx={{ textAlign: "center", py: { xs: 2, sm: 3 } }}>
                {/* カメラ権限チェック結果の表示 */}
                {cameraPermission === 'checking' && (
                  <Alert severity="info" sx={{ mb: 2 }}>
                    <Typography>カメラ権限をチェック中...</Typography>
                  </Alert>
                )}
                
                {cameraPermission === 'denied' && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    <Typography>
                      カメラの使用が許可されていません。<br />
                      ブラウザのアドレスバーのカメラアイコンをクリックするか、<br />
                      設定 {'>'}  Safari {'>'}  カメラでアクセスを許可してください。
                    </Typography>
                  </Alert>
                )}
                
                {/* カメラ権限テストボタン */}
                <Button
                  variant="outlined"
                  color="primary"
                  onClick={checkCameraPermission}
                  sx={{ mb: 2 }}
                  startIcon={<QrIcon />}
                >
                  カメラ権限をテスト
                </Button>
                
                {/* 📸 QRコードスキャン領域（react-qr-readerによるカメラ実装） */}
                <Paper
                  elevation={3}
                  sx={{
                    p: { xs: 3, sm: 4 },
                    mb: { xs: 2, sm: 3 },
                    bgcolor: "grey.50",
                    minHeight: { xs: 150, sm: 200 },
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Typography
                    variant="h6"
                    gutterBottom
                    sx={{ fontSize: { xs: "1.1rem", sm: "1.25rem" } }}
                  >
                    カメラでQRコードをスキャン
                  </Typography>
                  
                  {/* カメラプレビュー */}
                  {showCameraPreview && (
                    <Box sx={{ width: "100%", maxWidth: 350, mb: 2 }}>
                      <Paper
                        elevation={2}
                        sx={{
                          p: 2,
                          bgcolor: "success.light",
                          border: "2px solid #4caf50",
                          borderRadius: "8px"
                        }}
                      >
                        <Typography variant="h6" color="success.dark" sx={{ mb: 1, textAlign: "center" }}>
                          📹 カメラテスト中
                        </Typography>
                        <video
                          ref={cameraPreviewRef}
                          style={{
                            width: "100%",
                            height: "200px",
                            objectFit: "cover",
                            borderRadius: "4px",
                            backgroundColor: "#000"
                          }}
                          autoPlay
                          playsInline
                          muted
                        />
                        {/* QRコード検出用のCanvas（非表示） */}
                        <canvas
                          ref={canvasRef}
                          style={{ display: 'none' }}
                        />
                        <Typography variant="body2" color="success.dark" sx={{ mt: 1, textAlign: "center" }}>
                          {isQRScanMode ? (
                            isScanning ? "📱 QRコードをスキャン中..." : "📱 QRコードをカメラに向けてください"
                          ) : (
                            "✅ カメラが正常に動作しています"
                          )}
                        </Typography>
                        
                        {!isQRScanMode && (
                          <Button
                            variant="contained"
                            color="primary"
                            onClick={() => {
                              // QRスキャンモードに移行
                              console.log("QRスキャンモードに移行します");
                              setIsQRScanMode(true);
                              setIsScanning(true);
                              
                              // カメラプレビューを継続表示してQRスキャンモードのUIを表示
                              // ストリームは停止せず、同じvideo要素を使用
                            }}
                            sx={{ mt: 2 }}
                          >
                            QRスキャンを開始
                          </Button>
                        )}
                        
                        {isQRScanMode && (
                          <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                            <Button
                              variant="outlined"
                              color="secondary"
                              onClick={() => {
                                console.log("QRスキャンモードを終了");
                                setIsQRScanMode(false);
                                setIsScanning(false);
                              }}
                            >
                              テストモードに戻る
                            </Button>
                            <Button
                              variant="contained"
                              color="warning"
                              onClick={() => {
                                // 手動でQRコードデータを入力するモードに切り替え
                                const qrData = prompt("QRコードのデータを入力してください（テスト用）:");
                                if (qrData) {
                                  handleQRScan(qrData);
                                  setIsQRScanMode(false);
                                  setIsScanning(false);
                                  setShowCameraPreview(false);
                                  if (currentStream) {
                                    currentStream.getTracks().forEach(track => track.stop());
                                    setCurrentStream(null);
                                  }
                                }
                              }}
                            >
                              手動入力
                            </Button>
                          </Box>
                        )}
                      </Paper>
                    </Box>
                  )}
                  
                  <Box sx={{ width: "100%", maxWidth: 350, minHeight: 200 }}>
                    <div ref={qrReaderRef} style={{ width: "100%" }}></div>
                  </Box>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mt: 2, fontSize: { xs: "0.9rem", sm: "1rem" } }}
                  >
                    お客様のQRコードをカメラに向けてください
                  </Typography>
                  
                  {/* iOS Safari用の追加説明 */}
                  <Alert severity="info" sx={{ mt: 2, fontSize: { xs: "0.8rem", sm: "0.9rem" } }}>
                    <Typography variant="body2">
                      📱 <strong>iPhone/iPad をお使いの場合:</strong><br />
                      • まず上の「カメラ権限をテスト」ボタンを押してください<br />
                      • カメラの使用許可を求められたら「許可」を選択<br />
                      • カメラが起動しない場合は、設定 {'>'}  Safari {'>'}  カメラを確認<br />
                      • プライベートブラウズモードでは使用できません
                    </Typography>
                  </Alert>
                </Paper>

                {/* 📋 使用方法の説明 */}
                <Alert
                  severity="info" // 情報アラート
                  sx={{
                    textAlign: "left", // 左寄せ
                    fontSize: { xs: "0.9rem", sm: "1rem" },
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{ fontSize: { xs: "0.9rem", sm: "1rem" } }}
                  >
                    <strong>使用方法:</strong>
                    <br />
                    1. お客様にQRコードを表示してもらう
                    <br />
                    2. カメラでQRコードを読み取る
                    <br />
                    3. 自動的に受け渡し処理が完了します
                  </Typography>
                </Alert>
              </Box>
            </DialogContent>
            {/* ダイアログのアクションボタン */}
            <DialogActions sx={{ p: { xs: 2, sm: 3 } }}>
              <Button
                onClick={() => setQrScannerOpen(false)} // ダイアログを閉じる
                sx={{
                  py: { xs: 1, sm: 1.2 },
                  px: { xs: 3, sm: 4 },
                  fontSize: { xs: "0.95rem", sm: "1rem" },
                  minHeight: { xs: 44, sm: 48 },
                  width: { xs: "100%", sm: "auto" },
                }}
              >
                キャンセル
              </Button>
            </DialogActions>
          </Dialog>
        </Paper>
      </Container>
    </Box>
  );
}

// 🚀 デフォルトエクスポート
// このコンポーネントを他のファイルから import できるようにする
export default DeliveryPage;
