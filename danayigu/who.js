/* 達娜伊谷這次開啟要選哪一位家人。
 * 網址有合法的 ?who= 就用那位。沒有 who，才用呼叫端傳來的已儲存代號。
 * 只認 family 裡的 sheetId。儲存與管理權杖由頁面處理，這裡不碰。
 */
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.DanayiguWho = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  function memberIds(family) {
    var ids = [];
    var list = Array.isArray(family) ? family : [];
    var i;
    for (i = 0; i < list.length; i++) {
      var id = list[i] && list[i].sheetId != null ? String(list[i].sheetId) : "";
      if (id && ids.indexOf(id) < 0) ids.push(id);
    }
    return ids;
  }

  function isMember(ids, value) {
    var id = String(value == null ? "" : value);
    return !!id && ids.indexOf(id) >= 0;
  }

  function decodePart(text) {
    var raw = String(text || "").replace(/\+/g, " ");
    try { return decodeURIComponent(raw); } catch (err) { return String(text || ""); }
  }

  function queryWho(search) {
    var q = String(search || "");
    var hash = q.indexOf("#");
    if (hash >= 0) q = q.slice(0, hash);
    if (q.charAt(0) === "?") q = q.slice(1);
    if (!q) return { present: false, value: "" };
    var parts = q.split("&");
    var i;
    for (i = 0; i < parts.length; i++) {
      if (!parts[i]) continue;
      var eq = parts[i].indexOf("=");
      var key = decodePart(eq < 0 ? parts[i] : parts[i].slice(0, eq));
      if (key !== "who") continue;
      var value = eq < 0 ? "" : decodePart(parts[i].slice(eq + 1));
      return { present: true, value: String(value).trim() };
    }
    return { present: false, value: "" };
  }

  function resolve(search, stored, family) {
    var ids = memberIds(family);
    var saved = isMember(ids, stored) ? String(stored) : "";
    var query = queryWho(search);
    if (!query.present) return { id: saved, persist: false };
    if (!isMember(ids, query.value)) return { id: saved, persist: false };
    return { id: query.value, persist: true };
  }

  return { resolve: resolve };
});
