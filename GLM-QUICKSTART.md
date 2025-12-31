# GLM 4.7 字幕分析 - 快速開始指南

## ✅ 已完成的工作

### 1. 📝 測試腳本
- **檔案**: `scripts/test-glm-subtitle-analysis.js`
- **功能**: 使用 GLM 4.7 API 分析 Inception 字幕並寫入資料庫
- **狀態**: 已創建，等待測試

### 2. 📚 n8n Workflow 配置指南
- **檔案**: `n8n-workflows/GLM-SUBTITLE-ANALYSIS-GUIDE.md`
- **內容**: 完整的 n8n 節點配置說明（使用 GLM 4.7 API）
- **狀態**: 已完成

### 3. 🔧 環境設定
- **檔案**: `.env`
- **新增**: `GLM_API_KEY` 配置項
- **狀態**: 已更新

---

## 🚀 開始使用

### 步驟 1: 申請 GLM 4.7 API Key

1. 訪問 [Z.AI Developer Platform](https://docs.z.ai/api-reference/introduction)
2. 註冊帳號
3. 創建 API Key
4. 將 API Key 填入 `.env` 檔案：

```bash
GLM_API_KEY=your-actual-api-key-here
```

### 步驟 2: 測試 GLM API 連接

執行測試腳本：

```bash
node scripts/test-glm-subtitle-analysis.js
```

**預期結果**：
- ✅ 成功呼叫 GLM 4.7 API
- ✅ 分析出 20 段重要對話（含繁體中文翻譯）
- ✅ 分析出 10-15 個生字筆記
- ✅ 寫入 Turso 資料庫

### 步驟 3: 配置 n8n Workflow

參考 `n8n-workflows/GLM-SUBTITLE-ANALYSIS-GUIDE.md`，按照以下步驟操作：

1. 在 n8n 中創建新的 workflow
2. 按照「節點配置指南」添加 14 個節點
3. 設定環境變數 `GLM_API_KEY`
4. 連接所有節點
5. 啟動 workflow

### 步驟 4: 測試完整流程

使用 Postman 或 curl 測試：

```bash
curl -X POST https://your-n8n-url/webhook/subtitle-fetcher-complete \
  -H "Content-Type: application/json" \
  -d '{
    "imdb_id": "tt1375666",
    "language": "en"
  }'
```

---

## 📊 預期輸出

### GLM 4.7 分析結果範例

**重要對話**：
```json
{
  "content": "What is the most resilient parasite? A bacteria? A virus? An intestinal worm?",
  "time_start": "00:02:46,741",
  "time_end": "00:02:55,076",
  "translation_zh": "最強韌的寄生蟲是什麼？細菌？病毒？還是腸道寄生蟲？",
  "explanation": "這段對話引出了電影的核心概念——想法（idea）是最強韌的寄生蟲。使用寄生蟲的比喻來說明想法一旦植入就很難消除。",
  "difficulty_level": "advanced"
}
```

**生字筆記**：
```json
{
  "word": "resilient",
  "part_of_speech": "adjective (形容詞)",
  "definition_zh": "有彈性的；能快速恢復的",
  "level": "advanced",
  "original_sentence": "What is the most resilient parasite?",
  "example_sentences": [
    "Children are often more resilient than adults.",
    "The resilient material can withstand extreme temperatures."
  ]
}
```

---

## 🔑 關鍵配置

### GLM 4.7 API 端點
```
URL: https://api.z.ai/v1/chat/completions
Method: POST
Headers:
  Authorization: Bearer <your-api-key>
  Content-Type: application/json
```

### API 請求範例
```json
{
  "model": "glm-4.7",
  "messages": [
    {
      "role": "system",
      "content": "你是專業的英文教學助手..."
    },
    {
      "role": "user",
      "content": "請分析以下字幕內容..."
    }
  ],
  "temperature": 0.3,
  "max_tokens": 8000,
  "top_p": 0.9
}
```

---

## 📁 檔案結構

```
SubtitleLingo/
├── .env                                    # 環境變數（已更新）
├── scripts/
│   └── test-glm-subtitle-analysis.js      # GLM 4.7 測試腳本（新）
├── n8n-workflows/
│   ├── subtitle-fetcher-complete-real.json # 原始 workflow
│   └── GLM-SUBTITLE-ANALYSIS-GUIDE.md     # n8n 配置指南（新）
└── GLM-QUICKSTART.md                       # 本文件（新）
```

---

## ⚙️ 前端整合

更新 `src/pages/HomePage.jsx` 以讀取資料庫中的真實數據：

```javascript
// 載入重要對話
const { data: dialoguesData } = await importantDialoguesDB.getByMovieId(movieId);
setDialogues(dialoguesData);

// 載入生字筆記
const { data: vocabData } = await vocabularyNotesDB.getByMovieId(movieId);
setVocabularies(vocabData);
```

---

## 🐛 故障排除

### 問題 1: GLM API 認證失敗
```
錯誤: 401 Unauthorized
解決: 檢查 API Key 是否正確
```

### 問題 2: JSON 解析失敗
```
錯誤: SyntaxError: Unexpected token
解決: 在 prompt 中強調輸出純 JSON，不包含其他文字
```

### 問題 3: 資料庫寫入失敗
```
錯誤: LibsqlError: SQL_INPUT_ERROR
解決: 檢查 SQL 語法和資料類型
```

---

## 📚 相關資源

- [GLM 4.7 API 文檔](https://docs.z.ai/guides/llm/glm-4.7)
- [Z.AI 開發者平台](https://docs.z.ai/api-reference/introduction)
- [n8n 官方文檔](https://docs.n8n.io/)
- [Turso 資料庫文檔](https://docs.turso.tech/)

---

## 📝 下一步

1. ✅ 申請 GLM API Key
2. ⏳ 測試 `test-glm-subtitle-analysis.js` 腳本
3. ⏳ 配置 n8n workflow
4. ⏳ 更新前端代碼讀取資料庫
5. ⏳ 測試完整流程

---

**創建日期**: 2025-12-24
**狀態**: 待測試
**優先級**: 高
