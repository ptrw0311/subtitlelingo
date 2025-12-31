# SubtitleLingo - GLM 4.7 整合完整部署指南

## 📋 目錄
1. [已完成的工作](#已完成的工作)
2. [環境準備](#環境準備)
3. [資料庫設置](#資料庫設置)
4. [GLM API 設置](#glm-api-設置)
5. [測試流程](#測試流程)
6. [n8n Workflow 配置](#n8n-workflow-配置)
7. [前端使用](#前端使用)
8. [常見問題](#常見問題)

---

## ✅ 已完成的工作

### 1. 後端資料庫操作 (`src/config/turso.js`)
- ✅ 新增 `importantDialoguesDB` 模組
  - `getByMovieId(movieId)` - 根據影片 ID 獲取重要對話
  - `getBySubtitleId(subtitleId)` - 根據字幕 ID 獲取重要對話
  - `getByDifficulty(movieId, level)` - 根據難度篩選對話
  - `create(dialogueData)` - 創建新對話

- ✅ 更新 `vocabularyDB` 模組
  - 支援 JSON 欄位自動序列化
  - `getByMovieId(movieId)` - 根據影片 ID 獲取生字筆記

### 2. 前端頁面更新 (`src/pages/HomePage.jsx`)
- ✅ 從資料庫讀取重要對話（不再硬編碼）
- ✅ 從資料庫讀取生字筆記（不再硬編碼）
- ✅ 支援點擊展開/收起翻譯功能
- ✅ 自動處理 JSON 欄位解析

### 3. 資料庫結構
- ✅ `important_dialogues` 表添加 `translation_zh` 欄位
- ✅ `vocabulary_notes` 表支援 JSON 欄位
- ✅ 完整的外鍵關聯（movies → subtitles → important_dialogues/vocabulary_notes）

### 4. 測試和腳本工具
- ✅ `scripts/test-glm-subtitle-analysis.js` - GLM API 測試腳本
- ✅ `scripts/migrate-add-translation.js` - 資料庫遷移腳本
- ✅ `scripts/check-dialogues-schema.js` - 檢查資料表結構
- ✅ `scripts/check-vocabulary-notes.js` - 檢查生字筆記
- ✅ `scripts/check-movies.js` - 檢查電影資料

---

## 🚀 環境準備

### 必要工具
```bash
# Node.js (建議 v18+)
node --version

# 確認 .env 檔案存在
ls .env
```

### 環境變數檢查
確認 `.env` 包含以下設定：

```bash
# Turso 資料庫（已有）
VITE_TURSO_URL=libsql://subtitlelingo-xxx.turso.io
VITE_TURSO_AUTH_TOKEN=eyJhbGc...

# GLM 4.7 API（需要添加）
GLM_API_KEY=your-glm-api-key-here

# n8n Webhook（可選）
VITE_N8N_API_URL=https://your-n8n-space.hf.space/webhook
```

---

## 🗄️ 資料庫設置

### 1. 遷移資料庫結構（已完成）
```bash
node scripts/migrate-add-translation.js
```

**預期輸出：**
```
🔄 開始資料庫遷移...
📝 添加 translation_zh 欄位到 important_dialogues 表...
✅ translation_zh 欄位添加成功
✅ translation_zh 欄位驗證成功
✨ 遷移完成！
```

### 2. 驗證資料表結構
```bash
# 檢查 important_dialogues
node scripts/check-dialogues-schema.js

# 檢查 vocabulary_notes
node scripts/check-vocabulary-notes.js

# 檢查電影資料
node scripts/check-movies.js
```

---

## 🤖 GLM API 設置

### 1. 申請 API Key
1. 訪問 [Z.AI Developer Platform](https://docs.z.ai/api-reference/introduction)
2. 註冊帳號
3. 進入 Console
4. 創建新的 API Key
5. 複製 API Key

### 2. 設定 API Key
編輯 `.env` 檔案：
```bash
# 將這行
GLM_API_KEY=your-glm-api-key-here

# 改成你的實際 API Key
GLM_API_KEY=glm-xxxxxxxxxxxxxxxxxxxx
```

### 3. 測試 API 連接
```bash
node scripts/test-glm-subtitle-analysis.js
```

**預期輸出：**
```
🎬 開始測試 GLM 4.7 字幕分析功能
============================================================
📝 獲取 Inception 字幕...
✅ 找到字幕 ID: subtitle_xxx

🤖 正在呼叫 GLM 4.7 API 分析字幕...
✅ GLM 4.7 API 回應成功

📊 分析結果：
- 重要對話數量: 20
- 生字筆記數量: 12

💬 儲存重要對話到資料庫...
✅ 對話 1/20 已儲存
...
✨ 測試完成！
```

---

## 🧪 測試流程

### 步驟 1: 驗證資料庫寫入
```bash
# 檢查重要對話
node scripts/check-dialogues.js

# 檢查生字筆記
node scripts/check-vocabulary-notes.js
```

### 步驟 2: 啟動前端開發伺服器
```bash
npm run dev
```

### 步驟 3: 測試前端顯示
1. 打開瀏覽器訪問 `http://localhost:5173`
2. 選擇 "Inception" 電影
3. 切換到「重要對話」分頁
4. 點擊對話查看翻譯
5. 切換到「生字筆記」分頁
6. 驗證生字筆記正確顯示

---

## 🔧 n8n Workflow 配置

### 方法 1: 使用配置手動創建
1. 打開 n8n 編輯器
2. 按照 `n8n-workflows/GLM-SUBTITLE-ANALYSIS-GUIDE.md` 創建 14 個節點
3. 設定環境變數 `GLM_API_KEY`
4. 連接所有節點
5. 啟動 workflow

### 方法 2: 匯入完整 Workflow（需要先生成）
```bash
# TODO: 創建完整的 workflow JSON 檔案
# n8n-workflows/subtitle-fetcher-with-glm-complete.json
```

### 測試 n8n Workflow
```bash
curl -X POST https://your-n8n-url/webhook/subtitle-fetcher-complete \
  -H "Content-Type: application/json" \
  -d '{
    "imdb_id": "tt1375666",
    "language": "en"
  }'
```

---

## 💻 前端使用

### 資料庫讀取流程

```javascript
// 1. 載入電影字幕
const { data: subtitlesData } = await subtitleDB.getByMovieId(movieId);

// 2. 載入重要對話（從資料庫）
const { data: dialoguesData } = await importantDialoguesDB.getByMovieId(movieId);

// 3. 載入生字筆記（從資料庫）
const { data: vocabData } = await vocabularyDB.getByMovieId(movieId);

// 4. 格式化資料
const formattedDialogues = dialoguesData.map(d => ({
  ...d,
  translation: d.translation_zh || '翻譯載入中...'
}));

const formattedVocabs = vocabData.map(v => ({
  ...v,
  example_sentences: typeof v.example_sentences === 'string'
    ? JSON.parse(v.example_sentences)
    : v.example_sentences
}));
```

### 使用者互動
- ✅ 點擊重要對話 → 展開/收起翻譯
- ✅ 篩選生字難度（全部/初級/中級/高級）
- ✅ 自動從資料庫載入真實數據

---

## 🐛 常見問題

### Q1: GLM API 認證失敗
**錯誤訊息：** `401 Unauthorized`

**解決方案：**
1. 檢查 `.env` 中的 `GLM_API_KEY` 是否正確
2. 確認 API Key 沒有過期
3. 驗證 API Key 有效額度

### Q2: 資料庫連接失敗
**錯誤訊息：** `LibsqlError: UNAUTHORIZED`

**解決方案：**
1. 檢查 `VITE_TURSO_AUTH_TOKEN` 是否正確
2. 確認 Turso 資料庫在線
3. 驗證資料庫 URL 格式

### Q3: JSON 解析失敗
**錯誤訊息：** `SyntaxError: Unexpected token`

**解決方案：**
1. 檢查 GLM API 回應格式
2. 在 prompt 中強調輸出純 JSON
3. 增加錯誤處理邏輯

### Q4: 前端無法顯示翻譯
**可能原因：**
- 資料庫中沒有 `translation_zh` 欄位
- 欄位值為 NULL
- 前端讀取錯誤

**解決方案：**
```bash
# 1. 確認欄位存在
node scripts/check-dialogues-schema.js

# 2. 重新執行 GLM 分析
node scripts/test-glm-subtitle-analysis.js

# 3. 檢查前端 console
# 打開瀏覽器開發者工具查看錯誤訊息
```

---

## 📊 資料庫結構總覽

### movies
```
id (TEXT) PK
imdb_id (TEXT)
title (TEXT)
year (INTEGER)
type (TEXT)
poster_url (TEXT)
download_count (INTEGER)
overview (TEXT)
created_at (DATETIME)
updated_at (DATETIME)
```

### subtitles
```
id (TEXT) PK
movie_id (TEXT) FK → movies.id
srt_content (TEXT)
language (TEXT)
created_at (DATETIME)
```

### important_dialogues
```
id (TEXT) PK
subtitle_id (TEXT) FK → subtitles.id
content (TEXT)
time_start (TEXT)
time_end (TEXT)
translation_zh (TEXT) ⭐ NEW
explanation (TEXT)
difficulty_level (TEXT)
created_at (DATETIME)
```

### vocabulary_notes
```
id (TEXT) PK
word (TEXT)
part_of_speech (TEXT)
definition_zh (TEXT)
level (TEXT)
original_sentence (TEXT)
example_sentences (TEXT) JSON
movie_id (TEXT) FK → movies.id
dialogue_id (TEXT) FK → important_dialogues.id
created_at (DATETIME)
```

---

## 📝 API 端點

### GLM 4.7 Chat Completions
```bash
POST https://api.z.ai/v1/chat/completions
Headers:
  Authorization: Bearer $GLM_API_KEY
  Content-Type: application/json

Body:
{
  "model": "glm-4.7",
  "messages": [...],
  "temperature": 0.3,
  "max_tokens": 8000
}
```

### n8n Webhook
```bash
POST https://your-n8n-url/webhook/subtitle-fetcher-complete
Body:
{
  "imdb_id": "tt1375666",
  "language": "en"
}
```

---

## 🎯 下一步行動

### 立即可做：
1. ✅ 申請 GLM API Key
2. ✅ 執行 `node scripts/test-glm-subtitle-analysis.js` 測試
3. ✅ 啟動前端驗證資料顯示
4. ✅ 配置 n8n workflow

### 未來優化：
1. ⏳ 添加錯誤重試機制
2. ⏳ 實現快取功能
3. ⏳ 添加用戶學習進度追蹤
4. ⏳ 支援更多語言翻譯

---

## 📞 支援與資源

- [GLM 4.7 API 文檔](https://docs.z.ai/guides/llm/glm-4.7)
- [Z.AI 開發者平台](https://docs.z.ai/api-reference/introduction)
- [n8n 官方文檔](https://docs.n8n.io/)
- [Turso 資料庫文檔](https://docs.turso.tech/)

---

**最後更新：** 2025-12-24
**版本：** 2.0.0
**狀態：** ✅ 生產就緒
