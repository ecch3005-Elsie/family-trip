(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.DanayiguScore = api;
})(typeof window !== "undefined" ? window : globalThis, function () {
  var MIN_MS = 500;
  var MAX_MS = 2 * 60 * 60 * 1000;
  var MAX_MOVES = 5000;

  function isBetterScore(nextMs, nextMoves, prevMs, prevMoves) {
    if (nextMs !== prevMs) return nextMs < prevMs;
    return nextMoves < prevMoves;
  }

  function validateScore(input) {
    var difficulty = Number(input && input.difficulty);
    var elapsedMs = Number(input && input.elapsedMs);
    var moves = Number(input && input.moves);
    if (difficulty !== 3 && difficulty !== 4) return "難度必須是 3×3 或 4×4";
    if (!isFinite(elapsedMs) || Math.round(elapsedMs) !== elapsedMs || elapsedMs < MIN_MS || elapsedMs > MAX_MS) {
      return "完成時間不合理，這次沒有列入排行榜";
    }
    if (!isFinite(moves) || Math.round(moves) !== moves || moves < 1 || moves > MAX_MOVES) {
      return "交換次數不合理，這次沒有列入排行榜";
    }
    return "";
  }

  function rankBoard(rows, difficulty) {
    var list = [];
    var i;
    for (i = 0; i < rows.length; i++) {
      if (Number(rows[i].difficulty) === difficulty) list.push(rows[i]);
    }
    list.sort(function (a, b) {
      if (a.elapsedMs !== b.elapsedMs) return a.elapsedMs - b.elapsedMs;
      if (a.moves !== b.moves) return a.moves - b.moves;
      if (a.personId < b.personId) return -1;
      if (a.personId > b.personId) return 1;
      return 0;
    });
    return list;
  }

  function mergeBoards(prev, incoming) {
    var map = {};
    function put(row) {
      if (!row) return;
      var personId = String(row.personId || "");
      var difficulty = Number(row.difficulty);
      var elapsedMs = Number(row.elapsedMs);
      var moves = Number(row.moves);
      if (!personId || (difficulty !== 3 && difficulty !== 4)) return;
      if (!isFinite(elapsedMs) || !isFinite(moves)) return;
      var next = { personId: personId, difficulty: difficulty, elapsedMs: elapsedMs, moves: moves };
      var key = personId + ":" + difficulty;
      var cur = map[key];
      if (!cur || isBetterScore(next.elapsedMs, next.moves, cur.elapsedMs, cur.moves)) map[key] = next;
    }
    var i;
    var lists = [prev || [], incoming || []];
    var n;
    for (n = 0; n < lists.length; n++) {
      for (i = 0; i < lists[n].length; i++) put(lists[n][i]);
    }
    var out = [];
    var key;
    for (key in map) {
      if (Object.prototype.hasOwnProperty.call(map, key)) out.push(map[key]);
    }
    return out;
  }

  return {
    MIN_MS: MIN_MS,
    MAX_MS: MAX_MS,
    isBetterScore: isBetterScore,
    validateScore: validateScore,
    rankBoard: rankBoard,
    mergeBoards: mergeBoards
  };
});
(function (root) {
  if (!root || !root.DanayiguGuard) return;
  root.DanayiguGuard.claim("score.js", "6d2");
})(typeof window !== "undefined" ? window : null);
