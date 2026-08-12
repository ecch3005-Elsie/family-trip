/**
 * 瓦特鎮家族｜family-trip Google Apps Script
 *
 * 部署步驟：
 * 1. 在試算表建立以下分頁（名稱需完全一致）：
 *    Members, Feedback, Progress, Guesses, Segments, Photos, Tasks, Announcements
 * 2. 在 Google Drive 建立一個資料夾（例如「family-trip 合照」），把網址列的 ID 貼到 PHOTOS_FOLDER_ID
 *    例：https://drive.google.com/drive/folders/1AbCdEfGhIjKlMnOp → ID 是 1AbCdEfGhIjKlMnOp
 * 3. 貼上此程式 → 部署 → 網路應用程式 → 任何人可存取
 * 4. 若已有舊版 Script，保留 Members / Feedback / Progress 資料即可
 */

const PHOTOS_FOLDER_ID = "YOUR_DRIVE_FOLDER_ID_HERE"; // ← 改成你的 Drive 資料夾 ID

const MEMBER_IDS = ["walter", "wen", "yan", "money", "xiang", "xin", "rouzong", "ting", "cheng"];
const MEMBER_NAMES = {
  walter: "Walter", wen: "文", yan: "艷", money: "Money", xiang: "享",
  xin: "心", rouzong: "肉粽", ting: "庭", cheng: "呈",
};
const DAY1_ACCOMMODATION_STOP_ID = 3;
const TASK_KEYS = ["photo", "food", "dayComplete", "safeArrival"];

function doGet() {
  return ContentService.createTextOutput(JSON.stringify(buildPayload()))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    handleAction(body);
    return ContentService.createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function handleAction(body) {
  const action = body.action;
  switch (action) {
    case "checkin": setMemberField(body.id, "checkedIn", true); break;
    case "checkinHome": setMemberField(body.id, "arrivedHome", true); break;
    case "resetAll": MEMBER_IDS.forEach((id) => { setMemberField(id, "checkedIn", false); setMemberField(id, "checkinTime", ""); }); break;
    case "resetAllHome": MEMBER_IDS.forEach((id) => { setMemberField(id, "arrivedHome", false); setMemberField(id, "homeTime", ""); }); break;
    case "addFeedback": addFeedback(body); break;
    case "resolveFeedback": resolveFeedback(body.id); break;
    case "setStop": setStop(body.stopIndex, body.segmentKm, body.recordedBy); break;
    case "submitGuess": submitGuess(body); break;
    case "toggleTask": toggleTask(body.taskKey, body.value !== false); break;
    case "postAnnouncement": postAnnouncement(body); break;
    case "uploadPhoto": uploadPhoto(body); break;
    case "fixSegment": fixSegment(body.stopIndex, body.km); break;
    default: throw new Error("unknown action: " + action);
  }
}

function buildPayload() {
  return {
    ok: true,
    members: getMembers(),
    feedback: getFeedback(),
    progress: getProgress(),
    guesses: getGuesses(),
    segments: getSegments(),
    photos: getPhotos(),
    tasks: getTasks(),
    announcements: getAnnouncements(),
    day1Result: getDay1Result(),
    guessLocked: isGuessLocked(),
  };
}

// ---- Sheets helpers ----
function ss() { return SpreadsheetApp.getActiveSpreadsheet(); }

function ensureSheet(name, headers) {
  let sh = ss().getSheetByName(name);
  if (!sh) {
    sh = ss().insertSheet(name);
    sh.appendRow(headers);
  }
  return sh;
}

function getMembers() {
  const sh = ensureSheet("Members", ["id", "name", "checkedIn", "arrivedHome", "checkinTime", "homeTime"]);
  const data = sh.getDataRange().getValues();
  const map = {};
  for (let i = 1; i < data.length; i++) {
    map[data[i][0]] = data[i];
  }
  return MEMBER_IDS.map((id) => {
    const row = map[id];
    if (row) {
      return { id, name: row[1], checkedIn: row[2], arrivedHome: row[3], checkinTime: row[4] || "", homeTime: row[5] || "" };
    }
    sh.appendRow([id, MEMBER_NAMES[id] || id, false, false, "", ""]);
    return { id, name: MEMBER_NAMES[id] || id, checkedIn: false, arrivedHome: false, checkinTime: "", homeTime: "" };
  });
}

function setMemberField(id, field, value) {
  const sh = ensureSheet("Members", ["id", "name", "checkedIn", "arrivedHome", "checkinTime", "homeTime"]);
  const data = sh.getDataRange().getValues();
  const colMap = { checkedIn: 3, arrivedHome: 4, checkinTime: 5, homeTime: 6 };
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === id) {
      sh.getRange(i + 1, colMap[field]).setValue(value);
      if (field === "checkedIn" && value === true) sh.getRange(i + 1, 5).setValue(new Date().toISOString());
      if (field === "arrivedHome" && value === true) sh.getRange(i + 1, 6).setValue(new Date().toISOString());
      return;
    }
  }
}

