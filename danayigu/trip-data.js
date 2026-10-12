/* 達娜伊谷一日遊尚未定稿的行程。
 * 只放已確認的名稱，以及明確標成未確認的候選。
 * 不要在這裡補日期、時間、座標、里程或道路能不能走。
 * 不要放試算表網址或管理權杖。導航連結等定稿後再加。
 */
window.DANAYIGU_TRIP = {
  title: "2026 達娜伊谷一日機車小旅行",
  brand: "瓦特鎮家族",
  tagline: "去哪裡？跟家人走就對了！",
  logo: "../logo.png",
  meeting: {
    place: "旗山俗ㄟ碳烤三明治",
    time: null,
    timeText: "尚未確定"
  },
  direction: "逆時鐘",
  destinationName: "達娜伊谷",
  stops: [
    { key: "meet", name: "旗山俗ㄟ碳烤三明治", kind: "集合", status: "name-confirmed" },
    { key: "jiaxian", name: "甲仙", kind: "預定途經", status: "unconfirmed" },
    { key: "chashan", name: "茶山", kind: "預定途經", status: "unconfirmed" },
    { key: "danayigu", name: "達娜伊谷", kind: "主要目的地", status: "name-confirmed" },
    { key: "fanlu", name: "嘉義番路", kind: "預定途經", status: "unconfirmed" },
    { key: "neimen", name: "內門", kind: "預定途經", status: "unconfirmed" }
  ],
  fuelCandidates: [
    { key: "fuel-jiaxian", name: "甲仙", status: "candidate" },
    { key: "fuel-wufeng", name: "吳鳳", status: "candidate" },
    { key: "fuel-nanxi", name: "楠西", status: "candidate" },
    { key: "fuel-neimen", name: "內門", status: "candidate" }
  ],
  excludedReference: "有一張 Google Maps 截圖寫全程約 268 公里、騎乘約 6 小時。那是包含大樹個人往返的參考，不能標成家族共同路線的里程。",
  quickPhrases: [
    { key: "toilet", icon: "🚻", label: "上廁所" },
    { key: "fuel", icon: "⛽", label: "快沒油了" },
    { key: "help", icon: "📞", label: "需要大家幫忙" },
    { key: "rest", icon: "😴", label: "想休息一下" },
    { key: "photo", icon: "📸", label: "想停下來拍照" },
    { key: "drink", icon: "🥤", label: "想買飲料" },
    { key: "wake", icon: "🐔", label: "起床…咕咕咕" }
  ]
};
(function (root) {
  if (!root || !root.DanayiguGuard) return;
  root.DanayiguGuard.claim("trip-data.js", "6d1");
})(typeof window !== "undefined" ? window : null);
