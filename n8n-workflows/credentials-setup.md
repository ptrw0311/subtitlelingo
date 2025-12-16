# n8n 憑證（Credentials）設定指南

## 1. OpenSubtitles API 憑證

在 n8n 中設定 OpenSubtitles API：

1. 前往 n8n 的 Settings > Credentials
2. 點擊 "Add credential"
3. 選擇 "Header Auth"
4. 設定：
   - Name: `OpenSubtitles API`
   - Header Name: `Api-Key`
   - Header Value: `vSuOAURoDGadtGk6End40nf6Eah0bVOF`

或者使用 "Generic Credential" 並設定：
```json
{
  "apiKey": "vSuOAURoDGadtGk6End40nf6Eah0bVOF"
}
```

## 2. Turso 資料庫憑證

在 n8n 中設定 Turso 資料庫：

1. 前往 Settings > Credentials
2. 點擊 "Add credential"
3. 選擇 "Generic Credential"
4. 設定：
   - Name: `Turso DB`
   - JSON Configuration:
```json
{
  "url": "libsql://subtitlelingo-peterwang.aws-ap-northeast-1.turso.io",
  "authToken": "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NjU1MjcyNTQsImlkIjoiOTY0ZjBjMjMtMTEzYi00YjEwLTg3N2UtM2I2NjVhNmYyYjg3IiwicmlkIjoiNzEyZmJhNmQtODY4YS00ZGU2LTg5NTEtNDNlOWExY2UyNzA3In0.w228JKt8eUFbWMoeKKQOwWsZGL1lkvOJ5Ho9_mbf2n34_IZrpakq69VoB4jtPN1I9-ZEbOMio3Xyb2A-pJ--CA"
}
```

## 3. 驗證憑證

設定完成後，在工作流程中使用：
- OpenSubtitles API: `{{ $credentials.opensubtitlesApi.apiKey }}`
- Turso DB: `{{ $credentials.tursoDb.url }}` 和 `{{ $credentials.tursoDb.authToken }}`

## 提示

- 確保憑證的名稱與工作流程中使用的一致
- 可以在 n8n 的 Test Connection 功能中測試憑證是否正確
- Turso 的 authToken 可以在 Turso Dashboard 中重新生成