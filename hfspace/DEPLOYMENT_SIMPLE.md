# SubtitleLingo HuggingFace Spaces 部署指南

## 檢查清單

✅ 所有必要檔案已準備完成
- app.py (主應用程式)
- requirements.txt (依賴套件)
- README.md (專案說明)
- config/, utils/, api_handlers/ (核心模組)

## 部署步驟

### 1. 建立 HuggingFace Space

1. 前往 https://huggingface.co/spaces
2. 點擊 "Create new Space"
3. 設定：
   - Name: `subtitlelingo`
   - SDK: Gradio
   - Hardware: CPU Basic (免費)
   - Visibility: Public

### 2. 上傳檔案

將整個 `hfspace` 目錄內容上傳到 Space

### 3. 設定環境變數

在 Space 的 Settings > Variables and secrets 中新增：

```
OPENSUBTITLES_API_KEY=vSuOAURoDGadtGk6End40nf6Eah0bVOF
TURSO_URL=libsql://subtitlelingo-peterwang.aws-ap-northeast-1.turso.io
TURSO_AUTH_TOKEN=your_turso_auth_token
```

### 4. 測試部署

- 健康檢查: `https://subtitlelingo.hf.space/health`
- API 端點: `https://subtitlelingo.hf.space/webhook/movies/popular`

## 前端整合

更新前端 API 配置：

```javascript
// src/config/api.js
export const API_CONFIG = {
  baseURL: 'https://subtitlelingo.hf.space/webhook',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  }
};
```

完成後，您的 SubtitleLingo API 將可在 HuggingFace Spaces 上運行！