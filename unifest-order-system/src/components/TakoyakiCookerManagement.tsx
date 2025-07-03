import React, { useState } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Alert,
  TextField,
} from "@mui/material";
import {
  Restaurant as RestaurantIcon,
  Timer as TimerIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Settings as SettingsIcon,
  Refresh as RefreshIcon,
  CleaningServices as CleanIcon,
} from "@mui/icons-material";
import { useAppContext } from "../hooks/useAppContext";
import type { TakoyakiCooker } from "../types";

interface TakoyakiCookerManagementProps {
  showDetailedView?: boolean;
}

const TakoyakiCookerManagement: React.FC<TakoyakiCookerManagementProps> = ({
  showDetailedView = false,
}) => {
  const { state, dispatch } = useAppContext();
  const { takoyakiCookers } = state;

  const [selectedCooker, setSelectedCooker] = useState<TakoyakiCooker | null>(
    null
  );
  const [dialogOpen, setDialogOpen] = useState(false);
  const [maintenanceDialog, setMaintenanceDialog] = useState(false);
  const [maintenanceNote, setMaintenanceNote] = useState("");

  // たこ焼き器のステータス色を取得
  const getCookerStatusColor = (status: TakoyakiCooker["status"]) => {
    switch (status) {
      case "空き":
        return "success";
      case "使用中":
        return "info";
      case "清掃中":
        return "warning";
      case "故障中":
        return "error";
      default:
        return "default";
    }
  };

  // たこ焼き器のステータスアイコンを取得
  const getCookerStatusIcon = (status: TakoyakiCooker["status"]) => {
    switch (status) {
      case "空き":
        return <CheckIcon />;
      case "使用中":
        return <RestaurantIcon />;
      case "清掃中":
        return <CleanIcon />;
      case "故障中":
        return <ErrorIcon />;
      default:
        return <TimerIcon />;
    }
  };

  // 利用率の計算
  const getUtilizationRate = (cooker: TakoyakiCooker) => {
    if (cooker.max_capacity === 0) return 0;
    return Math.round((cooker.current_load / cooker.max_capacity) * 100);
  };

  // たこ焼き器の状態更新
  const updateCookerStatus = (
    cookerId: number,
    newStatus: TakoyakiCooker["status"]
  ) => {
    const cooker = takoyakiCookers.find((c) => c.cooker_id === cookerId);
    if (cooker) {
      dispatch({
        type: "UPDATE_COOKER_STATUS",
        payload: { ...cooker, status: newStatus },
      });
    }
  };

  // メンテナンス開始
  const startMaintenance = (cookerId: number) => {
    const cooker = takoyakiCookers.find((c) => c.cooker_id === cookerId);
    if (cooker) {
      dispatch({
        type: "UPDATE_COOKER_STATUS",
        payload: { ...cooker, status: "清掃中" },
      });
    }
    setMaintenanceDialog(false);
    setMaintenanceNote("");
  };

  // たこ焼き器詳細ダイアログを開く
  const openCookerDetails = (cooker: TakoyakiCooker) => {
    setSelectedCooker(cooker);
    setDialogOpen(true);
  };

  // メンテナンスダイアログを開く
  const openMaintenanceDialog = (cooker: TakoyakiCooker) => {
    setSelectedCooker(cooker);
    setMaintenanceDialog(true);
  };

  const renderCookerCard = (cooker: TakoyakiCooker) => {
    const utilizationRate = getUtilizationRate(cooker);

    return (
      <Card
        key={cooker.cooker_id}
        sx={{
          cursor: "pointer",
          "&:hover": { boxShadow: 3 },
          border: cooker.status === "故障中" ? "2px solid red" : "none",
        }}
        onClick={() => openCookerDetails(cooker)}
      >
        <CardContent>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 2,
            }}
          >
            <Typography variant="h6">{cooker.cooker_name}</Typography>
            <Chip
              icon={getCookerStatusIcon(cooker.status)}
              label={cooker.status}
              color={getCookerStatusColor(cooker.status)}
              size="small"
            />
          </Box>

          <Box sx={{ mb: 2 }}>
            <Box
              sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}
            >
              <Typography variant="body2">稼働率</Typography>
              <Typography variant="body2">{utilizationRate}%</Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={utilizationRate}
              color={utilizationRate > 80 ? "warning" : "primary"}
              sx={{ height: 6, borderRadius: 3 }}
            />
          </Box>

          <Typography variant="body2" color="text.secondary">
            負荷: {cooker.current_load}/{cooker.max_capacity}
          </Typography>

          {cooker.current_order_id && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary">
                調理中の注文: #{cooker.current_order_id}
              </Typography>
            </Box>
          )}

          {cooker.maintenance_required && (
            <Box sx={{ mt: 1 }}>
              <Chip
                label="メンテナンス要"
                size="small"
                color="warning"
                variant="outlined"
                icon={<WarningIcon />}
              />
            </Box>
          )}

          {showDetailedView && (
            <Box sx={{ mt: 2, display: "flex", gap: 1 }}>
              <Button
                size="small"
                startIcon={<SettingsIcon />}
                onClick={(e) => {
                  e.stopPropagation();
                  openMaintenanceDialog(cooker);
                }}
                disabled={cooker.status === "使用中"}
              >
                清掃
              </Button>
              {cooker.status === "故障中" && (
                <Button
                  size="small"
                  startIcon={<RefreshIcon />}
                  onClick={(e) => {
                    e.stopPropagation();
                    updateCookerStatus(cooker.cooker_id, "空き");
                  }}
                  color="primary"
                >
                  復旧
                </Button>
              )}
            </Box>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        たこ焼き器管理
      </Typography>

      {/* 全体統計 */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
          <Box sx={{ flex: 1, minWidth: 200 }}>
            <Card sx={{ bgcolor: "primary.light", color: "white" }}>
              <CardContent sx={{ py: 1 }}>
                <Typography variant="body2">稼働可能</Typography>
                <Typography variant="h5">
                  {takoyakiCookers.filter((c) => c.status === "空き").length}
                </Typography>
              </CardContent>
            </Card>
          </Box>
          <Box sx={{ flex: 1, minWidth: 200 }}>
            <Card sx={{ bgcolor: "info.light", color: "white" }}>
              <CardContent sx={{ py: 1 }}>
                <Typography variant="body2">使用中</Typography>
                <Typography variant="h5">
                  {takoyakiCookers.filter((c) => c.status === "使用中").length}
                </Typography>
              </CardContent>
            </Card>
          </Box>
          <Box sx={{ flex: 1, minWidth: 200 }}>
            <Card sx={{ bgcolor: "warning.light", color: "white" }}>
              <CardContent sx={{ py: 1 }}>
                <Typography variant="body2">清掃中</Typography>
                <Typography variant="h5">
                  {takoyakiCookers.filter((c) => c.status === "清掃中").length}
                </Typography>
              </CardContent>
            </Card>
          </Box>
          <Box sx={{ flex: 1, minWidth: 200 }}>
            <Card sx={{ bgcolor: "error.light", color: "white" }}>
              <CardContent sx={{ py: 1 }}>
                <Typography variant="body2">故障中</Typography>
                <Typography variant="h5">
                  {takoyakiCookers.filter((c) => c.status === "故障中").length}
                </Typography>
              </CardContent>
            </Card>
          </Box>
        </Box>
      </Box>

      {/* アラート表示 */}
      {takoyakiCookers.some((c) => c.status === "故障中") && (
        <Alert severity="error" sx={{ mb: 2 }}>
          故障中のたこ焼き器があります。至急対応してください。
        </Alert>
      )}

      {takoyakiCookers.some((c) => c.maintenance_required) && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          メンテナンスが必要なたこ焼き器があります。
        </Alert>
      )}

      {/* たこ焼き器一覧 */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: 2,
        }}
      >
        {takoyakiCookers.map((cooker) => (
          <Box key={cooker.cooker_id}>{renderCookerCard(cooker)}</Box>
        ))}
      </Box>

      {/* たこ焼き器詳細ダイアログ */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>{selectedCooker?.cooker_name} - 詳細情報</DialogTitle>
        <DialogContent>
          {selectedCooker && (
            <Box>
              <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                <Box sx={{ flex: 1, minWidth: 300 }}>
                  <List>
                    <ListItem>
                      <ListItemIcon>
                        {getCookerStatusIcon(selectedCooker.status)}
                      </ListItemIcon>
                      <ListItemText
                        primary="ステータス"
                        secondary={selectedCooker.status}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <RestaurantIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary="負荷"
                        secondary={`${selectedCooker.current_load}/${selectedCooker.max_capacity}`}
                      />
                    </ListItem>
                    {selectedCooker.last_used_at && (
                      <ListItem>
                        <ListItemIcon>
                          <TimerIcon />
                        </ListItemIcon>
                        <ListItemText
                          primary="最終使用時刻"
                          secondary={new Date(
                            selectedCooker.last_used_at
                          ).toLocaleString()}
                        />
                      </ListItem>
                    )}
                  </List>
                </Box>
                <Box sx={{ flex: 1, minWidth: 300 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    調理中の注文
                  </Typography>
                  {selectedCooker.current_order_id ? (
                    <List dense>
                      <ListItem>
                        <ListItemText
                          primary={`注文 #${selectedCooker.current_order_id}`}
                        />
                      </ListItem>
                      {selectedCooker.cooking_start_time && (
                        <ListItem>
                          <ListItemText
                            primary="調理開始時刻"
                            secondary={new Date(
                              selectedCooker.cooking_start_time
                            ).toLocaleString()}
                          />
                        </ListItem>
                      )}
                      {selectedCooker.estimated_completion_time && (
                        <ListItem>
                          <ListItemText
                            primary="完了予定時刻"
                            secondary={new Date(
                              selectedCooker.estimated_completion_time
                            ).toLocaleString()}
                          />
                        </ListItem>
                      )}
                    </List>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      調理中の注文はありません
                    </Typography>
                  )}
                </Box>
              </Box>

              <Divider sx={{ my: 2 }} />

              {selectedCooker.maintenance_required && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                  このたこ焼き器はメンテナンスが必要です。
                </Alert>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>閉じる</Button>
        </DialogActions>
      </Dialog>

      {/* メンテナンス開始ダイアログ */}
      <Dialog
        open={maintenanceDialog}
        onClose={() => setMaintenanceDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>清掃開始</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <Typography variant="body1" gutterBottom>
              {selectedCooker?.cooker_name} の清掃を開始します。
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="清掃内容"
              value={maintenanceNote}
              onChange={(e) => setMaintenanceNote(e.target.value)}
              sx={{ mt: 2 }}
              placeholder="実施する清掃内容を入力してください"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMaintenanceDialog(false)}>
            キャンセル
          </Button>
          <Button
            onClick={() =>
              selectedCooker && startMaintenance(selectedCooker.cooker_id)
            }
            variant="contained"
          >
            開始
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TakoyakiCookerManagement;
