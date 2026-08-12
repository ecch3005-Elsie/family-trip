// ==================================================
// 母版 — 明年可沿用（改 config.trip2027.js 即可）
// ==================================================
const COLORS = {
  deepGreen: "#1F4A3D",
  plantGreen: "#4C8763",
  gold: "#E8B34A",
  warmWhite: "#FBF6EC",
  cream: "#F3E9D2",
  orange: "#E4732C",
  red: "#C24A3B",
  ink: "#26332C",
};

const FAMILY = [
  { id: 1, name: "Walter", initial: "W", sheetId: "walter" },
  { id: 2, name: "文", initial: "文", sheetId: "wen" },
  { id: 3, name: "艷", initial: "艷", sheetId: "yan" },
  { id: 4, name: "Money", initial: "M", sheetId: "money" },
  { id: 5, name: "享", initial: "享", sheetId: "xiang" },
  { id: 6, name: "心", initial: "心", sheetId: "xin" },
  { id: 7, name: "肉粽", initial: "肉", sheetId: "rouzong" },
  { id: 8, name: "庭", initial: "庭", sheetId: "ting" },
  { id: 9, name: "呈", initial: "呈", sheetId: "cheng" },
];

const TASK_DEFS = [
  { key: "photo", label: "家族合照", icon: "📸", doneLabel: "家族合照完成", cta: "📸 我們拍好了！" },
  { key: "food", label: "今日美食", icon: "🍜", doneLabel: "今日美食完成", cta: "🍜 吃飽啦！" },
  { key: "dayComplete", label: "完成今日行程", icon: "🌄", doneLabel: "今日行程完成", cta: "🌄 完成啦！" },
  { key: "safeArrival", label: "平安抵達住宿", icon: "🏠", doneLabel: "平安抵達住宿", cta: "🏠 平安抵達！" },
];

const FEEDBACK_TYPES = [
  { key: "toilet", label: "上廁所", icon: "🚻" },
  { key: "fuel", label: "快沒油了", icon: "⛽" },
  { key: "help", label: "需要大家幫忙", icon: "📞" },
  { key: "rest", label: "想休息一下", icon: "😴" },
  { key: "photo", label: "想停下來拍照", icon: "📸" },
  { key: "drink", label: "想買飲料", icon: "🥤" },
];

const SAFETY_TIPS = [
  "🪖 安全帽戴好", "🧥 備好兩件式雨衣", "🌧️ 山區可能下雨",
  "⛽ 確認油量", "🏍️ 保持車距", "❤️ 不趕路，平安最重要",
];

const WEATHER_CODE_MAP = {
  0: { icon: "☀️", label: "晴朗" },
  1: { icon: "🌤️", label: "大致晴朗" },
  2: { icon: "⛅", label: "多雲" },
  3: { icon: "☁️", label: "陰天" },
  45: { icon: "🌫️", label: "有霧" },
  48: { icon: "🌫️", label: "有霧" },
  51: { icon: "🌦️", label: "小毛毛雨" },
  53: { icon: "🌦️", label: "毛毛雨" },
  55: { icon: "🌦️", label: "大毛毛雨" },
  61: { icon: "🌧️", label: "小雨" },
  63: { icon: "🌧️", label: "中雨" },
  65: { icon: "🌧️", label: "大雨" },
  66: { icon: "🌧️", label: "凍雨" },
  67: { icon: "🌧️", label: "強凍雨" },
  71: { icon: "🌨️", label: "小雪" },
  73: { icon: "🌨️", label: "中雪" },
  75: { icon: "🌨️", label: "大雪" },
  80: { icon: "🌦️", label: "短暫陣雨" },
  81: { icon: "🌧️", label: "陣雨" },
  82: { icon: "⛈️", label: "強陣雨" },
  95: { icon: "⛈️", label: "雷雨" },
  96: { icon: "⛈️", label: "雷雨挾冰雹" },
  99: { icon: "⛈️", label: "強雷雨挾冰雹" },
};

const SECTION_TITLE = { fontSize: 16, fontWeight: 700, color: "#8A7A5C" };
const PAGE_TITLE = { fontSize: 17, fontWeight: 800, color: COLORS.deepGreen };

function makeAnnouncementLevels(colors) {
  return {
    normal: { label: "一般", color: colors.plantGreen, bg: "#E4F1E1" },
    important: { label: "重要", color: "#B8861F", bg: "#FBF0D6" },
    urgent: { label: "緊急", color: colors.red, bg: "#F8E0DB" },
  };
}

function makeAchievementDefs() {
  return [
    { key: "allGather", label: "全員到齊", icon: "🎉", check: (ctx) => ctx.checkedCount === 9 },
    { key: "together", label: "全家一起出發", icon: "❤️", check: (ctx) => ctx.progress.currentStop >= 0 },
    { key: "firstStop", label: "第一站抵達", icon: "🏍️", check: (ctx) => ctx.progress.currentStop >= 1 },
    { key: "photo", label: "家族合照", icon: "📸", check: (ctx) => ctx.trip.tasks.photo },
    { key: "food", label: "今日美食", icon: "🍜", check: (ctx) => ctx.trip.tasks.food },
    { key: "dayComplete", label: "今日旅程完成", icon: "🌄", check: (ctx) => ctx.trip.tasks.dayComplete },
    { key: "safeArrival", label: "平安投宿", icon: "🏠", check: (ctx) => ctx.trip.tasks.safeArrival },
    { key: "allHome", label: "全員到家", icon: "🌙", check: (ctx) => ctx.arrivedHomeCount === 9 },
    { key: "star", label: "今日之星", icon: "⭐", check: (ctx) => ctx.day1Result && ctx.day1Result.starPersonId === ctx.mySheetId },
  ];
}
