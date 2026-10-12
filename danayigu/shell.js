/* 達娜伊谷六個分頁。
 * 分頁只用 ?tab=。不要讀取或保存 #a= 權杖，也不要把權杖帶到其他分頁。
 * 報到、留言、公告的正式狀態只採用伺服器回應。這個檔案不連線，也不接觸權杖。
 */
(function () {
  var TABS = ["checkin", "journey", "map", "puzzle", "badge", "review"];
  var trip = window.DANAYIGU_TRIP || { stops: [], fuelCandidates: [], quickPhrases: [] };
  var view = {
    checkins: [],
    messages: [],
    announcements: [],
    synced: false,
    stale: false,
    mode: "",
    canPublish: false,
    syncReady: null
  };
  var historyOpen = false;
  var customOpen = false;
  var busy = false;
  var ask = null;
  var messageOutgoing = null;
  var announcementOutgoing = null;

  function family() {
    var cfg = window.DANAYIGU_CONFIG || {};
    return Array.isArray(cfg.family) ? cfg.family : [];
  }

  function clear(node) {
    while (node.firstChild) node.removeChild(node.firstChild);
  }

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  function currentWho() {
    var btn = document.querySelector("#who button[aria-pressed='true']");
    if (!btn || !btn.dataset.sheetId) return null;
    return { id: btn.dataset.sheetId, name: btn.textContent || "" };
  }

  function personName(id) {
    var people = family();
    var i;
    for (i = 0; i < people.length; i++) if (people[i].sheetId === id) return people[i].name;
    return id || "家人";
  }

  function placeStatus(item) {
    if (item.status === "name-confirmed") return "名稱已確認。時間、座標與實際道路都尚未定稿。";
    if (item.status === "candidate") return "規劃候選。尚未定稿，先不導航。";
    return "預定途經。尚未定稿，先不導航。";
  }

  function clock(date) {
    var h = date.getHours();
    var m = date.getMinutes();
    return (h < 10 ? "0" : "") + h + ":" + (m < 10 ? "0" : "") + m;
  }

  function clockMs(ms) {
    var date = new Date(Number(ms) || 0);
    if (!ms || isNaN(date.getTime())) return "";
    return clock(date);
  }

  function requestId() {
    var raw = "r" + Date.now().toString(36) + Math.random().toString(36).replace(/[^a-z0-9]+/g, "");
    if (raw.length < 8) raw += "retryid1";
    return raw.slice(0, 64);
  }

  function timeOf(kind, id) {
    var i;
    for (i = 0; i < view.checkins.length; i++) {
      if (view.checkins[i].personId !== id) continue;
      return Number(kind === "depart" ? view.checkins[i].departedAtMs : view.checkins[i].homeAtMs) || 0;
    }
    return 0;
  }

  function countKind(kind) {
    var n = 0;
    family().forEach(function (person) {
      if (timeOf(kind, person.sheetId)) n += 1;
    });
    return n;
  }

  function setCheckinStatus(text) {
    var node = document.getElementById("checkin-status");
    if (node) node.textContent = text || "";
  }

  function setSayStatus(text) {
    var node = document.getElementById("say-status");
    if (node) node.textContent = text || "";
  }

  function setAnnStatus(text) {
    var node = document.getElementById("ann-status");
    if (node) node.textContent = text || "";
  }

  function hideAsks() {
    ask = null;
    ["depart-ask", "home-ask"].forEach(function (id) {
      var node = document.getElementById(id);
      if (node) node.hidden = true;
    });
  }

  function fillPeople(list, kind) {
    clear(list);
    var onLabel = kind === "depart" ? "已出發" : "已到家";
    family().forEach(function (person) {
      var at = timeOf(kind, person.sheetId);
      var row = el("li", at ? "is-on" : "");
      row.appendChild(el("span", "person", person.name));
      row.appendChild(el("span", "state", at ? onLabel + " " + clockMs(at) : "尚未報到"));
      list.appendChild(row);
    });
  }

  function renderBanners() {
    var checkinBanner = document.getElementById("checkin-banner");
    var journeyBanner = document.getElementById("journey-banner");
    var live = view.mode === "live";
    if (checkinBanner) {
      checkinBanner.textContent = !live
        ? "目前沒有連上。按了也不會報到成功。"
        : (view.syncReady === false
          ? "家族同步尚未開通。報到、留言和公告不會送出。拼圖排行榜仍可使用。"
          : (view.stale
            ? "這次沒有同步到。下面是上次讀到的狀態。"
            : (view.syncReady === true
              ? "報到會和其他手機一起更新。重新整理後會再向伺服器讀取。選擇姓名不是登入。"
              : "正在讀取報到。")));
    }
    if (journeyBanner) {
      journeyBanner.textContent = !live
        ? "行程尚未定稿。目前沒有連上，留言和公告按了也不會送出。"
        : (view.syncReady === false
          ? "行程尚未定稿。家族同步尚未開通，留言和公告不會送出。"
          : "行程尚未定稿。家人想說和公告會和其他手機一起更新。");
    }
  }

  function renderCheckin() {
    var who = currentWho();
    var departCount = document.getElementById("depart-count");
    var homeCount = document.getElementById("home-count");
    var departBtn = document.getElementById("depart-button");
    var homeBtn = document.getElementById("home-button");
    if (!departCount || !departBtn || !homeBtn) return;
    departCount.textContent = "已報到 " + countKind("depart") + "/9";
    homeCount.textContent = "已到家 " + countKind("home") + "/9";
    fillPeople(document.getElementById("depart-list"), "depart");
    fillPeople(document.getElementById("home-list"), "home");
    var departOn = who && timeOf("depart", who.id);
    var homeOn = who && timeOf("home", who.id);
    departBtn.textContent = departOn ? "取消出發報到" : "👋 我到啦！";
    homeBtn.textContent = homeOn ? "取消到家報到" : "🏠 到家啦！";
    departBtn.disabled = busy;
    homeBtn.disabled = busy;
    document.getElementById("checkin-hint").textContent = who
      ? "現在選的是" + who.name + "。送出前會再確認。選名字不是登入。"
      : "請先在上方選擇你是誰。";
    if (view.stale && !busy) setCheckinStatus("這次沒有同步到。下面是上次讀到的狀態。");
    renderBanners();
  }

  function renderSays() {
    var list = document.getElementById("say-list");
    var empty = document.getElementById("say-empty");
    var retry = document.getElementById("say-retry");
    if (!list) return;
    clear(list);
    view.messages.forEach(function (item) {
      var row = el("li");
      row.appendChild(el("div", "say-meta", personName(item.personId) + " · " + clockMs(item.createdAtMs)));
      row.appendChild(el("div", "say-text", item.text));
      list.appendChild(row);
    });
    empty.hidden = view.messages.length > 0;
    document.getElementById("say-custom").hidden = !customOpen;
    if (retry) retry.hidden = !messageOutgoing;
    var send = document.getElementById("say-send");
    if (send) send.disabled = busy;
  }

  function renderAnnouncements() {
    var latest = document.getElementById("ann-latest");
    var history = document.getElementById("ann-history");
    var toggle = document.getElementById("ann-history-toggle");
    var composer = document.getElementById("ann-composer");
    var retry = document.getElementById("ann-retry");
    if (!latest) return;
    clear(latest);
    clear(history);
    if (composer) composer.hidden = !view.canPublish;
    if (!view.announcements.length) {
      latest.appendChild(el("p", "empty-copy", "尚無公告。"));
      toggle.hidden = true;
      history.hidden = true;
    } else {
      var head = view.announcements[0];
      latest.appendChild(el("p", "say-text", head.text));
      latest.appendChild(el("p", "say-meta", personName(head.authorId) + " · " + clockMs(head.createdAtMs)));
      var older = view.announcements.slice(1);
      toggle.hidden = older.length === 0;
      toggle.textContent = historyOpen ? "收合歷史公告" : "查看歷史公告";
      history.hidden = !historyOpen || older.length === 0;
      older.forEach(function (item) {
        var row = el("li");
        row.appendChild(el("div", "say-text", item.text));
        row.appendChild(el("div", "say-meta", personName(item.authorId) + " · " + clockMs(item.createdAtMs)));
        history.appendChild(row);
      });
    }
    if (retry) retry.hidden = !announcementOutgoing || !view.canPublish;
    var send = document.getElementById("ann-send");
    if (send) send.disabled = busy;
  }

  function renderTripLists() {
    var route = document.getElementById("route-list");
    var legs = document.getElementById("leg-list");
    var fuels = document.getElementById("fuel-list");
    var plan = document.getElementById("plan-list");
    var reviewPlan = document.getElementById("review-plan");
    [route, plan, reviewPlan].forEach(function (list) {
      if (!list) return;
      clear(list);
      trip.stops.forEach(function (stop, index) {
        var row = el("li");
        row.appendChild(el("div", "stop-name", (index + 1) + ". " + stop.name));
        row.appendChild(el("div", "stop-kind", stop.kind));
        row.appendChild(el("p", "stop-status", placeStatus(stop)));
        list.appendChild(row);
      });
    });
    if (legs) {
      clear(legs);
      var i;
      for (i = 0; i < trip.stops.length - 1; i += 1) {
        var from = trip.stops[i];
        var to = trip.stops[i + 1];
        var card = el("li", "leg");
        card.appendChild(el("div", "stop-name", from.name + " → " + to.name));
        card.appendChild(el("p", "stop-status", "這一段只是規劃順序，不代表道路已經確認。"));
        var button = el("button", "nav-wait", "地點未定稿，先不導航");
        button.type = "button";
        button.disabled = true;
        card.appendChild(button);
        legs.appendChild(card);
      }
    }
    if (fuels) {
      clear(fuels);
      trip.fuelCandidates.forEach(function (item) {
        var card = el("li", "leg");
        card.appendChild(el("div", "stop-name", item.name));
        card.appendChild(el("p", "stop-status", placeStatus(item)));
        var button = el("button", "nav-wait", "地點未定稿，先不導航");
        button.type = "button";
        button.disabled = true;
        card.appendChild(button);
        fuels.appendChild(card);
      });
    }
  }

  function lineText(node) {
    return node ? String(node.textContent || "").trim() : "";
  }

  function renderMirrors() {
    var ceremony = document.getElementById("ceremony");
    var closed = ceremony && !ceremony.hidden;
    var name3 = lineText(document.getElementById("champ-3-name"));
    var meta3 = lineText(document.getElementById("champ-3-meta"));
    var name4 = lineText(document.getElementById("champ-4-name"));
    var meta4 = lineText(document.getElementById("champ-4-meta"));
    [["badge-champ-3", "review-champ-3", name3, meta3], ["badge-champ-4", "review-champ-4", name4, meta4]].forEach(function (slot) {
      [slot[0], slot[1]].forEach(function (id) {
        var node = document.getElementById(id);
        if (!node) return;
        clear(node);
        if (!closed) {
          node.appendChild(el("p", "stop-status", "晚餐才公布。這裡跟著拼圖分頁的冠軍畫面，不會另外計算。"));
          return;
        }
        node.appendChild(el("p", "champ-name", slot[2] || "本屆從缺"));
        if (slot[3]) node.appendChild(el("p", "stop-status", slot[3]));
      });
    });
    ["review-rank-3", "review-rank-4"].forEach(function (id, index) {
      var target = document.getElementById(id);
      var source = document.getElementById(index === 0 ? "rank-3" : "rank-4");
      if (!target || !source) return;
      clear(target);
      if (!source.children.length) {
        target.appendChild(el("li", "stop-status", "尚無成績"));
        return;
      }
      Array.prototype.forEach.call(source.children, function (item) {
        target.appendChild(el("li", "", item.textContent));
      });
    });
  }

  function show(key, updateUrl) {
    if (TABS.indexOf(key) < 0) key = "checkin";
    TABS.forEach(function (name) {
      var panel = document.getElementById("panel-" + name);
      var button = document.querySelector('.tabbar button[data-tab="' + name + '"]');
      var on = name === key;
      if (panel) panel.hidden = !on;
      if (button) {
        button.classList.toggle("is-active", on);
        if (on) button.setAttribute("aria-current", "page");
        else button.removeAttribute("aria-current");
      }
    });
    if (updateUrl) {
      var url = new URL(location.href);
      url.searchParams.set("tab", key);
      url.searchParams.delete("a");
      url.hash = "";
      try { history.replaceState(null, "", url.pathname + url.search); } catch (err) { /* 分頁網址寫不進去時，畫面仍可切換 */ }
    }
    if (key === "puzzle") {
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          window.dispatchEvent(new Event("resize"));
        });
      });
    }
    if (key === "badge" || key === "review") renderMirrors();
    try {
      window.dispatchEvent(new CustomEvent("danayigu-tab", { detail: { tab: key } }));
    } catch (err) { /* 沒有 CustomEvent 時，拼圖仍會在看得到的時候開始計時 */ }
    window.scrollTo(0, 0);
  }

  function tabFromQuery() {
    var tab = "";
    try { tab = new URLSearchParams(location.search).get("tab") || ""; } catch (err) { tab = ""; }
    return TABS.indexOf(tab) >= 0 ? tab : "";
  }

  function rememberPuzzleTab() {
    setTimeout(function () {
      if (/^#a=/.test(location.hash || "")) return;
      var url = new URL(location.href);
      url.searchParams.set("tab", "puzzle");
      url.searchParams.delete("a");
      url.hash = "";
      try { history.replaceState(null, "", url.pathname + url.search); } catch (err) { /* 保持目前畫面 */ }
    }, 0);
  }

  function requireWho() {
    var who = currentWho();
    if (who) return who;
    setCheckinStatus("請先在上方選擇你是誰。這次沒有送出。");
    setSayStatus("請先在上方選擇你是誰。這則沒有發布。");
    return null;
  }

  function askCopy(who, kind, mode) {
    if (mode === "clear") {
      var which = kind === "depart" ? "出發報到" : "到家報平安";
      return "要取消" + who.name + "的" + which + "嗎？只會清掉這一個時間。";
    }
    if (kind === "depart") return "要幫" + who.name + "出發報到嗎？其他手機也會看到這個名字。選名字不是登入。";
    return "要幫" + who.name + "到家報平安嗎？其他手機也會看到這個名字。選名字不是登入。";
  }

  function syncBlockMessage() {
    var sync = window.danayiguSync;
    if (!sync || sync.mode() !== "live") return "目前沒有連上，這次沒有送出";
    if (sync.syncReady && sync.syncReady() === false) return "家族同步尚未開通，這次沒有送出";
    return "";
  }

  function openAsk(kind) {
    var who = requireWho();
    if (!who || busy) return;
    var blocked = syncBlockMessage();
    if (blocked) {
      setCheckinStatus(blocked + "。報到維持原狀。");
      return;
    }
    var mode = timeOf(kind, who.id) ? "clear" : "set";
    ask = { kind: kind, mode: mode };
    var other = kind === "depart" ? "home" : "depart";
    var otherBox = document.getElementById(other + "-ask");
    if (otherBox) otherBox.hidden = true;
    var text = document.getElementById(kind + "-ask-text");
    var yes = document.getElementById(kind + "-yes");
    var box = document.getElementById(kind + "-ask");
    if (text) text.textContent = askCopy(who, kind, mode);
    if (yes) yes.textContent = mode === "clear" ? "確認取消" : "確認送出";
    if (box) box.hidden = false;
  }

  function confirmAsk() {
    if (busy || !ask) return;
    var who = currentWho();
    var sync = window.danayiguSync;
    var blocked = syncBlockMessage();
    if (!who || blocked) {
      setCheckinStatus((blocked || "目前沒有連上，這次沒有送出") + "。報到維持原狀。");
      return;
    }
    var pending = { kind: ask.kind, mode: ask.mode, id: who.id };
    busy = true;
    renderCheckin();
    setCheckinStatus("正在送出…");
    var call = pending.mode === "clear"
      ? sync.clearCheckin(pending.id, pending.kind)
      : sync.checkin(pending.id, pending.kind);
    call.then(function (data) {
      busy = false;
      renderCheckin();
      if (!data || data.ok !== true) {
        setCheckinStatus(((data && data.error) || "沒有送出") + "。報到維持原狀。");
        return;
      }
      hideAsks();
      if (pending.mode === "clear") setCheckinStatus("已取消。只清掉這一個時間。");
      else setCheckinStatus(data.already ? "已經報到過了，時間沒有改。" : "已送出。其他手機也會看到。");
    }).catch(function () {
      busy = false;
      renderCheckin();
      setCheckinStatus("不確定有沒有送出。請看名單，先不要再按一次。");
    });
  }

  function sendText(text, reuse) {
    if (busy) return;
    var who = requireWho();
    if (!who) return;
    var body = String(text || "").trim();
    if (!body) return;
    if (body.length > 80) {
      setSayStatus("內容太長。這則沒有發布。");
      return;
    }
    var sync = window.danayiguSync;
    var blocked = syncBlockMessage();
    if (blocked) {
      setSayStatus(blocked + "。這則沒有發布。");
      return;
    }
    var key = reuse && messageOutgoing ? messageOutgoing.clientRequestId : requestId();
    messageOutgoing = { text: body, clientRequestId: key };
    busy = true;
    renderSays();
    setSayStatus("正在送出…");
    sync.sendMessage(who.id, body, key).then(function (data) {
      busy = false;
      if (!data || data.ok !== true) {
        messageOutgoing = null;
        renderSays();
        setSayStatus(((data && data.error) || "沒有送出") + "。這則沒有發布。");
        return;
      }
      messageOutgoing = null;
      var input = document.getElementById("say-text");
      if (input) input.value = "";
      customOpen = false;
      renderSays();
      setSayStatus(data.duplicate ? "這次已經送出過，沒有再新增一則。" : "已送出。");
    }).catch(function () {
      busy = false;
      renderSays();
      setSayStatus("不確定有沒有送出。若要再試，會沿用同一次，不會變成兩則。");
    });
  }

  function publishText(text, reuse) {
    if (busy) return;
    var sync = window.danayiguSync;
    var blocked = syncBlockMessage();
    if (blocked) {
      setAnnStatus(blocked + "。這則沒有發布。");
      return;
    }
    if (!sync || !sync.canPublish()) {
      setAnnStatus("沒有管理權限，這則沒有發布。");
      return;
    }
    var who = currentWho();
    var body = String(text || "").trim();
    if (!body) return;
    if (body.length > 120) {
      setAnnStatus("內容太長。這則沒有發布。");
      return;
    }
    var key = reuse && announcementOutgoing ? announcementOutgoing.clientRequestId : requestId();
    announcementOutgoing = { text: body, clientRequestId: key };
    busy = true;
    renderAnnouncements();
    setAnnStatus("正在送出…");
    sync.publish(body, key, who ? who.id : "").then(function (data) {
      busy = false;
      if (!data || data.ok !== true) {
        announcementOutgoing = null;
        renderAnnouncements();
        setAnnStatus(((data && data.error) || "無法發布公告") + "。這則沒有發布。");
        return;
      }
      announcementOutgoing = null;
      var input = document.getElementById("ann-text");
      if (input) input.value = "";
      renderAnnouncements();
      setAnnStatus(data.duplicate ? "這次已經發布過，沒有再新增一則。" : "已發布。");
    }).catch(function () {
      busy = false;
      renderAnnouncements();
      setAnnStatus("不確定有沒有發布。若要再試，會沿用同一次，不會變成兩則。");
    });
  }

  function seenRequest(list, key) {
    var i;
    if (!key) return false;
    for (i = 0; i < list.length; i++) if (list[i].clientRequestId === key) return true;
    return false;
  }

  function applyView(detail) {
    detail = detail || {};
    if (Array.isArray(detail.checkins)) view.checkins = detail.checkins;
    if (Array.isArray(detail.messages)) view.messages = detail.messages;
    if (Array.isArray(detail.announcements)) view.announcements = detail.announcements;
    view.synced = !!detail.synced;
    view.stale = !!detail.stale;
    view.mode = detail.mode || view.mode;
    view.canPublish = !!detail.canPublish;
    if (Object.prototype.hasOwnProperty.call(detail, "syncReady")) view.syncReady = detail.syncReady;
    if (messageOutgoing && seenRequest(view.messages, messageOutgoing.clientRequestId)) {
      messageOutgoing = null;
      setSayStatus("已經在名單上。這則沒有再新增。");
    }
    if (announcementOutgoing && seenRequest(view.announcements, announcementOutgoing.clientRequestId)) {
      announcementOutgoing = null;
      setAnnStatus("已經在公告上。這則沒有再新增。");
    }
    renderCheckin();
    renderSays();
    renderAnnouncements();
  }

  function bind() {
    document.getElementById("depart-button").addEventListener("click", function () { openAsk("depart"); });
    document.getElementById("home-button").addEventListener("click", function () { openAsk("home"); });
    document.getElementById("depart-yes").addEventListener("click", confirmAsk);
    document.getElementById("home-yes").addEventListener("click", confirmAsk);
    document.getElementById("depart-no").addEventListener("click", hideAsks);
    document.getElementById("home-no").addEventListener("click", hideAsks);
    document.getElementById("phrase-grid").addEventListener("click", function (event) {
      var button = event.target.closest("button");
      if (!button) return;
      if (button.dataset.phrase === "custom") {
        customOpen = !customOpen;
        button.classList.toggle("is-open", customOpen);
        renderSays();
        return;
      }
      if (!button.dataset.phrase) return;
      sendText(button.dataset.phrase, false);
    });
    document.getElementById("say-send").addEventListener("click", function () {
      var input = document.getElementById("say-text");
      sendText(input ? input.value : "", false);
    });
    document.getElementById("say-retry").addEventListener("click", function () {
      if (!messageOutgoing) return;
      sendText(messageOutgoing.text, true);
    });
    document.getElementById("ann-history-toggle").addEventListener("click", function () {
      historyOpen = !historyOpen;
      renderAnnouncements();
    });
    document.getElementById("ann-send").addEventListener("click", function () {
      var input = document.getElementById("ann-text");
      publishText(input ? input.value : "", false);
    });
    document.getElementById("ann-retry").addEventListener("click", function () {
      if (!announcementOutgoing) return;
      publishText(announcementOutgoing.text, true);
    });
    document.querySelector(".tabbar").addEventListener("click", function (event) {
      var button = event.target.closest("button");
      if (!button || !button.dataset.tab) return;
      show(button.dataset.tab, true);
    });
    document.addEventListener("click", function (event) {
      var target = event.target;
      if (!target || !target.dataset || !target.dataset.sheetId) return;
      hideAsks();
      renderCheckin();
      var sayHint = document.getElementById("say-hint");
      var who = currentWho();
      if (sayHint) {
        sayHint.textContent = who
          ? "現在選的是" + who.name + "。選名字不是登入。"
          : "請先在上方選擇你是誰。選名字不是登入。";
      }
    });
    window.addEventListener("hashchange", function () {
      if (!/^#a=/.test(location.hash || "")) return;
      show("puzzle", false);
      rememberPuzzleTab();
    });
    window.addEventListener("danayigu-trip", function (event) {
      applyView(event.detail);
    });
    var ceremony = document.getElementById("ceremony");
    if (window.MutationObserver && ceremony) {
      var observer = new MutationObserver(renderMirrors);
      observer.observe(ceremony, { attributes: true, childList: true, subtree: true, characterData: true });
      ["rank-3", "rank-4"].forEach(function (id) {
        var node = document.getElementById(id);
        if (node) observer.observe(node, { childList: true, subtree: true, characterData: true });
      });
    }
  }

  function fillPhrases() {
    var grid = document.getElementById("phrase-grid");
    clear(grid);
    (trip.quickPhrases || []).forEach(function (item) {
      var button = el("button", "", item.icon + " " + item.label);
      button.type = "button";
      button.dataset.phrase = item.icon + " " + item.label;
      grid.appendChild(button);
    });
    var custom = el("button", "", "💬 發訊息");
    custom.type = "button";
    custom.dataset.phrase = "custom";
    grid.appendChild(custom);
  }

  var title = document.getElementById("trip-title");
  var brand = document.getElementById("trip-brand");
  var tagline = document.getElementById("trip-tagline");
  var meetPlace = document.getElementById("meet-place");
  var meetTime = document.getElementById("meet-time");
  var direction = document.getElementById("route-direction");
  var reference = document.getElementById("route-reference");
  if (title && trip.title) title.textContent = trip.title;
  if (brand && trip.brand) brand.textContent = trip.brand;
  if (tagline && trip.tagline) tagline.textContent = trip.tagline;
  if (meetPlace && trip.meeting) meetPlace.textContent = trip.meeting.place;
  if (meetTime && trip.meeting) meetTime.textContent = trip.meeting.timeText;
  if (direction) direction.textContent = "方向：" + (trip.direction || "尚未確定") + "。下面只列出預定順序。";
  if (reference && trip.excludedReference) reference.textContent = trip.excludedReference;

  fillPhrases();
  renderTripLists();
  renderCheckin();
  renderSays();
  renderAnnouncements();
  renderMirrors();
  bind();

  var adminHash = /^#a=/.test(location.hash || "");
  show(adminHash ? "puzzle" : (tabFromQuery() || "checkin"), false);
  if (adminHash) rememberPuzzleTab();
  function syncIdentity() {
    renderCheckin();
    var sayHint = document.getElementById("say-hint");
    var who = currentWho();
    if (sayHint) {
      sayHint.textContent = who
        ? "現在選的是" + who.name + "。選名字不是登入。"
        : "請先在上方選擇你是誰。選名字不是登入。";
    }
    renderMirrors();
  }
  if (document.readyState === "complete") syncIdentity();
  else window.addEventListener("load", syncIdentity);
})();
