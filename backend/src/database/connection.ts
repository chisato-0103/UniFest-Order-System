// 🗄️ データベース接続管理ファイル
// 目的: システムがデータベースと安全に通信するための「電話線」を管理
// 機能: データベースの接続、クエリ実行、エラーハンドリング
// 初心者向け解説: このファイルはシステムとデータベースを繋ぐ「橋」の役割をしています

import { Pool } from "pg"; // PostgreSQLデータベースに繋ぐためのライブラリ
import dotenv from "dotenv"; // 環境変数（パスワードなどの秘密情報）を読み込む道具

// 🔐 秘密の設定ファイルを読み込む
// 目的: .envファイルに書かれたデータベースのURLやパスワードを読み込む
dotenv.config();

// DB接続先を起動時に一度だけ出力
console.log("[DB CONNECT] DATABASE_URL:", process.env.DATABASE_URL);

// 🏊‍♂️ データベース接続プール（複数の人が同時に使えるようにする仕組み）
// 目的: データベースへの接続を管理する「プール」を作成
// なぜプール？: 複数のユーザーが同時にアクセスしても、効率よく処理できるようにするため
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL, // データベースの住所（URL形式）
  ssl:
    process.env.NODE_ENV === "production" // 本番環境（Renderなど）の場合
      ? { rejectUnauthorized: false } // SSL暗号化接続を使う
      : false, // 開発環境（ローカル）ではSSL不要
  max: 20, // 最大20人まで同時に接続できる
  idleTimeoutMillis: 30000, // 30秒使わないと接続を切る（節約のため）
  connectionTimeoutMillis: 10000, // 10秒で接続タイムアウト（遅すぎる場合はエラー）
});

// 🔍 データベースに繋がるかテストする関数
// 目的: システム起動時にデータベースに接続できるかを確認する
// 使用場面: サーバー起動時のヘルスチェック、デバッグ時の確認
export const testConnection = async (): Promise<boolean> => {
  try {
    const client = await pool.connect(); // データベースに接続を試す
    await client.query("SELECT NOW()"); // 現在の時刻を取得（接続テスト）
    client.release(); // 接続をプールに返却（他の人が使えるように）
    console.log("✅ Database connected successfully"); // 成功メッセージ
    return true;
  } catch (error) {
    console.error("❌ Database connection failed:", error); // エラーメッセージ
    return false;
  }
};

// 📝 データベースにコマンドを送る関数
// 目的: SQLコマンドを実行して、データの取得・更新・削除を行う
// 使用例: query("SELECT * FROM orders WHERE order_id = $1", [123])
// 機能: 処理時間の計測、エラーハンドリング、ログ出力
export const query = async (text: string, params?: any[]): Promise<any> => {
  const start = Date.now(); // 処理開始時刻を記録（パフォーマンス監視用）
  try {
    const res = await pool.query(text, params); // データベースにSQLコマンドを送信
    const duration = Date.now() - start; // 処理時間を計算
    console.log("Executed query", { text, duration, rows: res.rowCount }); // デバッグ用ログ出力
    return res; // 結果を返す
  } catch (error) {
    console.error("Query error:", { text, error }); // エラーログ出力
    throw error; // エラーを再び投げる（呼び出し元が処理できるように）
  }
};

// 🔒 トランザクション実行ヘルパー
// 目的: 複数のデータベース操作を「全て成功」か「全て失敗」で統一する
// 使用例: 注文作成時に「注文テーブルに追加」と「在庫を減らす」を一括処理
// 重要: 途中でエラーが起きたら、全ての変更を取り消して元に戻す
export const transaction = async (callback: (client: any) => Promise<any>) => {
  const client = await pool.connect(); // データベース接続を取得
  try {
    await client.query("BEGIN"); // トランザクション開始
    const result = await callback(client); // 渡された処理を実行
    await client.query("COMMIT"); // 全て成功したら確定
    return result;
  } catch (error) {
    await client.query("ROLLBACK"); // エラーが起きたら全て取り消し
    throw error;
  } finally {
    client.release(); // 接続をプールに返却
  }
};

// 🛠️ データベースヘルパーオブジェクト
// 目的: データベース操作のための便利な道具をまとめたオブジェクト
// 使用例: import { db } from './connection'; → db.query("SELECT * FROM orders");
export const db = {
  query,                        // SQLクエリ実行関数
  transaction,                  // トランザクション実行関数
  getClient: () => pool.connect(), // 専用クライアント取得関数
  pool,                         // プールオブジェクト直接アクセス
};

// 📋 デフォルトエクスポート
// 目的: 他のファイルで import pool from './connection' として使えるようにする
export default pool;
