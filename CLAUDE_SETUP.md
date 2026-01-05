# Claude Code 設定說明

這個專案使用 MCP servers 和 skills 來增強開發體驗。以下是完整的設定說明。

## 📁 專案結構

```
SubtitleLingo/
├── .claude/
│   ├── settings.json          # 專案權限設定(已加入版本控制)
│   └── skills/
│       └── ui-ux-pro-max/     # UI/UX 設計技能包
├── .mcp.json                  # MCP servers 設定(已加入版本控制)
└── n8n-mcp-server.js         # 自訂 MCP server
```

## 🔧 MCP Servers 設定

專案使用以下 MCP servers:

1. **n8n-mcp** - 自訂伺服器,用於 n8n workflow 整合
2. **playwright** - 瀏覽器自動化測試
3. **turso** - Turso 資料庫查詢
4. **brave-search** - Brave 搜尋 API

### 環境變數需求

`.mcp.json` 中包含敏感資訊,需要設定以下環境變數:

```bash
# Turso 資料庫
TURSO_DATABASE_URL=libsql://subtitlelingo-peterwang.aws-ap-northeast-1.turso.io
TURSO_AUTH_TOKEN=your_token_here

# Brave Search API
BRAVE_API_KEY=your_key_here

# n8n webhook URL
N8N_URL=https://ptrw0311-n8n-free.hf.space
```

## 🚦 在家裡電腦設定步驟

### 1. Clone 專案

```bash
git clone <your-repo-url>
cd SubtitleLingo
```

### 2. 設定環境變數

建立 `.env` 檔案(不要加入版本控制):

```bash
# 複製範本
cp .env.example .env

# 編輯 .env,填入實際的 API keys 和 tokens
```

### 3. 更新 `.mcp.json` 中的環境變數

由於 `.mcp.json` 中的 token 和 keys 需要保持最新,你需要:

- 從安全的密碼管理器取得最新的 API keys
- 手動更新 `.mcp.json` 中的 `env` 欄位

或者使用環境變數替換:

```json
{
  "mcpServers": {
    "turso": {
      "command": "npx",
      "args": ["-y", "@prama13/turso-mcp"],
      "env": {
        "TURSO_DATABASE_URL": "${TURSO_DATABASE_URL}",
        "TURSO_AUTH_TOKEN": "${TURSO_AUTH_TOKEN}"
      }
    }
  }
}
```

### 4. 安裝依賴

```bash
# 安裝專案依賴
npm install

# 安裝 Playwright 瀏覽器(如果需要)
npx playwright install chromium
```

### 5. 驗證設定

```bash
# 檢查 Claude Code 設定
claude doctor

# 測試 MCP servers
# 在 Claude Code 中執行測試指令
```

## 📝 Skills 說明

專案包含以下自訂 skill:

### ui-ux-pro-max

UI/UX 設計智能助手,包含:
- 50 種設計風格
- 21 個色彩調色板
- 50 種字體配對
- 20 種圖表類型
- 8 種技術棧支援

## 🔐 安全注意事項

1. **不要將實際的 API keys 提交到 Git**
   - `.mcp.json` 包含敏感資訊,建議使用環境變數
   - 或者將 `.mcp.json` 加入 `.gitignore`

2. **使用環境變數**
   - 建立每台電腦獨立的 `.env` 檔案
   - 在 `.mcp.json` 中使用 `${VAR_NAME}` 語法

3. **定期輪換 API keys**
   - 建議每 3-6 個月更新一次 tokens

## 🔄 同步更新

當在家裡電腦更新後:

```bash
git add .
git commit -m "update: 更新設定檔"
git push
```

回到公司電腦:

```bash
git pull
```

## 🆨 故障排除

### MCP Server 無法啟動

```bash
# 檢查 npx 是否安裝
npm --version

# 手動測試 MCP server
npx @playwright/mcp@latest
```

### Playwright 瀏覽器未安裝

```bash
npx playwright install
```

### 權限問題

檢查 `.claude/settings.json` 是否包含所有必要的權限設定。

## 📚 相關文件

- [MCP 官方文件](https://modelcontextprotocol.io)
- [Claude Code 文件](https://claude.ai/claude-code)
- [Playwright MCP Server](https://github.com/modelcontextprotocol/servers)
