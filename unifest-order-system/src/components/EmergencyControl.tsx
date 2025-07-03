import React, { useState } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  IconButton,
  Tooltip,
} from "@mui/material";
import {
  Emergency as EmergencyIcon,
  Stop as StopIcon,
  Announcement as AnnouncementIcon,
  PlayArrow as PlayIcon,
  Settings as SettingsIcon,
  Warning as WarningIcon,
} from "@mui/icons-material";
import { useAppContext } from "../hooks/useAppContext";
import type { EmergencyState } from "../types";

interface EmergencyControlProps {
  compactView?: boolean;
}

const EmergencyControl: React.FC<EmergencyControlProps> = ({
  compactView = false,
}) => {
  const { state, dispatch } = useAppContext();
  const { emergencyState, emergencyLogs, currentUser } = state;

  const [emergencyStopDialog, setEmergencyStopDialog] = useState(false);
  const [messageDialog, setMessageDialog] = useState(false);
  const [emergencyMessage, setEmergencyMessage] = useState("");
  const [emergencyReason, setEmergencyReason] = useState("");
  const [selectedType, setSelectedType] =
    useState<EmergencyState["emergency_type"]>("システム停止");

  const userName = currentUser?.name || "スタッフ";

  // 緊急停止実行
  const handleEmergencyStop = () => {
    if (selectedType && emergencyReason) {
      dispatch({
        type: "ACTIVATE_EMERGENCY",
        payload: {
          type: selectedType,
          message: emergencyReason,
          user: userName,
        },
      });
      setEmergencyStopDialog(false);
      setEmergencyReason("");
    }
  };

  // システム復旧実行
  const handleSystemResume = () => {
    dispatch({
      type: "DEACTIVATE_EMERGENCY",
      payload: {
        user: userName,
      },
    });
  };

  // 緊急メッセージ更新
  const handleUpdateMessage = () => {
    if (emergencyMessage) {
      dispatch({
        type: "UPDATE_EMERGENCY_MESSAGE",
        payload: {
          message: emergencyMessage,
          user: userName,
        },
      });
      setMessageDialog(false);
      setEmergencyMessage("");
    }
  };

  // コンパクトビュー（NavigationBar用）
  if (compactView) {
    return (
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        {emergencyState.is_active && (
          <Chip
            icon={<WarningIcon />}
            label="緊急事態"
            color="error"
            size="small"
            sx={{ animation: "blink 1s infinite" }}
          />
        )}

        <Tooltip title={emergencyState.is_active ? "システム復旧" : "緊急停止"}>
          <IconButton
            color={emergencyState.is_active ? "success" : "error"}
            onClick={
              emergencyState.is_active
                ? handleSystemResume
                : () => setEmergencyStopDialog(true)
            }
            disabled={!emergencyState.is_active && !currentUser}
            size="small"
          >
            {emergencyState.is_active ? <PlayIcon /> : <StopIcon />}
          </IconButton>
        </Tooltip>

        {emergencyState.is_active && (
          <Tooltip title="メッセージ更新">
            <IconButton
              color="warning"
              onClick={() => setMessageDialog(true)}
              size="small"
            >
              <AnnouncementIcon />
            </IconButton>
          </Tooltip>
        )}
      </Box>
    );
  }

  // フルビュー（SystemSettingsPage用）
  return (
    <Box>
      <Card>
        <CardContent>
          <Typography
            variant="h6"
            gutterBottom
            sx={{ display: "flex", alignItems: "center", gap: 1 }}
          >
            <EmergencyIcon color="error" />
            緊急時対応管理
          </Typography>

          {emergencyState.is_active && (
            <Alert severity="error" sx={{ mb: 2 }}>
              <Typography variant="h6" gutterBottom>
                緊急事態が発生中です
              </Typography>
              <Typography>種類: {emergencyState.emergency_type}</Typography>
              <Typography>メッセージ: {emergencyState.message}</Typography>
              <Typography variant="caption">
                開始:{" "}
                {emergencyState.activated_at
                  ? new Date(emergencyState.activated_at).toLocaleString()
                  : "不明"}
                {emergencyState.activated_by &&
                  ` (${emergencyState.activated_by})`}
              </Typography>
            </Alert>
          )}

          <Box sx={{ display: "flex", gap: 2, mb: 2, flexWrap: "wrap" }}>
            {!emergencyState.is_active ? (
              <>
                <Button
                  variant="contained"
                  color="error"
                  startIcon={<StopIcon />}
                  onClick={() => setEmergencyStopDialog(true)}
                  disabled={!currentUser}
                >
                  緊急停止
                </Button>
                <Button
                  variant="outlined"
                  color="warning"
                  startIcon={<AnnouncementIcon />}
                  onClick={() => setMessageDialog(true)}
                  disabled={!currentUser}
                >
                  緊急メッセージ送信
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="contained"
                  color="success"
                  startIcon={<PlayIcon />}
                  onClick={handleSystemResume}
                >
                  システム復旧
                </Button>
                <Button
                  variant="outlined"
                  color="warning"
                  startIcon={<AnnouncementIcon />}
                  onClick={() => setMessageDialog(true)}
                >
                  メッセージ更新
                </Button>
              </>
            )}
          </Box>

          <Divider sx={{ my: 2 }} />

          <Typography variant="h6" gutterBottom>
            緊急時ログ履歴
          </Typography>

          <List sx={{ maxHeight: 200, overflow: "auto" }}>
            {emergencyLogs.length === 0 ? (
              <ListItem>
                <ListItemText primary="緊急時ログはありません" />
              </ListItem>
            ) : (
              emergencyLogs.slice(0, 10).map((log, index) => (
                <ListItem key={index} divider>
                  <ListItemIcon>
                    {log.emergency_type === "システム停止" && (
                      <StopIcon color="error" />
                    )}
                    {log.emergency_type === "手動運用" && (
                      <SettingsIcon color="warning" />
                    )}
                    {log.emergency_type === "設備故障" && (
                      <WarningIcon color="error" />
                    )}
                    {log.emergency_type === "その他" && (
                      <EmergencyIcon color="warning" />
                    )}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <Chip
                          label={log.action}
                          size="small"
                          color={
                            log.action === "開始"
                              ? "error"
                              : log.action === "終了"
                              ? "success"
                              : "warning"
                          }
                        />
                        <Typography variant="caption">
                          {new Date(log.timestamp).toLocaleString()}
                        </Typography>
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2">{log.message}</Typography>
                        <Typography variant="caption" color="textSecondary">
                          操作者: {log.user_name}
                          {log.duration_minutes &&
                            ` (継続時間: ${log.duration_minutes}分)`}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
              ))
            )}
          </List>
        </CardContent>
      </Card>

      {/* 緊急停止ダイアログ */}
      <Dialog
        open={emergencyStopDialog}
        onClose={() => setEmergencyStopDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>緊急停止の実行</DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 2 }}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>緊急事態の種類</InputLabel>
              <Select
                value={selectedType || ""}
                onChange={(e) =>
                  setSelectedType(
                    e.target.value as EmergencyState["emergency_type"]
                  )
                }
              >
                <MenuItem value="システム停止">システム停止</MenuItem>
                <MenuItem value="手動運用">手動運用</MenuItem>
                <MenuItem value="設備故障">設備故障</MenuItem>
                <MenuItem value="その他">その他</MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="緊急停止の理由"
              multiline
              rows={3}
              value={emergencyReason}
              onChange={(e) => setEmergencyReason(e.target.value)}
              placeholder="緊急停止の理由を詳しく記入してください"
            />
          </Box>

          <Alert severity="warning">
            この操作により、システム全体が停止します。本当に実行しますか？
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEmergencyStopDialog(false)}>
            キャンセル
          </Button>
          <Button
            onClick={handleEmergencyStop}
            color="error"
            variant="contained"
            disabled={!selectedType || !emergencyReason.trim()}
          >
            緊急停止実行
          </Button>
        </DialogActions>
      </Dialog>

      {/* 緊急メッセージダイアログ */}
      <Dialog
        open={messageDialog}
        onClose={() => setMessageDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {emergencyState.is_active
            ? "緊急メッセージ更新"
            : "緊急メッセージ送信"}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="緊急メッセージ"
            multiline
            rows={3}
            value={emergencyMessage}
            onChange={(e) => setEmergencyMessage(e.target.value)}
            placeholder="緊急時の連絡事項やお知らせを入力してください"
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMessageDialog(false)}>キャンセル</Button>
          <Button
            onClick={handleUpdateMessage}
            color="warning"
            variant="contained"
            disabled={!emergencyMessage.trim()}
          >
            {emergencyState.is_active ? "メッセージ更新" : "メッセージ送信"}
          </Button>
        </DialogActions>
      </Dialog>

      <style>{`
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0.3; }
        }
      `}</style>
    </Box>
  );
};

export default EmergencyControl;
