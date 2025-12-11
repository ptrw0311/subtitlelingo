# SubtitleLingo - 產品需求規格文件 (PRD)

**版本**: 1.0  
**日期**: 2025-12-11  
**作者**: Peter & Claude  

---

## 1. 專案概述

### 1.1 專案名稱
SubtitleLingo

### 1.2 專案目的
透過 Netflix 等影視作品的英文字幕，幫助使用者學習道地的英文對話與詞彙。系統會自動分析字幕，提取重要對話和分級生字，並提供互動式練習功能。

### 1.3 目標用戶
個人使用（開發者本人）

### 1.4 核心價值
- 從真實影視對話學習道地英文
- AI 自動篩選重要對話，省去人工挑選時間
- 分級生字系統，適應不同程度學習需求
- 互動練習強化記憶

---

## 2. 技術架構

### 2.1 系統架構圖

```
┌─────────────────────────────────────────────────────────────┐
│                       SubtitleLingo                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐   │
│  │   Frontend  │────▶│   n8n API   │────▶│  Supabase   │   │
│  │ React+Vite  │◀────│  (HF Space) │◀────│ PostgreSQL  │   │
│  │ GitHub Pages│     └──────┬──────┘     └─────────────┘   │
│  └─────────────┘            │                               │
│                             ▼                               │
│                    ┌─────────────────┐                      │
│                    │  OpenSubtitles  │                      │
│                    │   (字幕來源)     │                      │
│                    └────────┬────────┘                      │
│                             │                               │
│                             ▼                               │
│                    ┌─────────────────┐                      │
│                    │   Gemini API    │                      │
│                    │  (LLM 分析)     │                      │
│                    └─────────────────┘                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 技術選型

| 層級 | 技術 | 說明 |
|------|------|------|
| Frontend | React + Vite | 元件化開發，熱更新快速 |
| Hosting | GitHub Pages | 靜態網站託管，免費 |
| Backend API | n8n (Hugging Face Space) | 自動化流程，webhook 觸發 |
| Database | Supabase (PostgreSQL) | 免費額度充足，SDK 完整 |
| LLM | Gemini API (1.5 Flash) | 免費額度：15次/分鐘、1500次/天 |
| 字幕來源 | OpenSubtitles.org | 豐富的影視字幕資源 |

---

## 3. 功能需求

### 3.1 影片瀏覽模組

#### 3.1.1 熱門影片列表
- **描述**: 首頁左側顯示 OpenSubtitles 上的熱門/最新英文字幕影片
- **資料來源**: 爬取 OpenSubtitles 熱門頁面
- **顯示欄位**: 影片名稱、年份、類型（電影/影集）、字幕下載次數
- **分頁**: 每頁 20 筆，支援載入更多

#### 3.1.2 搜尋功能
- **描述**: 使用者可輸入影片名稱搜尋
- **搜尋範圍**: OpenSubtitles 全站英文字幕
- **篩選條件**: 僅顯示有英文字幕的結果
- **即時搜尋**: 輸入後 500ms 防抖觸發

### 3.2 字幕分析模組

#### 3.2.1 字幕擷取
- **觸發時機**: 使用者點擊影片時
- **快取機制**: 已分析過的影片直接從 Supabase 讀取，不重複爬取
- **字幕格式**: 保留 SRT 時間軸，儲存完整字幕內容
- **錯誤處理**: 找不到字幕時顯示提示訊息

#### 3.2.2 重要對話分析 (LLM)
- **分析引擎**: Gemini 1.5 Flash API
- **擷取數量**: 基礎 5 句，依片長調整（每 30 分鐘 +2 句）
- **選取標準**:
  - 日常生活常用句型
  - 道地美式口語表達
  - 包含實用片語或慣用語
  - 情境明確，易於理解用法

#### 3.2.3 生字分析 (LLM)
- **分級制度**:
  - 初級（高中程度）: 5 個單字
  - 中級（大學程度）: 5 個單字
  - 高級（社會人士）: 5 個單字
- **生字資訊**:
  - 單字本身
  - 詞性
  - 中文解釋
  - 字幕中的原句（含時間軸）
  - 2-3 個額外例句

### 3.3 學習互動模組

#### 3.3.1 等級篩選
- **描述**: 使用者可選擇要學習的難度等級
- **選項**: 初級 / 中級 / 高級 / 全部
- **預設**: 全部

#### 3.3.2 填空練習
- **題型**: 選擇填空
- **題目生成**: 從重要對話中挖空生字
- **選項數量**: 4 個選項（1 正確 + 3 干擾）
- **即時回饋**: 答對顯示綠色，答錯顯示紅色並標示正解

#### 3.3.3 學習歷程追蹤
- **記錄項目**:
  - 每日學習的影片數量
  - 已學習的生字數量
  - 練習題正確率
  - 學習時間
- **統計顯示**: 簡易圖表呈現近 7 天/30 天趨勢

---

## 4. 資料庫設計 (Supabase)

### 4.1 資料表結構

#### movies 影片資料表
```sql
CREATE TABLE movies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opensubtitles_id VARCHAR(50) UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  year INTEGER,
  type VARCHAR(20), -- 'movie' or 'series'
  poster_url TEXT,
  download_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### subtitles 字幕資料表
