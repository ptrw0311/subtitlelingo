# n8n Workflow 配置指南 - 使用 GLM 4.7 分析字幕

## 📋 前置準備

### 1. 申請 GLM 4.7 API Key
- 訪問：https://docs.z.ai/api-reference/introduction
- 註冊帳號並創建 API Key
- 將 API Key 加入 n8n 的環境變數或憑證管理

### 2. 準備 Turso 資料庫憑證
- Turso URL: 已有
- Turso Auth Token: 已有

---

## 🔧 n8n Workflow 節點配置

### 節點 1: Webhook Trigger
```
名稱: Webhook Trigger
類型: Webhook
HTTP Method: POST
Path: subtitle-fetcher-complete
Response Mode: Using 'Respond to Webhook' Node
```

---

### 節點 2: Prepare API Call (Code)
```javascript
// 準備調用 OpenSubtitles API
const body = $input.first().json.body || {};
const imdbId = body.imdb_id || '';
const language = body.language || 'en';

if (!imdbId) {
  return { error: 'IMDb ID 是必填的' };
}

const cleanImdbId = imdbId.replace(/^tt/, '');
const searchUrl = `https://api.opensubtitles.com/api/v1/subtitles?imdb_id=${cleanImdbId}&languages=${language}`;

return {
  url: searchUrl,
  imdb_id: imdbId,
  language: language,
  clean_imdb_id: cleanImdbId
};
```

---

### 節點 3: HTTP Request - Search Subtitles
```
名稱: HTTP Request - Search Subtitles
類型: HTTP Request
Method: GET
URL:={{ $json.url }}
Authentication: None
Response Format: JSON
```

---

### 節點 4: Select Best Subtitle (Code)
```javascript
// 選擇最佳字幕
const searchResult = $input.first().json;

if (!searchResult.data || searchResult.data.length === 0) {
  return { success: false, error: '未找到字幕' };
}

// 選擇下載次數最多的字幕
const bestSubtitle = searchResult.data.reduce((best, current) => {
  const currentDownloads = current.attributes.download_count + current.attributes.new_download_count;
  const bestDownloads = best ? best.attributes.download_count + best.attributes.new_download_count : 0;
  return currentDownloads > bestDownloads ? current : best;
}, null);

const fileId = bestSubtitle.attributes.files[0].file_id;

return {
  success: true,
  selected_subtitle: {
    id: bestSubtitle.id,
    file_id: fileId,
    language: bestSubtitle.attributes.language,
    movie: bestSubtitle.attributes.feature_details
  },
  file_id: fileId,
  imdb_id: $('Prepare API Call').item.json.imdb_id
};
```

---

### 節點 5: Download Subtitle File (HTTP Request)
```
名稱: Download Subtitle File
類型: HTTP Request
Method: POST
URL: https://api.opensubtitles.com/api/v1/download
Authentication: None
Request Body: JSON
{
  "file_id": "={{ $json.file_id }}"
}
Response Format: JSON
```

---

### 節點 6: Download SRT Content (HTTP Request)
```
名稱: Download SRT Content
類型: HTTP Request
Method: GET
URL:={{ $json.link }}
Response Format: Text
Options:
  - Response Response: Response
```

---

### 節點 7: Save Subtitle to Turso (HTTP Request)
```
名稱: Save Subtitle to Turso
類型: HTTP Request
Method: POST
URL: https://<your-turso-url>
Authentication: None
Request Body: SQL
Content-Type: text/plain

Body:
INSERT INTO subtitles (id, movie_id, srt_content, language, created_at)
VALUES (
  'subtitle_' || lower(hex(randomblob(16))),
  (SELECT id FROM movies WHERE imdb_id = '{{ $('Select Best Subtitle').item.json.imdb_id }}' LIMIT 1),
  '{{ $json }}',
  'en',
  datetime('now')
)
RETURNING *

Headers:
Authorization: Bearer <your-turso-token>
```

---

### ⭐ 節點 8: GLM 4.7 Analyze Subtitles (HTTP Request) - 核心節點
```
名稱: GLM 4.7 Analyze Subtitles
類型: HTTP Request
Method: POST
URL: https://api.z.ai/v1/chat/completions
Authentication: None
Request Body: JSON
Content-Type: application/json