function getFeedback() {
  const sh = ensureSheet("Feedback", ["id", "personId", "personName", "type", "ts", "resolved"]);
  const data = sh.getDataRange().getValues();
  const out = [];
  for (let i = 1; i < data.length; i++) {
    if (data[i][5] === true || data[i][5] === "TRUE") continue;
    out.push({ id: data[i][0], personId: data[i][1], personName: data[i][2], type: data[i][3], ts: Number(data[i][4]) || 0 });
  }
  return out.sort((a, b) => b.ts - a.ts);
}

function addFeedback(body) {
  const sh = ensureSheet("Feedback", ["id", "personId", "personName", "type", "ts", "resolved"]);
  sh.appendRow([Date.now(), body.personId, body.personName, body.type, Date.now(), false]);
}

function resolveFeedback(id) {
  const sh = ss().getSheetByName("Feedback");
  if (!sh) return;
  const data = sh.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(id)) { sh.getRange(i + 1, 6).setValue(true); return; }
  }
}

function getProgress() {
  const sh = ensureSheet("Progress", ["key", "value"]);
  const data = sh.getDataRange().getValues();
  const map = {};
  for (let i = 1; i < data.length; i++) map[data[i][0]] = data[i][1];
  if (map.currentStop === undefined) setProgressKey("currentStop", -1);
  return { currentStop: Number(map.currentStop !== undefined ? map.currentStop : -1) };
}

function setProgressKey(key, value) {
  const sh = ensureSheet("Progress", ["key", "value"]);
  const data = sh.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === key) { sh.getRange(i + 1, 2).setValue(value); return; }
  }
  sh.appendRow([key, value]);
}

function isGuessLocked() {
  const sh = ensureSheet("Progress", ["key", "value"]);
  const data = sh.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === "guessLocked") return data[i][1] === true || data[i][1] === "TRUE";
  }
  return false;
}

function setStop(stopIndex, segmentKm, recordedBy) {
  const idx = Number(stopIndex);
  setProgressKey("currentStop", idx);
  if (segmentKm !== undefined && segmentKm !== null && segmentKm !== "") {
    recordSegment(idx, Number(segmentKm), recordedBy || "");
  }
  if (idx === DAY1_ACCOMMODATION_STOP_ID) {
    finalizeDay1();
  }
  if (idx >= 0 && !isGuessLocked()) {
    setProgressKey("guessLocked", true);
  }
}

function recordSegment(stopIndex, km, recordedBy) {
  const sh = ensureSheet("Segments", ["stopIndex", "stopName", "km", "ts", "recordedBy"]);
  const data = sh.getDataRange().getValues();
  const stopNames = ["台3線出發","伯恭甕缸雞","古坑好農","茗鎮民宿","華山咖啡大街","華山會館","民宿出發","五元兩角","雲嶺之丘","午餐","草嶺下山","抵達永康","東悅坊慶功宴","台南組解散","萬丹解散","高雄各組返家"];
  for (let i = 1; i < data.length; i++) {
    if (Number(data[i][0]) === stopIndex) {
      sh.getRange(i + 1, 3).setValue(km);
      sh.getRange(i + 1, 4).setValue(new Date().toISOString());
      sh.getRange(i + 1, 5).setValue(recordedBy);
      return;
    }
  }
  sh.appendRow([stopIndex, stopNames[stopIndex] || "", km, new Date().toISOString(), recordedBy]);
}

function fixSegment(stopIndex, km) {
  recordSegment(Number(stopIndex), Number(km), "admin-fix");
  if (Number(stopIndex) === DAY1_ACCOMMODATION_STOP_ID) finalizeDay1();
}

function getSegments() {
  const sh = ensureSheet("Segments", ["stopIndex", "stopName", "km", "ts", "recordedBy"]);
  const data = sh.getDataRange().getValues();
  const out = [];
  for (let i = 1; i < data.length; i++) {
    if (data[i][2] !== "" && data[i][2] !== null) {
      out.push({ stopIndex: Number(data[i][0]), stopName: data[i][1], km: Number(data[i][2]), ts: data[i][3], recordedBy: data[i][4] });
    }
  }
  return out.sort((a, b) => a.stopIndex - b.stopIndex);
}

function sumDay1Km() {
  return getSegments()
    .filter((s) => s.stopIndex <= DAY1_ACCOMMODATION_STOP_ID)
    .reduce((sum, s) => sum + s.km, 0);
}

function finalizeDay1() {
  const totalKm = sumDay1Km();
  const arrivalTime = new Date().toISOString();
  setProgressKey("day1TotalKm", totalKm);
  setProgressKey("day1ArrivalTime", arrivalTime);
  const star = calculateStar(totalKm, arrivalTime);
  if (star) setProgressKey("day1StarPersonId", star);
}

