/* 2026/12/26 達娜伊谷一日遊的正式停靠順序。
 * 導航只用已在 Google 地圖核對過的店名、地址或地點編號。
 * 不放座標、里程、行車時間或道路名稱。
 * 茶山、楠西不在這次導航裡。
 * 不要放試算表網址或管理權杖。
 */
window.DANAYIGU_TRIP = {
  title: "2026 達娜伊谷一日機車小旅行",
  brand: "瓦特鎮家族",
  tagline: "去哪裡？跟家人走就對了！",
  logo: "../logo.png",
  dateText: "2026/12/26（六）",
  rideNote: "Google 地圖可能用汽車路線。出發前請確認機車可以走。",
  meeting: {
    place: "好食包",
    address: "高雄市旗山區瑞吉里中正路500號",
    time: null,
    timeText: "尚未確定",
    navQuery: "好食包 高雄市旗山區瑞吉里中正路500號",
    navReady: true
  },
  direction: "旗山集合，晚餐後各自返家",
  destinationName: "達娜伊谷",
  fullRouteReady: false,
  stops: [
    {
      key: "meet",
      name: "好食包",
      kind: "集合出發",
      status: "confirmed",
      address: "高雄市旗山區瑞吉里中正路500號",
      navQuery: "好食包 高雄市旗山區瑞吉里中正路500號",
      navReady: true
    },
    {
      key: "jiaxian",
      name: "台灣中油甲仙站",
      kind: "加油站",
      status: "required",
      address: "高雄市甲仙區新興路55號",
      navQuery: "台灣中油 甲仙站(直營、自助、充氣)",
      placeId: "ChIJowIdYIRebjQRAegrfI4_bso",
      navReady: true
    },
    {
      key: "danayigu",
      name: "達娜伊谷",
      kind: "主要景點",
      status: "confirmed",
      address: "嘉義縣阿里山鄉山美村3鄰51號",
      navQuery: "達娜伊谷自然生態公園 嘉義縣阿里山鄉山美村3鄰51號",
      navReady: true
    },
    {
      key: "houke",
      name: "手工窯烤麵包－厚殼仔",
      kind: "美食停靠",
      status: "confirmed",
      address: "嘉義縣番路鄉公田路口",
      navQuery: "手工窯烤麵包-厚殼仔 嘉義縣番路鄉公田路口",
      navReady: true
    },
    {
      key: "wufeng",
      name: "台灣中油吳鳳站",
      kind: "加油站",
      status: "required",
      address: "嘉義縣中埔鄉檨仔林110號",
      navQuery: "台灣中油 吳鳳站 嘉義縣中埔鄉檨仔林110號",
      navReady: true
    },
    {
      key: "neimen",
      name: "台灣中油內門站",
      kind: "加油站",
      status: "required",
      address: "高雄市內門區南屏路125號",
      navQuery: "台灣中油 內門站(直營、自助、充氣) 高雄市內門區觀亭里南屏路125號",
      navReady: true
    },
    {
      key: "dinner",
      name: "里港・飽渴夢餐酒館",
      kind: "晚餐／最後一站",
      status: "tentative",
      address: "屏東縣里港鄉港路162號",
      navQuery: "飽渴夢Restaurant 905屏東縣里港鄉港路162號",
      navReady: true
    }
  ],
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
  root.DanayiguGuard.claim("trip-data.js", "6d2");
})(typeof window !== "undefined" ? window : null);
