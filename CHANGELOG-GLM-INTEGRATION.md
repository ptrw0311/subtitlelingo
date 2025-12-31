# SubtitleLingo - GLM 4.7 整合更新總結

## 📅 更新日期
2025-12-24

## 🎯 更新目標
整合 GLM 4.7 AI 模型，自動分析字幕並生成重要對話和生字筆記，完全取代硬編碼資料。

---

## ✨ 主要功能

### 1. AI 自動分析字幕
- ✅ 使用 GLM 4.7 API 分析完整字幕
- ✅ 自動提取 20 段最重要對話
- ✅ 自動生成繁體中文翻譯
- ✅ 自動提取 10-15 個生字筆記
- ✅ 智能判斷難度等級

### 2. 資料庫整合
- ✅ 所有資料存入 Turso 資料庫
- ✅ 支援重要對話（`important_dialogues` 表）
- ✅ 支援生字筆記（`vocabulary_notes` 表）
- ✅ 完整的外鍵關聯

### 3. 前端顯示
- ✅ 從資料庫動態載入
- ✅ 點擊展開/收起翻譯
- ✅ 支援難度篩選
- ✅ 自動解析 JSON 欄位

---

## 📁 新增檔案

### 腳本工具
```
scripts/
├── test-glm-subtitle-analysis.js    # GLM API 測試腳本
├── migrate-add-translation.js       # 資料庫遷移腳本
├── check-dialogues-schema.js        # 檢查對話表結構
├── check-vocabulary-notes.js        # 檢查生字筆記表
└── check-movies.js                  # 檢查電影資料
```

### 文檔
```
├── DEPLOYMENT-GUIDE.md              # 完整部署指南（詳細）
├── GLM-QUICKSTART.md                # 快速開始指南
├── QUICK-CHECKLIST.md               # 檢查清單
└── CHANGELOG-GLM-INTEGRATION.md     # 本文件
```

### n8n 配置
```
n8n-workflows/
└── GLM-SUBTITLE-ANALYSIS-GUIDE.md   # n8n workflow 配置指南
```

---

## 🔧 修改檔案

### 1. `.env`
**變更：** 添加 GLM API Key 配置
```bash
# 新增
GLM_API_KEY=your-glm-api-key-here
```

### 2. `src/config/turso.js`
**變更：** 添加 `importantDialoguesDB` 模組
```javascript
// 新增
export const importantDialoguesDB = {
  getBySubtitleId: async (subtitleId) => { ... },
  getByMovieId: async (movieId) => { ... },
  create: async (dialogueData) => { ... },
  getByDifficulty: async (movieId, difficultyLevel) => { ... }
};
```

### 3. `src/pages/HomePage.jsx`
**變更：**
- 匯入 `importantDialoguesDB`
- 更新 `loadSubtitles()` 從資料庫讀取
- 添加翻譯展開/收起功能
- 自動處理 JSON 欄位

---

## 🗄️ 資料庫變更

### important_dialogues 表
**新增欄位：**
```sql
ALTER TABLE important_dialogues
ADD COLUMN translation_zh TEXT;
```

**完整結構：**
```sql
CREATE TABLE important_dialogues (
  id TEXT PRIMARY KEY,
  subtitle_id TEXT NOT NULL,      -- FK → subtitles.id
  content TEXT NOT NULL,
  time_start TEXT NOT NULL,
  time_end TEXT NOT NULL,
  translation_zh TEXT,            -- ⭐ 新增
  explanation TEXT,
  difficulty_level TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

## 🔄 資料流程

### 原本流程（硬編碼）
```
用戶選擇電影
  ↓
前端顯示假資料
  ↓
重要對話：硬編碼 20 段
生字筆記：硬編碼 10 個
```

### 新流程（AI 分析 + 資料庫）
```
用戶選擇電影
  ↓
從資料庫讀取字幕
  ↓
從資料庫讀取重要對話（已由 GLM 分析）
  ↓
從資料庫讀取生字筆記（已由 GLM 分析）
  ↓
前端動態顯示真實資料
```

### GLM 分析流程
```
n8n webhook 接收請求
  ↓
