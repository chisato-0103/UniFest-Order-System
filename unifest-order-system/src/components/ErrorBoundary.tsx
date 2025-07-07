// 🛡️ エラーバウンダリー - アプリ全体の予期しないエラーをキャッチ
import React, { Component } from "react";
import type { ErrorInfo, ReactNode } from "react";
import { Box, Typography, Button, Alert, Container } from "@mui/material";
import {
  BugReport as BugReportIcon,
  Refresh as RefreshIcon,
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

  public render() {
    if (this.state.hasError) {
      return (
        <Container maxWidth="md" sx={{ mt: 4 }}>
          <Alert severity="error" icon={<BugReportIcon />} sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              予期しないエラーが発生しました
            </Typography>
            <Typography variant="body2" color="text.secondary">
              アプリケーションで問題が発生しました。ページを更新してやり直してください。
            </Typography>
          </Alert>

          <Box sx={{ mb: 3, display: "flex", gap: 2 }}>
            <Button
              variant="contained"
              startIcon={<RefreshIcon />}
              onClick={this.handleReload}
              color="primary"
            >
              ページを更新
            </Button>
            <Button variant="outlined" onClick={this.handleReset}>
              エラーを無視して続行
            </Button>
          </Box>

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
