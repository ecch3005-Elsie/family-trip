/* 同一版頁面與腳本的核對。
 * 網址上的 build 只能讓瀏覽器少拿舊快取。伺服器同一個路徑仍只有一份檔案，
 * 所以這裡用版本字與必要檔案是否報到，決定能不能操作。
 */
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root && root.document && root.document.documentElement) {
    root.DanayiguGuard = api.open(function () {
      return root.document.documentElement.getAttribute("data-build") || "";
    });
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  var BUILD = "6d1";
  var FILES = ["score.js", "config.js", "trip-data.js", "clock.js", "who.js", "checkin-view.js", "shell.js", "page"];

  function firstMissing(ids, has) {
    var list = ids || [];
    var i;
    for (i = 0; i < list.length; i++) {
      if (!has || !has(list[i])) return list[i];
    }
    return "";
  }

  function open(readBuild) {
    var claims = {};
    var failed = false;
    var shown = false;

    function pageBuild() {
      try { return readBuild ? String(readBuild() || "") : ""; }
      catch (err) { return ""; }
    }

    function claimed(name) {
      return claims[name] === BUILD;
    }

    function priorsReady(build) {
      var i;
      if (failed || build !== BUILD || pageBuild() !== BUILD) return false;
      for (i = 0; i < FILES.length; i++) {
        if (FILES[i] === "page") continue;
        if (!claimed(FILES[i])) return false;
      }
      return true;
    }

    function accepted() {
      var i;
      if (failed || pageBuild() !== BUILD) return false;
      for (i = 0; i < FILES.length; i++) if (!claimed(FILES[i])) return false;
      return true;
    }

    return {
      build: BUILD,
      files: FILES.slice(),
      claim: function (name, build) {
        if (failed || build !== BUILD || pageBuild() !== BUILD) {
          failed = true;
          return false;
        }
        claims[name] = BUILD;
        return true;
      },
      fail: function () {
        failed = true;
        shown = true;
        return false;
      },
      readyForPage: priorsReady,
      accepted: accepted,
      allowPost: function () { return accepted(); },
      shown: function () { return shown; },
      markShown: function () { shown = true; }
    };
  }

  return { BUILD: BUILD, FILES: FILES.slice(), firstMissing: firstMissing, open: open };
});
