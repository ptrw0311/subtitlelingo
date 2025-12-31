# n8n Workflow 使用指南 - Gemini 版本

## 📋 概述

**檔案名稱**: `subtitle-fetcher-complete-with-gemini.json`

**功能**: 完整的字幕下載、AI 分析和資料庫儲存工作流程

**使用的 AI 模型**: Google Gemini 3 Flash Preview (免費)

---

## 🎯 Workflow 結構

### 完整工作流程（16 個節點）

```
1. Webhook Trigger
   ↓
2. Prepare API Call
   ↓
3. HTTP Request - Search (OpenSubtitles)
   ↓
4. Select Best Subtitle
   ↓
5. HTTP Request - Download (獲取下載連結)
   ↓
6. Prepare Download
   ↓
7. HTTP Request - Fetch SRT (下載實際字幕檔案)
   ↓
8. Parse SRT Content
   ↓
9. Prepare Save Subtitle (新增) ⭐
   ↓
10. Save Movie to Turso (新增) ⭐
   ↓
11. Save Subtitle to Turso (新增) ⭐
   ↓
12. Prepare Gemini Analysis (新增) ⭐
   ↓
13. Google Gemini Analyze (新增) ⭐
   ↓
14. Parse Gemini Response (新增) ⭐
   ↓
    ├─→ Split Batches - Dialogues (新增) ⭐
    │    ↓
    │    Prepare Dialogue Data (新增) ⭐
    │    ↓
    │    Save Dialogue to Turso (新增) ⭐
    │    ↓
    │    (循環直到所有對話儲存完成)
    │
    └─→ Split Batches - Vocabulary (新增) ⭐
         ↓
         Prepare Vocabulary Data (新增) ⭐
         ↓
         Save Vocabulary to Turso (新增) ⭐
         ↓
         (循環直到所有生字儲存完成)
   ↓
15. Respond to Webhook (返回最終結果)
```

---

## 🔧 節點說明

### 原有節點（1-8）

| 節點 ID | 節點名稱 | 功能 |
|---------|---------|------|
| 1 | Webhook Trigger | 接收 POST 請求 |
| 2 | Prepare API Call | 準備 API 參數 |
| 3 | HTTP Request - Search | 搜索 OpenSubtitles |
| 4 | Select Best Subtitle | 選擇最佳字幕（下載量最多） |
| 5 | HTTP Request - Download | 獲取下載連結 |
| 6 | Prepare Download | 準備下載參數 |
| 7 | HTTP Request - Fetch SRT | 下載 SRT 檔案內容 |
| 8 | Parse SRT Content | 解析 SRT 格式 |

### 新增節點（9-16）

| 節點 ID | 節點名稱 | 類型 | 功能 |
|---------|---------|------|------|
| 9 | Prepare Save Subtitle | Code | 準備數據，生成唯一 ID |
| 10 | Save Movie to Turso | HTTP Request | 將電影資訊寫入 `movies` 表 |
| 11 | Save Subtitle to Turso | HTTP Request | 將字幕內容寫入 `subtitles` 表 |
| 12 | Prepare Gemini Analysis | Code | 準備 Gemini API 請求 |
| 13 | Google Gemini Analyze | HTTP Request | 呼叫 Gemini AI 分析字幕 |
| 14 | Parse Gemini Response | Code | 解析 AI 回應的 JSON |
| 15 | Split Batches - Dialogues | Split In Batches | 批次處理重要對話 |
| 16 | Prepare Dialogue Data | Code | 準備對話數據 |
| 17 | Save Dialogue to Turso | HTTP Request | 寫入 `important_dialogues` 表 |
| 18 | Split Batches - Vocabulary | Split In Batches | 批次處理生字筆記 |
| 19 | Prepare Vocabulary Data | Code | 準備生字數據 |
| 20 | Save Vocabulary to Turso | HTTP Request | 寫入 `vocabulary_notes` 表 |
| 21 | Respond to Webhook | Respond to Webhook | 返回處理結果 |

---

## 🚀 導入 Workflow

### 步驟 1: 登入 n8n

```bash
# 如果使用本地 n8n
訪問: http://localhost:5678

# 如果使用 Hugging Face Spaces
訪問: https://your-n8n-space.hf.space
```

### 步驟 2: 導入 Workflow

1. 點擊左上角 **「+」** 按鈕
2. 選擇 **「Import from File」**
3. 上傳 `n8n-workflows/subtitle-fetcher-complete-with-gemini.json`
4. 點擊 **「Import」**

### 步驟 3: 激活 Workflow

1. 找到導入的 workflow: "Subtitle Fetcher Complete with Gemini and Turso"
2. 點擊 workflow 名稱進入編輯模式
3. 檢查所有節點連接是否正確
4. 點擊右上角 **「Active」** 開關啟動 workflow

---

## 🔑 API 配置

### Google Gemini API Key

Workflow 已內嵌 API Key：

```javascript
const GEMINI_API_KEY = 'AIzaSyBogCVKs89gv5_DKyJeUSkS9J-U6SS-yuM';
```

如需更換 API Key，編輯 **「Prepare Gemini Analysis」** 節點（節點 12）：

```javascript
// 在節點的代碼中找到這行並替換
const GEMINI_API_KEY = 'YOUR_NEW_API_KEY';
```

### Turso 資料庫

