# SubtitleLingo 設計調整說明

## 📋 調整總覽

根據您的需求，已完成以下設計調整：
1. ✅ **移除平板端佈局** - 只保留桌面端（≥1024px）和手機端（<768px）
2. ✅ **重新設計電影選擇區塊** - 最近練習 + 下拉選單
3. ✅ **n8n workflow 雙語字幕策略** - 4 種解決方案分析

---

## 🎬 新設計：電影選擇區塊

### 設計原則

**問題**：原設計中電影選擇不夠直覺，無法快速切換影片
**解決**：分層顯示，最近練習置頂 + 下拉選單選擇其他

### 結構

```
┌─────────────────────────────────────────────────┐
│  選擇影片學習                    最近：Dark Knight│
├─────────────────────────────────────────────────┤
│                                                 │
│  ⏱️ 最近練習                                    │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐          │
│  │Dark  │ │Incep │ │Fight │ │Rizzo │          │
│  │Knight│ │tion  │ │Club  │ │&Isles│          │
│  └──────┘ └──────┘ └──────┘ └──────┘          │
│                                                 │
│  ─────────────────────────────────────────────  │
│                                                 │
│  📚 所有電影                       [▼ 下拉]     │
│  ┌─────────────────────────────────────────┐   │
│  │ 🔍 搜尋電影...                        │   │
│  ├─────────────────────────────────────────┤   │
│  │ 🎬 12 Angry Men    1957 • 初級         │   │
│  │ 🎬 The Godfather   1972 • 中級         │   │
│  │ 🎬 Wake Up Dead    2025 • 高級         │   │
│  │ 還有 4 部影片...                      │   │
│  └─────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
```

### 功能特點

#### 1️⃣ 最近練習區（橫向滾動）

**顯示邏輯**：
- 根據 `user_learning_records` 表的 `last_practiced_at` 排序
- 顯示最近 4-6 部練習過的影片
- 當前選中的影片有高亮邊框（Teal-400）

**卡片資訊**：
- 🎬 電影海報圖標
- 標題 + 年份
- 難度標籤（初級/中級/高級）
- 生字數量
- 最後練習時間（相對時間）
- 如果今天練習過顯示 🔥

**互動**：
- Hover: 上移 2px + 邊框變色
- Click: 切換到該影片，顯示下方 6 個學習按鈕

#### 2️⃣ 所有電影下拉選單

**功能**：
- 點擊展開/收起
- 搜尋框過濾電影
- 顯示所有資料庫中的影片

**列表項目**：
- 縮圖（色塊 + 圖標）
- 標題
- 年份 + 類型
- 難度標籤
- 生字數量

**排序建議**：
1. 最近添加
2. 標題字母順序
3. 難度（初級 → 高級）

### 資料庫查詢邏輯

```sql
-- 最近練習的影片
SELECT
    m.id, m.title, m.year,
    COUNT(DISTINCT vn.id) as vocabulary_count,
    MAX(ulr.last_practiced_at) as last_practiced_at,
    CASE
        WHEN DATE(ulr.last_practiced_at) = DATE('now') THEN 1
        ELSE 0
    END as practiced_today
FROM movies m
LEFT JOIN vocabulary_notes vn ON m.id = vn.movie_id
LEFT JOIN user_learning_records ulr ON m.id = ulr.movie_id AND ulr.user_id = ?
GROUP BY m.id
ORDER BY last_practiced_at DESC
LIMIT 6;

-- 所有電影（下拉選單）
SELECT
    m.id, m.title, m.year, m.genre,
    COUNT(DISTINCT vn.id) as vocabulary_count,
    AVG(vn.level) as avg_difficulty
FROM movies m
LEFT JOIN vocabulary_notes vn ON m.id = vn.movie_id
GROUP BY m.id
ORDER BY m.created_at DESC;
```

---

## 📱 響應式佈局調整

### 移除平板端佈局

**原設計**：
- 桌面端（≥1024px）：3x2 網格
- 平板端（768-1023px）：2x3 網格 ❌ 移除
- 手機端（<768px）：橫向滾動

**新設計**：
- 桌面端（≥1024px）：3x2 網格 ✅
- 手機端（<768px）：橫向滾動卡片 ✅

### 桌面端按鈕排列

