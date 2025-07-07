import React from "react";

function TestApp() {
  return (
    <div style={{ padding: "20px", textAlign: "center" }}>
      <h1>UniFest Order System</h1>
      <p>アプリケーションが正常に動作しています</p>
      <button onClick={() => alert("テスト成功!")}>テストボタン</button>
    </div>
  );
}

export default TestApp;
