# Tracker

## Identity

- **Work key:** A-006-100ls-impl.

- **Active Ask:** A-006.

- **Goal:** 依 [A-002 實作計畫](../A-002-100ls-plan/design.md)（Q1–Q6 全部照建議）完成階段 0–4。

- **Last update:** 2026-10-13 15:00:00 +0800.

- **Evidence commit:** 71ea423b3e96c25d424f371e12567eb961449c7c.

## Update meaning

- 每完成一個階段就勾選對應任務、提交一次並更新 Current recovery；中斷後從 Current item 繼續。使用者喊停時立即停止，不自動續做。

## Overall state

- **State:** complete.

- **Reason:** 所有任務完成並通過獨立審查。

- **Total:** 6.

- **Completed:** 6.

- **Remaining:** 0.

## Accepted task checklist

- [x] **T-1:** 階段 0 安全修正：`api/query.js` 與 `cloudflare-worker/src/index.js` 改為只接受具名查詢（`{ name, params }`），SQL 白名單集中在 `api/_queries.js`，只收錄前端實際使用的查詢（含測驗頁既有寫入）；`src/config/turso-api.js` 改送查詢名稱並移除未使用、無白名單的 `create` 類方法。證明：Vitest 測試任意 SQL 與未知名稱被拒、已知名稱以參數執行；`npm run build` 成功。不改資料庫結構、不新增寫入。Source: A-006（design.md Q1、AC-7）。 Proof: commit 9513b40；npm test 25/25 通過；npm run build 成功。

- [x] **T-2:** 階段 1 基礎：安裝 Tailwind 與 Vitest；`src/utils/srt.js` 字幕拆句（首頁共用）；`src/utils/progress-store.js` 進度、次數、生字本、YouTube 網址、A-B 段落存 localStorage，含匯出／匯入。證明：Vitest 測拆句、保存、不同影片互不影響、匯入匯出。Source: A-006（design.md 3.1、3.4、Q3、Q5、AC-1、AC-4）。Tailwind v4 不載入 preflight，utilities 不分層以蓋過 index.css 元素樣式。 Proof: commit 8e32a91；npm test 43/43 通過；npm run build 產出 Tailwind 樣式。

- [x] **T-3:** 階段 2 五步驟學習頁 `/learn/:movieId`：進度條（不強制順序）、每步說明與「完成這一步」、YouTube 嵌入播放器與本機影片播放器（共用操作介面）、步驟 1、2。證明：Playwright 重新整理後進度保留、兩部片互不影響。Source: A-006（design.md 3.2、3.6、Q2、Q4、AC-1）。新增白名單查詢 movies.getById（唯讀）。 Proof: commit 0915747；Playwright AC-1 通過。

- [x] **T-4:** 階段 3 聽說工具：A-B 重複與段落清單、逐句播放／重播／0.75 倍、錄音對照（不存檔）、「跟上了」、步驟 5 關字幕與 100 遍計數（整部與段落分開）。證明：Vitest 計數與段落邏輯；Playwright 用測試影片與假 YouTube 播放器檢查跳轉、變速、網路請求。Source: A-006（design.md 3.2、3.3、Q3、Q6、AC-2、AC-3、AC-4、AC-9）。 Proof: commit 0915747；npm test 60/60；Playwright AC-2、AC-3、AC-4、AC-9（YouTube 與本機）6/6 通過；截圖檢查版面。

- [x] **T-5:** 階段 4：步驟 3 點字加入我的生字本；修好首頁 6 個按鈕、統計頁改真實資料（無資料顯示「尚無資料」）、填空頁無題目時顯示「這部片還沒有題目」。證明：Playwright 截圖與點選；`npm run build`。Source: A-006（design.md 3.5、AC-5、AC-6、AC-8）。另修：測驗頁按鈕無色的實際原因是未定義的 CSS 變數 --accent-primary、--border-secondary（非 Tailwind），在 global.css 補上別名；移除不再使用的查詢 movies.getByImdbId、learning.getStats。 Proof: commit 1f8b5aa；npm test 58/58；Playwright 14/14（含 AC-5、AC-6、AC-8）；build 成功；新增程式無 CREATE/ALTER/DROP。
- [x] **T-6:** 最終獨立審查與交付：內部子代理依 review-dispatch.md 唯讀審查 1f8b5aa，處理 BLOCKING 發現，完成 devlog 收尾。證明：review.md 三項判定為 PASS、協調者檢查報告。Source: A-006（closeout 規則）。第 1 次審查 BLOCKING（B-1：YouTube 來源誤用資料庫字幕時間），已於 71ea423 修正並一併處理 S-1、S-3、S-5（README）。 Proof: review-2.md Outcome/Minimality/Conformance 皆 PASS（Reviewed commit 71ea423）；npm test 58/58；Playwright 14/14。

## Accepted scope changes

- None.

## Current recovery

- **Current item:** None.

- **Last proven result:** 第 2 次獨立審查 PASS；npm test 58/58、Playwright 14/14、build 成功。

- **Active blocker or running process:** None.

- **Next safe action:** None.

- **Expected changed files:** api/query.js, api/_queries.js, cloudflare-worker/src/index.js, src/config/turso-api.js, package.json, package-lock.json, tests/.

## Completion proof

- **All accepted tasks checked:** yes.

- **Blocking accepted decision:** none.

- **Operation running:** no.

- **Next action remaining:** none.

- **Evidence status:** complete.

- **Judgment:** complete.
