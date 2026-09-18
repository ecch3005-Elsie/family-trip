# Phase 4 Final｜2026/9/26 正式出發版封存

## 1. 專案名稱

瓦特鎮家族｜2026 雲林二日機車小旅行

## 2. 系統名稱

家族導覽網站

## 3. 封存版本

Phase 4 Final｜2026/9/26 正式出發版

## 4. 封存日期

2026/9/18

封存起算：

- 不再新增功能
- 不再重構核心
- 不再進行完整 Day 1 / Day 2 測試
- 除非正式旅行資訊異動或發現阻斷使用的 bug，否則不再修改正式版
- 後續效能優化留待旅行結束後處理

## 5. 正式網站 URL

- 前端（GitHub Pages）：https://ecch3005-Elsie.github.io/family-trip/index.html
- GAS Web App：`config.trip2026.js` 的 `TRIP.webappUrl`  
  `https://script.google.com/macros/s/AKfycbzeocoHvNHF4HRVwGSf_wGYs_R_lKsNsAHy_thyvrXwEwERdDcjfNTWAIGhNSfVUo8-cA/exec`
- Push Relay：Cloudflare Worker `family-trip-push-relay`

說明：本機工作區為本次封存對照的程式來源。這幾輪開發依指示均未部署；Pages 上線檔是否已含 2026/9/18 最後修改，需由管理者另行確認。

## 6. 正式檔案／架構

| 路徑 | 角色 |
|---|---|
| `index.html` | 前端主程式（React + Babel standalone） |
| `config.template.js` | 母版：家人、顏色、管理者、任務定義 |
| `config.trip2026.js` | 2026 行程、集合點、GAS URL、pollMs |
| `manifest.json` | PWA |
| `service-worker.js` | Push（不做離線快取） |
| `apps-script/Code.gs` | GAS 後端 |
| `cloudflare-worker/` | Push relay / VAPID |
| `images/trip-route-map.png` | 正式旅行地圖（URL `?v=20260917`） |
| `icon-192.png` / `icon-512.png` / `logo.png` | PWA／品牌圖 |

非執行期檔：`preview-phase4-ui.html`（舊 UI 預覽，非正式 PWA 入口）。未刪除。

本機工作區**沒有 `.git` 目錄**，此台電腦也找不到 `git.exe`，因此無法在此環境執行 `git status`／commit／tag。

## 7. Phase 4 Final 已完成功能（對照程式）

### 報到

- 9 位家人（`FAMILY`）
- 出發報到／到家報到
- 報到人數統計（`n/9`）

### Day 1 猜謎

- 猜總里程＋猜抵達茗鎮時間
- 出發後鎖定（`setStop` 且 `idx >= 0` 時寫入 `guessLocked`）
- 結果／今日之星；無人猜時「今日之星從缺」
- `ReviewTab` 仍顯示 Day 1 結果

### Day 1 里程挑戰

- `currentStop = -1` 即可顯示「🚦 準備出發」，**不要求 9/9**
- 全員可見起始里程／出發時間
- 僅 `ADMIN_SHEET_IDS = ["walter", "xiang"]` 可輸入並按「🏍️ 出發囉！」
- 一般家人欄位唯讀，顯示「等待 Walter／阿享設定出發資料」
- `saveDay1Start` 仍 `requireAdmin`
- 抵達茗鎮輸入終點里程＋抵達時間
- 實際總里程 = 終點 − 起始，再進揭曉／今日之星

### 旅程／地圖／訊息／PWA

- Day 1 → Day 2 既有站序與「🌙 Day 1 行程完成」→「🏍️ Day 2 民宿出發」
- 正式旅行地圖；Day 2 民宿出發卡片 `noNav: true`；Day 1 茗鎮導航仍保留
- 同檔名地圖以 `images/trip-route-map.png?v=20260917` 避開 PWA cache
- 家人想說、快速訊息、公告、紀錄、MessageAcks、PushSubscriptions、iPhone PWA Push、senderName、Cloudflare Worker / VAPID
- `family-trip-who`；`?who=` 優先、localStorage fallback
- Safari POST 使用 `Blob` + `text/plain`

## 8. Day 1 猜謎與里程流程

1. 集合（`currentStop = -1`）：報到頁可猜；旅程頁可看準備出發區。  
2. 管理者「出發囉！」：`saveDay1Start` → `setStop(0)` → 鎖定猜測。  
3. 行程前進至茗鎮（stop 3）：管理者輸入抵達里程／時間並揭曉。  
4. `calculateStar`：`score = 里程絕對誤差 + 時間絕對誤差（分鐘）/ 10`，分數低者勝。  
5. 報到頁 GuessSection 顯示結果／排行；無人猜則從缺。

## 9. Day 1 → Day 2 currentStop 邏輯

程式常數（請勿改站序）：

- `DAY1_LAST_ID = 5`（華山會館）
- `DAY2_START_ID = 6`（民宿出發）

`currentStop === 5`：顯示「🌙 Day 1 行程完成」，等待管理者「🏍️ Day 2 民宿出發」。  
按下後：`setStop(6, …, startDay2: true)`，`currentStop = 6`。

