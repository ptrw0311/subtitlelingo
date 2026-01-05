# 🎬 SubtitleLingo API Server

n8n 風格的字幕抓取和分析服務，部署在 HuggingFace Spaces 上，提供完整的字幕學習 API。

## ✨ 功能特色

- **🔍 智能字幕抓取**: 自動從 OpenSubtitles.org 抓取最新字幕
- **📝 多格式支援**: 支援 SRT 和 VTT 字幕格式解析
- **🎯 影片分析**: 使用 AI 技術分析影片內容和難度
- **💾 資料庫整合**: Turso 雲端資料庫儲存和管理
- **🚀 高效能 API**: FastAPI 後端提供穩定的服務
- **📊 實時監控**: Gradio 介面提供系統狀態監控

## 🚀 快速開始

### API 端點

所有 API 都通過 webhook 呼叫：

```bash
# 基礎 URL
https://subtitlelingo.hf.space/webhook

# 支援的端點
POST /webhook/movies/popular          # 取得熱門影片
POST /webhook/movies/search           # 搜尋影片
POST /webhook/movies/{id}/details     # 影片詳情
POST /webhook/movies/{id}/analyze     # 分析影片
POST /webhook/subtitles/fetch         # 抓取字幕
```

### 請求格式

```json
{
  "param1": "value1",
  "param2": "value2"
}
```

### 回應格式

```json
{
  "success": true,
  "data": { ... },
  "message": "操作成功",
  "response_time": 0.123
}
```

## 📖 API 使用範例

### 1. 取得熱門影片

```bash
curl -X POST https://subtitlelingo.hf.space/webhook/movies/popular \
  -H "Content-Type: application/json" \
  -d '{"page": 1}'
```

### 2. 搜尋影片

```bash
curl -X POST https://subtitlelingo.hf.space/webhook/movies/search \
  -H "Content-Type: application/json" \
  -d '{"query": "Inception", "page": 1}'
```

### 3. 抓取字幕

```bash
curl -X POST https://subtitlelingo.hf.space/webhook/subtitles/fetch \
  -H "Content-Type: application/json" \
  -d '{"imdb_id": "tt1375666", "language": "en"}'
```

### 4. 分析影片

```bash
curl -X POST https://subtitlelingo.hf.space/webhook/movies/tt1375666/analyze \
  -H "Content-Type: application/json" \
  -d '{}'
```

## 🛠️ 技術架構

### 核心技術

- **Gradio**: Web 介面框架
- **FastAPI**: 高效能 API 框架
- **Turso**: LibSQL 雲端資料庫
- **OpenSubtitles API**: 字幕來源
- **chardet**: 字元編碼檢測

### 專案結構

```
subtitlelingo/
├── app.py                    # Gradio 主應用程式
├── requirements.txt          # Python 依賴
├── README.md                # 專案說明
├── .env                     # 環境變數 ( Secrets )
├── utils/                   # 工具模組
│   ├── opensubtitles.py     # OpenSubtitles API 客戶端
│   ├── subtitle_parser.py   # 字幕解析器
│   └── turso_client.py      # Turso 資料庫客戶端
├── api_handlers/            # API 處理器
│   ├── movies.py           # 影片相關 API
│   ├── subtitles.py        # 字幕相關 API
│   └── analysis.py         # 分析相關 API
└── config/                  # 配置檔案
    └── settings.py         # 全域設定
```

## ⚙️ 設定說明

### 環境變數

在 HuggingFace Space 的 Settings > Secrets 中設定：

```bash
OPENSUBTITLES_API_KEY=your_api_key_here
TURSO_URL=libsql://your-database-url
TURSO_AUTH_TOKEN=your_auth_token
GEMINI_API_KEY=your_gemini_key  # 可選
```

### 速率限制

- **OpenSubtitles API**: 每秒最多 4 個請求
- **自動重試**: 失敗時自動重試 3 次
- **指數退避**: 避免觸發 API 限制

