# Cloudflare Worker for Turso API Proxy

這個 Cloudflare Worker 充當 Turso 資料庫的 API 代理，解決瀏覽器 CORS 問題並保護資料庫憑證。

## 🚀 部署步驟

### 1. 安裝 Wrangler CLI

```bash
npm install -g wrangler
```

### 2. 登入 Cloudflare

```bash
wrangler login
```

### 3. 設置環境變數

```bash
cd cloudflare-worker
wrangler secret put TURSO_HTTP_URL
wrangler secret put TURSO_AUTH_TOKEN
```

### 4. 部署 Worker

```bash
wrangler deploy
```

部署後會獲得一個 URL，例如：`https://subtitlelingo-api.your-subdomain.workers.dev`

## 🔧 前端配置

在 `src/config/turso.js` 中，將 `VITE_API_BASE_URL` 設置為 Worker URL：

```javascript
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8787';
```

## 📡 API 端點

### POST /api/query

執行 SQL 查詢

**請求：**
```json
{
  "sql": "SELECT * FROM movies LIMIT ?",
  "params": [10]
}
```

**回應：**
```json
{
  "data": [
    { "id": 1, "title": "Movie Title", ... }
  ],
  "cols": ["id", "title", ...],
  "affected_row_count": 10
}
```

### GET /health

健康檢查

**回應：**
```json
{
  "status": "ok"
}
```

## 🔒 安全性

- ✅ 資料庫憑證存儲在 Cloudflare Secrets 中
- ✅ CORS 已啟用
- ✅ SQL 參數化查詢防止注入
- ✅ 錯誤處理和日誌記錄

## 💰 費用

- Cloudflare Workers 免費套餐：
  - 每天 100,000 個請求
  - 無限頻寬
- 完全免費用於個人專案

## 📚 參考

- [Cloudflare Workers 文檔](https://developers.cloudflare.com/workers/)
- [Turso HTTP API 文檔](https://docs.turso.tech/sdk/http/quickstart)
