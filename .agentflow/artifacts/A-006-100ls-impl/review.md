* _2026-10-13 15:10:49 +0800 (Opus 5.5/inherited)_

Reviewed commit: 1f8b5aa4340a1f3b66f01b789b116dc592634fa4

**摘要**

- **結論：要退回修正一項。** 安全修正（只准跑固定查詢）做得紮實，找不到繞過方法；測驗頁原有的資料庫寫入語意和舊版一致；沒有新增改資料庫結構的指令，也沒有新的寫入管道。

- **重大問題：** 用 YouTube 片段練習時（Q2 決定的主要來源），學習頁仍拿資料庫裡「整部電影」的字幕時間去對 YouTube 片段。結果是字幕顯示錯句，逐句清單的「播放」也會跳到錯的位置。設計第 3.2 節明確說 YouTube 來源拿不到字幕時間點，要以 A-B 重複和 YouTube 內建字幕為主。

- **缺少的證據：** 自動測試用的假 YouTube 播放器一建立就能操作，所以測不到真實 YouTube「載入完成前的指令會被忽略」這種情況（見建議 S-1）。真實 YouTube 影片仍需要你手動試一次，這點設計本來就有要求。

- **下一步：** 修正 B-1（YouTube 來源時不顯示資料庫字幕、不提供依資料庫時間的逐句播放），補一個 Playwright 檢查後重新審查。其餘都是建議，不擋交付。

Outcome: BLOCKING

Minimality: PASS

Conformance: PASS

Verdict: BLOCKING

## 發現事項

### B-1（BLOCKING）YouTube 來源套用整部電影的字幕時間，字幕錯句、逐句播放跳錯位置

- **檔案與行號：** `src/pages/LearnPage.jsx` 第 94、252–256 行（字幕顯示）、第 121–124 行（`playLine`）、第 356–371 行（逐句清單）。

- **觸發情境：** 選 Inception，貼上一支官方 YouTube 片段（例如 2 分鐘的預告），進入步驟 3 或步驟 4。

- **影響：**

  - 步驟 3：畫面下方的英文字幕是「電影第 0:30 秒的台詞」，不是片段第 0:30 秒聽到的台詞。點字加入生字本時，存下的原句和耳朵聽到的不一致。

  - 步驟 4：逐句清單的「▶ 播放」會把 YouTube 片段跳到電影時間（例如 1:05:12），通常已經超過片段長度，等於按了沒有作用。

  - 這是 Q2 決定的主要使用路徑，使用者第一次用就會遇到。

- **證據：**

  - 字幕顯示的條件只看步驟（`showEnglish && currentIndex >= 0`），完全沒有判斷 `source.type`。

  - `playLine` 只要有來源就用 `line.start + offset` 去跳轉，YouTube 和本機一視同仁。

  - 設計第 3.2 節「來源一」寫明：「拿不到別人影片的字幕時間點，所以 YouTube 來源以 A-B 重複為主……字幕顯示改用 YouTube 播放器內建的字幕開關」。資料庫字幕時間只列在「來源二：自己電腦裡的影片檔」底下。

  - 字幕微調只能每次 ±0.5 秒，沒辦法補償片段和整部片之間幾十分鐘的落差。

  - `e2e/learn.spec.js` 的 AC-9 測試只檢查 A-B 段落，沒有檢查 YouTube 來源下的字幕顯示和逐句播放。

- **建議做法（最小修正）：**

  1. `source.type === 'youtube'` 時，字幕區改顯示一行提示，例如「YouTube 來源請用播放器的 CC 按鈕看字幕」，不顯示資料庫字幕。

  2. 同一情況下，逐句清單的「播放」改用已有的電腦朗讀（`speak`），或隱藏播放按鈕並提示改用 A-B 重複；步驟 3 的字幕清單仍可點字加入生字本。

  3. 在 AC-9 的 Playwright 測試加一個斷言：YouTube 來源時，字幕區不出現資料庫台詞。

### S-1（建議）YouTube 播放器載入完成前設定的速度和字幕開關會被忽略

- **檔案與行號：** `src/pages/LearnPage.jsx` 第 88、91 行；`src/components/learn/VideoPlayer.jsx` 第 45–51、62–75 行。

