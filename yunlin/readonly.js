/* 雲林封存只讀。擋下寫入，保留 GET。不改身分儲存。
 */
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root && root.document) api.install(root);
})(typeof window !== "undefined" ? window : null, function () {
  function methodOf(input, init) {
    if (init && init.method) return String(init.method).toUpperCase();
    if (input && typeof input === "object" && input.method) return String(input.method).toUpperCase();
    return "GET";
  }

  function install(root) {
    if (!root || root.YUNLIN_READONLY) return root;
    var native = typeof root.fetch === "function" ? root.fetch.bind(root) : null;
    root.YUNLIN_READONLY = true;
    root.fetch = function (input, init) {
      var method = methodOf(input, init);
      if (method !== "GET" && method !== "HEAD") {
        return Promise.reject(new Error("雲林歷史回顧是唯讀，不會寫入"));
      }
      if (!native) return Promise.reject(new Error("雲林歷史回顧是唯讀，不會寫入"));
      return native(input, init);
    };
    return root;
  }

  function homePath() {
    var config = window.FAMILY_TRIP_ENTRY;
    var api = window.FamilyTripEntry;
    return api && api.safeHome ? api.safeHome(config && config.home) : "";
  }

  function goHome(event) {
    var home = homePath();
    if (!home) {
      if (event) event.preventDefault();
      return;
    }
    if (event && event.currentTarget && event.currentTarget.setAttribute) {
      event.currentTarget.setAttribute("href", home);
    }
  }

  function wire() {
    var button = document.getElementById("family-home");
    if (!button || button.getAttribute("data-wired") === "1") return;
    var home = homePath();
    if (home) button.setAttribute("href", home);
    button.setAttribute("data-wired", "1");
    button.addEventListener("click", goHome);
  }

  if (typeof document !== "undefined") {
    wire();
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", wire);
  }

  return { install: install };
});
