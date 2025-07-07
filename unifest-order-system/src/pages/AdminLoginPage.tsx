import React, { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  Container,
  Paper,
  InputAdornment,
  IconButton,
} from "@mui/material";
import {
  Visibility,
  VisibilityOff,
  AdminPanelSettings,
  Restaurant,
} from "@mui/icons-material";
import { useAuth } from "../hooks/useAuth";
import { useNavigate, useLocation } from "react-router-dom";

const AdminLoginPage: React.FC = () => {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || "/admin";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    // 少し遅延を入れて本格的な認証感を演出
    await new Promise((resolve) => setTimeout(resolve, 1000));

    if (login(password)) {
      navigate(from, { replace: true });
    } else {
      setError("パスワードが間違っています");
      setPassword("");
    }
    setIsLoading(false);
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          py: 4,
        }}
      >
        <Paper
          elevation={8}
          sx={{
            width: "100%",
            maxWidth: 400,
            p: 4,
            borderRadius: 3,
            background: "linear-gradient(135deg, #FF6B35 0%, #F7931E 100%)",
          }}
        >
          <Card
            sx={{
              backgroundColor: "rgba(255, 255, 255, 0.95)",
              backdropFilter: "blur(10px)",
              borderRadius: 2,
            }}
          >
            <CardContent sx={{ p: 4 }}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  mb: 3,
                }}
              >
                <Restaurant sx={{ fontSize: 32, color: "#FF6B35", mr: 1 }} />
                <AdminPanelSettings sx={{ fontSize: 32, color: "#4ECDC4" }} />
              </Box>

              <Typography
                variant="h4"
                align="center"
                gutterBottom
                sx={{ fontWeight: 600, color: "#333" }}
              >
                管理者ログイン
              </Typography>

              <Typography
                variant="body2"
                align="center"
                sx={{ color: "#666", mb: 3 }}
              >
                UniFest たこ焼き店舗管理システム
              </Typography>

              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}

              <form onSubmit={handleSubmit}>
                <TextField
                  fullWidth
                  type={showPassword ? "text" : "password"}
                  label="管理者パスワード"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  margin="normal"
                  required
                  autoFocus
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      backgroundColor: "rgba(255, 255, 255, 0.8)",
                    },
                  }}
                />

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  size="large"
                  disabled={isLoading}
                  sx={{
                    mt: 3,
                    mb: 2,
                    py: 1.5,
                    borderRadius: 2,
                    background: "linear-gradient(45deg, #FF6B35, #F7931E)",
                    fontWeight: 600,
                    "&:hover": {
                      background: "linear-gradient(45deg, #E55A2B, #E6841A)",
                    },
                  }}
                >
                  {isLoading ? "認証中..." : "ログイン"}
                </Button>
              </form>

              <Typography
                variant="body2"
                align="center"
                sx={{ color: "#888", mt: 2 }}
              >
                お客様の注文画面は{" "}
                <Button
                  size="small"
                  onClick={() => navigate("/order")}
                  sx={{ color: "#FF6B35", fontWeight: 600 }}
                >
                  こちら
                </Button>{" "}
                ・{" "}
                <Button
                  size="small"
                  onClick={() => navigate("/")}
                  sx={{ color: "#4ECDC4", fontWeight: 600 }}
                >
                  全ページ一覧
                </Button>{" "}
                ・{" "}
                <Button
                  size="small"
                  onClick={() => navigate("/admin-navigation")}
                  sx={{ color: "#4ECDC4", fontWeight: 600 }}
                >
                  管理者ページ一覧
                </Button>
              </Typography>
            </CardContent>
          </Card>
        </Paper>
      </Box>
    </Container>
  );
};

export default AdminLoginPage;