下載字幕檔案
  ↓
儲存字幕到資料庫
  ↓
呼叫 GLM 4.7 API 分析
  ↓
接收 JSON 回應（20 對話 + 10-15 生字）
  ↓
解析並寫入資料庫
  ↓
前端讀取並顯示
```

---

## 📊 GLM 4.7 vs OpenAI 對比

| 項目 | GLM 4.7 | OpenAI GPT-4 |
|------|---------|--------------|
| **繁體中文** | ✅ 原生支援，品質優 | ✅ 支援，品質良 |
| **價格** | ~$0.6/百萬 tokens | ~$30/百萬 tokens |
| **語境窗口** | 200K tokens | 128K tokens |
| **API 相容性** | OpenAI 格式相容 | 原生 |
| **翻譯品質** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **代碼生成** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **成本效益** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |

**結論：** GLM 4.7 在繁體中文和成本效益上更具優勢！

---

## 🚀 使用方式

### 方式 1: 測試腳本（推薦先用這個）
```bash
# 1. 設定 GLM_API_KEY 到 .env
# 2. 執行測試腳本
node scripts/test-glm-subtitle-analysis.js

# 3. 查看結果
node scripts/check-dialogues.js
node scripts/check-vocabulary-notes.js

# 4. 啟動前端驗證
npm run dev
```

### 方式 2: n8n Workflow（生產環境）
```bash
# 1. 按照 GLM-SUBTITLE-ANALYSIS-GUIDE.md 配置 n8n
# 2. 啟動 workflow
# 3. 發送請求
curl -X POST https://your-n8n-url/webhook/subtitle-fetcher-complete \
  -H "Content-Type: application/json" \
  -d '{"imdb_id": "tt1375666", "language": "en"}'
```

---

## 📈 預期效果

### 資料品質提升
- ✅ 真實的電影對話（不再假資料）
- ✅ 專業的繁體中文翻譯
- ✅ 語法和文化背景說明
- ✅ 智能難度分級

### 使用者體驗提升
- ✅ 點擊展開翻譯（互動性）
- ✅ 動態載入真實資料
- ✅ 支援難度篩選
- ✅ 真實例句應用

### 開發維護提升
- ✅ 自動化分析流程
- ✅ 資料庫集中管理
- ✅ 易於擴充新電影
- ✅ API 化架構

---

## 🐛 已知問題

### 1. GLM API 有時會 JSON 格式錯誤
**影響：** 需要重試
**解決方案：** 在 prompt 中強調輸出純 JSON

### 2. 長字幕可能超出 token 限制
**影響：** 無法完整分析
**解決方案：** 截取前 15000 字元或分段處理

### 3. 部分對話可能沒有翻譯
**影響：** 顯示「翻譯載入中...」
**解決方案：** 重新執行 GLM 分析

---

## 🔮 未來規劃

### 短期（1-2 週）
- [ ] 添加錯誤重試機制
- [ ] 實現分析快取
- [ ] 添加進度條顯示
- [ ] 支援更多電影

### 中期（1 個月）
- [ ] 支援多語言翻譯
- [ ] 添加用戶收藏功能
- [ ] 實現學習進度追蹤
- [ ] 優化 n8n workflow

### 長期（3 個月）
- [ ] 支援用戶自定義對話
- [ ] 添加語音朗讀功能
- [ ] 整合 Quizlet 風格測驗
- [ ] 建立學習社群

---

## 📞 支援與反饋

### 問題回報
- GitHub Issues: [創建 Issue]
- Email: support@subtitlelingo.com

### 相關資源
- [GLM 4.7 文檔](https://docs.z.ai/guides/llm/glm-4.7)
- [Z.AI 開發者平台](https://docs.z.ai/api-reference/introduction)
- [完整部署指南](./DEPLOYMENT-GUIDE.md)

---

## 📜 授權

MIT License

---

**更新版本：** v2.0.0
**發布日期：** 2025-12-24
**作者：** SubtitleLingo Team
**狀態：** ✅ 生產就緒
