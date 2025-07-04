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
import { ensureOrdersTable } from "./database/ensure-orders";
import { pool } from "./database/connection";
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
    console.log("🚀 サーバーを起動中...");

    // データベース接続テスト
    console.log("🔄 データベース接続をテスト中...");
    const dbConnected = await testConnection();
    if (!dbConnected) {
      console.error("❌ Database connection failed. Server will not start.");
      process.exit(1);
    }

    // データベーススキーマの初期化（失敗してもサーバーは起動）
    console.log("🔄 データベーススキーマを初期化中...");
    try {
      const dbInitialized = await initializeDatabase();
      if (dbInitialized) {
        console.log("✅ データベース初期化完了");
      } else {
        console.log(
          "⚠️  データベース初期化に問題がありますが、サーバーを継続起動します"
        );
      }
    } catch (initError) {
      console.error(
        "⚠️  データベース初期化エラー（サーバーは継続起動）:",
        initError
      );
    }

    // ordersテーブル強制作成（Shell制限対応）- 改善版
    console.log("🔄 ordersテーブル存在確認・作成中...");
    try {
      // 最初に直接確認
      const client = await pool.connect();
      const checkResult = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'public'
          AND table_name = 'orders'
        );
      `);

      if (!checkResult.rows[0].exists) {
        console.log("❌ ordersテーブルが存在しません。緊急作成を実行します...");

        // 緊急作成SQL - 最小限のordersテーブル
        const createOrdersSql = `
          CREATE TABLE IF NOT EXISTS orders (
            order_id SERIAL PRIMARY KEY,
            customer_id INTEGER,
            order_number VARCHAR(4) NOT NULL UNIQUE,
            total_amount DECIMAL(10,2) NOT NULL,
            status VARCHAR(20) NOT NULL DEFAULT '注文受付'
              CHECK (status IN ('注文受付', '調理待ち', '調理中', '調理完了', '受け取り済み', 'キャンセル')),
            payment_status VARCHAR(20) NOT NULL DEFAULT '未払い'
              CHECK (payment_status IN ('未払い', '支払済み')),
            payment_method VARCHAR(20) DEFAULT '現金'
              CHECK (payment_method IN ('現金', 'クレジットカード', 'PayPay', 'その他')),
            estimated_pickup_time TIMESTAMP,
            actual_pickup_time TIMESTAMP,
            special_instructions TEXT,
            cooking_start_time TIMESTAMP,
            cooking_completion_time TIMESTAMP,
            cancel_reason TEXT,
            qr_code TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );
        `;

        await client.query(createOrdersSql);
        console.log("✅ 緊急ordersテーブル作成完了！");

        // 再確認
        const recheckResult = await client.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables
            WHERE table_schema = 'public'
            AND table_name = 'orders'
          );
        `);

        if (recheckResult.rows[0].exists) {
          console.log("🎉 ordersテーブルが正常に作成されました");
        } else {
          console.log("❌ ordersテーブル作成に失敗しました");
        }
      } else {
        console.log("✅ ordersテーブルは既に存在します");
      }

      client.release();
    } catch (ordersError) {
      console.error(
        "❌ ordersテーブル緊急作成エラー（サーバーは継続起動）:",
        ordersError
      );

      // 元のensureOrdersTable関数も試行
      try {
        const ordersEnsured = await ensureOrdersTable(pool);
        if (ordersEnsured) {
          console.log("✅ ensureOrdersTable関数でordersテーブル作成完了");
        } else {
          console.log("⚠️  ensureOrdersTable関数でもordersテーブル作成に失敗");
        }
      } catch (fallbackError) {
        console.error("❌ ensureOrdersTable関数もエラー:", fallbackError);
      }
    }

    // テーブル行数の確認（本番環境では省略可能）
    if (process.env.NODE_ENV !== "production") {
      try {
        await checkTableCounts();
      } catch (countError) {
        console.log("⚠️  テーブル行数確認をスキップ:", countError);
      }
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

      // 統計ポーリングを開始（30秒間隔）- エラーハンドリング強化済み
      console.log("📈 統計ポーリングを開始中...");
      startStatsPolling(30000);
      console.log("✅ サーバー起動完了");
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