```
┌─────────┬─────────┬─────────┐
│ 1.觀看  │ 2.對話  │ 3.生字  │ ← 輸入階段
├─────────┼─────────┼─────────┤
│ 4.測驗  │ 5.複習  │ 6.跟讀  │ ← 輸出階段
└─────────┴─────────┴─────────┘
```

### 手機端按鈕排列

```
┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐
│ 1    │ │ 2    │ │ 3    │ │ 4    │ │ 5    │ │ 6    │
└──────┘ └──────┘ └──────┘ └──────┘ └──────┘ └──────┘
← 橫向滾動 →
```

---

## 🔧 n8n Workflow 雙語字幕策略

### 現況分析

**目前狀況**：
- n8n workflow 只抓取英文字幕
- 儲存到 `subtitles` 表的 `text` 欄位
- `type` 欄位可能用於區分字幕類型

**資料庫結構**：
```sql
subtitles 表：
- id: INTEGER PRIMARY KEY
- movie_id: TEXT
- type: TEXT (可能是 'en', 'dialogue', etc.)
- text: TEXT (字幕內容)
- timestamp/duration: (時間戳記)
```

### 4 種解決方案

#### ⭐ 方案 A：雙欄位並存（推薦）

**實作方式**：
```sql
-- 新增中文欄位
ALTER TABLE subtitles ADD COLUMN text_zh_tw TEXT;

-- 更新資料
UPDATE subtitles
SET text_zh_tw = '中文字幕內容'
WHERE movie_id = 'movie_xxx';
```

**n8n Workflow**：
```
Webhook → Fetch EN Subtitles → Merge → Save to DB
                ↓
        Fetch ZH-TW Subtitles →
```

**優點**：
- ✅ 保留原始英文資料
- ✅ 查詢效能好（簡單 SELECT）
- ✅ 易於維護和擴展
- ✅ 支援增量更新

**缺點**：
- ⚠️ 資料庫大小增加（可接受）

---

#### 方案 B：JSON 欄位

**實作方式**：
```sql
ALTER TABLE subtitles ADD COLUMN text_bilingual TEXT;

-- 儲存格式
{
  "en": "Hello",
  "zh_tw": "你好"
}
```

**優點**：
- ✅ 彈性高，易於新增語言
- ✅ 單一欄位管理

**缺點**：
- ❌ 查詢複雜（需 JSON 函數）
- ❌ 索引效能較差
- ❌ SQLite JSON 函數支援有限

---

#### 方案 C：分表儲存

**實作方式**：
```sql
CREATE TABLE subtitles_zh_tw (
    id INTEGER PRIMARY KEY,
    subtitle_id INTEGER,  -- 對應 subtitles.id
    movie_id TEXT,
    text TEXT,
    FOREIGN KEY (subtitle_id) REFERENCES subtitles(id)
);
```

**優點**：
- ✅ 擴展性好
- ✅ 清晰的資料分離

**缺點**：
- ❌ 需要 JOIN 查詢（效能較差）
- ❌ 複雜度增加
- ❌ 需要維護關聯性

---

#### 方案 D：type 欄位區分

**實作方式**：
```sql
-- 插入兩次
INSERT INTO subtitles (movie_id, type, text) VALUES
('movie_xxx', 'en', 'Hello'),
('movie_xxx', 'zh-tw', '你好');
```

**優點**：
- ✅ 無需修改 schema

**缺點**：
- ❌ 資料重複（除時間戳記外）
- ❌ 查詢複雜（需 GROUP BY 或多行合併）
- ❌ 難以保證資料一致性

---

### 🚀 推薦實作步驟（方案 A）

#### Step 1: 準備資料庫 Migration

```javascript
// scripts/migrate-bilingual-subtitles.js
export async function up(db) {
  await db.execute(`
    ALTER TABLE subtitles
    ADD COLUMN text_zh_tw TEXT
  `);
}

export async function down(db) {
  await db.execute(`
    ALTER TABLE subtitles
    DROP COLUMN text_zh_tw
  `);
}
```

#### Step 2: 修改 n8n Workflow

**新增節點**：
1. **Fetch ZH-TW Subtitles** - 從字幕來源抓取繁體中文
2. **Merge** - 合併英文和中文字幕資料
3. **Transform** - 轉換成資料庫格式

