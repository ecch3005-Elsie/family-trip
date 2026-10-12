/* 只給 /entry-preview/index.html 使用。
 * 測試入口比正式入口深一層，所以 tripRoot 是 "../"，home 是 "../entry-preview/"。
 * 不要把這一檔接到根目錄入口、達娜伊谷或雲林。
 */
(function (root, factory) {
  var config = factory();
  if (typeof module === "object" && module.exports) module.exports = config;
  if (root) root.FAMILY_TRIP_ENTRY = config;
})(typeof window !== "undefined" ? window : null, function () {
  return {
    version: "6g1-preview",
    name: "瓦特鎮家族",
    home: "../entry-preview/",
    tripRoot: "../",
    current: "danayigu",
    trips: [
      { id: "danayigu", path: "danayigu/", historical: false },
      { id: "yunlin", path: "yunlin/", historical: true }
    ]
  };
});
