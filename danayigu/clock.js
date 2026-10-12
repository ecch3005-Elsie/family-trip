/* 拼圖計時。開始前是 0。開始後只看實際經過的時間，沒有暫停。 */
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.DanayiguClock = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  function fresh() {
    return { clockOn: false, startedAt: 0, stoppedAt: null };
  }

  function elapsed(state, now) {
    if (!state || !state.clockOn || !state.startedAt) return 0;
    var end = state.stoppedAt == null ? now : state.stoppedAt;
    return Math.max(0, end - state.startedAt);
  }

  function begin(state, now) {
    if (!state || state.clockOn || state.stoppedAt != null) return state;
    state.clockOn = true;
    state.startedAt = now;
    return state;
  }

  function stop(state, now) {
    if (!state || !state.clockOn || state.stoppedAt != null) return state;
    state.stoppedAt = now;
    return state;
  }

  function reset(state) {
    state.clockOn = false;
    state.startedAt = 0;
    state.stoppedAt = null;
    return state;
  }

  return { fresh: fresh, elapsed: elapsed, begin: begin, stop: stop, reset: reset };
});
(function (root) {
  if (!root || !root.DanayiguGuard) return;
  root.DanayiguGuard.claim("clock.js", "6d2");
})(typeof window !== "undefined" ? window : null);
