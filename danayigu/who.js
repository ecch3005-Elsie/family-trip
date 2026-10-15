/* 這次開啟要顯示哪一位家人。
 * 呼叫端傳入永久身分、舊身分與網址。這裡只判斷，不碰儲存，也不碰管理權杖。
 * 兩個有效身分不同時，不替任何人做決定，也不要求寫入。
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

  function noWrites() {
    return { permanent: "", legacy: "" };
  }

  function unique(list) {
    var out = [];
    var i;
    for (i = 0; i < list.length; i++) {
      if (list[i] && out.indexOf(list[i]) < 0) out.push(list[i]);
    }
    return out;
  }

  function ready(id, writes) {
    return { mode: "ready", id: id, writes: writes || noWrites(), options: [id] };
  }

  function choose() {
    return { mode: "choose", id: "", writes: noWrites(), options: [] };
  }

  function confirm(options) {
    return { mode: "confirm", id: "", writes: noWrites(), options: unique(options) };
  }

  function fromStored(permanent, legacy) {
    if (permanent && legacy && permanent !== legacy) return confirm([permanent, legacy]);
    if (permanent) return ready(permanent);
    if (legacy) return ready(legacy, { permanent: legacy, legacy: "" });
    return choose();
  }

  function decide(input) {
    var source = input || {};
    var ids = memberIds(source.family);
    var permanent = isMember(ids, source.permanent) ? String(source.permanent) : "";
    var legacy = isMember(ids, source.legacy) ? String(source.legacy) : "";
    var query = queryWho(source.search);
    var queryValid = query.present && isMember(ids, query.value);
    var queryId = queryValid ? String(query.value) : "";
    var writes;

    if (query.present && !queryValid) {
      var blocked = fromStored(permanent, legacy);
      blocked.writes = noWrites();
      return blocked;
    }

    if (queryValid) {
      var options = unique([permanent, legacy, queryId]);
      if (options.length > 1) return confirm(options);
      writes = noWrites();
      if (!permanent) writes.permanent = queryId;
      if (!legacy) writes.legacy = queryId;
      return ready(queryId, writes);
    }

    return fromStored(permanent, legacy);
  }

  function resolve(searchOrInput, stored, family) {
    if (searchOrInput && typeof searchOrInput === "object") return decide(searchOrInput);
    return decide({ search: searchOrInput, permanent: "", legacy: stored, family: family });
  }

  return { resolve: resolve };
});
(function (root) {
  if (!root || !root.DanayiguGuard) return;
  root.DanayiguGuard.claim("who.js", "6d4");
})(typeof window !== "undefined" ? window : null);
