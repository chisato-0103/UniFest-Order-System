// ⚙️ システム設定ページ
// 目的: 店舗の運営設定、システム設定、通知設定などを管理する管理者向けページ
// 機能: 営業時間設定、支払い方法設定、音声通知設定、緊急時対応など
// 使用者: 店長や管理者がシステムの設定を変更するために使用

import { useState, useEffect } from "react"; // Reactの状態管理フック
import {
  Container, // ページ全体を囲むコンテナ
  Typography, // テキスト表示コンポーネント
  Box, // レイアウト用コンテナ
  Card, // カード表示コンポーネント
  CardContent, // カード内のコンテンツ
  Button, // ボタンコンポーネント
  IconButton, // アイコン付きボタン
  TextField, // テキスト入力欄
  FormControl, // フォーム要素のコンテナ
  Select, // セレクトボックス（選択肢）
  MenuItem, // セレクトボックスの項目
  Switch, // オン/オフ切り替えスイッチ
  Alert, // 警告メッセージ表示
  Snackbar, // 画面下部に表示される通知
  Dialog, // ポップアップダイアログ
  DialogTitle, // ダイアログのタイトル
  DialogContent, // ダイアログのメインコンテンツ
  DialogActions, // ダイアログのボタンエリア
  Tooltip, // ホバー時のツールチップ
  Chip, // ステータス表示用タグ
  Table, // テーブル表示コンポーネント
  TableBody, // テーブルの本体部分
  TableCell, // テーブルのセル
  TableContainer, // テーブルを囲むコンテナ
  TableHead, // テーブルのヘッダー部分
  TableRow, // テーブルの行
} from "@mui/material";
// ナビゲーションバーはApp.tsxで共通表示
import {
  Settings as SettingsIcon, // 設定アイコン
  Notifications as NotificationsIcon, // 通知アイコン
  Security as SecurityIcon, // セキュリティアイコン
  Schedule as ScheduleIcon, // スケジュールアイコン
  Payment as PaymentIcon, // 支払いアイコン
  Restaurant as RestaurantIcon, // レストランアイコン
  Edit as EditIcon, // 編集アイコン
  Save as SaveIcon, // 保存アイコン
  Cancel as CancelIcon, // キャンセルアイコン
  RestartAlt as RestartIcon, // リスタートアイコン
  Backup as BackupIcon, // バックアップアイコン
  CloudDownload as RestoreIcon, // 復元アイコン
  VolumeUp as VolumeIcon, // 音量アイコン
  PlayArrow as PlayIcon, // 再生アイコン
} from "@mui/icons-material";
import { audioNotificationService } from "../utils/audioNotification"; // 音声通知サービス
import EmergencyControl from "../components/EmergencyControl"; // 緊急時対応コンポーネント

// ⚙️ システム設定項目の型定義
// 目的: 各設定項目の情報を管理するためのデータ構造
interface SystemSetting {
  id: string; // 設定項目の一意識別子
  category: string; // カテゴリ（例: "基本設定"、"通知設定"）
  name: string; // 設定項目名（例: "店舗名"、"営業時間"）
  value: string | number | boolean; // 設定値（文字列、数値、ブール値）
  type: "string" | "number" | "boolean" | "select"; // 入力タイプ（テキスト、数値、スイッチ、選択）
  description: string; // 設定の説明文
  options?: string[]; // 選択タイプの場合の選択肢
}

