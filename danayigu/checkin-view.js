/* 達娜伊谷報到頁的畫面狀態。
 * 只算人數、圓環、按鈕文字和同步說法。不連線，也不讀寫報到紀錄。
 */
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.DanayiguCheckin = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  var TOTAL = 9;
  var RADIUS = 54;

  function countOf(value) {
    var n = Number(value);
    if (!isFinite(n) || n < 0) n = 0;
    if (n > TOTAL) n = TOTAL;
    return Math.floor(n);
  }

  function gaugeFace(count) {
    var n = countOf(count);
    var circ = 2 * Math.PI * RADIUS;
    return {
      count: n,
      total: TOTAL,
      label: n + "/" + TOTAL,
      dash: circ * (n / TOTAL),
      rest: circ
    };
  }

  function blockFace(count, kind, selfOn) {
    var gauge = gaugeFace(count);
    var home = kind === "home";
    var all = gauge.count === TOTAL;
    var remain = all
      ? (home ? "🎉 全員到家，平安旅程圓滿完成！" : "🎉 全員到齊，準備出發！")
      : ("還有 " + (TOTAL - gauge.count) + " 位家人" + (home ? "尚未到家" : "尚未抵達"));
    var button = selfOn
      ? (home ? "✓ 已到家" : "✓ 已報到")
      : (home ? "🏠 到家啦！" : "👋 我到啦！");
    return {
      count: gauge.count,
      total: TOTAL,
      label: gauge.label,
      dash: gauge.dash,
      rest: gauge.rest,
      all: all,
      remain: remain,
      button: button,
      done: !!selfOn
    };
  }

  function avatarFace(initial, on, self) {
    var text = initial == null ? "" : String(initial);
    return {
      initial: text,
      on: !!on,
      self: !!self,
      long: text.length > 1,
      mark: on ? "✓" : "⋯"
    };
  }

  function syncFace(state) {
    state = state || {};
    if (!state.mode) return { ok: false, tone: "wait", text: "正在讀取報到" };
    if (state.mode !== "live") return { ok: false, tone: "error", text: "目前沒有連上，這次沒有同步" };
    if (state.syncReady === false) return { ok: false, tone: "error", text: "家族同步尚未開通，這次沒有同步" };
    if (state.stale) return { ok: false, tone: "error", text: "同步失敗，稍後自動重試" };
    if (state.syncReady === true && state.synced) return { ok: true, tone: "ok", text: "🟢 已同步" };
    return { ok: false, tone: "wait", text: "正在讀取報到" };
  }

  return {
    gaugeFace: gaugeFace,
    blockFace: blockFace,
    avatarFace: avatarFace,
    syncFace: syncFace
  };
});
(function (root) {
  if (!root || !root.DanayiguGuard) return;
  root.DanayiguGuard.claim("checkin-view.js", "6d3");
})(typeof window !== "undefined" ? window : null);