- **觸發情境：** 先在本機影片選 0.75 倍，再切到 YouTube；或在步驟 1 開啟一支曾經開過字幕的 YouTube 影片。

- **影響：** 速度按鈕顯示 0.75 倍，影片實際用 1 倍播放；步驟 1、5 可能仍顯示 YouTube 字幕。要再按一次速度按鈕才會生效。

- **證據：** 速度和字幕的設定只在「來源改變」或「速度、步驟改變」時送出一次。真實 YouTube 播放器要等「準備好」（onReady）之後才有 `setPlaybackRate` 等方法，程式用 `?.` 呼叫，所以在那之前的指令會被靜靜略過。假播放器一建立就有這些方法，所以自動測試抓不到。

- **建議做法：** 在 `YT.Player` 的 `onReady` 事件裡，補送一次目前的速度和字幕開關。

### S-2（建議）匯入格式只檢查外層，內容壞掉的進度檔會讓學習頁和統計頁持續出錯

- **檔案與行號：** `src/utils/progress-store.js` 第 21–26、117–127 行；`src/hooks/useProgress.js` 第 8–11 行。

- **觸發情境：** 匯入一個帶有正確 `app` 標記、但某部片的 `segments` 是 `null`、`vocab` 裡有 `null` 的檔案（例如手動編輯過）。

- **影響：** 檔案會通過檢查並寫入瀏覽器儲存空間。之後每次打開學習頁或統計頁都會因為 `.map`、`.includes` 讀到 `null` 而整頁空白，只能手動清除瀏覽器資料。專案沒有錯誤邊界（ErrorBoundary，React 用來接住畫面錯誤的元件），所以不會顯示提示。

- **證據：** `normalize` 只檢查 `movies` 是物件、`vocab` 是陣列，沒有檢查每部片的欄位型別；`getMovie` 直接把存檔內容蓋在預設值上。

- **補充：** 匯入是「整份取代」，而且沒有確認步驟。在新電腦上匯入舊檔，會蓋掉這台電腦原有的進度。這符合 Q5 換電腦的用途，但建議加一個「將取代目前所有進度」的確認視窗，呼應 INV-2「進度不會遺失」。

- **建議做法：** 在 `normalize` 逐部片檢查欄位型別（陣列、物件、數字），不合格的欄位改回預設值；`vocab` 過濾掉不是物件的項目。

### S-3（建議）錄音中離開頁面，麥克風不會關閉

- **檔案與行號：** `src/components/learn/Recorder.jsx` 第 11、13–30 行。

- **觸發情境：** 按「錄音」後，沒有按停止就切到別的步驟或回首頁。

- **影響：** 瀏覽器分頁上的麥克風圖示會一直亮著，直到關閉分頁。錄音不會上傳，所以不違反 INV-1，但使用者會擔心。

- **建議做法：** 元件卸載時，若還在錄音，就呼叫 `stop()` 並關閉音訊來源。

### S-4（建議）整部電影字幕很長時，每 0.1 秒重畫一次整份逐句清單

- **檔案與行號：** `src/pages/LearnPage.jsx` 第 76–86 行（每 0.1 秒更新 `time`）；`src/components/learn/LinePanel.jsx` 第 35–71 行。

- **影響：** 一部電影約有 1,000 到 2,000 句字幕。每 0.1 秒整頁重畫，等於每秒重建上萬個按鈕，較慢的電腦可能卡頓。測試用的假字幕只有 3 句，所以看不出來。

- **建議做法：** 用 `React.memo` 包住 `LinePanel`，或只在「目前這一句」改變時才更新畫面。

### S-5（建議，原本就有的問題）伺服器錯誤訊息、既有寫入查詢、舊文件

- **錯誤訊息外洩：** `api/query.js` 第 47 行回傳資料庫原始錯誤訊息，`cloudflare-worker/src/index.js` 回傳 Turso 的錯誤內容（`details`）。改成白名單後，外人只能用參數型別觸發錯誤，能看到的資訊很少。這是舊行為，不在這次範圍。

