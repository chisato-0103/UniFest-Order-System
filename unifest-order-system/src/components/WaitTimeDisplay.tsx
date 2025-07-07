import React from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  LinearProgress,
  Chip,
  Icon,
} from "@mui/material";
import {
  Schedule as ScheduleIcon,
  LocalFireDepartment as FireIcon,
  CheckCircle as CheckIcon,
  HourglassTop as HourglassIcon,
} from "@mui/icons-material";
import { useAppContext } from "../hooks/useAppContext";
import type { CongestionStatus, WaitTimeInfo } from "../types";

interface WaitTimeDisplayProps {
  orderId?: number;
  showCongestionInfo?: boolean;
  compact?: boolean;
}

const WaitTimeDisplay: React.FC<WaitTimeDisplayProps> = (props) => {
  const { orderId, showCongestionInfo = false, compact = false } = props;
  const { state } = useAppContext();
  const { waitTimeInfo, congestionStatus } = state;

  // 特定の注文の待ち時間情報を取得
  const orderWaitInfo = orderId
    ? waitTimeInfo.find(
        (info: WaitTimeInfo) => info.order_id === orderId.toString()
      )
    : null;

  // 待ち時間の色とアイコンを取得
  const getWaitTimeStatus = (minutes: number, status: string) => {
    if (status === "完成" || status === "受け渡し可能") {
      return {
        color: "success" as const,
        icon: CheckIcon,
        label: "完成",
      };
    } else if (status === "調理中") {
      return {
        color: "info" as const,
        icon: FireIcon,
        label: "調理中",
      };
    } else if (minutes <= 5) {
      return {
        color: "success" as const,
        icon: ScheduleIcon,
        label: "もうすぐ",
      };
    } else if (minutes <= 10) {
      return {
        color: "warning" as const,
        icon: ScheduleIcon,
        label: "少々お待ちください",
      };
    } else {
      return {
        color: "error" as const,
        icon: HourglassIcon,
        label: "しばらくお待ちください",
      };
    }
  };

  // 混雑状況の色を取得
  const getCongestionColor = (
    level: CongestionStatus["congestion_level"]
  ): "success" | "warning" | "error" | "info" => {
    switch (level) {
      case "空いている":
        return "success";
      case "やや混雑":
        return "warning";
      case "混雑":
        return "error";
      case "非常に混雑":
        return "error";
      default:
        return "info";
    }
  };

  // 混雑度の進捗バー値を計算
  const getCongestionProgress = (
    level: CongestionStatus["congestion_level"]
  ) => {
    switch (level) {
      case "空いている":
        return 25;
      case "やや混雑":
        return 50;
      case "混雑":
        return 75;
      case "非常に混雑":
        return 100;
      default:
        return 0;
    }
  };

  // 温度管理のアラート表示
  const getTemperatureAlert = (status: string, completionTime?: string) => {
    if (!completionTime || status !== "完成") return null;

    const minutesSinceCompletion = Math.floor(
      (Date.now() - new Date(completionTime).getTime()) / 60000
    );

    if (minutesSinceCompletion >= 15) {
      return { severity: "error", message: "再加熱をお勧めします" };
    } else if (minutesSinceCompletion >= 10) {
      return { severity: "warning", message: "お早めにお受け取りください" };
    } else if (minutesSinceCompletion >= 5) {
      return { severity: "info", message: "熱々のうちにどうぞ" };
    }
    return null;
  };

  if (compact) {
    // コンパクト表示（注文カード内などで使用）
    if (orderWaitInfo) {
      const status = getWaitTimeStatus(
        orderWaitInfo.estimated_wait_minutes,
        orderWaitInfo.current_status
      );
      const temperatureAlert = getTemperatureAlert(
        orderWaitInfo.current_status,
        typeof orderWaitInfo.cooking_completion_time === "string"
          ? orderWaitInfo.cooking_completion_time
          : orderWaitInfo.cooking_completion_time.toISOString()
      );

      return (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Icon component={status.icon} color={status.color} />
          <Typography variant="body2" color={`${status.color}.main`}>
            {orderWaitInfo.current_status === "完成"
              ? "完成"
              : `約${orderWaitInfo.estimated_wait_minutes}分`}
          </Typography>
          {temperatureAlert && (
            <Chip
              label={temperatureAlert.message}
              size="small"
              color={
                temperatureAlert.severity === "warning" ? "warning" : "error"
              }
              variant="outlined"
            />
          )}
        </Box>
      );
    }
    return null;
  }

  return (
    <Box>
      {/* 個別注文の待ち時間表示 */}
      {orderWaitInfo && (
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                mb: 2,
              }}
            >
              <Typography variant="h6">
                注文番号: {orderWaitInfo.order_id}
              </Typography>
              <Chip
                label={orderWaitInfo.current_status}
                color={
                  getWaitTimeStatus(
                    orderWaitInfo.estimated_wait_minutes,
                    orderWaitInfo.current_status
                  ).color
                }
              />
            </Box>

            {orderWaitInfo.current_status !== "完成" && (
              <Box sx={{ mb: 2 }}>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mb: 1,
                  }}
                >
                  <Typography variant="body2">調理進捗</Typography>
                  <Typography variant="body2">
                    予想完了:{" "}
                    {new Date(
                      orderWaitInfo.estimated_completion_time
                    ).toLocaleTimeString("ja-JP", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={orderWaitInfo.current_status === "調理中" ? 70 : 30}
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </Box>
            )}

            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <ScheduleIcon color="primary" />
                <Typography variant="h5" color="primary.main">
                  {orderWaitInfo.current_status === "完成"
                    ? "完成！"
                    : `約${orderWaitInfo.estimated_wait_minutes}分`}
                </Typography>
              </Box>

              {orderWaitInfo.current_status === "完成" && (
                <Chip
                  label="熱々のうちにお受け取りください"
                  color="warning"
                  icon={<FireIcon />}
                />
              )}
            </Box>

            {/* 温度管理アラート */}
            {(() => {
              const alert = getTemperatureAlert(
                orderWaitInfo.current_status,
                typeof orderWaitInfo.cooking_completion_time === "string"
                  ? orderWaitInfo.cooking_completion_time
                  : orderWaitInfo.cooking_completion_time.toISOString()
              );
              return (
                alert && (
                  <Box sx={{ mt: 2 }}>
                    <Chip
                      label={alert.message}
                      color={alert.severity === "warning" ? "warning" : "error"}
                      variant="outlined"
                      icon={<FireIcon />}
                    />
                  </Box>
                )
              );
            })()}
          </CardContent>
        </Card>
      )}

      {/* 混雑状況表示 */}
      {showCongestionInfo && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              現在の混雑状況
            </Typography>

            <Box sx={{ mb: 2 }}>
              <Box
                sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}
              >
                <Typography variant="body2">混雑度</Typography>
                <Typography
                  variant="body2"
                  color={`${getCongestionColor(
                    congestionStatus.congestion_level
                  )}.main`}
                >
                  {congestionStatus.congestion_level}
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={getCongestionProgress(congestionStatus.congestion_level)}
                color={getCongestionColor(congestionStatus.congestion_level)}
                sx={{ height: 8, borderRadius: 4 }}
              />
            </Box>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 2,
                mb: 2,
              }}
            >
              <Box>
                <Typography variant="body2" color="text.secondary">
                  現在の待ち件数
                </Typography>
                <Typography variant="h6">
                  {congestionStatus.current_wait_count}件
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  調理中
                </Typography>
                <Typography variant="h6">
                  {congestionStatus.current_cooking_count}件
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  平均待ち時間
                </Typography>
                <Typography variant="h6">
                  約{congestionStatus.average_wait_time}分
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  新規注文予想待ち時間
                </Typography>
                <Typography variant="h6" color="primary">
                  約{congestionStatus.estimated_new_order_wait}分
                </Typography>
              </Box>
            </Box>

            <Typography variant="body2" color="text.secondary">
              最終更新:{" "}
              {new Date(congestionStatus.updated_at).toLocaleTimeString(
                "ja-JP"
              )}
            </Typography>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default WaitTimeDisplay;