Body (使用表達式):
{
  "model": "glm-4.7",
  "messages": [
    {
      "role": "system",
      "content": "你是專業的英文教學助手和語言學專家。請分析以下 SRT 字幕檔案，完成兩個任務：\n\n1. 提取 20 段最重要的對話（根據以下標準選擇）：\n   - 對話長度適中（15-50 字）\n   - 包含重要劇情或情感表達\n   - 不包含純音效或環境描述\n   - 涵蓋整部電影的不同場景\n   - 選擇具有代表性、學習價值高的句子\n\n2. 提取 10-15 個重要生字（根據以下標準）：\n   - 中高級難度單字（B2-C1 等級）\n   - 在對話中出現的重要詞彙\n   - 包含詞性、繁體中文定義、難度等級\n   - 提供原電影中的例句和額外例句\n\n請以 JSON 格式回應，結構如下：\n{\n  \"important_dialogues\": [\n    {\n      \"content\": \"對話內容（完整英文）\",\n      \"time_start\": \"00:02:46,741\",\n      \"time_end\": \"00:02:56,644\",\n      \"translation_zh\": \"繁體中文翻譯\",\n      \"explanation\": \"語法、文化背景或學習重點說明（繁體中文）\",\n      \"difficulty_level\": \"intermediate 或 advanced\"\n    }\n  ],\n  \"vocabulary_notes\": [\n    {\n      \"word\": \"subconscious\",\n      \"part_of_speech\": \"noun (名詞)\",\n      \"definition_zh\": \"潛意識；指潛藏在意識之下的心理活動\",\n      \"level\": \"advanced\",\n      \"original_sentence\": \"That's my subconscious trying to keep the dream intact.\",\n      \"example_sentences\": [\n        \"Your subconscious can affect your decisions without you realizing it.\",\n        \"Dreams are a way to access the subconscious mind.\"\n      ]\n    }\n  ]\n}\n\n重要提醒：\n- translation_zh 必須使用繁體中文\n- explanation 必須使用繁體中文\n- definition_zh 必須使用繁體中文\n- 確保 JSON 格式正確，可以被直接解析\n- time_start 和 time_end 必須與字幕中的時間戳完全一致"
    },
    {
      "role": "user",
      "content": "請分析以下電影的字幕內容，提取重要對話和生字筆記：\n\n{{ $('Download SRT Content').item.json.slice(0, 15000) }}\n\n請以 JSON 格式回應，不要包含任何其他文字說明。"
    }
  ],
  "temperature": 0.3,
  "max_tokens": 8000,
  "top_p": 0.9
}

Headers:
Authorization: Bearer {{ $env.GLM_API_KEY }}
Content-Type: application/json

Response Format: JSON
```

**⚠️ 重要說明：**
- 將 `GLM_API_KEY` 加入 n8n 的環境變數
- 或直接替換 `{{ $env.GLM_API_KEY }}` 為你的實際 API Key

---

### 節點 9: Parse GLM Response (Code)
```javascript
// 解析 GLM 4.7 回應
const glmResponse = $input.first().json;
let dialogues = [];
let vocabularies = [];

try {
  // 獲取回應內容
  const content = glmResponse.choices?.[0]?.message?.content || '{}';

  // 移除可能的 markdown 程式碼區塊標記
  let jsonContent = content.trim();
  if (jsonContent.startsWith('```json')) {
    jsonContent = jsonContent.slice(7);
  }
  if (jsonContent.startsWith('```')) {
    jsonContent = jsonContent.slice(3);
  }
  if (jsonContent.endsWith('```')) {
    jsonContent = jsonContent.slice(0, -3);
  }
  jsonContent = jsonContent.trim();

  // 解析 JSON
  const parsed = JSON.parse(jsonContent);

  dialogues = parsed.important_dialogues || [];
  vocabularies = parsed.vocabulary_notes || [];

  console.log(`解析成功: ${dialogues.length} 段對話, ${vocabularies.length} 個生字`);
} catch (error) {
  console.error('解析 GLM 回應失敗:', error);
  return {
    error: '解析失敗',
    details: error.message
  };
}

return {
  dialogues: dialogues,
  vocabularies: vocabularies,
  dialogues_count: dialogues.length,
  vocabularies_count: vocabularies.length,
  subtitle_id: $('Save Subtitle to Turso').item.json.id,
  movie_id: $('Save Subtitle to Turso').item.json.movie_id
};
```

---

### 節點 10: Split in Batches - Dialogues
```
名稱: Split in Batches - Dialogues
類型: Split In Batches
Batch Size: 1
Options: Reset = false
```

---

### 節點 11: Save Important Dialogues (Loop over HTTP Request)
```
名稱: Save Important Dialogues
類型: HTTP Request
Method: POST
URL: https://<your-turso-url>
Authentication: None
Request Body: SQL
Content-Type: text/plain

Body:
INSERT INTO important_dialogues (
  id, subtitle_id, content, time_start, time_end,
  explanation, difficulty_level, created_at
)
VALUES (
  'dialogue_' || lower(hex(randomblob(16))),
  '{{ $('Parse GLM Response').item.json.subtitle_id }}',
  '{{ $json.content }}',
  '{{ $json.time_start }}',
  '{{ $json.time_end }}',
  '{{ $json.explanation }}',
  '{{ $json.difficulty_level }}',
  datetime('now')
)
RETURNING *

