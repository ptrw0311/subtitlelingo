# Subtitle Fetcher n8n 工作流程

## 概述

這是一個 n8n 自動化工作流程，用於從 OpenSubtitles.com 抓取字幕並儲存到 Turso 資料庫。

## 🚀 快速開始

### 1. 匯入工作流程

1. 前往您的 n8n 環境
2. 點擊 "Workflows" > "Import from file"
3. 選擇 `subtitle-fetcher.json` 檔案
4. 匯入完成後會看到完整的工作流程圖

### 2. 設定憑證

參考 `credentials-setup.md` 檔案設定以下憑證：

- **OpenSubtitles API** - 用於呼叫 OpenSubtitles API
- **Turso DB** - 用於儲存字幕資料

### 3. 更新 Webhook URL

匯入後需要更新 Webhook URL：

1. 點擊 "Webhook Trigger" 節點
2. 複製產生的 URL（格式：`https://your-n8n-space.hf.space/webhook/subtitle-fetcher`）
3. 這個 URL 將用於前端呼叫

### 4. 啟動工作流程

1. 點擊工作流程右上角的 "Active" 開關
2. 確保所有節點的設定正確
3. 工作流程現在已經準備好接收請求

## 📡 API 使用方式

### 前端呼叫格式

```javascript
// 更新前端 API 配置
const API_BASE = 'https://your-n8n-space.hf.space/webhook/subtitle-fetcher';

// 請求格式
const requestData = {
  endpoint: '/subtitles/fetch',  // 或其他端點
  // 其他參數...
};

fetch(API_BASE, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(requestData)
})
.then(res => res.json())
.then(data => console.log(data));
```

### 支援的端點

#### 1. 取得熱門影片
```javascript
{
  "endpoint": "/movies/popular",
  "page": 1
}
```

#### 2. 搜尋影片
```javascript
{
  "endpoint": "/movies/search",
  "query": "Inception",
  "page": 1
}
```

#### 3. 抓取字幕
```javascript
{
  "endpoint": "/subtitles/fetch",
  "imdb_id": "tt1375666",
  "language": "en"
}
```

#### 4. 分析影片
```javascript
{
  "endpoint": "/movies/tt1375666/analyze"
}
```

## 🔧 工作流程說明

### 流程圖

```
Webhook Trigger
    ├── Is Popular Movies? → Fetch Popular Movies → Response
    ├── Is Search Movies? → Search Movies → Response
    ├── Is Fetch Subtitles? → [多個節點] → Response
    └── Is Analyze Movie? → Fetch from Turso → Analyze → Response
```

### 主要節點說明

1. **Webhook Trigger** - 接收前端請求
2. **條件判斷節點** - 根據 endpoint 決定執行路徑
3. **HTTP Request 節點** - 呼叫 OpenSubtitles API
4. **Code 節點** - 處理字幕解析和分析
5. **Turso DB 節點** - 儲存和讀取字幕資料
6. **Response 節點** - 回傳結果給前端

## 🎯 測試工作流程

### 使用 n8n 測試

1. 點擊 "Webhook Trigger" 節點
2. 點擊 "Test step"
3. 輸入測試資料：
```json
{
  "endpoint": "/subtitles/fetch",
  "imdb_id": "tt1375666",
  "language": "en"
}
```
4. 點擊 "Execute Test" 查看結果

### 使用前端測試

更新前端配置後，可以在瀏覽器開發者工具中查看網路請求。

## 🛠️ 常見問題

### Q: Webhook 不回應？
A: 檢查工作流程是否已啟動（Active），以及憑證是否正確設定

### Q: OpenSubtitles API 呼叫失敗？
A: 確認 API Key 正確且有效，注意速率限制（每秒 4 個請求）

### Q: Turso 資料庫連線失敗？
A: 檢查 URL 和 Auth Token 是否正確，確保資料庫已建立必要的資料表

### Q: 字幕解析失敗？
A: 確認字幕格式為 SRT，檢查編碼是否為 UTF-8

## 📊 資料庫結構

確保 Turso 資料庫有以下資料表：

```sql
-- 影片表
CREATE TABLE movies (
  imdb_id TEXT PRIMARY KEY,
  title TEXT,
  year TEXT,
  created_at TEXT
);

-- 字幕表
CREATE TABLE subtitles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  movie_id TEXT,
  sequence_number INTEGER,
  start_time TEXT,
  end_time TEXT,
  text TEXT,
  created_at TEXT,
  FOREIGN KEY (movie_id) REFERENCES movies(imdb_id)
);
```

## 🔄 更新工作流程

如需修改工作流程：

1. 在 n8n 編輯器中調整
2. 保存變更
3. 如需匯出：點擊右上角 "..." > "Download"

## 📝 注意事項

- OpenSubtitles API 有速率限制，建議加入延遲或錯誤處理
- 大型字幕檔案可能需要較長的處理時間
- 定期備份 Turso 資料庫
- 監控 n8n 執行日誌以偵錯

---

**需要協助？**
- 查看 n8n 官方文件：https://docs.n8n.io/
- OpenSubtitles API 文件：https://www.opensubtitles.com/docs
- Turso 文件：https://docs.turso.tech/