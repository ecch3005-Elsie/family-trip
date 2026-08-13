// ==================================================
// 2026 雲林小旅行 — 這次限定設定
// ==================================================
const TRIP = {
  year: 2026,
  title: "2026 雲林二日機車小旅行",
  subtitle1: "瓦特鎮家族",
  subtitle2: "去哪裡? 跟家人走就對了!",
  meeting: { place: "旗山早餐店", time: "上午 8:30" },
  webappUrl:
    "https://script.google.com/macros/s/AKfycbzeocoHvNHF4HRVwGSf_wGYs_R_lKsNsAHy_thyvrXwEwERdDcjfNTWAIGhNSfVUo8-cA/exec",
  pollMs: 4000,
  // Day 1 猜謎：總公里累計到茗鎮民宿（stop id = 3）
  day1AccommodationStopId: 3,
  day1AccommodationName: "茗鎮民宿",
  qishanLat: 22.8724,
  qishanLng: 120.4297,
  stops: [
    { id: 0, day: 1, time: "09:10", name: "台3線出發" },
    { id: 1, day: 1, time: "11:30", name: "伯恭甕缸雞" },
    { id: 2, day: 1, time: "14:30", name: "古坑好農", note: "時間彈性" },
    { id: 3, day: 1, time: "16:00", name: "茗鎮民宿" },
    { id: 4, day: 1, time: "16:30", name: "華山咖啡大街" },
    { id: 5, day: 1, time: "18:00", name: "華山會館" },
    { id: 6, day: 2, time: "09:30", name: "民宿出發" },
    { id: 7, day: 2, time: "10:20", name: "五元兩角" },
    { id: 8, day: 2, time: "11:30", name: "雲嶺之丘" },
    { id: 9, day: 2, time: "12:00", name: "午餐" },
    { id: 10, day: 2, time: "13:30", name: "草嶺下山" },
    { id: 11, day: 2, time: "約17:00", name: "抵達永康" },
    { id: 12, day: 2, time: "17:30", name: "東悅坊慶功宴" },
    { id: 13, day: 2, time: "約19:00", name: "台南組解散" },
    { id: 14, day: 2, time: "約20:00", name: "萬丹解散" },
    { id: 15, day: 2, time: "約20:30後", name: "高雄各組返家" },
  ],
  // 地圖分頁：名稱對應 stops，僅在有 lat/lng 時設 configured: true
  // 若要新增地點座標，在對應 stop 加上 lat、lng 後將 configured 改為 true
  locations: [
    {
      type: "集合地點", icon: "📍", stopId: null,
      name: "旗山早餐店", desc: "8:30 準時集合，記得吃早餐再出發！",
      configured: true, lat: 22.8724, lng: 120.4297,
    },
    {
      type: "景點", icon: "🌿", stopId: 2,
      name: "古坑好農", desc: "Day 1 · 14:30（時間彈性）",
      configured: false,
    },
    {
      type: "餐廳", icon: "🍜", stopId: 1,
      name: "伯恭甕缸雞", desc: "Day 1 · 11:30",
      configured: false,
    },
    {
      type: "住宿", icon: "🏠", stopId: 3,
      name: "茗鎮民宿", desc: "Day 1 · 16:00 住宿",
      configured: false,
    },
    {
      type: "下一站", icon: "🏍️", dynamicNext: true,
      name: "", desc: "依旅程進度顯示下一站",
      configured: false,
    },
  ],
  bannerTip: "中秋連假機車小旅行，記得帶好安全帽和防曬，路上互相照應喔！",
};

const WEBAPP_URL = TRIP.webappUrl;
const POLL_MS = TRIP.pollMs;
const STOPS = TRIP.stops;
const LOCATIONS = TRIP.locations;
const QISHAN_LAT = TRIP.qishanLat;
const QISHAN_LNG = TRIP.qishanLng;
const DAY1_ACCOMMODATION_STOP_ID = TRIP.day1AccommodationStopId;
const DEFAULT_PROGRESS = { currentStop: -1 };
const DEFAULT_TRIP = {
  tasks: { photo: false, food: false, dayComplete: false, safeArrival: false },
  announcements: [],
};
const ANNOUNCEMENT_LEVELS = makeAnnouncementLevels(COLORS);
const ACHIEVEMENT_DEFS = makeAchievementDefs();
