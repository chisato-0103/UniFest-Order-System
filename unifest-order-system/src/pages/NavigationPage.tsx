// 🧭 お客さん用のメニューページ
// お客さんが最初に見る画面で、「注文する」「注文状況を見る」などのボタンがあります

import React from "react"; // Reactの基本道具
import CustomerNavigation from "../components/CustomerNavigation"; // お客さん用ナビゲーション部品

// 📄 ナビゲーションページの部品
const NavigationPage: React.FC = () => {
  // お客さん用ナビゲーション部品をそのまま表示する
  return <CustomerNavigation />;
};

export default NavigationPage;
