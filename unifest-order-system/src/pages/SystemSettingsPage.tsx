import { useState, useEffect } from "react";
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  IconButton,
  TextField,
  FormControl,
  Select,
  MenuItem,
  Switch,
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import {
  Settings as SettingsIcon,
  Notifications as NotificationsIcon,
  Security as SecurityIcon,
  Schedule as ScheduleIcon,
  Payment as PaymentIcon,
  Restaurant as RestaurantIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  RestartAlt as RestartIcon,
  Backup as BackupIcon,
  CloudDownload as RestoreIcon,
  VolumeUp as VolumeIcon,
  PlayArrow as PlayIcon,
} from "@mui/icons-material";
import { audioNotificationService } from "../utils/audioNotification";
import EmergencyControl from "../components/EmergencyControl";

interface SystemSetting {
  id: string;
  category: string;
  name: string;
  value: string | number | boolean;
  type: "string" | "number" | "boolean" | "select";
  description: string;
  options?: string[];
}

function SystemSettingsPage() {
  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [editingSettingId, setEditingSettingId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState<string | number | boolean>(
    ""
  );
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<
    "success" | "error" | "warning"
  >("success");
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<() => void>(() => {});

  // ダミーデータ
  useEffect(() => {
    const dummySettings: SystemSetting[] = [
      // 基本設定
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
      // 注文設定
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
      // 支払い設定
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
      // 通知設定
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
      // システム設定
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

    setSettings(dummySettings);
  }, []);

  const handleEditStart = (setting: SystemSetting) => {
    setEditingSettingId(setting.id);
    setEditingValue(setting.value);
  };

  const handleEditCancel = () => {
    setEditingSettingId(null);
    setEditingValue("");
  };

  const handleEditSave = (settingId: string) => {
    setSettings((prev) =>
      prev.map((setting) =>
        setting.id === settingId ? { ...setting, value: editingValue } : setting
      )
    );
    setEditingSettingId(null);
    setEditingValue("");
    setSnackbarMessage("設定を保存しました");
    setSnackbarSeverity("success");
    setSnackbarOpen(true);
  };

  // 音声通知テスト機能
  const handleAudioTest = async (testType: string) => {
    try {
      // Web Audio Contextを再開（ブラウザのポリシー対応）
      await audioNotificationService.resumeAudioContext();

      switch (testType) {
        case "new_order":
          await audioNotificationService.playNewOrder();
          break;
        case "order_ready":
          await audioNotificationService.playOrderReady("TEST");
          break;
        case "delay_alert":
          await audioNotificationService.playDelayAlert("TEST");
          break;
        case "emergency":
          await audioNotificationService.playEmergencyAlert();
          break;
        default:
          await audioNotificationService.playCustomNotification(
            "テスト通知です",
            700,
            2
          );
      }

      setSnackbarMessage(`${testType}の音声通知をテストしました`);
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
    } catch (error) {
      console.error("音声通知テストエラー:", error);
      setSnackbarMessage("音声通知のテストに失敗しました");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    }
  };

  const handleSystemRestart = () => {
    setConfirmAction(() => () => {
      setSnackbarMessage("システムを再起動しています...");
      setSnackbarSeverity("warning");
      setSnackbarOpen(true);
      setConfirmDialogOpen(false);
    });
    setConfirmDialogOpen(true);
  };

  const handleDataBackup = () => {
    setSnackbarMessage("データをバックアップしました");
    setSnackbarSeverity("success");
    setSnackbarOpen(true);
  };

  const handleDataRestore = () => {
    setConfirmAction(() => () => {
      setSnackbarMessage("データを復元しました");
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
      setConfirmDialogOpen(false);
    });
    setConfirmDialogOpen(true);
  };

  const renderEditField = (setting: SystemSetting) => {
    if (editingSettingId !== setting.id) {
      return (
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Typography variant="body1">
            {setting.type === "boolean"
              ? setting.value
                ? "有効"
                : "無効"
              : setting.value.toString()}
          </Typography>
          <Tooltip title="編集">
            <IconButton size="small" onClick={() => handleEditStart(setting)}>
              <EditIcon />
            </IconButton>
          </Tooltip>
        </Box>
      );
    }

    switch (setting.type) {
      case "boolean":
        return (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Switch
              checked={editingValue as boolean}
              onChange={(e) => setEditingValue(e.target.checked)}
            />
            <Typography variant="body2">
              {editingValue ? "有効" : "無効"}
            </Typography>
            <IconButton size="small" onClick={() => handleEditSave(setting.id)}>
              <SaveIcon color="primary" />
            </IconButton>
            <IconButton size="small" onClick={handleEditCancel}>
              <CancelIcon color="error" />
            </IconButton>
          </Box>
        );

      case "select":
        return (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <Select
                value={editingValue}
                onChange={(e) => setEditingValue(e.target.value)}
              >
                {setting.options?.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <IconButton size="small" onClick={() => handleEditSave(setting.id)}>
              <SaveIcon color="primary" />
            </IconButton>
            <IconButton size="small" onClick={handleEditCancel}>
              <CancelIcon color="error" />
            </IconButton>
          </Box>
        );

      case "number":
        return (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <TextField
              type="number"
              size="small"
              value={editingValue}
              onChange={(e) => setEditingValue(Number(e.target.value))}
              sx={{ width: 100 }}
            />
            <IconButton size="small" onClick={() => handleEditSave(setting.id)}>
              <SaveIcon color="primary" />
            </IconButton>
            <IconButton size="small" onClick={handleEditCancel}>
              <CancelIcon color="error" />
            </IconButton>
          </Box>
        );

      default: // string
        return (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <TextField
              size="small"
              value={editingValue}
              onChange={(e) => setEditingValue(e.target.value)}
              sx={{ width: 200 }}
            />
            <IconButton size="small" onClick={() => handleEditSave(setting.id)}>
              <SaveIcon color="primary" />
            </IconButton>
            <IconButton size="small" onClick={handleEditCancel}>
              <CancelIcon color="error" />
            </IconButton>
          </Box>
        );
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "基本設定":
        return <SettingsIcon color="primary" />;
      case "注文設定":
        return <RestaurantIcon color="secondary" />;
      case "支払い設定":
        return <PaymentIcon color="success" />;
      case "通知設定":
        return <NotificationsIcon color="warning" />;
      case "システム設定":
        return <SecurityIcon color="error" />;
      default:
        return <SettingsIcon />;
    }
  };

  const groupedSettings = settings.reduce((groups, setting) => {
    const category = setting.category;
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(setting);
    return groups;
  }, {} as Record<string, SystemSetting[]>);

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom color="primary">
          システム設定
        </Typography>
        <Typography variant="body1" color="text.secondary">
          システムの動作設定、営業設定、通知設定などを管理
        </Typography>
      </Box>

      {/* システム操作ボタン */}
      <Box sx={{ display: "flex", gap: 2, mb: 4, flexWrap: "wrap" }}>
        <Button
          variant="outlined"
          startIcon={<BackupIcon />}
          onClick={handleDataBackup}
          color="primary"
        >
          データバックアップ
        </Button>
        <Button
          variant="outlined"
          startIcon={<RestoreIcon />}
          onClick={handleDataRestore}
          color="secondary"
        >
          データ復元
        </Button>
        <Button
          variant="outlined"
          startIcon={<RestartIcon />}
          onClick={handleSystemRestart}
          color="warning"
        >
          システム再起動
        </Button>
      </Box>

      {/* 設定セクション */}
      {Object.entries(groupedSettings).map(([category, categorySettings]) => (
        <Card key={category} sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
              {getCategoryIcon(category)}
              <Typography variant="h6" sx={{ ml: 1 }}>
                {category}
              </Typography>
            </Box>

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>設定項目</TableCell>
                    <TableCell>現在の値</TableCell>
                    <TableCell>説明</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {categorySettings.map((setting) => (
                    <TableRow key={setting.id}>
                      <TableCell>
                        <Typography variant="subtitle2">
                          {setting.name}
                        </Typography>
                      </TableCell>
                      <TableCell>{renderEditField(setting)}</TableCell>
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

            {/* 音声通知テストボタン（通知設定セクションのみ） */}
            {category === "通知設定" && (
              <Box sx={{ mt: 3, p: 2, bgcolor: "grey.50", borderRadius: 2 }}>
                <Typography
                  variant="subtitle1"
                  sx={{ mb: 2, display: "flex", alignItems: "center", gap: 1 }}
                >
                  <VolumeIcon />
                  音声通知テスト
                </Typography>
                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<PlayIcon />}
                    onClick={() => handleAudioTest("new_order")}
                  >
                    新規注文
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<PlayIcon />}
                    onClick={() => handleAudioTest("order_ready")}
                  >
                    調理完了
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<PlayIcon />}
                    onClick={() => handleAudioTest("delay_alert")}
                  >
                    遅延アラート
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<PlayIcon />}
                    onClick={() => handleAudioTest("emergency")}
                    color="error"
                  >
                    緊急通知
                  </Button>
                </Box>
              </Box>
            )}
          </CardContent>
        </Card>
      ))}

      {/* 営業状態表示 */}
      <Card sx={{ mt: 4 }}>
        <CardContent>
          <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
            <ScheduleIcon color="info" sx={{ mr: 1 }} />
            <Typography variant="h6">現在の営業状態</Typography>
          </Box>
          <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
            <Chip
              label={`営業状態: ${
                settings.find((s) => s.name === "営業状態")?.value || "不明"
              }`}
              color="primary"
              variant="filled"
            />
            <Chip
              label={`営業時間: ${
                settings.find((s) => s.name === "営業時間（開始）")?.value
              } - ${
                settings.find((s) => s.name === "営業時間（終了）")?.value
              }`}
              color="secondary"
              variant="outlined"
            />
            <Chip
              label={`同時調理数: ${
                settings.find((s) => s.name === "同時調理可能数")?.value
              }件`}
              color="success"
              variant="outlined"
            />
          </Box>
        </CardContent>
      </Card>

      {/* 緊急時対応管理 */}
      <Box sx={{ mt: 4 }}>
        <EmergencyControl />
      </Box>

      {/* 確認ダイアログ */}
      <Dialog
        open={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
      >
        <DialogTitle>操作の確認</DialogTitle>
        <DialogContent>
          <Typography>この操作を実行してもよろしいですか？</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialogOpen(false)}>
            キャンセル
          </Button>
          <Button onClick={confirmAction} variant="contained" color="warning">
            実行
          </Button>
        </DialogActions>
      </Dialog>

      {/* スナックバー */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
      >
        <Alert
          severity={snackbarSeverity}
          onClose={() => setSnackbarOpen(false)}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
}

export default SystemSettingsPage;