Workflow 使用 Turso 資料庫的 HTTP API：

```
URL: https://subtitlelingo-peterwang.aws-ap-northeast-1.turso.io/v3/execute
方法: POST
認證: None (使用公開端點)
```

**重要**: 確保 Turso 資料庫已創建以下表格：
- `movies`
- `subtitles`
- `important_dialogues`
- `vocabulary_notes`

---

## 📝 測試 Workflow

### 方法 1: 使用 curl

```bash
curl -X POST https://your-n8n-url/webhook/subtitle-fetcher-complete \
  -H "Content-Type: application/json" \
  -d '{
    "imdb_id": "tt1375666",
    "language": "en"
  }'
```

### 方法 2: 使用 Postman

**URL**: `POST https://your-n8n-url/webhook/subtitle-fetcher-complete`

**Headers**:
```
Content-Type: application/json
```

**Body** (raw JSON):
```json
{
  "imdb_id": "tt1375666",
  "language": "en"
}
```

### 方法 3: 使用前端測試頁面

```bash
# 啟動開發伺服器
npm run dev

# 訪問
http://localhost:8080/n8n-api-test.html
```

---

## ✅ 預期回應

### 成功回應範例

```json
{
  "success": true,
  "message": "字幕下載、分析和保存完成",
  "data": {
    "subtitle_id": "subtitle_1234567890_abc123",
    "movie_id": "movie_tt1375666",
    "important_dialogues_count": 20,
    "vocabulary_notes_count": 12,
    "status": "completed"
  }
}
```

### 錯誤回應範例

```json
{
  "success": false,
  "error": "No subtitles found",
  "message": "Check IMDb ID or try another language"
}
```

---

## 🔍 驗證結果

### 1. 檢查資料庫

```bash
# 檢查對話數量
node scripts/check-dialogues.js

# 檢查生字筆記
node scripts/check-vocabulary-notes.js
```

### 2. 前端顯示

```bash
npm run dev
```

訪問 `http://localhost:8080`，選擇 Inception 電影，查看：
- ✅ 重要對話（英文 + 中文翻譯）
- ✅ 生字筆記（定義 + 例句）

---

## 📊 處理時間

| 步驟 | 預估時間 |
|------|---------|
| 搜索字幕 | 1-2 秒 |
| 下載 SRT | 2-5 秒 |
| Gemini AI 分析 | 10-20 秒 |
| 儲存對話 (20條) | 3-5 秒 |
| 儲存生字 (10-15個) | 2-3 秒 |
| **總計** | **20-35 秒** |

---

## ⚠️ 故障排除

### 問題 1: Webhook 無回應

**可能原因**:
- Workflow 未激活
- Webhook URL 錯誤

**解決方法**:
1. 確認 workflow 右上角顯示「Active」
2. 檢查 webhook 路徑: `/webhook/subtitle-fetcher-complete`

### 問題 2: Gemini API 錯誤

**常見錯誤**:
```
Error: 429 quota_exceeded
```

**解決方法**:
- 等待配額重置
- 更換 Gemini API Key
- 使用其他免費模型（如 `gemini-3-flash-preview`）

### 問題 3: Turso 寫入失敗

**常見錯誤**:
```
Error: table movies does not exist
```

**解決方法**:
```bash
# 執行資料庫初始化腳本
node scripts/init-turso.js
```

### 問題 4: JSON 解析失敗

**常見錯誤**:
```
Error: JSON 解析失敗
```

**解決方法**:
- 檢查 Gemini 回應格式
- 調整 prompt 要求更嚴格的 JSON 格式
- 添加重試邏輯

---

## 🎯 下一步優化

### 功能增強

1. **錯誤處理**: 添加錯誤捕獲和重試機制
2. **緩存機制**: 避免重複分析和下載
3. **批量處理**: 支持一次請求多部電影
4. **進度追蹤**: 使用 WebSocket 返回實時進度
5. **品質檢查**: 驗證 AI 輸出品質

### 性能優化

1. **並行處理**: 同時處理多個對話/生字儲存
2. **資料庫優化**: 添加索引以加快查詢
3. **API 優化**: 使用批量插入代替逐條插入

---

## 📚 相關檔案

- `n8n-workflows/subtitle-fetcher-complete-with-gemini.json` - Workflow 定義
- `scripts/test-gemini-analysis.js` - Gemini API 測試腳本
- `src/config/turso.js` - Turso 資料庫配置
- `DEPLOYMENT-GUIDE.md` - 完整部署指南
- `GLM-QUICKSTART.md` - 快速開始指南（可參考流程）

---

## 🔗 相關資源

### n8n 文檔
- [n8n 官方文檔](https://docs.n8n.io/)
- [HTTP Request 節點](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.httprequest/)
- [Split In Batches 節點](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.splitinbatches/)

### Google Gemini
- [Google AI Studio](https://makersuite.google.com/app/apikey)
- [Gemini API 文檔](https://ai.google.dev/tutorials/rest_quickstart)
- [模型列表](https://ai.google.dev/models/gemini)

### Turso 資料庫
- [Turso 官方文檔](https://docs.turso.tech/)
- [HTTP API](https://docs.turso.tech/api/reference)

---

**最後更新**: 2025-12-31

**版本**: 1.0.0

**作者**: Claude Code + User Collaboration
