#!/usr/bin/env node

/**
 * UniFest Order System 動作確認スクリプト
 */

const http = require("http");
const https = require("https");

// 設定
const BACKEND_URL = "http://localhost:3001";
const FRONTEND_URL = "http://localhost:5173";

// テスト用データ
const testOrder = {
  items: [
    {
      product_id: 1,
      quantity: 2,
      unit_price: 500,
    },
  ],
  customer_name: "テスト太郎",
  customer_phone: "090-1234-5678",
  total_amount: 1000,
  payment_method: "現金",
};

// HTTPリクエストヘルパー
function makeRequest(url, method = "GET", data = null) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "UniFest-Test-Script",
      },
    };

    if (data) {
      const jsonData = JSON.stringify(data);
      options.headers["Content-Length"] = Buffer.byteLength(jsonData);
    }

    const req = http.request(options, (res) => {
      let responseData = "";
      res.on("data", (chunk) => {
        responseData += chunk;
      });
      res.on("end", () => {
        try {
          const parsedData = JSON.parse(responseData);
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: parsedData,
          });
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: responseData,
          });
        }
      });
    });

    req.on("error", (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

// テスト実行
async function runTests() {
  console.log("🍟 UniFest Order System 動作確認開始\n");

  // 1. バックエンドAPI確認
  console.log("📡 バックエンドAPI確認...");
  try {
    const response = await makeRequest(`${BACKEND_URL}/api/orders`);
    if (response.statusCode === 200) {
      console.log("✅ バックエンドAPI正常");
      console.log(`   - 注文数: ${response.data.data?.length || 0}件`);
    } else {
      console.log("❌ バックエンドAPI異常");
      console.log(`   - ステータス: ${response.statusCode}`);
    }
  } catch (error) {
    console.log("❌ バックエンドAPI接続エラー");
    console.log(`   - エラー: ${error.message}`);
  }

  // 2. フロントエンド確認
  console.log("\n🌐 フロントエンド確認...");
  try {
    const response = await makeRequest(FRONTEND_URL);
    if (response.statusCode === 200) {
      console.log("✅ フロントエンド正常");
    } else {
      console.log("❌ フロントエンド異常");
      console.log(`   - ステータス: ${response.statusCode}`);
    }
  } catch (error) {
    console.log("❌ フロントエンド接続エラー");
    console.log(`   - エラー: ${error.message}`);
  }

  // 3. 商品取得確認
  console.log("\n📦 商品データ確認...");
  try {
    const response = await makeRequest(`${BACKEND_URL}/api/products`);
    if (response.statusCode === 200) {
      console.log("✅ 商品データ取得正常");
      console.log(`   - 商品数: ${response.data.data?.length || 0}件`);
    } else {
      console.log("❌ 商品データ取得異常");
      console.log(`   - ステータス: ${response.statusCode}`);
    }
  } catch (error) {
    console.log("❌ 商品データ取得エラー");
    console.log(`   - エラー: ${error.message}`);
  }

  console.log("\n🎯 動作確認完了");
  console.log("\n📋 次のステップ:");
  console.log("1. ブラウザで http://localhost:5173 を開く");
  console.log("2. 注文画面で注文を作成してみる");
  console.log("3. 厨房画面で注文が表示されるか確認");
  console.log("4. 監視画面で全体状況を確認");
}

// スクリプト実行
runTests().catch(console.error);