```sql
CREATE TABLE subtitles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  movie_id UUID REFERENCES movies(id) ON DELETE CASCADE,
  full_content TEXT NOT NULL, -- 完整 SRT 內容
  language VARCHAR(10) DEFAULT 'en',
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### dialogues 重要對話資料表
```sql
CREATE TABLE dialogues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  movie_id UUID REFERENCES movies(id) ON DELETE CASCADE,
  content TEXT NOT NULL, -- 對話內容
  time_start VARCHAR(20), -- 開始時間 (SRT 格式)
  time_end VARCHAR(20), -- 結束時間
  explanation TEXT, -- LLM 分析的學習重點
  sort_order INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### vocabularies 生字資料表
```sql
CREATE TABLE vocabularies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  movie_id UUID REFERENCES movies(id) ON DELETE CASCADE,
  dialogue_id UUID REFERENCES dialogues(id) ON DELETE SET NULL,
  word VARCHAR(100) NOT NULL,
  part_of_speech VARCHAR(20), -- noun, verb, adjective, etc.
  definition_zh TEXT, -- 中文解釋
  level VARCHAR(20) NOT NULL, -- 'beginner', 'intermediate', 'advanced'
  original_sentence TEXT, -- 字幕原句
  example_sentences JSONB, -- 額外例句陣列
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### learning_records 學習紀錄資料表
```sql
CREATE TABLE learning_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  movie_id UUID REFERENCES movies(id) ON DELETE CASCADE,
  vocabulary_id UUID REFERENCES vocabularies(id) ON DELETE CASCADE,
  is_correct BOOLEAN,
  practiced_at TIMESTAMP DEFAULT NOW()
);
```

#### daily_stats 每日統計資料表
```sql
CREATE TABLE daily_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE UNIQUE NOT NULL,
  movies_studied INTEGER DEFAULT 0,
  words_learned INTEGER DEFAULT 0,
  exercises_total INTEGER DEFAULT 0,
  exercises_correct INTEGER DEFAULT 0,
  study_minutes INTEGER DEFAULT 0
);
```

---

## 5. API 設計 (n8n Webhooks)

### 5.1 端點列表

| 端點 | 方法 | 說明 |
|------|------|------|
| `/webhook/movies/popular` | GET | 取得熱門影片列表 |
| `/webhook/movies/search` | GET | 搜尋影片 |
| `/webhook/movies/{id}/analyze` | POST | 分析影片字幕 |
| `/webhook/movies/{id}/details` | GET | 取得影片分析結果 |

### 5.2 API 詳細規格

#### GET /webhook/movies/popular
取得 OpenSubtitles 熱門影片列表

**Query Parameters:**
- `page` (optional): 頁碼，預設 1

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "opensubtitles_id": "123456",
      "title": "The Movie Title",
      "year": 2024,
      "type": "movie",
      "poster_url": "https://...",
      "download_count": 50000
    }
  ],
  "pagination": {
    "current_page": 1,
    "total_pages": 10
  }
}
```

#### GET /webhook/movies/search
搜尋影片

**Query Parameters:**
- `q` (required): 搜尋關鍵字
- `page` (optional): 頁碼，預設 1

**Response:** 同 popular 端點

#### POST /webhook/movies/{id}/analyze
觸發字幕分析（爬取 + LLM 分析 + 存入 Supabase）

**Path Parameters:**
- `id`: OpenSubtitles 影片 ID

**Response:**
```json
{
  "success": true,
  "message": "Analysis complete",
  "movie_id": "uuid-here"
}
```

#### GET /webhook/movies/{id}/details
取得已分析的影片詳細資料

**Path Parameters:**
- `id`: OpenSubtitles 影片 ID

**Response:**
```json
{
  "success": true,
  "data": {
    "movie": { ... },
    "subtitle": { ... },
    "dialogues": [ ... ],
    "vocabularies": [ ... ]
  }
}
```

---

## 6. UI 介面規劃

### 6.1 頁面結構

```
┌────────────────────────────────────────────────────────────┐
│  [Logo] SubtitleLingo              [學習統計] [設定]        │
├──────────────────────┬─────────────────────────────────────┤
│                      │                                     │
│  🔍 搜尋影片...       │  [影片標題]                         │
│                      │                                     │
│  ─────────────────   │  📝 完整字幕    💬 重要對話    📚 生字 │
│  熱門影片            │  ─────────────────────────────────  │
│  ─────────────────   │                                     │
│                      │  [等級篩選: 初級 | 中級 | 高級 | 全部] │
│  🎬 Movie 1          │                                     │
│  🎬 Movie 2          │  [內容顯示區]                        │
│  🎬 Movie 3          │                                     │
│  📺 Series 1         │                                     │
│  ...                 │                                     │
│                      │  ─────────────────────────────────  │
│  [載入更多]          │  [開始練習] 按鈕                     │
│                      │                                     │
└──────────────────────┴─────────────────────────────────────┘
```