- **既有寫入仍對外開放：** 白名單保留測驗頁原有的 11 個寫入查詢（例如 `mastery.update` 可以指定任何 `user_id`，`quiz.completeSession` 可以指定任何 `id`）。網站沒有登入，所以知道網址的人仍可改寫這些表格的內容。這是為了 INV-3 必須保留的舊行為，但已經不能刪表或跑任意 SQL。之後若要再收緊，需要另外規劃登入。

- **文件過期：** `cloudflare-worker/README.md` 仍寫著 `{ "sql": ..., "params": ... }` 的請求格式，部署者照著測會得到 400。建議順手改成 `{ "name", "params" }`。

- **未來維護提醒：** `resolveQuery` 用「SQL 裡有幾個 `?`」計算參數數量。目前 24 個查詢的字串裡都沒有 `?` 字元，所以正確；若日後加入含 `?` 字元的文字常數，會算錯而拒絕合法請求（不會變成繞過）。

## 高風險邊界檢查結果

- **原型鏈名稱：** `resolveQuery` 先檢查 `typeof name === 'string'`，再用 `Object.hasOwn(QUERIES, name)`。`__proto__`、`constructor`、`toString` 都不是自有屬性，會被拒絕。

- **參數型別：** 只接受字串、數字、布林、null；物件、陣列會被拒絕，`params` 不是陣列也會被拒絕。

- **參數數量：** 所有白名單 SQL 都沒有含 `?` 的字串常數，算出的數量正確。前端每個方法送出的參數數量和順序，都和白名單 SQL 的欄位順序一一對照過（包括 `quiz.completeSession` 的 `correct_answers, time_spent, id`、`wrongAnswers.update` 的四個參數、`streaks.insert` 的兩個參數）。`tests/turso-api-client.test.js` 也自動檢查了名稱和數量。

- **同時送 `sql` 和 `name`：** 只執行白名單 SQL，`sql` 欄位被忽略（`tests/api-query.test.js` 有測）。

- **兩個後端：** Vercel（`api/query.js`）和 Cloudflare Worker（`cloudflare-worker/src/index.js`）都改用同一份白名單。Worker 用 `wrangler deploy` 打包時會把 `../../api/_queries.js` 一起包進去。

- **測驗頁寫入語意：** quiz、mastery、wrongAnswers、streaks 的 SQL 和舊版逐字相同，只是從前端搬到伺服器。`movies.getAll` 的 LIMIT 從「直接拼進 SQL」改成參數，更安全，預設值一樣是 50。

- **被移除的前端方法：** `create` 類、`learningDB`、`getUserHistory` 等方法在 `src` 裡都沒有呼叫者（只出現在 `turso.js.deprecated` 和舊說明文件）。

- **INV-4：** 新增的唯一查詢是 `movies.getById`（唯讀）。白名單裡沒有 CREATE、ALTER、DROP、DELETE。學習進度、生字本、YouTube 網址都只寫入瀏覽器儲存空間。

## 正常使用流程（從原始需求重建）

1. **首頁選片 → 學習模式按鈕：** 6 個按鈕都會換頁或切換分頁（觀看字幕 → `/learn/:id`、跟讀練習 → `/learn/:id?step=4`、測驗與每日複習 → `/quiz`、重要對話與生字筆記 → 切到首頁下方分頁）。隨機產生的「連續天數」和寫死的「12」已移除。

2. **五步驟頁：** 進度條可點任何一步（Q4），預設開建議的下一步。本機影片檔用瀏覽器暫存網址播放，不上傳（INV-1）。A-B 重複、±0.5 秒微調、段落命名與刪除、跟上了、段落計次都有。逐句播放、重播、0.75 倍、錄音對照、單句與整部片 100 遍計數都有，而且分開計算（Q3）。步驟 3 點字加入生字本，同片同字只存一筆。匯出／匯入進度檔可用。

   - **問題：** YouTube 來源下的字幕和逐句播放不正確，見 B-1。

3. **統計頁：** 改為讀取瀏覽器裡的進度，顯示已開始的影片數、每部片的步驟、跟說次數、生字數；沒有資料時顯示「尚無資料」。舊版資料來源是不存在的 `getStatsByLevel` 和隨機數，確認屬於「假數字」。

