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
  var annFormOpen = false;
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
    if (item.status === "required") return "必停加油";
    if (item.status === "tentative") return "晚餐暫定";
    if (item.status === "confirmed") return "已確認";
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

  function svgCircle(stroke, progress) {
    var node = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    node.setAttribute("cx", "66");
    node.setAttribute("cy", "66");
    node.setAttribute("r", "54");
    node.setAttribute("fill", "none");
    node.setAttribute("stroke", stroke);
    node.setAttribute("stroke-width", "12");
    if (progress) {
      node.setAttribute("stroke-linecap", "round");
      node.setAttribute("stroke-dasharray", progress.dash + " " + progress.rest);
      node.setAttribute("transform", "rotate(-90 66 66)");
    }
    return node;
  }

  function paintGauge(host, face, label) {
    clear(host);
    var wrap = el("div", "gauge");
    var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", "132");
    svg.setAttribute("height", "132");
    svg.setAttribute("viewBox", "0 0 132 132");
    svg.setAttribute("aria-hidden", "true");
    svg.appendChild(svgCircle("#EAE0C6"));
    svg.appendChild(svgCircle("#4C8763", face));
    var center = el("div", "gauge-center");
    center.appendChild(el("div", "gauge-count", face.label));
    center.appendChild(el("div", "gauge-label", label));
    wrap.appendChild(svg);
    wrap.appendChild(center);
    host.appendChild(wrap);
  }

  function fillAvatars(list, kind, who) {
    if (!list) return;
    clear(list);
    family().forEach(function (person) {
      var face = window.DanayiguCheckin.avatarFace(
        person.initial,
        !!timeOf(kind, person.sheetId),
        !!(who && who.id === person.sheetId)
      );
      var item = el("div", "avatar" + (face.on ? " is-on" : "") + (face.self ? " is-self" : "") + (face.long ? " is-long" : ""));
      if (face.self) item.setAttribute("aria-current", "true");
      var ring = el("div", "avatar-face");
      ring.appendChild(document.createTextNode(face.initial));
      ring.appendChild(el("div", "avatar-mark", face.mark));
      item.appendChild(ring);
      item.appendChild(el("div", "avatar-name", person.name));
      list.appendChild(item);
    });
  }

  function paintSync(kind) {
    var node = document.getElementById(kind + "-sync");
    if (!node) return;
    var line = window.DanayiguCheckin.syncFace(view);
    node.textContent = line.text;
    node.classList.toggle("is-error", line.tone === "error");
    node.classList.toggle("is-ok", line.ok);
  }

  function paintBlock(kind, who) {
    var button = document.getElementById(kind + "-button");
    var gauge = document.getElementById(kind + "-gauge");
    if (!button || !gauge) return;
    var selfOn = !!(who && timeOf(kind, who.id));
    var face = window.DanayiguCheckin.blockFace(countKind(kind), kind, selfOn);
    paintGauge(gauge, face, kind === "home" ? "已到家" : "已報到");
    fillAvatars(document.getElementById(kind + "-list"), kind, who);
    button.textContent = face.button;
    button.classList.toggle("is-done", face.done);
    button.disabled = busy;
    var remain = document.getElementById(kind + "-remain");
    if (remain) {
      remain.textContent = face.remain;
      remain.classList.toggle("is-all", face.all);
    }
    paintSync(kind);
  }

  function renderBanners() {
    var checkinBanner = document.getElementById("checkin-banner");
    var journeyBanner = document.getElementById("journey-banner");
    var live = view.mode === "live";
    if (checkinBanner) {
      checkinBanner.textContent = !live
        ? "目前沒有連上。按了也不會報到成功。"
        : (view.syncReady === false
          ? "家族同步尚未開通。現在還不能報到。"
          : (view.stale
            ? "這次沒有同步到。下面是上次讀到的狀態。"
            : (view.syncReady === true
              ? ""
              : "正在讀取報到。")));
      if (checkinBanner) checkinBanner.hidden = !checkinBanner.textContent;
    }
    if (journeyBanner) {
      var journeyReady = live && view.syncReady === true && !view.stale;
      journeyBanner.classList.toggle("is-error", !journeyReady);
      journeyBanner.textContent = journeyReady
        ? ""
        : (!live
          ? "目前沒有連上。留言和公告按了也不會送出。"
          : (view.syncReady === false
            ? "現在還不能送出留言和公告。"
            : (view.stale
              ? "這次沒有同步到。先顯示上次讀到的內容。"
              : "正在讀取留言和公告。")));
      journeyBanner.hidden = !journeyBanner.textContent;
    }
  }

  function renderCheckin() {
    if (!window.DanayiguCheckin) return;
    var who = currentWho();
    if (!document.getElementById("depart-button") || !document.getElementById("home-button")) return;
    paintBlock("depart", who);
    paintBlock("home", who);
    var hint = document.getElementById("checkin-hint");
    if (hint && !who) hint.textContent = "請先在上方選擇你是誰。";
    renderBanners();
  }

  function renderSays() {
    var list = document.getElementById("say-list");
    var empty = document.getElementById("say-empty");
    var retry = document.getElementById("say-retry");
    if (!list) return;
    clear(list);
    var who = currentWho();
    view.messages.forEach(function (item) {
      var mine = !!(who && who.id === item.personId);
      var row = el("li", "say-row" + (mine ? " is-mine" : ""));
      var line = el("div", "say-line");
      line.appendChild(el("span", "say-who", personName(item.personId) + (mine ? "（我）" : "") + "："));
      line.appendChild(el("span", "say-body", item.text));
      line.appendChild(el("span", "say-when", clockMs(item.createdAtMs)));
      row.appendChild(line);
      list.appendChild(row);
    });
    empty.hidden = view.messages.length > 0;
    document.getElementById("say-custom").hidden = !customOpen;
    if (retry) retry.hidden = !messageOutgoing;
    var phraseButtons = document.querySelectorAll("#phrase-grid button");
    Array.prototype.forEach.call(phraseButtons, function (button) {
      button.disabled = busy;
    });
    var typed = document.getElementById("say-text");
    var send = document.getElementById("say-send");
    if (send) send.disabled = busy || !String(typed && typed.value || "").trim();
  }

  function renderAnnouncements() {
    var latest = document.getElementById("ann-latest");
    var history = document.getElementById("ann-history");
    var toggle = document.getElementById("ann-history-toggle");
    var composer = document.getElementById("ann-composer");
    var opener = document.getElementById("ann-open");
    var retry = document.getElementById("ann-retry");
    if (!latest) return;
    clear(latest);
    clear(history);
    if (!view.canPublish) annFormOpen = false;
    if (opener) opener.hidden = !view.canPublish || annFormOpen;
    if (composer) composer.hidden = !view.canPublish || !annFormOpen;
    if (!view.announcements.length) {
      latest.appendChild(el("p", "empty-copy", "尚無公告"));
      toggle.hidden = true;
      history.hidden = true;
    } else {
      var head = view.announcements[0];
      var box = el("div", "ann-latest-card");
      box.appendChild(el("p", "ann-body", head.text));
      box.appendChild(el("p", "ann-when", personName(head.authorId) + " · " + clockMs(head.createdAtMs)));
      latest.appendChild(box);
      var older = view.announcements.slice(1);
      toggle.hidden = older.length === 0;
      toggle.textContent = historyOpen ? "收合以前的公告" : "查看以前的公告";
      history.hidden = !historyOpen || older.length === 0;
      older.forEach(function (item) {
        var row = el("li");
        row.appendChild(el("div", "ann-body", item.text));
        row.appendChild(el("div", "ann-when", personName(item.authorId) + " · " + clockMs(item.createdAtMs)));
        history.appendChild(row);
      });
    }
    if (retry) retry.hidden = !announcementOutgoing || !view.canPublish;
    var typed = document.getElementById("ann-text");
    var send = document.getElementById("ann-send");
    if (send) send.disabled = busy || !String(typed && typed.value || "").trim();
  }

  function mapIcon(kind) {
    if (kind === "集合出發" || kind === "集合") return "📍";
    if (kind === "主要景點" || kind === "主要目的地") return "🌿";
    if (kind === "加油站") return "⛽";
    if (kind === "美食停靠") return "🍞";
    if (String(kind || "").indexOf("晚餐") === 0) return "🍽️";
    return "📌";
  }

  function mapsSegment(fromStop, toStop) {
    if (!fromStop || !toStop || !fromStop.navReady || !toStop.navReady) return "";
    if (!fromStop.navQuery || !toStop.navQuery) return "";
    var url = "https://www.google.com/maps/dir/?api=1&travelmode=driving";
    url += "&origin=" + encodeURIComponent(fromStop.navQuery);
    if (fromStop.placeId) url += "&origin_place_id=" + encodeURIComponent(fromStop.placeId);
    url += "&destination=" + encodeURIComponent(toStop.navQuery);
    if (toStop.placeId) url += "&destination_place_id=" + encodeURIComponent(toStop.placeId);
    return url;
  }

  function fillRouteMap(host) {
    if (!host) return;
    clear(host);
    trip.stops.forEach(function (stop, index) {
      if (index > 0) host.appendChild(el("div", "route-join"));
      var item = el("div", "route-node");
      item.appendChild(el("div", "route-num", String(index + 1)));
      item.appendChild(el("div", "route-label", stop.name));
      host.appendChild(item);
    });
  }

  function fillMapCards(host, items) {
    clear(host);
    items.forEach(function (item, index) {
      var card = el("article", "card map-card");
      var row = el("div", "map-row");
      row.appendChild(el("div", "route-num", String(index + 1)));
      row.appendChild(el("div", "map-icon", mapIcon(item.kind)));
      var body = el("div", "map-body");
      body.appendChild(el("p", "section-label", item.kind));
      body.appendChild(el("p", "map-place", item.name));
      body.appendChild(el("p", "map-desc", placeStatus(item)));
      if (item.address) body.appendChild(el("p", "map-note", item.address));
      if (index > 0) {
        var fromStop = items[index - 1];
        var href = mapsSegment(fromStop, item);
        body.appendChild(el("p", "map-note", "從" + fromStop.name + "出發"));
        if (href) {
          var link = el("a", "map-nav is-ready", "🧭 導航到這裡");
          link.href = href;
          link.target = "_blank";
          link.rel = "noopener noreferrer";
          body.appendChild(link);
        } else {
          var button = el("button", "map-nav", "🧭 導航確認中");
          button.type = "button";
          button.disabled = true;
          body.appendChild(button);
        }
      }
      row.appendChild(body);
      card.appendChild(row);
      host.appendChild(card);
    });
  }

  function renderTripLists() {
    var route = document.getElementById("route-list");
    var plan = document.getElementById("plan-list");
    var reviewPlan = document.getElementById("review-plan");
    fillRouteMap(document.getElementById("route-map"));
    if (route) fillMapCards(route, trip.stops);
    if (reviewPlan) {
      clear(reviewPlan);
      trip.stops.forEach(function (stop, index) {
        var row = el("li");
        row.appendChild(el("div", "stop-name", (index + 1) + ". " + stop.name));
        row.appendChild(el("div", "stop-kind", stop.kind));
        row.appendChild(el("p", "stop-status", placeStatus(stop)));
        reviewPlan.appendChild(row);
      });
    }
    if (plan) {
      clear(plan);
      trip.stops.forEach(function (stop) {
        var row = el("li", "plan-stop");
        row.appendChild(el("div", "plan-mark", "⚪"));
        var meta = el("div", "plan-meta");
        meta.appendChild(el("div", "plan-kicker", "預定"));
        meta.appendChild(el("div", "plan-kind", stop.kind));
        var body = el("div", "plan-body");
        body.appendChild(el("div", "plan-name", stop.name));
        body.appendChild(el("div", "plan-note", placeStatus(stop)));
        row.appendChild(meta);
        row.appendChild(body);
        plan.appendChild(row);
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
    [["review-champ-3", name3, meta3], ["review-champ-4", name4, meta4]].forEach(function (slot) {
      [slot[0]].forEach(function (id) {
        var node = document.getElementById(id);
        if (!node) return;
        clear(node);
        if (!closed) {
          node.appendChild(el("p", "stop-status", "晚餐才公布。這裡跟著拼圖分頁的冠軍畫面，不會另外計算。"));
          return;
        }
        node.appendChild(el("p", "champ-name", slot[1] || "本屆從缺"));
        if (slot[2]) node.appendChild(el("p", "stop-status", slot[2]));
      });
    });
    ["review-rank-3", "review-rank-4"].forEach(function (id, index) {
      var target = document.getElementById(id);
      var source = document.getElementById(index === 0 ? "rank-3" : "rank-4");
      if (!target || !source) return;
      clear(target);
      if (!source.children.length) {
        target.appendChild(el("li", "empty", "還沒有成績"));
        return;
      }
      Array.prototype.forEach.call(source.children, function (item) {
        var row = el("li", item.className);
        if (!item.children.length) {
          row.textContent = item.textContent;
          target.appendChild(row);
          return;
        }
        Array.prototype.forEach.call(item.children, function (child) {
          row.appendChild(el("span", child.className, child.textContent));
        });
        target.appendChild(row);
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
    var info = document.getElementById("checkin-info");
    var checkinHint = document.getElementById("checkin-hint");
    if (info) info.hidden = key !== "checkin";
    if (checkinHint) checkinHint.hidden = key !== "checkin";
    if (key === "review") renderMirrors();
    applyReviewGate();
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

  function focusTarget() {
    var focus = "";
    var hash = String(location.hash || "");
    try { focus = new URLSearchParams(location.search).get("focus") || ""; } catch (err) { focus = ""; }
    if (hash === "#family-ann" || focus === "family-ann") return "family-say";
    if (hash === "#family-say" || focus === "family-say") return "family-say";
    return "";
  }

  function revealFocus() {
    var id = focusTarget();
    var node = id ? document.getElementById(id) : null;
    if (!node || (node.closest && node.closest("[hidden]"))) return;
    function go() {
      try { node.scrollIntoView({ block: "center", inline: "nearest" }); }
      catch (err) { node.scrollIntoView(true); }
    }
    go();
    requestAnimationFrame(go);
  }

  function rememberPuzzleTab() {
    setTimeout(function () {
      var url = new URL(location.href);
      url.searchParams.set("tab", "puzzle");
      url.searchParams.delete("a");
      var hash = /^#a=/.test(location.hash || "") ? location.hash : "";
      try { history.replaceState(null, "", url.pathname + url.search + hash); } catch (err) { /* 保持目前畫面 */ }
    }, 0);
  }

  function requireWho() {
    var who = currentWho();
    if (who) return who;
    setCheckinStatus("請先在上方選擇你是誰。這次沒有送出。");
    setSayStatus("請先在上方選擇你是誰。這則沒有發布。");
    return null;
  }

  function askCopy(who, kind) {
    var which = kind === "depart" ? "出發報到" : "到家報平安";
    return "要取消" + who.name + "的" + which + "嗎？只會清掉這一個時間。";
  }

  function syncBlockMessage() {
    var sync = window.danayiguSync;
    if (!sync || sync.mode() !== "live") return "目前沒有連上，這次沒有送出";
    if (sync.syncReady && sync.syncReady() === false) return "家族同步尚未開通，這次沒有送出";
    return "";
  }

  function submitCheckin(pending) {
    if (busy || !pending || !pending.id) return;
    var sync = window.danayiguSync;
    var blocked = syncBlockMessage();
    if (!sync || blocked) {
      setCheckinStatus((blocked || "目前沒有連上，這次沒有送出") + "。報到維持原狀。");
      return;
    }
    busy = true;
    hideAsks();
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
      if (pending.mode === "clear") setCheckinStatus("已取消。只清掉這一個時間。");
      else setCheckinStatus(data.already ? "已經報到過了，時間沒有改。" : "已送出。其他手機也會看到。");
    }).catch(function () {
      busy = false;
      renderCheckin();
      setCheckinStatus("不確定有沒有送出。請看名單，先不要再按一次。");
    });
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
    if (mode === "set") {
      submitCheckin({ kind: kind, mode: mode, id: who.id });
      return;
    }
    ask = { kind: kind, mode: mode, id: who.id };
    var other = kind === "depart" ? "home" : "depart";
    var otherBox = document.getElementById(other + "-ask");
    if (otherBox) otherBox.hidden = true;
    var text = document.getElementById(kind + "-ask-text");
    var yes = document.getElementById(kind + "-yes");
    var box = document.getElementById(kind + "-ask");
    if (text) text.textContent = askCopy(who, kind);
    if (yes) yes.textContent = "確認取消";
    if (box) box.hidden = false;
  }

  function confirmAsk() {
    if (busy || !ask || ask.mode !== "clear") return;
    var who = currentWho();
    var blocked = syncBlockMessage();
    if (!who || who.id !== ask.id || blocked) {
      setCheckinStatus((blocked || "目前沒有連上，這次沒有送出") + "。報到維持原狀。");
      return;
    }
    submitCheckin({ kind: ask.kind, mode: "clear", id: who.id });
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
        renderSays();
        setSayStatus(((data && data.error) || "沒有送出") + "。這則沒有發布。");
        return;
      }
      messageOutgoing = null;
      var input = document.getElementById("say-text");
      if (input) input.value = "";
      customOpen = false;
      renderSays();
      var opener = document.getElementById("say-open");
      if (opener) {
        opener.classList.remove("is-open");
        opener.setAttribute("aria-expanded", "false");
      }
      var sentText = data.duplicate ? "這次已經送出過，沒有再新增一則。" : "已送出。";
      if (!data.duplicate && data.push) {
        if (data.push.skipped || data.push.failed || data.push.expired) sentText += "部分或全部手機通知未送達，訊息已保留。";
        else if (data.push.success > 0) sentText += "手機通知已發送。";
        else sentText += "目前沒有可接收的手機訂閱，訊息已保留。";
      }
      setSayStatus(sentText);
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
        renderAnnouncements();
        setAnnStatus(((data && data.error) || "無法發布公告") + "。這則沒有發布。");
        return;
      }
      announcementOutgoing = null;
      annFormOpen = false;
      var input = document.getElementById("ann-text");
      if (input) input.value = "";
      renderAnnouncements();
      setAnnStatus(announceStatus(data));
    }).catch(function () {
      busy = false;
      renderAnnouncements();
      setAnnStatus("不確定有沒有發布。若要再試，會沿用同一次，不會變成兩則。");
    });
  }

  function announceStatus(data) {
    if (data && data.duplicate) return "這次已經發布過，沒有再新增一則。";
    if (data && data.push && data.push.skipped) return "已發布。這次手機通知沒有送出。";
    if (data && data.push && data.push.skipped === false) return "已發布。家人會收到手機通知。";
    return "已發布。";
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
    document.getElementById("say-text").addEventListener("input", renderSays);
    document.getElementById("say-send").addEventListener("click", function () {
      var input = document.getElementById("say-text");
      var body = input ? input.value : "";
      if (messageOutgoing && String(body || "").trim() === messageOutgoing.text) {
        sendText(messageOutgoing.text, true);
        return;
      }
      sendText(body, false);
    });
    document.getElementById("say-retry").addEventListener("click", function () {
      if (!messageOutgoing) return;
      sendText(messageOutgoing.text, true);
    });
    document.getElementById("ann-history-toggle").addEventListener("click", function () {
      historyOpen = !historyOpen;
      renderAnnouncements();
    });
    document.getElementById("ann-open").addEventListener("click", function () {
      if (!view.canPublish || busy) return;
      annFormOpen = true;
      renderAnnouncements();
    });
    document.getElementById("ann-cancel").addEventListener("click", function () {
      if (busy) return;
      annFormOpen = false;
      if (!announcementOutgoing) {
        var input = document.getElementById("ann-text");
        if (input) input.value = "";
      }
      renderAnnouncements();
    });
    document.getElementById("ann-text").addEventListener("input", renderAnnouncements);
    document.getElementById("ann-send").addEventListener("click", function () {
      var input = document.getElementById("ann-text");
      var body = input ? input.value : "";
      if (announcementOutgoing && String(body || "").trim() === announcementOutgoing.text) {
        publishText(announcementOutgoing.text, true);
        return;
      }
      publishText(body, false);
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
          ? "這句會以" + who.name + "的名字送出。"
          : "請先在上方選擇你是誰。";
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
      var phrase = item.icon + " " + item.label;
      button.dataset.phrase = phrase;
      button.addEventListener("click", function () {
        sendText(phrase, false);
      });
      grid.appendChild(button);
    });
    var custom = el("button", "say-primary", "💬 發訊息給大家");
    custom.id = "say-open";
    custom.setAttribute("aria-controls", "say-custom");
    custom.setAttribute("aria-expanded", "false");
    custom.type = "button";
    custom.addEventListener("click", function () {
      if (busy) return;
      customOpen = !customOpen;
      custom.classList.toggle("is-open", customOpen);
      custom.setAttribute("aria-expanded", customOpen ? "true" : "false");
      renderSays();
      var input = document.getElementById("say-text");
      if (customOpen && input && input.focus) input.focus();
    });
    grid.appendChild(custom);
  }

  var title = document.getElementById("trip-title");
  var brand = document.getElementById("trip-brand");
  var tagline = document.getElementById("trip-tagline");
  var meetPlace = document.getElementById("meet-place");
  var meetTime = document.getElementById("meet-time");
  var direction = document.getElementById("route-direction");
  if (title && trip.title) title.textContent = trip.title;
  if (brand && trip.brand) brand.textContent = trip.brand;
  if (tagline && trip.tagline) tagline.textContent = trip.tagline;
  if (meetPlace && trip.meeting) meetPlace.textContent = trip.meeting.place;
  var meetAddress = document.getElementById("meet-address");
  var meetNav = document.getElementById("meet-nav");
  if (meetAddress && trip.meeting) meetAddress.textContent = trip.meeting.address || "";
  if (meetNav && trip.meeting && trip.meeting.navReady && trip.meeting.navQuery) {
    meetNav.href = "https://www.google.com/maps/dir/?api=1&travelmode=driving&destination=" + encodeURIComponent(trip.meeting.navQuery);
    meetNav.hidden = false;
  } else if (meetNav) {
    meetNav.hidden = true;
  }
  if (meetTime && trip.meeting) meetTime.textContent = trip.meeting.timeText;
  if (direction) direction.textContent = "方向：" + (trip.direction || "尚未確定") + "。時間與道路都尚未定稿。";
  var mapDate = document.getElementById("map-date");
  var rideNote = document.getElementById("map-ride-note");
  if (mapDate) mapDate.textContent = trip.dateText || "";
  if (rideNote) rideNote.textContent = trip.rideNote || "";
  var stageMeet = document.getElementById("journey-meet");
  var stageTime = document.getElementById("journey-time");
  var nextTime = document.getElementById("journey-next-time");
  var nextPlace = document.getElementById("journey-next-place");
  if (stageMeet && trip.meeting) stageMeet.textContent = "集合地點：" + trip.meeting.place;
  if (stageTime && trip.meeting) stageTime.textContent = "集合時間：" + (trip.meeting.timeText || "尚未確定");
  if (nextTime) nextTime.textContent = (trip.meeting && trip.meeting.timeText) || "尚未確定";
  if (nextPlace && trip.stops && trip.stops[0]) nextPlace.textContent = "📍 " + trip.stops[0].name;

  function syncIdentity() {
    renderCheckin();
    var sayHint = document.getElementById("say-hint");
    var who = currentWho();
    if (sayHint) {
      sayHint.textContent = who
        ? "這句會以" + who.name + "的名字送出。"
        : "請先在上方選擇你是誰。";
    }
    renderSays();
    renderMirrors();
  }

  var REVIEW_OPENS_AT = Date.parse("2026-12-27T00:00:00+08:00");

  function reviewIsOpen(now) {
    return Number(now) >= REVIEW_OPENS_AT;
  }

  function applyReviewGate(now) {
    var open = reviewIsOpen(now == null ? Date.now() : now);
    var locked = document.getElementById("review-locked");
    var body = document.getElementById("review-body");
    if (locked) locked.hidden = open;
    if (body) body.hidden = !open;
  }

  var SHELL_BUILD = "6d4";
  var SHELL_NODES = ["who", "who-confirm", "ann-open", "depart-gauge", "home-gauge", "phrase-grid", "depart-button", "home-button", "depart-yes", "home-yes", "say-send", "ann-send", "submit-score", "close-confirm"];

  function pageBuild() {
    var root = document.documentElement;
    if (!root || !root.getAttribute) return "";
    return root.getAttribute("data-build") || "";
  }

  function missingShellNode() {
    var i;
    for (i = 0; i < SHELL_NODES.length; i++) {
      if (!document.getElementById(SHELL_NODES[i])) return SHELL_NODES[i];
    }
    if (!document.querySelector || !document.querySelector(".tabbar")) return "tabbar";
    return "";
  }

  function showReloadBanner() {
    if (window.DanayiguShowReload) {
      DanayiguShowReload();
      return;
    }
    if (document.getElementById("danayigu-reload-banner")) return;
    var bar = document.createElement("div");
    var text = document.createElement("p");
    var button = document.createElement("button");
    bar.id = "danayigu-reload-banner";
    bar.setAttribute("role", "status");
    text.textContent = "這個畫面需要重新整理才能繼續使用。這不會刪除主畫面圖示，也不會清掉你的名字、報到或成績。";
    button.type = "button";
    button.textContent = "重新整理";
    button.addEventListener("click", function () { location.reload(); });
    bar.appendChild(text);
    bar.appendChild(button);
    if (document.body) document.body.appendChild(bar);
  }

  function holdOfficialPost() {
    if (window.__danayiguPostHeld) return;
    window.__danayiguPostHeld = true;
    var native = window.fetch;
    if (typeof native !== "function") return;
    window.fetch = function (input, init) {
      var method = "GET";
      if (init && init.method) method = String(init.method);
      else if (input && input.method) method = String(input.method);
      if (method.toUpperCase() === "POST") {
        return Promise.resolve({
          ok: false,
          json: function () { return Promise.resolve({ ok: false, error: "請先按重新整理" }); }
        });
      }
      return native.apply(window, arguments);
    };
  }

  function pageAllowsShell() {
    var missing = missingShellNode();
    if (pageBuild() !== SHELL_BUILD || missing) {
      holdOfficialPost();
      showReloadBanner();
      if (window.DanayiguGuard) DanayiguGuard.fail(missing || "build");
      return false;
    }
    if (window.DanayiguGuard && !DanayiguGuard.claim("shell.js", SHELL_BUILD)) {
      showReloadBanner();
      return false;
    }
    return true;
  }

  if (pageAllowsShell()) {
  fillPhrases();
  renderTripLists();
  renderCheckin();
  renderSays();
  renderAnnouncements();
  renderMirrors();

  bind();

  var adminHash = /^#a=/.test(location.hash || "");
  show(adminHash ? "puzzle" : (tabFromQuery() || "checkin"), false);
  if (!adminHash) revealFocus();
  if (adminHash) rememberPuzzleTab();
  window.DanayiguRevealFocus = revealFocus;
  window.addEventListener("danayigu-who", syncIdentity);
  if (document.readyState === "complete") syncIdentity();
  else window.addEventListener("load", syncIdentity);
  }
})();
