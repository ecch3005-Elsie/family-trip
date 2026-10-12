# 瓦特鎮家族｜交接與維護紀錄

這份文件對應正式版本 **6d2**、Git commit **`d38abe1`**。  
寫給之後用 VS Code 維護的人。網站怎麼運作，以這個 Git 倉庫裡的程式為準。

文件裡不放密語、權杖、試算表編號或推播私鑰。那些值只留在 Google 與 Cloudflare，不要抄進檔案、聊天或 Git。

---

## 1. 專案基本資料

瓦特鎮家族網站給九位家人一起看同一趟旅行。手機可以加到主畫面，打開後報到、看行程、導航、拼圖、看公告。

| 項目 | 內容 |
| --- | --- |
| GitHub 倉庫 | https://github.com/ecch3005-Elsie/family-trip |
| 正式分支 | `main` |
| 正式網站 | https://ecch3005-elsie.github.io/family-trip/ |
| 這一次旅行 | https://ecch3005-elsie.github.io/family-trip/danayigu/ |
| 雲林歷史頁 | https://ecch3005-elsie.github.io/family-trip/yunlin/ |
| 正式版本 | `6d2` |
| 正式 commit | `d38abe1`（完整識別 `d38abe1613c02efab26d43b763be2e2adff4c1cd`） |

這台電腦上有兩個資料夾，不要混用：

- `C:\Users\USER\Projects\family-trip-publish`  
  這是 Git 倉庫，也是 GitHub Pages 的來源。VS Code 請開這個資料夾。
- `C:\Users\USER\Projects\family-trip`  
  這是舊的工作副本，**不是 Git 倉庫**。測試、達娜伊谷 Apps Script 原始碼、Cloudflare 推播程式在這裡。GitHub 上沒有這些檔。

雲林是 2026 年 9 月已結束的歷史旅程，整包放在 `yunlin/`，只供回顧。達娜伊谷是現在這一次旅行。根目錄入口會自動前往 `entry-preview/trips.js` 裡 `current` 指定的旅行；現在是 `danayigu`。兩趟旅行不要共用同一份試算表。

---

## 2. 網站架構與重要檔案

客人打開正式網址時，根目錄 `index.html` 只顯示「正在前往這一次旅行」，然後依旅行清單轉到達娜伊谷。iPhone 主畫面圖示的起點是這個根目錄頁面，不是直接開達娜伊谷資料夾。

根目錄 `manifest.json` 的名稱仍是「瓦特鎮家族｜2026 雲林小旅行」，`start_url` 是 `./index.html`。圖示檔是 `icon-192.png`、`icon-512.png`。這次發布沒有改它們。

### `danayigu/` 主要檔案

| 檔案 | 用途 |
| --- | --- |
| `index.html` | 頁面、六個分頁、文字大小、Vespa 圖的位置。版本寫在 `data-build="6d2"`。 |
| `shell.js` | 分頁、報到送出、地圖連結、公告與留言、成就顯示、回顧開關。 |
| `trip-data.js` | 行程名稱、日期、集合地點、停靠站、導航用字、快捷短句。 |
| `vespa.png` | 同一張黃色偉士牌，用在頁首、報到標題旁、回顧頁。 |
| `guard.js` | 檢查頁面和腳本是不是同一版。版本不合就不會送出。 |
| `who.js` | 判斷現在要顯示哪一位家人。它不自己寫入手機儲存。 |
| `score.js` | 拼圖成績怎麼比。時間短的優先，時間相同則步數少的優先。 |
| `config.js` | 九位家人名單，以及連到哪一個 Google 網頁應用程式。 |
| `clock.js` | 拼圖計時。開始後沒有暫停。 |
| `checkin-view.js` | 報到人數與圓環的演算法。不連線。 |
| `test-image.png` | 拼圖用的圖。`config.js` 的 `photo` 指向它。 |

頁面大約每 4 秒讀一次正式資料（`config.js` 的 `pollMs` 是 4000）。

### 其他資料夾

