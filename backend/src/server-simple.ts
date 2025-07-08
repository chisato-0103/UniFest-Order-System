import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { testConnection } from "./database/connection";

// 環境変数の読み込み
dotenv.config();

// Express アプリケーションの作成
const app = express();

// 基本ミドルウェア
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "https://unifest-order.onrender.com/",
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 基本ルート
app.get("/", (req, res) => {
  res.json({
    message: "UniFest Order System API",
    version: "1.0.0",
    status: "running",
  });
});

// ヘルスチェック
app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// 商品一覧取得（テスト用）
app.get("/api/products", async (req, res) => {
  try {
    const { db } = await import("./database/connection");
    const result = await db.query(
      "SELECT * FROM products WHERE status = '有効' AND deleted_flag = false"
    );
    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "商品データの取得に失敗しました",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// エラーハンドリング
app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error("Error:", err);
    res.status(500).json({
      error: {
        message: err.message || "Internal Server Error",
        status: 500,
      },
    });
  }
);

// 404 ハンドラー
app.use("*", (req, res) => {
  res.status(404).json({
    error: {
      message: "Route not found",
      status: 404,
      path: req.originalUrl,
    },
  });
});

// サーバー起動
const PORT = process.env.PORT || 3001;

const startServer = async () => {
  try {
    // データベース接続テスト
    const dbConnected = await testConnection();
    if (!dbConnected) {
      console.error("❌ Database connection failed. Server will not start.");
      process.exit(1);
    }

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📝 API: http://localhost:${PORT}/`);
      console.log(`🏥 Health Check: http://localhost:${PORT}/health`);
      console.log(`🛍️ Products API: http://localhost:${PORT}/api/products`);
    });
  } catch (error) {
    console.error("❌ Server startup failed:", error);
    process.exit(1);
  }
};

startServer();
