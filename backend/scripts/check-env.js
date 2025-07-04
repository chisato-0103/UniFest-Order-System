#!/usr/bin/env node
/**
 * Renderの環境変数とデータベース接続を確認するスクリプト
 */

console.log("🔍 環境変数確認:");
console.log("NODE_ENV:", process.env.NODE_ENV);
console.log("DATABASE_URL:", process.env.DATABASE_URL ? "設定済み" : "未設定");
console.log("PORT:", process.env.PORT);

// DATABASE_URLが設定されている場合は詳細を表示（パスワード部分は隠す）
if (process.env.DATABASE_URL) {
  const urlPattern = process.env.DATABASE_URL.replace(
    /:\/\/([^:]+):([^@]+)@/,
    "://$1:***@"
  );
  console.log("データベースURL形式:", urlPattern);

  // URLを解析
  try {
    const url = new URL(process.env.DATABASE_URL);
    console.log("ホスト:", url.hostname);
    console.log("ポート:", url.port);
    console.log("データベース名:", url.pathname.substring(1));
    console.log("ユーザー:", url.username);
  } catch (error) {
    console.log("URL解析エラー:", error.message);
  }
} else {
  console.log("❌ DATABASE_URLが設定されていません");
  console.log("💡 Renderダッシュボードで以下を確認してください:");
  console.log("   1. PostgreSQLサービスのConnect > Internal Database URL");
  console.log("   2. バックエンドサービスのEnvironment > DATABASE_URL環境変数");
}

// 他の関連環境変数
console.log("\n🔍 その他の環境変数:");
const envVars = ["FRONTEND_URL", "JWT_SECRET"];
envVars.forEach((key) => {
  console.log(`${key}:`, process.env[key] ? "設定済み" : "未設定");
});