Headers:
Authorization: Bearer <your-turso-token>
```

---

### 節點 12: Split in Batches - Vocabulary
```
名稱: Split in Batches - Vocabulary
類型: Split In Batches
Batch Size: 1
Options: Reset = false
```

---

### 節點 13: Save Vocabulary Notes (Loop over HTTP Request)
```
名稱: Save Vocabulary Notes
類型: HTTP Request
Method: POST
URL: https://<your-turso-url>
Authentication: None
Request Body: SQL
Content-Type: text/plain

Body:
INSERT INTO vocabulary_notes (
  id, word, part_of_speech, definition_zh, level,
  original_sentence, example_sentences, movie_id, created_at
)
VALUES (
  'vocab_' || lower(hex(randomblob(16))),
  '{{ $json.word }}',
  '{{ $json.part_of_speech }}',
  '{{ $json.definition_zh }}',
  '{{ $json.level }}',
  '{{ $json.original_sentence }}',
  '{{ JSON.stringify($json.example_sentences) }}',
  '{{ $('Parse GLM Response').item.json.movie_id }}',
  datetime('now')
)
RETURNING *

Headers:
Authorization: Bearer <your-turso-token>
```

---

### 節點 14: Final Response (Respond to Webhook)
```
名稱: Final Response
類型: Respond to Webhook
Respond With: JSON

Response Body:
{
  "success": true,
  "message": "字幕下載與分析完成",
  "data": {
    "subtitle": {
      "id": "{{ $('Save Subtitle to Turso').item.json.id }}",
      "movie_id": "{{ $('Parse GLM Response').item.json.movie_id }}"
    },
    "analysis": {
      "dialogues_count": {{ $('Parse GLM Response').item.json.dialogues_count }},
      "vocabulary_count": {{ $('Parse GLM Response').item.json.vocabularies_count }}
    }
  }
}
```

---

## 🔗 節點連接順序

```
1. Webhook Trigger
   ↓
2. Prepare API Call
   ↓
3. HTTP Request - Search Subtitles
   ↓
4. Select Best Subtitle
   ↓
5. Download Subtitle File
   ↓
6. Download SRT Content
   ↓
7. Save Subtitle to Turso
   ↓
8. ⭐ GLM 4.7 Analyze Subtitles (關鍵節點)
   ↓
9. Parse GLM Response
   ↓
10. Split in Batches - Dialogues
    ↓ (循環)
11. Save Important Dialogues
    ↓
12. Split in Batches - Vocabulary
    ↓ (循環)
13. Save Vocabulary Notes
    ↓
14. Final Response
```

---

## 🔑 環境變數設定

在 n8n 中設定以下環境變數：

1. **GLM_API_KEY**: 你的 GLM 4.7 API Key
   - 申請地址：https://docs.z.ai/api-reference/introduction

2. **TURSO_URL**: 你的 Turso 資料庫 URL
   - 已有

3. **TURSO_AUTH_TOKEN**: 你的 Turso 認證令牌
   - 已有

---

## 📝 測試步驟

### 1. 測試 GLM API 連接
在 n8n 中創建一個簡單的 HTTP Request 節點：

```
Method: POST
URL: https://api.z.ai/v1/chat/completions
Body:
{
  "model": "glm-4.7",
  "messages": [
    {"role": "user", "content": "你好，請用一句話介紹你自己"}
  ]
}
Headers:
Authorization: Bearer <your-api-key>
```

預期回應：GLM 模型的回應

### 2. 測試完整 Workflow
使用 Postman 或 curl 發送測試請求：

```bash
curl -X POST https://your-n8n-url/webhook/subtitle-fetcher-complete \
  -H "Content-Type: application/json" \
  -d '{
    "imdb_id": "tt1375666",
    "language": "en"
  }'
```

---

## ⚠️ 常見問題

### Q1: GLM API 回應超時
**解決方案**：增加 `timeout` 參數或在 n8n 節點設定中調整逾時時間

### Q2: JSON 解析失敗
**解決方案**：在 "Parse GLM Response" 節點中加入更多錯誤處理，或調整 prompt 強調 JSON 格式

### Q3: Token 限制
**解決方案**：使用 `slice(0, 15000)` 限制字幕長度，或在 GLM API 中使用更大的 `max_tokens`

---

## 🎯 優化建議

1. **快取機制**：對已分析的字幕建立快取，避免重複調用 GLM API
2. **批量處理**：使用 Split in Batches 節點提高寫入效率
3. **錯誤重試**：在 HTTP Request 節點中設定 'Continue On Fail' 和重試邏輯
4. **日誌記錄**：使用 Set 節點記錄關鍵步驟的執行狀態

---

## 📚 相關資源

- [GLM 4.7 官方文檔](https://docs.z.ai/guides/llm/glm-4.7)
- [n8n HTTP Request 節點文檔](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.httprequest/)
- [Turso HTTP API 文檔](https://docs.turso.tech/api-reference)

---

**更新日期**: 2025-12-24
**作者**: Claude Code
**版本**: 1.0