- `yunlin/`：雲林歷史頁。`readonly.js` 會擋住寫入，只留讀取。
- `entry-preview/trips.js`：正式入口清單。`current` 是 `danayigu`，`tripRoot` 是 `"./"`。
- `entry-preview/trips.preview.js`：只給測試用的入口頁。不要拿去換掉 `trips.js`。
- `entry-preview/entry.js`：依照清單算出要去哪個資料夾。網址可以帶已知的家人代號，不接受外站網址。
- 根目錄 `service-worker.js`：負責通知。它不安裝離線快取。達娜伊谷頁面註冊的是上一層這支檔案。
- 根目錄 `apps-script/Code.gs`：舊網站留下的程式，**不是**現在達娜伊谷在用的那一份。不要把它貼進達娜伊谷的 Google 專案。
- 根目錄 `config.trip2026.js`、`config.template.js`：雲林時代的設定，達娜伊谷不讀它們。
- `Phase4_Final_20260918_正式出發版封存.md`：雲林封存說明，不是達娜伊谷的操作手冊。

### 不要覆蓋或刪除

改達娜伊谷時，不要一併上傳或刪除：

- 根目錄 `index.html`
- `manifest.json`
- `service-worker.js`
- `logo.png`、`icon-192.png`、`icon-512.png`
- `entry-preview/trips.js`
- 整個 `yunlin/`
- 根目錄 `trip-route-map.png`
- Google 上的達娜伊谷 Apps Script、試算表，以及雲林試算表

`logo.png` 曾有過另一張較小的圖。正式網站用的是現在倉庫裡這張。不要用別的資料夾裡的 logo 蓋過去。

---

## 3. 九位家人的身分機制

名字與代號寫在 `danayigu/config.js` 的 `family`。代號要和試算表一致。

| 畫面上的名字 | 代號 |
| --- | --- |
| Walter | `walter` |
| 文 | `wen` |
| 艷 | `yan` |
| Money | `money` |
| 享 | `xiang` |
| 心 | `xin` |
| 肉粽 | `rouzong` |
| 庭 | `ting` |
| 呈 | `cheng` |

手機用瀏覽器的 `localStorage` 記兩把鑰匙：

- `family-trip-who`：跨旅行共用的身分。根目錄入口和達娜伊谷都看這把。
- `danayigu-who`：達娜伊谷較早使用的鑰匙，現在仍一起保留。

兩把都是同一位家人時，頁面直接打招呼，九個名字先藏起來。  
兩把都空的，或都不是這九人時，請這個人點一次自己的名字。點了以後兩把鑰匙寫成同一人。  
兩把是不同的人，或網址上的 `?who=` 和手機裡保存的人不一樣時，頁面列出名字並請本人點一次。點下去之前，不送報到、留言或成績。

頁面不會刪除這兩把鑰匙。維護時不要清家人的瀏覽器資料，也不要叫大家刪掉主畫面圖示再重裝。主畫面圖示和瀏覽器分頁若是同一個網站來源，才看得到同一組身分。

---

## 4. 主要功能

六個分頁：報到、旅程、地圖、拼圖、成就、回顧。

**出發與到家。** 已經確認身分後，按「👋 我到啦！」或「🏠 到家啦！」會直接送出，不再問第二次。送出的是這支手機上這個人，不是別人。連點會先被擋住。成功會寫「已送出。其他手機也會看到。」失敗會寫「報到維持原狀。」若這個人已經有該筆記錄，再按一次是取消；取消仍要按「確認取消」，而且只清掉那一個時間。

**九人進度。** 報到頁顯示幾位已經出發、幾位已經到家。其他手機約 4 秒後會讀到同一份名單。

**家族公告與想說的話。** 旅程頁有公告區，也有家人短句。短句最長 80 字，公告最長 120 字。公告寫入成功後，才請既有的推播服務代送通知。推播失敗時，公告仍然算已送出。同一則公告重試時，不會再送一次通知。點通知會開到達娜伊谷的家族公告。iPhone 要先用主畫面圖示打開，再按「開啟通知」，系統才允許訂閱。

**地圖。** 停靠順序在 `trip-data.js`。現在是七站：好食包、台灣中油甲仙站、達娜伊谷、厚殼仔、台灣中油吳鳳站、台灣中油內門站、里港飽渴夢。導航用 Google 地圖開車路線，網址由店名和地址組成，不另存一整條固定網址。頁面上有一句提醒：Google 可能用汽車路線，出發前要確認機車可以走。茶山、楠西不在這次導航裡。

**拼圖。** 有 3×3 與 4×4。成績送到達娜伊谷自己的試算表。

**成就。** 九格裡，目前只有「全員到齊」和「全員到家」會依九個人的報到點亮。其餘七格保留文字，這次沒有對應資料，不會點亮。拼圖冠軍不在成就格裡公布。

