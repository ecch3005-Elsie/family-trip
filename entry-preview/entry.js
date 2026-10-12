/* 依旅行清單決定要前往的站內頁面。
 * 不讀寫身分，不轉送管理權杖，也不接受網址裡的外部目的地。
 */
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.FamilyTripEntry = api;
})(typeof window !== "undefined" ? window : null, function () {
  var MEMBERS = ["walter", "wen", "yan", "money", "xiang", "xin", "rouzong", "ting", "cheng"];

  function decodePart(text) {
    try {
      return decodeURIComponent(String(text || "").replace(/\+/g, " "));
    } catch (err) {
      return "";
    }
  }

  function queryValue(search, name) {
    var q = String(search || "");
    var hash = q.indexOf("#");
    if (hash >= 0) q = q.slice(0, hash);
    if (q.charAt(0) === "?") q = q.slice(1);
    if (!q) return "";
    var parts = q.split("&");
    var i;
    for (i = 0; i < parts.length; i++) {
      if (!parts[i]) continue;
      var eq = parts[i].indexOf("=");
      var key = decodePart(eq < 0 ? parts[i] : parts[i].slice(0, eq));
      if (key !== name) continue;
      return eq < 0 ? "" : decodePart(parts[i].slice(eq + 1)).trim();
    }
    return "";
  }

  function safeId(value) {
    var id = String(value || "");
    return /^[a-z0-9][a-z0-9-]*$/.test(id) ? id : "";
  }

  function safePath(value) {
    var path = String(value || "");
    return /^[a-z0-9][a-z0-9-]*\/$/.test(path) ? path : "";
  }

  function safeTripRoot(value) {
    if (value == null) return "../";
    var path = String(value);
    if (path === "" || path === "./" || path === "../") return path;
    return null;
  }

  function safeHome(value) {
    var path = String(value || "");
    if (path.indexOf("\\") >= 0 || path.indexOf("//") >= 0 || path.indexOf(":") >= 0) return "";
    if (path === "../") return path;
    if (path === "../index.html") return path;
    return /^\.\.\/[a-z0-9][a-z0-9-]*\/$/.test(path) ? path : "";
  }

  function findTrip(trips, id) {
    var wanted = safeId(id);
    var list = Array.isArray(trips) ? trips : [];
    var i;
    if (!wanted) return null;
    for (i = 0; i < list.length; i++) {
      if (list[i] && safeId(list[i].id) === wanted && safePath(list[i].path)) return list[i];
    }
    return null;
  }

  function memberId(value) {
    var id = String(value || "");
    return MEMBERS.indexOf(id) >= 0 ? id : "";
  }

  function resolve(input) {
    var source = input || {};
    var config = source.config || {};
    var search = String(source.search || "");
    var requested = queryValue(search, "trip");
    var known = findTrip(config.trips, requested);
    var trip = known || findTrip(config.trips, config.current);
    var reason = known ? "chosen" : (requested ? "unknown-trip" : "current");
    var path = trip ? safePath(trip.path) : "";
    var tripRoot = safeTripRoot(config.tripRoot);
    var who = memberId(queryValue(search, "who"));
    var href = "";
    if (!trip || !path || tripRoot == null) {
      return { ok: false, href: "", tripId: "", who: "", historical: false, reason: trip ? "bad-path" : "no-trip" };
    }
    href = tripRoot + path;
    if (who) href += "?who=" + who;
    return {
      ok: true,
      href: href,
      tripId: safeId(trip.id),
      who: who,
      historical: !!trip.historical,
      reason: reason
    };
  }

  return { resolve: resolve, members: MEMBERS.slice(), safeHome: safeHome, safeTripRoot: safeTripRoot };
});
