// 🗄️ データベースに繋ぐための道具
import { Pool } from "pg"; // PostgreSQLデータベースに繋ぐ道具
import dotenv from "dotenv"; // 秘密の設定を読み込む道具

// 🔐 秘密の設定ファイルを読み込む
dotenv.config();

// 🏊‍♂️ データベース接続プール（複数の人が同時に使えるようにする仕組み）
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL, // データベースの住所
  ssl:
    process.env.NODE_ENV === "production" // 本番環境の場合
      ? { rejectUnauthorized: false } // SSL接続を使う
      : false, // 開発環境ではSSL不要
  max: 20, // 最大20人まで同時に接続できる
  idleTimeoutMillis: 30000, // 30秒使わないと接続を切る
  connectionTimeoutMillis: 10000, // 10秒で接続タイムアウト
});

// 🔍 データベースに繋がるかテストする関数
export const testConnection = async (): Promise<boolean> => {
  try {
    const client = await pool.connect(); // データベースに接続を試す
    await client.query("SELECT NOW()"); // 現在の時刻を取得（接続テスト）
    client.release(); // 接続を返却
    console.log("✅ Database connected successfully"); // 成功メッセージ
    return true;
  } catch (error) {
    console.error("❌ Database connection failed:", error); // エラーメッセージ
    return false;
  }
};

// 📝 データベースにコマンドを送る関数
export const query = async (text: string, params?: any[]): Promise<any> => {
  const start = Date.now(); // 処理開始時刻を記録
  try {
    const res = await pool.query(text, params); // データベースにコマンドを送る
    const duration = Date.now() - start; // 処理時間を計算
    console.log("Executed query", { text, duration, rows: res.rowCount }); // ログ出力
    return res; // 結果を返す
  } catch (error) {
    console.error("Query error:", { text, error });
    throw error;
  }
};

// トランザクション実行ヘルパー
export const transaction = async (callback: (client: any) => Promise<any>) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await callback(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

// データベースヘルパーオブジェクト
export const db = {
  query,
  transaction,
  getClient: () => pool.connect(),
  pool,
};

export default pool;