function SystemSettingsPage() {
  // 🔄 設定項目の状態管理
  // 目的: 全ての設定項目を配列として管理し、画面表示と編集機能を実現
  const [settings, setSettings] = useState<SystemSetting[]>([]);

  // ✏️ 編集モード管理
  // 目的: 現在編集中の設定項目のIDを記録（nullは編集中でない状態）
  const [editingSettingId, setEditingSettingId] = useState<string | null>(null);

  // 📝 編集中の値を一時保存
  // 目的: 編集中の新しい値を保存し、保存時に設定に反映する
  const [editingValue, setEditingValue] = useState<string | number | boolean>(
    ""
  );

  // 🔔 通知バー（スナックバー）の表示制御
  // 目的: 設定保存完了やエラーメッセージを画面下部に表示
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  // 💬 通知メッセージの内容
  // 目的: スナックバーに表示するメッセージテキストを管理
  const [snackbarMessage, setSnackbarMessage] = useState("");

  // 🎨 通知の種類（成功/エラー/警告）
  // 目的: 通知の色とアイコンを決定する（緑=成功、赤=エラー、黄=警告）
  const [snackbarSeverity, setSnackbarSeverity] = useState<
    "success" | "error" | "warning"
  >("success");

  // 🔒 確認ダイアログの表示制御
  // 目的: 危険な操作（データ復元、システム再起動）の確認画面を表示
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

  // ⚡ 確認後に実行する処理
  // 目的: 「実行」ボタンが押された時に実行される関数を保存
  const [confirmAction, setConfirmAction] = useState<() => void>(() => {});

  // 🎯 システム設定のダミーデータ初期化
  // 目的: ページ読み込み時に設定項目のサンプルデータを作成
  // 実際のシステムでは、ここでAPIからデータを取得する
  useEffect(() => {
    // 📋 設定項目のダミーデータ配列
    // 構造: カテゴリ別に設定項目を定義（基本設定、注文設定、支払い設定など）
    // 各項目には、ID、カテゴリ、名前、値、入力タイプ、説明を含む
    const dummySettings: SystemSetting[] = [
      // 🏪 基本設定: 店舗名、営業時間、営業状態など店舗運営の基本情報
      {
        id: "1",
        category: "基本設定",
        name: "店舗名",
        value: "大学祭たこ焼き店",
        type: "string",
        description: "レシートや表示に使用される店舗名",
      },
      {
        id: "2",
        category: "基本設定",
        name: "営業時間（開始）",
        value: "10:00",
        type: "string",
        description: "営業開始時間",
      },
      {
        id: "3",
        category: "基本設定",
        name: "営業時間（終了）",
        value: "18:00",
        type: "string",
        description: "営業終了時間",
      },
      {
        id: "4",
        category: "基本設定",
        name: "営業状態",
        value: "営業中",
        type: "select",
        description: "現在の営業状態",
        options: ["営業中", "準備中", "終了"],
      },
      // 📋 注文設定: 注文受付、調理、キューイングに関する設定
      {
        id: "5",
        category: "注文設定",
        name: "同時調理可能数",
        value: 5,
        type: "number",
        description: "同時に調理できる注文の最大数",
      },
      {
        id: "6",
        category: "注文設定",
        name: "注文受付停止閾値",
        value: 20,
        type: "number",
        description: "待ち注文がこの数を超えたら受付停止",
      },
      {
        id: "7",
        category: "注文設定",
        name: "自動受付停止",
        value: true,
        type: "boolean",
        description: "閾値到達時に自動で注文受付を停止",
      },
      {
        id: "8",
        category: "注文設定",
        name: "調理時間（基本）",
        value: 8,
        type: "number",
        description: "基本的なたこ焼きの調理時間（分）",
      },
      // 💰 支払い設定: 利用可能な支払い方法の有効/無効
      {
        id: "9",
        category: "支払い設定",
        name: "現金支払い",
        value: true,
        type: "boolean",
        description: "現金での支払いを受け付ける",
      },
      {
        id: "10",
        category: "支払い設定",
        name: "PayPay支払い",
        value: true,
        type: "boolean",
        description: "PayPayでの支払いを受け付ける",
      },
      {
        id: "11",
        category: "支払い設定",
        name: "クレジットカード支払い",
        value: false,
        type: "boolean",
        description: "クレジットカードでの支払いを受け付ける",
      },
      // 🔔 通知設定: 音声通知、アラート、通知タイミングの設定
      {
        id: "12",
        category: "通知設定",
        name: "音声通知",
        value: true,
        type: "boolean",
        description: "音声通知システムを有効にする",
      },
      {
        id: "13",
        category: "通知設定",
        name: "通知音量",
        value: 70,
        type: "number",
        description: "通知音の音量（0-100）",
      },
      {
        id: "14",
        category: "通知設定",
        name: "新規注文通知",
        value: true,
        type: "boolean",
        description: "新しい注文が入った時の音声通知",
      },
      {
        id: "15",
        category: "通知設定",
        name: "調理完了通知",
        value: true,
        type: "boolean",
        description: "調理が完了した時の音声通知",
      },
      {
        id: "16",
        category: "通知設定",
        name: "遅延アラート通知",
        value: true,
        type: "boolean",
        description: "受け渡し遅延時のアラート通知",
      },
      {
        id: "17",
        category: "通知設定",
        name: "緊急通知",
        value: true,
        type: "boolean",
        description: "緊急停止時などの重要な通知",
      },
      {
        id: "18",
        category: "通知設定",
        name: "完了通知間隔",
        value: 30,
        type: "number",
        description: "調理完了通知の繰り返し間隔（秒）",
      },
      // ⚙️ システム設定: バックアップ、デバッグ、システム管理の設定
      {
        id: "15",
        category: "システム設定",
        name: "自動バックアップ",
        value: true,
        type: "boolean",
        description: "データの自動バックアップを有効にする",
      },
      {
        id: "16",
        category: "システム設定",
        name: "バックアップ間隔",
        value: 60,
        type: "number",
        description: "自動バックアップの間隔（分）",
      },
      {
        id: "17",
        category: "システム設定",
        name: "デバッグモード",
        value: false,
        type: "boolean",
        description: "開発者向けデバッグ情報を表示",
      },
    ];

    // 📝 設定データを状態に反映
    // 目的: 作成したダミーデータを settings state に設定してUIに表示
    setSettings(dummySettings);
  }, []); // 空の依存配列 = コンポーネントマウント時に1回だけ実行

  // ✏️ 編集モード開始処理
  // 目的: 設定項目の編集ボタンが押された時の処理
  // 処理: 編集対象のIDを記録し、現在の値を編集用の状態に保存
  const handleEditStart = (setting: SystemSetting) => {
    setEditingSettingId(setting.id); // 編集中の設定項目を記録
    setEditingValue(setting.value); // 現在の値を編集フィールドに表示
  };

  // ❌ 編集キャンセル処理
  // 目的: 編集を取り消し、元の表示状態に戻す
  // 処理: 編集状態をクリアし、変更内容を破棄
  const handleEditCancel = () => {
    setEditingSettingId(null); // 編集中の項目をクリア
    setEditingValue(""); // 編集中の値をクリア
  };

  // 💾 設定値保存処理
  // 目的: 編集した設定値を保存し、画面表示を更新
  // 処理: 指定されたIDの設定項目の値を更新し、編集モードを終了
  const handleEditSave = (settingId: string) => {
    // 設定配列を更新（該当IDの項目のみ値を変更）
    setSettings((prev) =>
      prev.map(
        (setting) =>
          setting.id === settingId
            ? { ...setting, value: editingValue } // 編集中の値で更新
            : setting // 他の項目はそのまま
      )
    );

    // 編集モードを終了
    setEditingSettingId(null); // 編集中の項目をクリア
    setEditingValue(""); // 編集中の値をクリア

    // 保存完了の通知を表示
    setSnackbarMessage("設定を保存しました");
    setSnackbarSeverity("success"); // 成功の緑色通知
    setSnackbarOpen(true); // 通知バーを表示
  };

  // 🔊 音声通知テスト機能
  // 目的: 各種音声通知が正常に動作するかテストする
  // 使用場面: 通知設定変更後の動作確認、音量調整時の確認
  const handleAudioTest = async (testType: string) => {
    try {
      // 🎵 Web Audio Contextを再開
      // 理由: ブラウザのセキュリティポリシーにより、ユーザー操作なしでは音声再生不可
      // 対策: ボタンクリック時にAudio Contextを明示的に再開
      await audioNotificationService.resumeAudioContext();

      // 🎯 テストタイプ別の音声通知再生
      // 各通知タイプに対応した音声を再生し、実際の動作を確認
      switch (testType) {
        case "new_order":
          // 新規注文時の通知音をテスト
          await audioNotificationService.playNewOrder();
          break;
        case "order_ready":
          // 調理完了時の通知音をテスト（注文番号"TEST"を使用）
          await audioNotificationService.playOrderReady("TEST");
          break;
        case "delay_alert":
          // 遅延アラート通知音をテスト
          await audioNotificationService.playDelayAlert("TEST");
          break;
        case "emergency":
          // 緊急時の通知音をテスト
          await audioNotificationService.playEmergencyAlert();
          break;
        default:
          // カスタム通知音をテスト（700Hz、2秒間）
          await audioNotificationService.playCustomNotification(
            "テスト通知です",
            700, // 周波数（Hz）
            2 // 再生時間（秒）
          );
      }

      // ✅ テスト成功時の通知表示
      setSnackbarMessage(`${testType}の音声通知をテストしました`);
      setSnackbarSeverity("success"); // 成功の緑色通知
      setSnackbarOpen(true);
    } catch (error) {
      // ❌ テスト失敗時のエラー処理
      console.error("音声通知テストエラー:", error);
      setSnackbarMessage("音声通知のテストに失敗しました");
      setSnackbarSeverity("error"); // エラーの赤色通知
      setSnackbarOpen(true);
    }
  };

  // 🔄 システム再起動処理
  // 目的: システム全体を再起動し、設定変更を反映
  // 注意: 危険な操作のため確認ダイアログを表示してから実行
  const handleSystemRestart = () => {
    // 確認後に実行される処理を定義
    setConfirmAction(() => () => {
      // 再起動処理中の通知を表示
      setSnackbarMessage("システムを再起動しています...");
      setSnackbarSeverity("warning"); // 警告の黄色通知
      setSnackbarOpen(true);
      setConfirmDialogOpen(false); // 確認ダイアログを閉じる

      // 実際のシステムでは、ここでサーバーに再起動リクエストを送信
    });

    // 確認ダイアログを表示
    setConfirmDialogOpen(true);
  };

  // 💾 データバックアップ処理
  // 目的: 現在の設定とデータを安全な場所に保存
  // 使用場面: 設定変更前の保護、定期的なデータ保護
  const handleDataBackup = () => {
    // 実際のシステムでは、ここでAPIにバックアップリクエストを送信
    // 設定データ、注文履歴、メニュー情報などを外部ストレージに保存

    // バックアップ完了の通知を表示
    setSnackbarMessage("データをバックアップしました");
    setSnackbarSeverity("success"); // 成功の緑色通知
    setSnackbarOpen(true);
  };

  // 🔄 データ復元処理
  // 目的: バックアップしたデータから設定を復元
  // 注意: 現在のデータが上書きされるため確認ダイアログを表示
  const handleDataRestore = () => {
    // 確認後に実行される処理を定義
    setConfirmAction(() => () => {
      // 実際のシステムでは、ここでAPIに復元リクエストを送信
      // バックアップファイルから設定データを読み込み、現在の設定を置き換え

      // 復元完了の通知を表示
      setSnackbarMessage("データを復元しました");
      setSnackbarSeverity("success"); // 成功の緑色通知
      setSnackbarOpen(true);
      setConfirmDialogOpen(false); // 確認ダイアログを閉じる
    });

    // 確認ダイアログを表示
    setConfirmDialogOpen(true);
  };

  // 🎨 設定値の編集フィールド表示関数
  // 目的: 設定項目の種類に応じて適切な入力フィールドを表示
  // 機能: 表示モードと編集モードを切り替え、データ型に応じた入力コンポーネントを提供
  const renderEditField = (setting: SystemSetting) => {
    // 👀 表示モード: 編集中でない場合の値表示
    if (editingSettingId !== setting.id) {
      return (
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          {/* 現在の設定値を表示（型に応じて表示形式を変更） */}
          <Typography variant="body1">
            {
              setting.type === "boolean"
                ? setting.value
                  ? "有効" // true の場合
                  : "無効" // false の場合
                : setting.value.toString() // 文字列・数値の場合
            }
          </Typography>
          {/* 編集開始ボタン */}
          <Tooltip title="編集">
            <IconButton size="small" onClick={() => handleEditStart(setting)}>
              <EditIcon />
            </IconButton>
          </Tooltip>
        </Box>
      );
    }

    // ✏️ 編集モード: 設定の種類に応じた入力フィールドを表示
    switch (setting.type) {
      case "boolean":
        // 🔘 ブール値（有効/無効）の編集: スイッチコンポーネントを使用
        return (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            {/* オン/オフ切り替えスイッチ */}
            <Switch
              checked={editingValue as boolean}
              onChange={(e) => setEditingValue(e.target.checked)}
            />
            {/* 現在の状態を文字で表示 */}
            <Typography variant="body2">
              {editingValue ? "有効" : "無効"}
            </Typography>
            {/* 保存ボタン */}
            <IconButton size="small" onClick={() => handleEditSave(setting.id)}>
              <SaveIcon color="primary" />
            </IconButton>
            {/* キャンセルボタン */}
            <IconButton size="small" onClick={handleEditCancel}>
              <CancelIcon color="error" />
            </IconButton>
          </Box>
        );

      case "select":
        // 📋 選択肢（セレクトボックス）の編集: 事前定義されたオプションから選択
        return (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              {/* ドロップダウンリスト */}
              <Select
                value={editingValue}
                onChange={(e) => setEditingValue(e.target.value)}
              >
                {/* 設定で定義されたオプションを選択肢として表示 */}
                {setting.options?.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {/* 保存ボタン */}
            <IconButton size="small" onClick={() => handleEditSave(setting.id)}>
              <SaveIcon color="primary" />
            </IconButton>
            {/* キャンセルボタン */}
            <IconButton size="small" onClick={handleEditCancel}>
              <CancelIcon color="error" />
            </IconButton>
          </Box>
        );

      case "number":
        // 🔢 数値入力の編集: 数値専用のテキストフィールドを使用
        return (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            {/* 数値入力フィールド */}
            <TextField
              type="number" // 数値のみ入力可能
              size="small"
              value={editingValue}
              onChange={(e) => setEditingValue(Number(e.target.value))} // 文字列を数値に変換
              sx={{ width: 100 }} // 幅を固定
            />
            {/* 保存ボタン */}
            <IconButton size="small" onClick={() => handleEditSave(setting.id)}>
              <SaveIcon color="primary" />
            </IconButton>
            {/* キャンセルボタン */}
            <IconButton size="small" onClick={handleEditCancel}>
              <CancelIcon color="error" />
            </IconButton>
          </Box>
        );

      default: // string
        // 📝 文字列入力の編集: 通常のテキストフィールドを使用
        return (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            {/* 文字列入力フィールド */}
            <TextField
              size="small"
              value={editingValue}
              onChange={(e) => setEditingValue(e.target.value)} // 入力値をそのまま設定
              sx={{ width: 200 }} // 幅を固定
            />
            {/* 保存ボタン */}
            <IconButton size="small" onClick={() => handleEditSave(setting.id)}>
              <SaveIcon color="primary" />
            </IconButton>
            {/* キャンセルボタン */}
            <IconButton size="small" onClick={handleEditCancel}>
              <CancelIcon color="error" />
            </IconButton>
          </Box>
        );
    }
  };

  // 🎨 カテゴリ別アイコン取得関数
  // 目的: 設定カテゴリに応じた適切なアイコンと色を返す
  // 効果: 視覚的に設定カテゴリを区別し、ユーザビリティを向上
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "基本設定":
        return <SettingsIcon color="primary" />; // 歯車アイコン（青色）
      case "注文設定":
        return <RestaurantIcon color="secondary" />; // レストランアイコン（紫色）
      case "支払い設定":
        return <PaymentIcon color="success" />; // 支払いアイコン（緑色）
      case "通知設定":
        return <NotificationsIcon color="warning" />; // 通知アイコン（黄色）
      case "システム設定":
        return <SecurityIcon color="error" />; // セキュリティアイコン（赤色）
      default:
        return <SettingsIcon />; // デフォルトアイコン（グレー）
    }
  };

  // 📊 設定項目のカテゴリ別グループ化
  // 目的: 設定項目を「基本設定」「注文設定」などのカテゴリごとに分類
  // 効果: 関連する設定を一箇所にまとめて表示し、管理しやすくする
  const groupedSettings = settings.reduce((groups, setting) => {
    const category = setting.category; // 設定項目のカテゴリを取得
    if (!groups[category]) {
      // そのカテゴリが初出の場合
      groups[category] = []; // 空の配列を作成
    }
    groups[category].push(setting); // カテゴリの配列に設定項目を追加
    return groups; // グループ化されたオブジェクトを返す
  }, {} as Record<string, SystemSetting[]>); // 初期値は空のオブジェクト

  return (
    <Box>
      {/* ナビゲーションバーはApp.tsxで共通表示 */}
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" component="h1" gutterBottom color="primary">
            システム設定
          </Typography>
          <Typography variant="body1" color="text.secondary">
            システムの動作設定、営業設定、通知設定などを管理
          </Typography>
        </Box>

        {/* 🔧 システム操作ボタン群 */}
        {/* 目的: システム管理に必要な重要操作を一箇所に集約 */}
        <Box sx={{ display: "flex", gap: 2, mb: 4, flexWrap: "wrap" }}>
          {/* 💾 データバックアップボタン */}
          <Button
            variant="outlined"
            startIcon={<BackupIcon />}
            onClick={handleDataBackup}
            color="primary"
          >
            データバックアップ
          </Button>

          {/* 🔄 データ復元ボタン */}
          <Button
            variant="outlined"
            startIcon={<RestoreIcon />}
            onClick={handleDataRestore}
            color="secondary"
          >
            データ復元
          </Button>

          {/* 🔄 システム再起動ボタン */}
          <Button
            variant="outlined"
            startIcon={<RestartIcon />}
            onClick={handleSystemRestart}
            color="warning"
          >
            システム再起動
          </Button>
        </Box>

        {/* 📋 設定セクション（カテゴリ別表示） */}
        {/* 目的: グループ化された設定項目をカテゴリごとにカード形式で表示 */}
        {Object.entries(groupedSettings).map(([category, categorySettings]) => (
          <Card key={category} sx={{ mb: 3 }}>
            <CardContent>
              {/* カテゴリヘッダー（アイコン + タイトル） */}
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                {getCategoryIcon(category)} {/* カテゴリ別アイコン */}
                <Typography variant="h6" sx={{ ml: 1 }}>
                  {category} {/* カテゴリ名 */}
                </Typography>
              </Box>

              {/* 📊 設定項目テーブル */}
              {/* 目的: カテゴリ内の設定項目を表形式で整理して表示 */}
              <TableContainer>
                <Table>
                  {/* テーブルヘッダー */}
                  <TableHead>
                    <TableRow>
                      <TableCell>設定項目</TableCell> {/* 設定の名前 */}
                      <TableCell>現在の値</TableCell> {/* 現在の設定値 */}
                      <TableCell>説明</TableCell> {/* 設定の説明 */}
                    </TableRow>
                  </TableHead>

                  {/* テーブル本体 */}
                  <TableBody>
                    {/* カテゴリ内の各設定項目をループ表示 */}
                    {categorySettings.map((setting) => (
                      <TableRow key={setting.id}>
                        {/* 設定項目名 */}
                        <TableCell>
                          <Typography variant="subtitle2">
                            {setting.name}
                          </Typography>
                        </TableCell>

                        {/* 設定値（編集可能フィールド） */}
                        <TableCell>{renderEditField(setting)}</TableCell>

                        {/* 設定の説明 */}
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {setting.description}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* 🔊 音声通知テストセクション（通知設定カテゴリでのみ表示） */}
              {/* 目的: 通知設定変更後に実際の音声を確認できるテスト機能 */}
              {category === "通知設定" && (
                <Box sx={{ mt: 3, p: 2, bgcolor: "grey.50", borderRadius: 2 }}>
                  {/* テストセクションのタイトル */}
                  <Typography
                    variant="subtitle1"
                    sx={{
                      mb: 2,
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                    }}
                  >
                    <VolumeIcon />
                    音声通知テスト
                  </Typography>

                  {/* テストボタン群 */}
                  <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                    {/* 新規注文通知テスト */}
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<PlayIcon />}
                      onClick={() => handleAudioTest("new_order")}
                    >
                      新規注文
                    </Button>

                    {/* 調理完了通知テスト */}
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<PlayIcon />}
                      onClick={() => handleAudioTest("order_ready")}
                    >
                      調理完了
                    </Button>

                    {/* 遅延アラート通知テスト */}
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<PlayIcon />}
                      onClick={() => handleAudioTest("delay_alert")}
                    >
                      遅延アラート
                    </Button>

                    {/* 緊急通知テスト */}
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<PlayIcon />}
                      onClick={() => handleAudioTest("emergency")}
                      color="error"
                      // 緊急時は赤色で強調
                    >
                      緊急通知
                    </Button>
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        ))}

        {/* 📊 営業状態表示カード */}
        {/* 目的: 重要な営業情報を一目で確認できるサマリー表示 */}
        <Card sx={{ mt: 4 }}>
          <CardContent>
            {/* サマリーカードのタイトル */}
            <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
              <ScheduleIcon color="info" sx={{ mr: 1 }} />
              <Typography variant="h6">現在の営業状態</Typography>
            </Box>

            {/* 営業情報をチップ形式で表示 */}
            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
              {/* 営業状態チップ */}
              <Chip
                label={`営業状態: ${
                  settings.find((s) => s.name === "営業状態")?.value || "不明"
                }`}
                color="primary"
                variant="filled"
                // 塗りつぶし表示で強調
              />

              {/* 営業時間チップ */}
              <Chip
                label={`営業時間: ${
                  settings.find((s) => s.name === "営業時間（開始）")?.value
                } - ${
                  settings.find((s) => s.name === "営業時間（終了）")?.value
                }`}
                color="secondary"
                variant="outlined"
                // 枠線表示
              />

              {/* 同時調理数チップ */}
              <Chip
                label={`同時調理数: ${
                  settings.find((s) => s.name === "同時調理可能数")?.value
                }件`}
                color="success"
                variant="outlined"
                // 枠線表示
              />
            </Box>
          </CardContent>
        </Card>

        {/* 🚨 緊急時対応管理コンポーネント */}
        {/* 目的: 緊急停止、避難誘導、システム復旧などの緊急時対応機能 */}
        {/* 機能: 別コンポーネントで実装された緊急時対応UIを組み込み */}
        <Box sx={{ mt: 4 }}>
          <EmergencyControl />
        </Box>

        {/* ⚠️ 確認ダイアログ */}
        {/* 目的: 危険な操作（データ復元、システム再起動）の実行前確認 */}
        {/* 効果: 誤操作を防ぎ、重要な操作に対する慎重な判断を促す */}
        <Dialog
          open={confirmDialogOpen}
          onClose={() => setConfirmDialogOpen(false)}
        >
          {/* ダイアログタイトル */}
          <DialogTitle>操作の確認</DialogTitle>

          {/* ダイアログメッセージ */}
          <DialogContent>
            <Typography>この操作を実行してもよろしいですか？</Typography>
          </DialogContent>

          {/* ダイアログボタン */}
          <DialogActions>
            {/* キャンセルボタン */}
            <Button onClick={() => setConfirmDialogOpen(false)}>
              キャンセル
            </Button>

            {/* 実行ボタン（警告色で危険性を表現） */}
            <Button onClick={confirmAction} variant="contained" color="warning">
              実行
            </Button>
          </DialogActions>
        </Dialog>

        {/* 📢 スナックバー（通知メッセージ） */}
        {/* 目的: 操作結果やエラーメッセージを画面下部に一時表示 */}
        {/* 効果: 操作の成功/失敗をユーザーに分かりやすく通知 */}
        <Snackbar
          open={snackbarOpen}
          autoHideDuration={3000} // 3秒後に自動で消える
          onClose={() => setSnackbarOpen(false)}
        >
          <Alert
            severity={snackbarSeverity} // 通知の種類（成功/エラー/警告）
            onClose={() => setSnackbarOpen(false)}
          >
            {snackbarMessage} // 通知メッセージ
          </Alert>
        </Snackbar>
      </Container>
    </Box>
  );
}

export default SystemSettingsPage;
