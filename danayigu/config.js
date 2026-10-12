/* 達娜伊谷一日遊的資料來源。
 * webappUrl 保持空白，直到另行建立新的 Google 試算表並部署新的網頁應用程式。
 * 不要填入雲林旅行的網址。這個頁面不會讀取雲林試算表。
 * 不要把管理者連結或權杖寫進這個檔案。權杖只放在達娜伊谷 Apps Script 的指令碼屬性。
 * reviewUnlockAt 與 feedbackQuestions 只先留位置，這一個階段不使用。
 */
window.DANAYIGU_CONFIG = {
  tripId: "danayigu",
  title: "達娜伊谷一日遊",
  webappUrl: "https://script.google.com/macros/s/AKfycbxEnkwjZBpjDDxqTwbnoBoQ4GL07wFmNYj4tJBJBsMi8vd_Uid0kC6LG7ooZWNJwjWRJg/exec",
  pollMs: 4000,
  photo: "test-image.png",
  blockedWebappMarks: [
    "AKfycbzeocoHvNHF4HRVwGSf_wGYs_R_lKsNsAHy_thyvrXwEwERdDcjfNTWAIGhNSfVUo8-cA"
  ],
  family: [
    { id: 1, name: "Walter", initial: "W", sheetId: "walter" },
    { id: 2, name: "文", initial: "文", sheetId: "wen" },
    { id: 3, name: "艷", initial: "艷", sheetId: "yan" },
    { id: 4, name: "Money", initial: "M", sheetId: "money" },
    { id: 5, name: "享", initial: "享", sheetId: "xiang" },
    { id: 6, name: "心", initial: "心", sheetId: "xin" },
    { id: 7, name: "肉粽", initial: "肉", sheetId: "rouzong" },
    { id: 8, name: "庭", initial: "庭", sheetId: "ting" },
    { id: 9, name: "呈", initial: "呈", sheetId: "cheng" }
  ],
  reviewUnlockAt: "",
  feedbackQuestions: []
};
(function (root) {
  if (!root || !root.DanayiguGuard) return;
  root.DanayiguGuard.claim("config.js", "6d2");
})(typeof window !== "undefined" ? window : null);
