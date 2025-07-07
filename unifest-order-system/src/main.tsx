// 🎬 Reactアプリを始めるための道具たち
import { StrictMode } from "react"; // Reactの厳格モード（バグを見つけやすくする）
import { createRoot } from "react-dom/client"; // Webページに表示するための道具
import "./index.css"; // 見た目の設定ファイル
import App from "./App"; // メインのアプリ

// 🏠 HTMLの「root」という場所にアプリを表示する
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