**Workflow 結構**：
```
┌──────────┐
│  Webhook │ 接收 movie_id
└────┬─────┘
     ↓
┌────────────────────────────────┐
│  Fork (並行執行)               │
└──┬────────────────────────┬───┘
   ↓                        ↓
┌──────────────┐      ┌──────────────┐
│ Fetch EN     │      │ Fetch ZH-TW  │
│ Subtitles    │      │ Subtitles    │
└──────┬───────┘      └──────┬───────┘
       │                     │
       └──────────┬──────────┘
                  ↓
         ┌────────────┐
         │  Merge     │ 合併資料
         └──────┬─────┘
                ↓
         ┌────────────┐
         │ Transform  │ 轉換格式
         └──────┬─────┘
                ↓
         ┌────────────┐
         │ Save to DB │ 儲存到 Turso
         └────────────┘
```

#### Step 3: 更新前端顯示邏輯

**「觀看字幕」頁面新增切換**：

```jsx
// 字幕顯示模式
const [subtitleMode, setSubtitleMode] = useState('bilingual'); // 'en' | 'zh-tw' | 'bilingual'

// 顯示邏輯
{subtitleMode === 'bilingual' && (
  <div className="bilingual-subtitle">
    <p className="text-en">{subtitle.text}</p>
    <p className="text-zh">{subtitle.text_zh_tw}</p>
  </div>
)}
```

**UI 控制項**：
```jsx
<div className="flex gap-2 mb-4">
  <button onClick={() => setSubtitleMode('bilingual')}
          className={subtitleMode === 'bilingual' ? 'active' : ''}>
    雙語對照
  </button>
  <button onClick={() => setSubtitleMode('en')}
          className={subtitleMode === 'en' ? 'active' : ''}>
    只看英文
  </button>
  <button onClick={() => setSubtitleMode('zh-tw')}
          className={subtitleMode === 'zh-tw' ? 'active' : ''}>
    只看中文
  </button>
</div>
```

#### Step 4: 測試與驗證

**測試計劃**：
1. 選擇一部測試影片（建議短片）
2. 執行修改後的 n8n workflow
3. 檢查資料庫是否正確儲存雙語
4. 前端顯示測試三種模式
5. 驗證對齊和同步性

---

## 📝 CSS 類別命名規範

### 電影卡片

```jsx
// 最近練習卡片
<button className="movie-card">
  className="flex-shrink-0 w-48 bg-gradient-to-br from-teal-600 to-teal-700 rounded-xl p-4 border-2 cursor-pointer transition-all"
  // 選中狀態
  className="border-teal-400"
  // 未選中
  className="border-transparent bg-slate-700 hover:bg-slate-600"
)
```

### 下拉選單

```jsx
// 下拉容器
<div className="relative">
  // 按鈕
  <button className="w-full bg-slate-700 hover:bg-slate-600 rounded-xl px-6 py-4">
  // 選單
  <div className="dropdown-menu absolute w-full mt-2 bg-slate-700 rounded-xl max-h-96 overflow-y-auto">
)
```

---

## ✅ 實作檢查清單

### 電影選擇區塊
- [ ] 後端 API：最近練習影片查詢
- [ ] 後端 API：所有影片列表查詢
- [ ] 前端組件：MovieSelector.jsx
- [ ] 前端組件：RecentMoviesCard.jsx
- [ ] 前端組件：AllMoviesDropdown.jsx
- [ ] 狀態管理：當前選中的影片 ID
- [ ] 搜尋過濾功能
- [ ] 響應式佈局測試

### n8n Workflow 雙語字幕
- [ ] 資料庫 Migration 腳本
- [ ] n8n workflow 匯出/備份
- [ ] 新增 Fetch ZH-TW 節點
- [ ] 新增 Merge 節點
- [ ] 測試 workflow 執行
- [ ] 驗證資料庫儲存
- [ ] 前端雙語顯示切換
- [ ] 三種模式測試（雙語/EN/ZH-TW）

---

## 🎯 下一步選項

請告訴我您想要：

1. **「開始實作電影選擇區塊」** - 優先實作新的 UI
2. **「先修改 n8n workflow」** - 優先實作雙語字幕抓取
3. **「兩個都做，順序...」** - 告訴我優先順序
4. **「需要調整設計...」** - 其他修改需求

預覽頁面已經開啟，您可以查看新的設計效果！🎉