**回顧。** `shell.js` 把開放時間訂在台灣時間 **2026 年 12 月 27 日 00:00**。在那之前，回顧頁只顯示「旅行回顧將在 12/27 開放」。回顧正文先藏著，所以那張 Vespa 在開放前看不到，這是預期結果。

結束拼圖比賽的按鈕只在帶有管理者連結的那一次畫面出現。那個動作會呼叫 `closeContest`。比賽一旦結束，就不再收新成績。日常維護不要按它，程式和測試也不要對正式網站呼叫它。

---

## 5. 外部服務與資料

三個服務各做一件事：

1. **GitHub Pages** 只負責把這個倉庫的網頁給大家打開。
2. **Google Apps Script 加 Google 試算表** 負責報到、留言、公告、拼圖成績、推播訂閱。達娜伊谷用自己的試算表，不讀雲林的旅行內容。
3. **Cloudflare Worker** 負責把公告轉成手機通知。達娜伊谷沿用雲林已經在用的那一個 Worker，沒有另建第二個。

網頁只保存 Apps Script 的 `/exec` 網址，位置在 `danayigu/config.js` 的 `webappUrl`。不要改成雲林的網址，也不要把網址清空。檔案開頭的註解仍寫「先保持空白」，那句註解已過時；以現在檔案裡的網址為準。

### 指令碼屬性

只記名稱。值由 Elsie 在 Google「專案設定 → 指令碼屬性」維護，不要寫進網頁或 Git。

| 名稱 | 用途 |
| --- | --- |
| `DANAYIGU_SPREADSHEET_ID` | 這次達娜伊谷試算表是哪一份。 |
| `DANAYIGU_ADMIN_TOKEN` | 管理者連結用的權杖。由 Apps Script 裡的 `rotateDanayiguAdminToken` 產生，不手打進檔案。 |
| `PUSH_RELAY_URL` | 既有 Cloudflare 推播服務的網址。與雲林同一組。 |
| `PUSH_RELAY_SECRET` | 呼叫那個推播服務時用的密語。與雲林同一組。 |
| `YUNLIN_PUSH_SPREADSHEET_ID` | 雲林試算表。只讀它的 `PushSubscriptions`，不改雲林的列。 |

Cloudflare 那邊另外有環境變數，名稱是 `PUSH_RELAY_SECRET`、`VAPID_PUBLIC_KEY`、`VAPID_PRIVATE_KEY`、`VAPID_SUBJECT`。私鑰只放在 Cloudflare。網頁裡有一把公開金鑰，瀏覽器用它來訂閱；這份交接文件不重抄那串文字。

### 試算表分頁

達娜伊谷程式在需要時自己建立這些工作表：`Checkins`、`Messages`、`Announcements`、`PuzzleScores`、`Contest`、`PushSubscriptions`、`PushExpired`。不要手動改欄位，也不要刪列來「整理」。

舊的雲林訂閱這樣沿用：發公告時，先讀達娜伊谷自己的 `PushSubscriptions`，再只讀雲林試算表裡仍有效的訂閱，依通知位址去掉重複。過期的位址只追加到達娜伊谷的 `PushExpired`。雲林那一列維持原樣。

Apps Script 的正式程式由 Elsie 親自貼上、親自部署。AI 或 VS Code 都不要自動部署、不要新建另一個網頁應用程式網址。要更新時，在 Google 編輯器對**現有部署**發行新版本，網址才能維持不變。本機原始碼在 `C:\Users\USER\Projects\family-trip\danayigu\apps-script\`，不在 GitHub 倉庫裡。若那個資料夾遺失，正式程式只剩 Google 上的那一份。

授權範圍是試算表，以及對外網址請求（用來呼叫推播）。執行身分是部署者，存取是任何人可開。這是網頁能匿名讀寫所需要的設定，不代表每一支手機都已登入。

---

## 6. 未來更新旅行的方式

### 只改這一次的行程文字或圖片

1. 先 `git pull`，確認仍從已知的正式 commit 往下改。
2. 集合地點、地址、日期、停靠站：改 `danayigu/trip-data.js`。集合地點要同時改 `meeting` 和第一個停靠站，店名與地址維持 Google 地圖上核對過的寫法。
3. 頁面開啟後，`shell.js` 會用 `trip-data.js` 蓋過頁首標題、集合地點、地址、時間和旅程頁的集合字。報到頁那一行標題寫在 `danayigu/index.html`，若旅行名稱要改，HTML 那一行也要一起看。
4. 換偉士牌圖時，仍用檔名 `vespa.png`，並維持透明背景的 PNG。三處共用這一張，不要改成會擋到文字的大圖。
5. 拼圖圖改 `test-image.png`，或連同 `config.js` 的 `photo` 一起改。不要動根目錄 `logo.png`。
6. 改了 `danayigu/` 任一支出現在畫面上的程式，版本字要全部一起換新，不能只改其中一個檔。要同時改：
   - `index.html` 的 `data-build`
   - 八個 `<script src="...?build=` 
   - `index.html` 裡 `readyForPage` 與 `claim("page"` 的版本
   - `guard.js` 的 `BUILD`
   - `shell.js` 的 `SHELL_BUILD`
   - `score.js`、`config.js`、`trip-data.js`、`clock.js`、`who.js`、`checkin-view.js` 最後的 `claim` 版本

