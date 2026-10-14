# STATUS

Project: SubtitleLingo

Notebook: .agentflow/devlog.md — root.

Current commit: local delivery recorded in Git history.

Tests/scenarios: 本輪僅提交工具設定與忽略規則，無應用程式變更，未重跑測試（前輪證據 npm test 58/58、Playwright 14/14）.

Configuration: ag.json — schema v8; validated for claude this round.

Proven: Vercel 正式站運行新版（dpl_FPrA9PhpCwH1CaasNWmreZJKBhh7）；本地設定變更已提交 e0403b2 並推送 GitHub.

Open: none.

Next: await the owner.

Artifacts: .agentflow/artifacts/A-006-100ls-impl/tracker.md.

Archived eras: none.

Streams: none.
---

# → Ask / A-009 (peter wang)

+ 請佈署到vercel

---

## [RUN-001] Event — 2026-10-14 10:27:48 +0800 (A-009)

1. 確認 Vercel CLI 登入狀態：auth.json 仍空、vercel whoami 顯示未登入，改在背景執行 `vercel login` 並提供裝置驗證網址，使用者在瀏覽器完成確認（代碼 WMFT-SFHW），登入帳號 ptrw0311-8713。
2. 釐清專案對應：`vercel inspect subtitlelingo.vercel.app` 顯示正式別名指向專案 `subtitlelingo`（2026-01-08 的舊部署）；本機 .vercel/project.json 雖記錄專案名 `subtitlelingo-api`，但 `vercel ls` 確認同一 projectId 解析為 `subtitlelingo`（專案曾改名），即正式網址背後的同一個專案。
3. 部署前檢查：.gitignore 已涵蓋 .env、node_modules、dist，本地 .env 不會上傳；app 程式碼已全部提交（HEAD fd70795）。
4. 執行 `vercel deploy --prod --yes`：建置成功（index-DRu13qaY.js / index-DUlsb5r3.css），部署 dpl_FPrA9PhpCwH1CaasNWmreZJKBhh7，別名 https://subtitlelingo.vercel.app 已切換。
5. 生產驗證：(a) 舊式任意 SQL `{"query":"SELECT * FROM movies"}` 回 HTTP 400 "Unknown query name"（白名單生效）；(b) 具名查詢 movies.count 回 {"data":[{"count":7}]}；(c) movies.getAll 回真實片單；(d) 正式站 HTML 引用的 asset 雜湊與本次遠端建置完全一致。

# ← Reply / A-009

* _2026-10-14 10:27:48 +0800 (claude/unknown)_

## [SUMMARY]

- 已完成 Vercel 正式部署：https://subtitlelingo.vercel.app 運行新版，任意 SQL 被拒（HTTP 400）、具名查詢正常回真實資料、前端為本次建置版本。

## [FINAL REPORT]

1. 「請佈署到vercel」

   - **完成。** 使用者在瀏覽器完成 Vercel 裝置登入（帳號 ptrw0311-8713）後，以 `vercel deploy --prod --yes` 部署到正式環境，部署識別 dpl_FPrA9PhpCwH1CaasNWmreZJKBhh7。

   - 專案對應已釐清：本機 .vercel/project.json 記錄的專案（原名 subtitlelingo-api）與正式網址背後的 `subtitlelingo` 是同一個專案（改過名、projectId 相同），沒有部署到錯的專案。

   - 生產驗證：舊式任意 SQL 已被拒（HTTP 400 "Unknown query name"，白名單生效）；具名查詢 movies.count 回 7 部片；movies.getAll 回真實片單；正式站 HTML 引用的 JS/CSS 雜湊（DRu13qaY／DUlsb5r3）與本次遠端建置一致。

   - 注意：此專案的 Vercel 未連接 GitHub 自動部署（推送到 GitHub 不會觸發部署），之後更新要再跑 `vercel deploy --prod`，或到 Vercel 後台把專案接上 GitHub 倉庫。

   - 本輪未變更任何應用程式碼；工作區中既有變更屬本地工具設定與快取，與網站行為無關（申報如下）。


---

# → Ask / A-010 (peter wang)

+ 請COMMIT到GITHUB上

---

## [RUN-001] Event — 2026-10-14 10:56:21 +0800 (A-010)

1. 盤點工作區：應用程式與部署紀錄已於 a09a854 提交並推送；剩餘變更為本地工具設定（.claude/settings.json 的 agentflow Stop hook、.claude/settings.local.json 的權限清單、.mcp.json 移除重複佔位鍵）與兩個未追蹤檔案（agentflow 備份、Python 位元碼快取）。
2. .gitignore 新增 __pycache__/、*.pyc、.claude/*.agentflow-backup，讓快取與備份檔不再出現在 git 狀態。
3. 提交 e0403b2（.gitignore、.mcp.json、.claude/settings.json、.claude/settings.local.json，4 檔案 36 插入 3 刪除），與本輪 devlog 紀錄一併推送 GitHub。

# ← Reply / A-010

* _2026-10-14 10:56:21 +0800 (claude/unknown)_

## [SUMMARY]

- 剩餘的本地設定變更已提交（e0403b2）並連同本輪紀錄推送 GitHub；快取與備份檔已加入 .gitignore 排除。

## [FINAL REPORT]

1. 「請COMMIT到GITHUB上」

   - **完成。** 應用程式碼與部署紀錄先前已提交並推送（至 a09a854）；本輪把剩餘的本地工具設定變更一併提交：

     - `.claude/settings.json`：agentflow 外掛註冊的 Stop hook。
     - `.claude/settings.local.json`：本階段累積的指令權限清單。
     - `.mcp.json`：移除重複的 TURSO_AUTH_TOKEN 佔位鍵（真正的 token 先前已在版本庫中，本輪未新增任何機敏內容）。
     - `.gitignore`：新增 __pycache__/、*.pyc、.claude/*.agentflow-backup，排除 Python 快取與 agentflow 備份檔。

   - 提交 e0403b2（4 檔案），連同本輪 devlog 紀錄推送至 github.com/ptrw0311/subtitlelingo 的 main 分支。

   - 提醒：.mcp.json 內含真實的 Turso auth token，且先前版本就已提交進 git 歷史。若此倉庫未來要設為公開或分享，建議將 token 改放環境變數並至 Turso 後台重發。

## Questions (batched — each with a suggested default)

- None.


---

# → Ask / A-011 (peter wang)

+
