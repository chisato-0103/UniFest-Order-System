#!/usr/bin/env node

/**
 * SQLファイルをdist/databaseディレクトリにコピーするスクリプト
 * Renderなどの本番環境でcpxが利用できない場合の代替手段
 */

const fs = require("fs");
const path = require("path");

const sourceDir = path.join(__dirname, "..", "src", "database");
const targetDir = path.join(__dirname, "..", "dist", "database");

// ターゲットディレクトリが存在しない場合は作成
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
  console.log(`📁 ディレクトリを作成: ${targetDir}`);
}

// SQLファイルをコピー
function copySqlFiles() {
  try {
    const files = fs.readdirSync(sourceDir);
    const sqlFiles = files.filter((file) => file.endsWith(".sql"));

    console.log(`🔄 SQLファイルをコピー中: ${sourceDir} -> ${targetDir}`);

    sqlFiles.forEach((file) => {
      const sourcePath = path.join(sourceDir, file);
      const targetPath = path.join(targetDir, file);

      fs.copyFileSync(sourcePath, targetPath);
      console.log(`✅ コピー完了: ${file}`);
    });

    console.log(`🎉 ${sqlFiles.length}個のSQLファイルのコピーが完了しました`);
  } catch (error) {
    console.error("❌ SQLファイルのコピーに失敗:", error);
    process.exit(1);
  }
}

// スクリプト実行
if (require.main === module) {
  copySqlFiles();
}

module.exports = { copySqlFiles };