### 6.2 頁面清單

| 頁面 | 路由 | 說明 |
|------|------|------|
| 首頁 | `/` | 影片列表 + 內容檢視 |
| 練習頁 | `/practice/:movieId` | 填空練習 |
| 統計頁 | `/stats` | 學習歷程統計 |

### 6.3 元件清單

| 元件 | 說明 |
|------|------|
| `MovieList` | 左側影片列表 |
| `MovieCard` | 單一影片卡片 |
| `SearchBar` | 搜尋輸入框 |
| `SubtitleViewer` | 完整字幕檢視（含時間軸） |
| `DialogueList` | 重要對話列表 |
| `VocabularyCard` | 生字卡片（含例句） |
| `LevelFilter` | 等級篩選按鈕群 |
| `PracticeQuiz` | 填空練習題 |
| `StatsChart` | 學習統計圖表 |
| `LoadingSpinner` | 載入中動畫 |

---

## 7. 開發階段規劃

### Phase 1: 基礎建設（1-2 週）
- [ ] 建立 React + Vite 專案結構
- [ ] 設定 GitHub Pages 部署
- [ ] 建立 Supabase 專案與資料表
- [ ] 設定 n8n webhook 基本框架

### Phase 2: 核心功能 - 影片與字幕（2-3 週）
- [ ] n8n: 爬取 OpenSubtitles 熱門列表
- [ ] n8n: 搜尋影片功能
- [ ] n8n: 下載並解析 SRT 字幕
- [ ] Frontend: MovieList + SearchBar 元件
- [ ] Frontend: SubtitleViewer 元件

### Phase 3: LLM 分析（1-2 週）
- [ ] n8n: 串接 Gemini API
- [ ] n8n: 重要對話分析 prompt 設計
- [ ] n8n: 生字分析 prompt 設計
- [ ] n8n: 額度控制邏輯
- [ ] Frontend: DialogueList + VocabularyCard 元件

### Phase 4: 學習功能（1-2 週）
- [ ] Frontend: LevelFilter 元件
- [ ] Frontend: PracticeQuiz 元件
- [ ] 學習紀錄寫入 Supabase
- [ ] Frontend: StatsChart 元件

### Phase 5: 優化與收尾（1 週）
- [ ] UI/UX 細節調整
- [ ] 錯誤處理完善
- [ ] 效能優化
- [ ] 文件撰寫

---

## 8. 額度與限制管理

### 8.1 Gemini API 額度控制
- 免費額度：15 次/分鐘、1500 次/天
- 每次分析影片呼叫約 2-3 次 API
- 實作計數器，達到 80% 額度時提示警告
- 超過額度時暫停分析功能，顯示剩餘等待時間

### 8.2 OpenSubtitles 爬蟲禮儀
- 請求間隔：至少 2 秒
- 使用合理的 User-Agent
- 快取已取得的資料，避免重複請求

---

## 9. 未來擴充方向

- 支援其他字幕來源（Subscene 等）
- 影片播放同步字幕顯示
- 生字複習系統（間隔重複）
- 匯出單字本功能（Anki 格式）
- 多使用者支援

---

## 附錄 A: Gemini Prompt 範本

### 重要對話分析 Prompt
```
你是一位英語教學專家。請從以下字幕內容中，挑選出最適合英文學習者學習的重要對話。

選取標準：
1. 日常生活中常用的句型
2. 道地的美式口語表達
3. 包含實用的片語或慣用語
4. 情境明確，容易理解用法

請挑選 {count} 句重要對話，並說明每句的學習重點。

字幕內容：
{subtitle_content}

請以 JSON 格式回覆：
{
  "dialogues": [
    {
      "content": "對話內容",
      "time_start": "開始時間",
      "time_end": "結束時間",
      "explanation": "學習重點說明"
    }
  ]
}
```

### 生字分析 Prompt
```
你是一位英語教學專家。請從以下重要對話中，挑選出值得學習的生字。

分級標準：
- 初級（beginner）：高中程度單字
- 中級（intermediate）：大學程度單字
- 高級（advanced）：社會人士、專業領域單字

每個等級請挑選 5 個單字。

對話內容：
{dialogue_content}

請以 JSON 格式回覆，並為每個生字提供 2-3 個額外例句：
{
  "vocabularies": [
    {
      "word": "單字",
      "part_of_speech": "詞性",
      "definition_zh": "中文解釋",
      "level": "beginner/intermediate/advanced",
      "original_sentence": "字幕原句",
      "example_sentences": ["例句1", "例句2", "例句3"]
    }
  ]
}
```

---

*文件結束*