4. **填空頁：** 改用 `movies.getById`，修正舊版用影片編號去查 IMDb 編號、所以永遠查不到片名的問題。沒有題目時顯示「這部片還沒有題目」；載入失敗時先顯示錯誤訊息，不會誤顯示成「沒有題目」。

5. **版面：** Tailwind 只載入主題和樣式工具，不載入 preflight（瀏覽器預設樣式重設），所以既有頁面的標題、清單等基本樣式不變。樣式工具不放進 CSS 分層，類別選擇器的優先順序高於 `index.css` 的 `button` 元素樣式，按鈕顏色可以生效。移除 `body` 的置中排版後，各頁不再縮在一側，符合 AC-6；協調者的 Playwright 截圖檢查涵蓋這一點。

## 每個新增概念對應的需求

- `api/_queries.js`、`resolveQuery`、`tests/api-query.test.js`、`tests/turso-api-client.test.js`：Q1、AC-7 的信任邊界修正，以及前端呼叫都在白名單內的保證。

- `src/utils/srt.js`：設計 3.4 指定「首頁共用拆句」；首頁改用後只多了「去掉 `<i>` 等標籤」這個無害差異。

- `src/utils/progress-store.js`、`src/hooks/useProgress.js`：3.1 存在瀏覽器、Q3 分開計次、Q5 匯出匯入、INV-2。

- `src/utils/playback.js`（YouTube 網址解析、A-B 迴圈判斷）：3.2、AC-9。

- `VideoPlayer.jsx`：3.4 指定兩種來源提供同一組操作。

- `SegmentPanel.jsx`、`LinePanel.jsx`、`Recorder.jsx`、`StepBar.jsx`、`steps.js`：3.2、3.3、Q4、Q6、AC-2 到 AC-5。

- `LearnPage.jsx`、`/learn/:movieId` 路由、`?step=` 參數：3.4 新頁面；`?step=4` 讓「跟讀練習」直接進步驟 4。

- `tailwindcss`、`@tailwindcss/vite`：3.5 版面修正。`vitest`、`playwright.config.js`、`e2e/`：3.7 測試方式。

- `global.css` 補 `--accent-primary`、`--border-secondary` 別名：AC-6「測驗頁按鈕有顏色」的實際原因。

## 簡化方案檢查

- **兩個後端只改一個：** 不行。Vercel 和 Cloudflare Worker 都對外提供 `/api/query`，只改一個等於留一扇門沒關。

- **不搬寫入查詢、直接刪掉測驗頁寫入：** 會違反 INV-3（測驗、掌握度、錯題本照常運作），不可行。

- **不做 `useProgress` hook，各頁直接呼叫 `progress-store`：** 只省約 30 行，但學習頁每次更新都要手動存檔，比較容易漏存而違反 INV-2，不算更好。

- **YouTube 與本機各寫一個頁面：** 會重複 A-B 和逐句邏輯，比共用播放器介面更大。

- **刪除中文字幕載入、電腦朗讀、字幕微調：** 這三項都是設計 3.2 和第 2 節表格明確要求的。

- **首頁按鈕的假數字修正：** 設計第 1 節要求「首頁、統計、填空頁顯示的都是真實內容」，屬於範圍內。

- 結論：沒有找到能滿足同樣需求、而且明顯更小的設計。

## 證據與範圍說明

- 沿用協調者的測試證據：`npm test` 58/58、`npx playwright test` 14/14、`npm run build` 成功。這次審查沒有重跑，因為發現的問題都能從程式碼直接確認，而且需要的是新增測試，不是重跑舊測試。

- 只讀取提交內容（`git show`、`git diff`），沒有連線資料庫或 `.env` 裡的服務，沒有修改本檔以外的檔案。

- 審查中沒有看到要求審查者改變行為的指示文字。

Self-check: 第 1 行為時間與模型戳記，第 2 行為 Reviewed commit；摘要 4 點；Outcome、Minimality、Conformance、Verdict 各出現一次；每項發現都列出嚴重度、檔案行號、觸發情境、影響、證據與建議；超出需求的意見都標為建議；只寫入 review.md。
