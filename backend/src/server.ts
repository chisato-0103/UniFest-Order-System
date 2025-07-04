import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";
import rateLimit from "express-rate-limit";
import { createServer } from "http";
import { Server } from "socket.io";
import dotenv from "dotenv";
import { testConnection } from "./database/connection";
import { initializeDatabase, checkTableCounts } from "./database/init";
import { SocketHandlers } from "./socket/socketHandlers";
import { startStatsPolling } from "./controllers/statsController";

// ルーターのインポート
import productsRouter from "./routes/products";
import ordersRouter from "./routes/orders";
import categoriesRouter from "./routes/categories";
import toppingsRouter from "./routes/toppings";
import stockRouter from "./routes/stock";
import statsRouter from "./routes/stats";
import emergencyRouter from "./routes/emergency";
import settingsRouter from "./routes/settings";

// コントローラーにSocket.ioインスタンスを注入
import { setSocketInstance as setOrderSocketInstance } from "./controllers/orderController";
import { setSocketInstance as setProductSocketInstance } from "./controllers/productController";
import { setSocketInstance as setCategorySocketInstance } from "./controllers/categoryController";
import { setSocketInstance as setToppingSocketInstance } from "./controllers/toppingController";
import { setSocketInstance as setSettingsSocketInstance } from "./controllers/settingsController";
import { setSocketInstance as setStockSocketInstance } from "./controllers/stockController";
import { setSocketInstance as setStatsSocketInstance } from "./controllers/statsController";
import { setSocketInstance as setEmergencySocketInstance } from "./controllers/emergencyController";

// 環境変数の読み込み
dotenv.config();

// Express アプリケーションの作成
const app = express();
const server = createServer(app);

// Socket.IO の設定
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  },
});

// Socket.IO ハンドラーの初期化
const socketHandlers = new SocketHandlers(io);

// コントローラーにSocket.ioインスタンスを注入
setOrderSocketInstance(io);
setProductSocketInstance(io);
setCategorySocketInstance(io);
setToppingSocketInstance(io);
setSettingsSocketInstance(io);
setStockSocketInstance(io);
setStatsSocketInstance(io);
setEmergencySocketInstance(io);

// 基本ミドルウェア
app.use(
  helmet({
    contentSecurityPolicy: false, // Socket.IOのため無効化
  })
);
app.use(compression());
app.use(morgan("combined"));
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分
  max: 100, // 最大100リクエスト/15分
  message: {
    error: "Too many requests from this IP, please try again later.",
  },
});
app.use("/api/", limiter);

// JSON パースの設定
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// API ルーターの設定
app.use("/api/products", productsRouter);
app.use("/api/orders", ordersRouter);
app.use("/api/categories", categoriesRouter);
app.use("/api/toppings", toppingsRouter);
app.use("/api/stock", stockRouter);
app.use("/api/stats", statsRouter);
app.use("/api/emergency", emergencyRouter);
app.use("/api/settings", settingsRouter);

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
    connections: socketHandlers.getConnectionStats(),
  });
});

// Socket.IO 接続管理（レガシー - 新しいハンドラーで置き換え済み）
// 以下のコードは SocketHandlers クラスで管理されています

// エラーハンドリングミドルウェア
app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error("Error:", err);

    const status = err.status || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({
      error: {
        message,
        status,
        timestamp: new Date().toISOString(),
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

    // データベーススキーマの初期化
    console.log("🔄 データベーススキーマを初期化中...");
    const dbInitialized = await initializeDatabase();
    if (!dbInitialized) {
      console.error(
        "❌ Database initialization failed. Server will not start."
      );
      process.exit(1);
    }

    // テーブル行数の確認（本番環境では省略可能）
    if (process.env.NODE_ENV !== "production") {
      await checkTableCounts();
    }

    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📝 API Documentation: http://localhost:${PORT}/`);
      console.log(`🏥 Health Check: http://localhost:${PORT}/health`);
      console.log(`🔗 Socket.IO: http://localhost:${PORT}`);
      console.log(
        `📊 Frontend URL: ${
          process.env.FRONTEND_URL || "http://localhost:5173"
        }`
      );

      // 統計ポーリングを開始（30秒間隔）
      startStatsPolling(30000);
      console.log("📈 Stats polling started");
    });
  } catch (error) {
    console.error("❌ Server startup failed:", error);
    process.exit(1);
  }
};

startServer();

// Socket.IOインスタンスをエクスポート
export { io, socketHandlers };
export default app;
