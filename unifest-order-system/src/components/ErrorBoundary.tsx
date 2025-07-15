// 🛡️ エラーバウンダリー - アプリ全体の予期しないエラーをキャッチ
import React, { Component } from "react";
import type { ErrorInfo, ReactNode } from "react";
import { 
  Box, 
  Typography, 
  Button, 
  Alert, 
  Container, 
  Paper,
  Divider,
} from "@mui/material";
import {
  BugReport as BugReportIcon,
  Refresh as RefreshIcon,
  Home as HomeIcon,
  Support as SupportIcon,
} from "@mui/icons-material";
import { apiLogger } from "../utils/logger";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    // エラーが投げられた時にstateを更新する
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("エラーバウンダリーでキャッチしたエラー:", error, errorInfo);

    // 詳細なエラー情報をログに記録
    apiLogger.log(
      "ERROR",
      "ERROR_BOUNDARY",
      "React エラーバウンダリーでキャッチ",
      {
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
        },
        errorInfo: {
          componentStack: errorInfo.componentStack,
        },
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
      }
    );

    this.setState({
      error,
      errorInfo,
    });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  private handleGoHome = () => {
    window.location.href = "/";
  };

  public render() {
    if (this.state.hasError) {
      return (
        <Container maxWidth="md" sx={{ py: 4 }}>
          <Paper
            elevation={3}
            sx={{
              p: { xs: 3, sm: 4 },
              textAlign: "center",
              borderRadius: 3,
            }}
          >
            <BugReportIcon
              sx={{
                fontSize: { xs: 60, sm: 80 },
                color: "error.main",
                mb: 2,
              }}
            />
            
            <Typography
              variant="h4"
              component="h1"
              gutterBottom
              sx={{
                fontSize: { xs: "1.5rem", sm: "2rem" },
                fontWeight: 700,
                color: "error.main",
              }}
            >
              システムエラーが発生しました
            </Typography>
            
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{
                mb: 3,
                fontSize: { xs: "1rem", sm: "1.1rem" },
              }}
            >
              申し訳ございません。予期しないエラーが発生しました。
              <br />
              以下の方法をお試しください。
            </Typography>

            {/* エラー対処法 */}
            <Alert severity="info" sx={{ mb: 3, textAlign: "left" }}>
              <Typography variant="h6" gutterBottom sx={{ fontSize: "1.1rem" }}>
                <SupportIcon sx={{ mr: 1, verticalAlign: "middle" }} />
                対処方法
              </Typography>
              <Typography component="div" sx={{ pl: 2 }}>
                <strong>1. ページの再読み込み</strong>
                <br />
                一時的な問題の可能性があります。
                <br />
                <br />
                <strong>2. ブラウザの再起動</strong>
                <br />
                ブラウザを完全に閉じて再度開いてください。
                <br />
                <br />
                <strong>3. 管理者への連絡</strong>
                <br />
                問題が継続する場合は、店舗スタッフにお声がけください。
              </Typography>
            </Alert>

            <Divider sx={{ my: 3 }} />

            {/* アクションボタン */}
            <Box
              sx={{
                display: "flex",
                gap: 2,
                justifyContent: "center",
                flexDirection: { xs: "column", sm: "row" },
              }}
            >
              <Button
                variant="contained"
                color="primary"
                startIcon={<RefreshIcon />}
                onClick={this.handleReload}
                sx={{
                  py: { xs: 1.2, sm: 1.5 },
                  px: { xs: 3, sm: 4 },
                  fontSize: { xs: "1rem", sm: "1.1rem" },
                }}
              >
                ページを再読み込み
              </Button>
              
              <Button
                variant="outlined"
                color="primary"
                startIcon={<HomeIcon />}
                onClick={this.handleGoHome}
                sx={{
                  py: { xs: 1.2, sm: 1.5 },
                  px: { xs: 3, sm: 4 },
                  fontSize: { xs: "1rem", sm: "1.1rem" },
                }}
              >
                ホームに戻る
              </Button>

              {import.meta.env.DEV && (
                <Button
                  variant="text"
                  color="secondary"
                  onClick={this.handleReset}
                  sx={{
                    py: { xs: 1.2, sm: 1.5 },
                    px: { xs: 3, sm: 4 },
                    fontSize: { xs: "1rem", sm: "1.1rem" },
                  }}
                >
                  エラーをクリア（開発用）
                </Button>
              )}
            </Box>

            {/* 緊急時の手動操作案内 */}
            <Alert severity="warning" sx={{ mt: 3, textAlign: "left" }}>
              <Typography variant="body2">
                <strong>🚨 緊急時の対応</strong>
                <br />
                システムが復旧しない場合は、紙とペンで注文を記録し、
                後でシステムに入力してください。
              </Typography>
            </Alert>
          </Paper>

          {/* 開発環境でのみエラー詳細を表示 */}
          {import.meta.env.DEV && this.state.error && (
            <Box>
              <Typography variant="h6" gutterBottom>
                エラー詳細 (開発用)
              </Typography>
              <Box
                component="pre"
                sx={{
                  backgroundColor: "#f5f5f5",
                  p: 2,
                  borderRadius: 1,
                  fontSize: "0.875rem",
                  overflow: "auto",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                }}
              >
                <strong>エラーメッセージ:</strong>
                {"\n"}
                {this.state.error.message}
                {"\n\n"}
                <strong>スタックトレース:</strong>
                {"\n"}
                {this.state.error.stack}
                {"\n\n"}
                {this.state.errorInfo && (
                  <>
                    <strong>コンポーネントスタック:</strong>
                    {"\n"}
                    {this.state.errorInfo.componentStack}
                  </>
                )}
              </Box>
            </Box>
          )}
        </Container>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
