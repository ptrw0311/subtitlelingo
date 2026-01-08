# GitHub Pages 部署指南 - Turso 資料庫連接

## ⚠️ 問題說明

GitHub Pages 是靜態網站託管服務，無法直接連接到 Turso 資料庫，因為：

1. **CORS 限制**：瀏覽器會阻止跨域請求到 Turso
2. **安全性問題**：不能在客戶端暴露資料庫憑證
3. **環境變數問題**：GitHub Pages 構建時無法訪問 `.env` 檔案

## ✅ 解決方案：使用 Cloudflare Worker 作為 API 代理

Cloudflare Workers 是免費的無伺服器平台，可以作為 API 代理：

- ✅ 免費（每天 100,000 個請求）
- ✅ 全球邊緣網絡，速度快
- ✅ 隱藏資料庫憑證
- ✅ 支援 CORS

## 🚀 部署步驟

### 第一步：部署 Cloudflare Worker

1. **安裝 Wrangler CLI**
   ```bash
   npm install -g wrangler
   ```

2. **登入 Cloudflare**
   ```bash
   wrangler login
   ```

3. **導航到 Worker 目錄**
   ```bash
   cd cloudflare-worker
   ```

4. **設置環境變數**
   ```bash
   # 獲取 Turso HTTP URL（不是 libsql:// 開頭的）
   turso db show your-db-name --http-url

   # 設置環境變數
   wrangler secret put TURSO_HTTP_URL
   # 輸入你的 HTTP URL，例如：https://your-db.turso.io

   wrangler secret put TURSO_AUTH_TOKEN
   # 輸入你的 auth token
   ```

5. **部署 Worker**
   ```bash
   wrangler deploy
   ```

6. **記下 Worker URL**
   ```
   Published to: https://subtitlelingo-api.your-subdomain.workers.dev
   ```

### 第二步：更新前端配置

1. **創建本地 `.env` 檔案**
   ```bash
   cp .env.example .env
   ```

2. **編輯 `.env`**
   ```env
   VITE_API_BASE_URL=https://subtitlelingo-api.your-subdomain.workers.dev
   ```

3. **更新組件導入**

   將所有組件中的：
   ```javascript
   import { movieDB, vocabularyDB } from '../config/turso.js';
   ```

   改為：
   ```javascript
   import { movieDB, vocabularyDB } from '../config/turso-api.js';
   ```

   **需要更新的文件：**
   - `src/pages/HomePage.jsx`
   - `src/components/RecentMoviesCard.jsx`
   - `src/components/LearningButtons.jsx`
   - `src/components/AllMoviesDropdown.jsx`
   - `src/pages/QuizPage.jsx`
   - `src/pages/StatsPage.jsx`
   - `src/pages/PracticePage.jsx`

### 第三步：本地測試

```bash
npm run dev
```

訪問 http://localhost:5173 並測試資料庫連接。

### 第四步：部署到 GitHub Pages

1. **提交變更**
   ```bash
   git add .
   git commit -m "feat: 添加 Cloudflare Worker API 支持"
   git push origin main
   ```

2. **GitHub Pages 會自動部署**

3. **訪問生產環境**
   ```
   https://ptrw0311.github.io/subtitlelingo/
   ```

## 🔧 測試 API 連接

### 測試 Cloudflare Worker

```bash
curl https://subtitlelingo-api.your-subdomain.workers.dev/health
```

應該返回：
```json
{"status":"ok"}
```

### 測試資料庫查詢

```bash
curl -X POST https://subtitlelingo-api.your-subdomain.workers.dev/api/query \
  -H "Content-Type: application/json" \
  -d '{"sql":"SELECT COUNT(*) as count FROM movies"}'
```

## 📊 費用與限制

### Cloudflare Workers (免費套餐)
- ✅ 每天 100,000 個請求
- ✅ 10ms CPU 時間限制
- ✅ 無限頻寬
- ✅ 全球 CDN

### Turso (免費套餐)
- ✅ 每月 500 MB 存儲
- ✅ 每月 1,000 億行讀取
- ✅ 每月 10 億行寫入
- ✅ 3 個資料庫

**總計：完全免費！**

## 🐛 故障排除

### 問題 1：CORS 錯誤
```
Access to fetch at 'https://your-db.turso.io' has been blocked by CORS policy
```

**解決方案**：確保使用 Cloudflare Worker URL，而不是直接連接 Turso。

### 問題 2：404 Not Found
```
Failed to fetch: 404
```

**解決方案**：
1. 檢查 Worker URL 是否正確
2. 確認 Worker 已成功部署
3. 測試 `/health` 端點

### 問題 3：500 Internal Server Error
```
Database query failed
```

**解決方案**：
1. 檢查 Cloudflare Worker 日誌：`wrangler tail`
2. 確認 Turso 憑證正確設置
3. 測試 SQL 語法是否正確

## 📚 參考資料

- [Cloudflare Workers 文檔](https://developers.cloudflare.com/workers/)
- [Turso HTTP API 文檔](https://docs.turso.tech/sdk/http/quickstart)
- [GitHub Pages 文檔](https://docs.github.com/en/pages)

## 🎯 快速開始腳本

創建 `setup.sh`：

```bash
#!/bin/bash

echo "🚀 開始部署 SubtitleLingo..."

# 1. 部署 Cloudflare Worker
echo "📦 部署 Cloudflare Worker..."
cd cloudflare-worker
wrangler secret put TURSO_HTTP_URL
wrangler secret put TURSO_AUTH_TOKEN
wrangler deploy

# 2. 獲取 Worker URL
echo "⚠️  請輸入您的 Worker URL:"
read WORKER_URL

# 3. 更新 .env
cd ..
echo "VITE_API_BASE_URL=$WORKER_URL" >> .env

# 4. 更新組件導入
echo "📝 更新組件導入..."
find src -name "*.jsx" -exec sed -i "s|from '../config/turso.js'|from '../config/turso-api.js'|g" {} \;

echo "✅ 部署完成！"
echo "🔗 Worker URL: $WORKER_URL"
```

運行：
```bash
chmod +x setup.sh
./setup.sh
```