版本不一致時，頁面會拒絕送出。`?build=` 只是讓手機少用舊快取，不能代替上面的檢查。

### 建立下一趟旅行

不要刪掉 `danayigu/` 或 `yunlin/`。新增一個新的資料夾，例如下一趟自己的名字。

然後只改 `entry-preview/trips.js`：

- 把 `current` 改成新旅行的 id。
- 在 `trips` 加一筆 `id` 與 `path`。
- 達娜伊谷結束後，把它標成 `historical: true`，讓入口改去新的一趟。

可以留著繼續用的部分：九人代號、`family-trip-who`、版本檢查的做法、報到與取消的差別、根目錄 Service Worker、主畫面圖示與 `manifest.json`。不必為了新旅行重做主畫面圖示，也不必叫家人重選名字。

新旅行若要自己的報到與成績，就要另開一份試算表、另外部署 Apps Script，再把新的 `/exec` 網址寫進那一趟自己的設定。這一步仍由 Elsie 在 Google 上手動完成。推播繼續用同一個 Cloudflare 服務時，不要新做一把 VAPID 私鑰。

---

## 7. 用 VS Code 接手

### 開啟專案

1. 安裝 [VS Code](https://code.visualstudio.com/) 與 [Git for Windows](https://git-scm.com/download/win)。這台電腦的 Git 已在 `C:\Program Files\Git\cmd\git.exe`。
2. VS Code 選「檔案 → 開啟資料夾」，開 `C:\Users\USER\Projects\family-trip-publish`。
3. 換一台電腦時，在終端機執行：

```powershell
git clone https://github.com/ecch3005-Elsie/family-trip.git
```

克隆下來的資料夾就是之後的正式副本。工作副本裡的測試和 Apps Script 不會跟著克隆出現。

### 修改與本機預覽

用 VS Code 編輯後，可用「Live Server」這類外掛，或在倉庫資料夾執行靜態網站預覽。不要用檔案總管直接雙擊 HTML，Service Worker 與連線需要 `http://` 網址。

正式副本裡的 `webappUrl` 指到真正的試算表。本機預覽仍會讀正式資料。預覽時不要按報到、公告、開啟通知或結束比賽。

### 執行既有測試

測試不在 Git 倉庫。在工作副本執行，而且測試自己開瀏覽器、攔截對外送出，不會幫你打正式報到：

```powershell
cd C:\Users\USER\Projects\family-trip
node danayigu/dev/version-guard.test.js
```

其他測試也在 `danayigu\dev\` 與 `entry-preview\dev\`，檔名以 `.test.js` 結尾，同樣用 `node` 執行。它們需要本機已安裝的 Chrome，以及 `%TEMP%\e3-browser\node_modules\puppeteer-core`。  
`danayigu/dev/release-pack.test.js` 會寫出發布包，平常不要跑。

### 看 Git 差異

在 `family-trip-publish` 裡：

```powershell
git status
git diff
git diff --stat
```

送出前確認清單裡只有這次要改的檔。若出現根目錄入口、`manifest.json`、Service Worker、logo、圖示、`entry-preview/trips.js` 或 `yunlin/`，先停下來，不要一併提交。

### 提交、推送、確認 Pages

確認遠端 `main` 沒有被別人推進去之後，只加入這次的檔案：

```powershell
git add 這次要提交的檔案
git commit -m "說明這次為什麼改"
git push origin main
```

不要使用 `git push --force`。GitHub Pages 直接使用 `main`，沒有另外一個部署按鈕。推送後隔一小段時間，打開：

https://ecch3005-elsie.github.io/family-trip/danayigu/index.html

在頁面原始碼搜尋 `data-build`，確認已是這次的版本。這台電腦目前沒有 `gh` 指令，所以不以 GitHub API 的建置編號為準，以這個正式網址的內容為準。

---

## 8. 已知限制與待驗證事項

### 已在 2026-10-12 用正式網址做過唯讀檢查

檢查時沒有送出報到、公告、推播，也沒有呼叫 `closeContest`，沒有清除身分。

已通過的項目：原入口仍進達娜伊谷；好食包地址與 Google 導航還在；黃色 Vespa 三處都是 PNG；文字縮放是 1.15；六個分頁都在頁面上；回顧仍寫 12/27；新的出發與到家不再二次確認，取消仍要確認；九人身分鑰匙還在；家族公告區塊在；雲林歷史頁開得了；頁面、八個腳本與版本檢查都是 `6d2`；Apps Script 仍用原來的部署網址；主畫面圖示的起點檔沒有被這次 commit 改掉。

### 尚待真人用 iPhone 確認

- 原本的主畫面圖示仍打開同一個入口，不必刪除重裝。
- 已經選過名字的手機，不會再先看到九個名字。
- 時間與電量沒有蓋住標題，六個分頁在手機上仍是一行。
- 「我到啦」「到家啦」的確不再先跳出確認。若要真的送出一筆報到，需另外同意。
- 公告推播要等 Elsie 明確同意後，才做一次真的發送。要同時看舊的雲林訂閱與新的達娜伊谷訂閱有沒有收到，點開後是否到家族公告。

### 其他已知事項

- Apps Script 只檢查代號是不是九人之一。它沒有手機登入階段。真正「不能幫別人報到」是網頁在送出前擋住；知道網址的人仍可能直接呼叫 Apps Script。這是現況，不是這次發布才出現的缺口。
- 通知網址若帶了另一個人的 `who`，手機會進入身分確認，這是既有的保護，不是故障。
- 集合時間仍是「尚未確定」。晚餐站在資料裡標成尚未完全定案。
- 隔天的成就回饋尚未開放。對 Apps Script 送 `submitFeedback` 會被拒絕。
- 回顧開放前，回顧區裡的 Vespa 處於隱藏狀態。
- `manifest.json` 的全名仍寫雲林。若要改名，可能影響已經加到主畫面的名稱，先由真人決定。
- 公開的推播金鑰在 `danayigu/index.html`。這是訂閱所需，不是私鑰。不要把 Cloudflare 或 Apps Script 的密語加進這個檔。

---

## 9. 日常維護

1. 用 VS Code 開啟 `family-trip-publish`。
2. `git pull`，看 `git log -1 --oneline` 是不是預期的正式版本。
3. 只改這一趟需要的檔。行程文字優先改 `trip-data.js`。
4. 若改了會被載入的程式，整個版本字一起換。
5. 本機看畫面時，不要按會寫入正式資料的按鈕。
6. `git status` 與 `git diff` 確認沒有多出來的檔。
7. 提交並 `git push origin main`。
8. 打開正式網址，核對 `data-build` 和剛改的那一句文字。
9. Apps Script 有改動時，先改本機 `family-trip\danayigu\apps-script\`，再由 Elsie 貼上 Google 並更新**現有**部署。不要把密語交回 Git。

---

## 10. 故障時回到 6d2

先看現在在哪裡：

```powershell
git fetch origin
git status -sb
git log --oneline -5
```

- 改壞了但還沒提交：`git restore -- 檔案路徑` 可以丟掉該檔尚未提交的修改。
- 已經提交、還沒推送：用 `git revert` 產生一筆新的還原 commit。不要用會改寫歷史的強制指令。
- 已經推上 `main`、正式網站也壞了：同樣 `git revert` 那一筆有問題的 commit，再平常地 `git push origin main`。不要 `push --force`。
- 只想把某幾個檔案收回 `d38abe1` 的內容：

```powershell
git checkout d38abe1 -- danayigu/index.html
```

把路徑換成實際要收回的檔，然後當成一筆新的 commit 推上去。這樣歷史仍留下「曾經改過、又收回」的紀錄。

`d38abe1` 這一筆只包含達娜伊谷那 10 個檔。入口、圖示、雲林與 Service Worker 在更早的 commit 裡，回復達娜伊谷時不要順便還原那些路徑。