function getDay1Result() {
  const sh = ensureSheet("Progress", ["key", "value"]);
  const data = sh.getDataRange().getValues();
  const map = {};
  for (let i = 1; i < data.length; i++) map[data[i][0]] = data[i][1];
  if (map.day1TotalKm === undefined) return null;
  return {
    totalKm: Number(map.day1TotalKm),
    arrivalTime: map.day1ArrivalTime || "",
    starPersonId: map.day1StarPersonId || "",
  };
}

function getGuesses() {
  const sh = ensureSheet("Guesses", ["personId", "personName", "guessKm", "guessTime", "ts"]);
  const data = sh.getDataRange().getValues();
  const out = [];
  for (let i = 1; i < data.length; i++) {
    if (data[i][0]) out.push({ personId: data[i][0], personName: data[i][1], guessKm: Number(data[i][2]), guessTime: data[i][3], ts: Number(data[i][4]) || 0 });
  }
  return out;
}

function submitGuess(body) {
  if (isGuessLocked()) throw new Error("guesses locked");
  const sh = ensureSheet("Guesses", ["personId", "personName", "guessKm", "guessTime", "ts"]);
  const data = sh.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === body.personId) {
      throw new Error("already submitted");
    }
  }
  sh.appendRow([body.personId, body.personName, body.guessKm, body.guessTime, Date.now()]);
}

function timeToMinutes(hhmm) {
  const parts = String(hhmm).split(":");
  return Number(parts[0]) * 60 + Number(parts[1] || 0);
}

function calculateStar(actualKm, arrivalIso) {
  const guesses = getGuesses();
  if (!guesses.length) return "";
  const actualMin = new Date(arrivalIso).getHours() * 60 + new Date(arrivalIso).getMinutes();
  let bestId = "";
  let bestScore = Infinity;
  guesses.forEach((g) => {
    const kmErr = Math.abs(g.guessKm - actualKm);
    const timeErr = Math.abs(timeToMinutes(g.guessTime) - actualMin);
    const score = kmErr + timeErr / 10;
    if (score < bestScore) { bestScore = score; bestId = g.personId; }
  });
  return bestId;
}

function getTasks() {
  const sh = ensureSheet("Tasks", ["key", "value"]);
  const data = sh.getDataRange().getValues();
  const map = {};
  for (let i = 1; i < data.length; i++) map[data[i][0]] = data[i][1] === true || data[i][1] === "TRUE";
  const out = {};
  TASK_KEYS.forEach((k) => { out[k] = map[k] || false; });
  return out;
}

function toggleTask(key, value) {
  const sh = ensureSheet("Tasks", ["key", "value"]);
  const data = sh.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === key) { sh.getRange(i + 1, 2).setValue(value); return; }
  }
  sh.appendRow([key, value]);
}

function getAnnouncements() {
  const sh = ensureSheet("Announcements", ["id", "level", "text", "ts"]);
  const data = sh.getDataRange().getValues();
  const out = [];
  for (let i = 1; i < data.length; i++) {
    out.push({ id: Number(data[i][0]), level: data[i][1], text: data[i][2], ts: Number(data[i][3]) });
  }
  return out.sort((a, b) => b.ts - a.ts).slice(0, 20);
}

function postAnnouncement(body) {
  const sh = ensureSheet("Announcements", ["id", "level", "text", "ts"]);
  sh.appendRow([Date.now(), body.level || "normal", body.text, Date.now()]);
}

function getPhotos() {
  const sh = ensureSheet("Photos", ["id", "personId", "personName", "url", "caption", "ts"]);
  const data = sh.getDataRange().getValues();
  const out = [];
  for (let i = 1; i < data.length; i++) {
    out.push({ id: data[i][0], personId: data[i][1], personName: data[i][2], url: data[i][3], caption: data[i][4] || "", ts: Number(data[i][5]) || 0 });
  }
  return out.sort((a, b) => b.ts - a.ts);
}

function uploadPhoto(body) {
  if (PHOTOS_FOLDER_ID === "YOUR_DRIVE_FOLDER_ID_HERE") {
    throw new Error("請先在 Code.gs 設定 PHOTOS_FOLDER_ID");
  }
  const folder = DriveApp.getFolderById(PHOTOS_FOLDER_ID);
  const bytes = Utilities.base64Decode(body.imageBase64);
  const blob = Utilities.newBlob(bytes, body.mimeType || "image/jpeg", body.fileName || "photo.jpg");
  const file = folder.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  const url = "https://drive.google.com/uc?export=view&id=" + file.getId();
  const sh = ensureSheet("Photos", ["id", "personId", "personName", "url", "caption", "ts"]);
  sh.appendRow([Date.now(), body.personId, body.personName, url, body.caption || "", Date.now()]);
}