## 🎯 功能詳情

### 字幕處理

1. **自動格式檢測**: 智能識別 SRT/VTT 格式
2. **編碼處理**: 自動檢測和轉換字元編碼
3. **內容清理**: 移除 HTML 標籤和多餘格式
4. **時間解析**: 支援多種時間格式

### 影片分析

1. **對話提取**: 基於時間間隔提取對話片段
2. **生字識別**: 自動標記可能的生字詞彙
3. **難度評估**: 根據詞彙複雜度評估影片難度
4. **統計資訊**: 提供詳細的字幕統計資料

### 資料庫操作

1. **影片資訊**: 儲存影片基本資訊和元數據
2. **字幕內容**: 儲存解析後的字幕條目
3. **分析結果**: 儲存 AI 分析結果和統計資料
4. **練習題目**: 儲存自動生成的練習題

## 🔧 本地開發

### 環境需求

- Python 3.8+
- pip 或 uv

### 安裝依賴

```bash
pip install -r requirements.txt
```

### 設定環境變數

```bash
# 建立 .env 檔案
cp .env.example .env

# 編輯環境變數
nano .env
```

### 執行應用

```bash
python app.py
```

應用將在 `http://localhost:7860` 啟動。

## 🧪 測試

### 單元測試

```bash
python -m pytest tests/
```

### API 測試

使用 Gradio 介面的「API 測試」標籤進行測試，或使用 curl 工具。

### 健康檢查

```bash
curl https://subtitlelingo.hf.space/health
```

## 📊 監控與日誌

### 系統狀態

- 透過 Gradio 介面的「系統狀態」標籤監控
- 檢查資料庫連線狀態
- 查看 API 呼叫統計

### 日誌記錄

所有 API 請求都會記錄詳細日誌：
- 請求參數
- 回應時間
- 成功/失敗狀態
- 錯誤訊息

## 🚀 部署

### HuggingFace Spaces 自動部署

1. 推送程式碼到 GitHub
2. 連接到 HuggingFace Space
3. 設定環境變數
4. 自動建構和部署

### 手動部署

```bash
# 建構 Docker 映像檔 (可選)
docker build -t subtitlelingo .

# 執行容器
docker run -p 7860:7860 subtitlelingo
```

## 🔒 安全性

### API 金鑰保護

- 使用 HuggingFace Secrets 儲存敏感資訊
- 不在程式碼中硬編碼金鑰
- 定期輪換 API 金鑰

### 請求驗證

- 支援 HTTP Basic Auth (可選)
- 請求頻率限制
- 輸入參數驗證

## 🤝 貢獻

歡迎提交 Issue 和 Pull Request！

### 開發流程

1. Fork 專案
2. 建立功能分支
3. 提交變更
4. 推送到分支
5. 建立 Pull Request

## 📄 授權

本專案採用 MIT 授權條款。

## 🔗 相關連結

- [OpenSubtitles API 文件](https://www.opensubtitles.com/docs)
- [Turso 文件](https://docs.turso.tech/)
- [Gradio 文件](https://gradio.app/docs/)
- [FastAPI 文件](https://fastapi.tiangolo.com/)

## 🆘 支援

如有問題或需要協助，請：

1. 查看 [常見問題](#常見問題)
2. 搜尋 [現有 Issues](https://github.com/your-repo/issues)
3. 建立 [新 Issue](https://github.com/your-repo/issues/new)

### 常見問題

**Q: 如何取得 OpenSubtitles API 金鑰？**
A: 註冊 [OpenSubtitles](https://www.opensubtitles.com/) 帳號並在開發者頁面申請 API 金鑰。

**Q: Turso 資料庫免費額度？**
A: Turso 提供免費方案，包含 5GB 儲存空間和每月 100 萬次查詢。

**Q: 如何更新字幕資料？**
A: 使用 `force_refresh: true` 參數重新抓取字幕。

---

**SubtitleLingo** - 讓英文学習更輕鬆有趣！ 🎬✨