## 10. Day 2 顯示規則

Day 2 為純旅程進度，不做第二輪猜里程。

報到頁：`progress.currentStop >= DAY2_START_ID` 時**不渲染**整個 `GuessSection`。

- 只隱藏 UI  
- 不刪 Guesses、day1Result、Day 1 里程／今日之星  
- `ReviewTab` 仍保留 Day 1 回顧  

`currentStop === 5`（Day 1 完成、尚未民宿出發）仍顯示 GuessSection 結果。

## 11. 旅行小 Memo 正式內容

`TravelMemoCard`（`index.html`）：

1. **早餐｜9 人**：大哥、清文、紅艷、哈哈、肉粽、亦庭、亦呈、阿勳、阿享  
2. **餐廳訂位**  
   - Day 1 18:00 華山會館  
   - Day 2 12:30 山中美食館  
   - Day 2 17:30 東悅坊  
3. **旅平險**  
   - 投保：500／50  
   - 意外身故／完全失能 500 萬  
   - 意外傷害醫療 50 萬  
   - 聯絡人：劉珠玲　0915-357817  
   - `href="tel:0915357817"`

資料概念分開、不可互相覆蓋：

- 行程預計抵達山中美食館：`STOPS` id 9 **12:00**  
- 正式訂位時間：Memo **12:30**

## 12. PWA / Push 狀態

- `manifest.json` short_name「瓦特鎮家族」，standalone  
- SW：install/activate、push、notificationclick；無離線頁面快取  
- 身分：`family-trip-who`；URL `who` 優先  
- POST：`Blob` + `text/plain`（避免 Safari charset preflight）  
- Worker：`family-trip-push-relay`；本機密鑰在 `cloudflare-worker/.local/`（勿提交）

## 13. 初次同步 polling 改善

`App` 的 `[myId]` effect：

1. `myId` 就緒  
2. 第一次 `fetchAll()`  
3. 完成（成功或失敗）後才 `setInterval(fetchAll, POLL_MS)`（4000ms）  
4. cleanup：`cancelled` + `clearInterval`

目的：避免第一次 GAS GET 未完成時，4 秒 polling 再送第二包 `buildPayload()`。  
本次封存不再做其他效能優化。

## 14. 正式出發初始狀態

預期（依管理者所述清理結果；封存當下**未再對 Sheet 做寫入測試**）：

- 0/9 報到  
- `currentStop = -1`  
- 旅程狀態 = 集合中  
- Day 1 尚未開始  
- 無測試用起始／終點里程與時間  
- 無測試用 Day 1 finalized  
- `guessLocked` 為可猜  

2026/9/18 本機瀏覽器最後一次觀察（`?who=walter&tab=journey`）：畫面為「🟢 集合中」「0/9 人報到」與準備出發輸入區，與上述一致。未再按出發／揭曉／reset。

## 15. 已知觀察事項

記錄、本次不修：

1. 慢網路時「更新中…」可能較久，資料後來仍可能寫入成功。  
2. GAS `buildPayload()` 初次 GET 仍偏重。  
3. Progress 在 `buildPayload` 中重複讀取。  
4. 部分 GET 路徑有 `setNumberFormat` 寫入（Guesses、PushSubscriptions）。  
5. 後續 polling 仍是 `setInterval`；旅行後可評估 sequential polling。  
6. Babel standalone 可於旅行後評估改預編譯。

## 16. Post-Trip / Phase 5 候選

全部標示：**旅行後再評估，不屬於 2026/9/26 正式出發版。**

- GAS `buildPayload` 效能整理  
- Progress 單次讀取  
- GET 路徑移除不必要 Sheet 寫入  
- sequential polling  
- Babel 預編譯  
- 慢網路 loading / timeout / recovery UX  
- 正式旅行資料與使用紀錄整理  
- 是否保留此網站作為未來家族旅行模板  

## 17. 封存後修改原則

僅在以下情況才改正式版：

- 正式旅行資訊異動（時間、地點、訂位、保險、聯絡電話）  
- 阻斷使用的 bug  

不要：新功能、核心重構、完整 Day 1/Day 2 測試、出發前效能大改、未明確要求就 deploy／tag／push。

---

## Git／工作區檢查（2026/9/18）

- 本機專案路徑：`C:\Users\USER\Projects\family-trip`  
- **沒有 `.git`**，也沒有可用的 `git.exe`  
- 無法執行 `git status`、無法確認 remote／tag 命名慣例  
- 無法判斷「是否已 commit」；本機即目前正式版程式工作複本  
- 未擅自刪除檔案  

建議（需有 Git 的環境、且使用者明確要求後才執行）：

- Commit message：`chore: archive Phase 4 Final 2026 trip release`  
- Tag（無既有規則時）：`phase4-final-20260918`  
- **本次不 push、不建立 tag、不重新部署**

## 標記建議

本機程式與上述封存描述一致，可作為：

**Phase 4 Final｜2026/9/26 正式出發版｜SEALED（本機工作區）**

上線 Pages 是否已與本機同步，須管理者確認後再視為「已上線封存」。
