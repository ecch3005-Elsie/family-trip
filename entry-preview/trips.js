/* 瓦特鎮家族正式入口的旅行清單。
 * 這一檔給 /family-trip/index.html、達娜伊谷與雲林共用。
 * tripRoot 是 "./"，所以根目錄入口會進到 /family-trip/danayigu/。
 * home 是 "../index.html"，所以各旅行資料夾會回到 /family-trip/index.html。
 * /entry-preview/ 的測試頁不讀這一檔，改讀 trips.preview.js。
 * 下一趟只改 current，並在 trips 增加一筆 id 與 path。
 * 這裡不放身分、管理權杖或試算表網址。
 */
(function (root, factory) {
  var config = factory();
  if (typeof module === "object" && module.exports) module.exports = config;
  if (root) root.FAMILY_TRIP_ENTRY = config;
})(typeof window !== "undefined" ? window : null, function () {
  return {
    version: "6g1",
    name: "瓦特鎮家族",
    home: "../index.html",
    tripRoot: "./",
    current: "danayigu",
    trips: [
      { id: "danayigu", path: "danayigu/", historical: false },
      { id: "yunlin", path: "yunlin/", historical: true }
    ]
  };
});
