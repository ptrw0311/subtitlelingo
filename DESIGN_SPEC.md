# SubtitleLingo - 6 個核心學習按鈕設計規格

## 📨 設計研究總結

基於 UI/UX Pro Max 數據庫搜索結果：

### 產品類型分析
- **類型**: Language Learning App
- **推薦風格**: Claymorphism + Vibrant & Block-based + Micro-interactions
- **關鍵元素**: 進度指示器、清晰的視覺層級、趣味性配色

### 配色方案（調整為深色主題）

```javascript
// 主色調 - Teal（學習、成長）
{
  primary: '#14B8A6',      // Teal-500 - 主要品牌色
  primaryLight: '#2DD4BF', // Teal-400 - hover 狀態
  primaryDark: '#0F766E',  // Teal-600 - active 狀態
  primaryBg: '#CCFBF1',    // Teal-100 - 淺色背景

  // CTA - Orange（行動呼籲）
  cta: '#F97316',          // Orange-500 - 主要按鈕
  ctaHover: '#FB923C',     // Orange-400
  ctaActive: '#EA580C',    // Orange-600

  // 深色主題背景
  bgPrimary: '#0F172A',    // Slate-900 - 主背景
  bgSecondary: '#1E293B',  // Slate-800 - 次要背景
  bgTertiary: '#334155',   // Slate-700 - 三級背景

  // 文字顏色
  textPrimary: '#F1F5F9',  // Slate-100 - 主文字
  textSecondary: '#94A3B8', // Slate-400 - 次要文字
  textMuted: '#64748B',    // Slate-500 - 強調文字

  // 邊框和分隔
  border: '#334155',       // Slate-700
  borderLight: '#475569',  // Slate-600

  // 語義顏色
  success: '#22C55E',      // Green-500 - 完成進度
  warning: '#F59E0B',      // Amber-500 - 待複習
  error: '#EF4444',        // Red-500 - 錯誤
  info: '#3B82F6',         // Blue-500 - 提示
}
```

### 字體系統

```css
/* Google Fonts Import */
@import url('https://fonts.googleapis.com/css2?family=Open+Sans:wght@300;400;500;600;700&family=Poppins:wght@400;500;600;700&display=swap');

/* Tailwind Config */
fontFamily: {
  heading: ['Poppins', 'sans-serif'],
  body: ['Open Sans', 'sans-serif'],
}

/* 使用 */
- 標題 H1-H3: font-heading font-weight 600-700
- 正文: font-body font-weight 400-500
- 按鈕文字: font-heading font-weight 600
```

---

## 🎨 按鈕設計系統

### 視覺層級架構

```
┌─────────────────────────────────────────┐
│  學習流程按鈕區域（Sticky）              │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐  │
│  │ 1    │ │ 2    │ │ 3    │ │ 4    │  │ ← 輸入階段
│  └──────┘ └──────┘ └──────┘ └──────┘  │
│  ┌──────┐ ┌──────┐                  │
│  │ 5    │ │ 6    │                      │ ← 輸出階段
│  └──────┘ └──────┘                  │
└─────────────────────────────────────────┘
```

### 6 個核心按鈕設計

#### 1️⃣ 觀看字幕（Watch Subtitles）

**功能定位**: 可理解輸入（Input）
**學習階段**: ① 初接觸

```jsx
<Button
  icon={<FilmIcon />}
  label="觀看字幕"
  badge="INPUT"
  color="primary"
  description="完整英文字幕 + 雙語對照"
/>
```

**視覺設計**:
- 默認狀態: Teal-500 背景
- Hover: Teal-400 + 微上移（translateY(-2px)）
- Active: Teal-600
- Disabled: opacity-50 cursor-not-allowed
- 徽章: 左上角 "INPUT" 標籤（小字）

---

#### 2️⃣ 重要對話（Key Dialogues）

**功能定位**: 深度理解（Comprehension）
**學習階段**: ② 理解內容

```jsx
<Button
  icon={<ChatBubbleLeftRightIcon />}
  label="重要對話"
  badge="UNDERSTAND"
  color="primary"
  description="精選對話 + 情境學習"
  count={12} // 顯示對話數量
/>
```

**視覺設計**:
- 默認狀態: Teal-600 背景（比 1 號稍深）
- Hover: Teal-500 + 陰影
- 右上角數量徽章: `count` prop
- 點擊後展開對話列表

---

#### 3️⃣ 生字筆記（Vocabulary Notes）

**功能定位**: 詞彙建構（Vocabulary）
**學習階段**: ③ 詞彙學習

```jsx
<Button
  icon={<BookOpenIcon />}
  label="生字筆記"
  badge="VOCAB"
  color="primary"
  description="影片生字 + 掌握度追蹤"
  progressBar={{ current: 8, total: 34 }}
/>
```

**視覺設計**:
- 默認狀態: Teal-700 背景
- 底部進度條: 綠色（success）
- Hover: 顯示詳細統計 tooltip
- 點擊後展開生字列表（可排序）

---

#### 4️⃣ 開始測驗（Start Quiz）

**功能定位**: 主動回想（Active Recall）
**學習階段**: ④ 測驗檢驗 ⭐

```jsx
<Button
  icon={<AcademicCapIcon />}
  label="開始測驗"
  badge="QUIZ"
  color="cta" // Orange - 突顯重要性
  description="四選一測驗 + 成績追蹤"
  glowEffect // 發光效果
/>
```

**視覺設計**:
- **主要行動按鈕** - 使用橙色（CTA）
- 默認狀態: Orange-500 + box-shadow 發光
- Hover: Orange-400 + 放大 1.05 倍
- Active: Orange-600
- 動畫: pulse 效果（1.5s 循環）
- **視覺權重最高** - 吸引用戶點擊

---

#### 5️⃣ 每日複習（Daily Review）⭐ 新功能

**功能定位**: 間隔重複（Spaced Repetition）
**學習階段**: ⑤ 記憶強化 ⭐

```jsx
<Button
  icon={<ArrowPathIcon />}
  label="每日複習"
  badge="SRS"
  color="cta"
  description="今日待複習 + Leitner Box"
  notification={15} // 待複習數量
  streak={7} // 連續天數
/>
```

**視覺設計**:
- **第二重要按鈕** - 也用橙色，但比測驗按鈕小
- 右上角紅色通知圓點: `notification` prop
- 左下角火焰圖標 + 連續天數
- Hover: 顯示複習預覽卡片
- 動畫: 待複習 > 0 時輕微跳動

---

#### 6️⃣ 跟讀練習（Shadowing Practice）⭐ 新功能

**功能定位**: 語言產出（Output）
**學習階段**: ⑥ 口語練習 ⭐

```jsx
<Button
  icon={<MicrophoneIcon />}
  label="跟讀練習"
  badge="SPEAK"
  color="cta"
  description="Shadowing + 錄音評分"
  recordingIndicator // 錄音時閃爍
/>
```

**視覺設計**:
- **產出階段按鈕** - 橙色系
- 麥克風圖標: 錄音時紅色脈衝
- Hover: 顯示練習模式選擇
- Active: 錄音中 - 紅色波形動畫
- 視覺權重: 與「每日複習」相同

---

## 🔄 標籤切換設計

### 布局結構

```
┌──────────────────────────────────────────────────┐
│  🎬 The Dark Knight (2008)                        │
│  ┌────────────────────────────────────────────┐   │
│  │  學習按鈕區域 (Sticky)                     │   │
│  │  [1] [2] [3]                                │   │
│  │  [4]     [5] [6]                            │   │
│  └────────────────────────────────────────────┘   │
│                                                  │
│  ┌────────────────────────────────────────────┐   │
│  │  內容顯示區                                │   │
│  │  （根據選中的按鈕顯示對應內容）            │   │
│  │                                              │   │
│  │                                              │   │
│  └────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────┘
```

### 響應式設計

```jsx
// 桌面端（≥1024px）
<div className="grid grid-cols-3 gap-3">
  {/* 第一行: 1, 2, 3 */}
  <ButtonLearning1 />
  <ButtonLearning2 />
  <ButtonLearning3 />

  {/* 第二行: 4, 5, 6 */}
  <div className="col-span-1">
    <ButtonQuiz /> {/* 4 - 較大 */}
  </div>
  <ButtonReview />  {/* 5 */}
  <ButtonShadowing /> {/* 6 */}
</div>

// 平板端（768px - 1023px）
<div className="grid grid-cols-2 gap-3">
  <ButtonLearning1 />
  <ButtonLearning2 />
  <ButtonLearning3 />
  <ButtonQuiz />
  <ButtonReview />
  <ButtonShadowing />
</div>

// 手機端（<768px）
<div className="flex overflow-x-auto gap-2 pb-2">
  {/* 橫向滾動卡片式按鈕 */}
  <ButtonLearning1 className="min-w-[140px]" />
  <ButtonLearning2 className="min-w-[140px]" />
  {/* ... */}
</div>
```

---

## 🎭 微互動設計

### 1. Hover 狀態

```jsx
const buttonHoverStates = {
  // 輸入階段按鈕（1-3）
  input: {
    default: 'bg-teal-500 text-white',
    hover: 'bg-teal-400 -translate-y-0.5 shadow-lg',
    active: 'bg-teal-600 translate-y-0',
  },

  // 輸出階段按鈕（4-6）
  output: {
    default: 'bg-orange-500 text-white',
    hover: 'bg-orange-400 -translate-y-1 shadow-xl scale-105',
    active: 'bg-orange-600 scale-95',
  },
}
```

### 2. 過渡動畫

```jsx
// 統一過渡設定
const transition = 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)'

// 特殊動畫
const animations = {
  pulse: 'animate-pulse', // 測驗按鈕
  bounce: 'animate-bounce', // 待複習提醒
  spin: 'animate-spin', // 錄音中
}
```

### 3. 載入狀態

```jsx
// Skeleton Loader
<div className="animate-pulse bg-slate-700 rounded-lg h-20" />

// Spinner
<svg className="animate-spin h-5 w-5" />
```

---

## 🎨 按鈕組件代碼結構

### 基礎組件

```jsx
// components/LearningButton.jsx
import { useState } from 'react';

export default function LearningButton({
  icon,
  label,
  description,
  badge,
  color = 'primary',
  count,
  progressBar,
  notification,
  streak,
  disabled = false,
  onClick,
}) {
  const [isHovered, setIsHovered] = useState(false);

  const colorClasses = {
    primary: {
      default: 'bg-teal-500 hover:bg-teal-400 active:bg-teal-600',
      text: 'text-white',
    },
    cta: {
      default: 'bg-orange-500 hover:bg-orange-400 active:bg-orange-600',
      text: 'text-white',
    },
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`
        relative p-4 rounded-xl
        transition-all duration-200
        ${colorClasses[color].default}
        ${colorClasses[color].text}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${!disabled && 'hover:-translate-y-0.5 hover:shadow-lg'}
        active:translate-y-0
      `}
    >
      {/* Badge */}
      {badge && (
        <span className="absolute top-2 left-2 text-xs font-bold opacity-60">
          {badge}
        </span>
      )}

      {/* Icon */}
      <div className="flex justify-center mb-2">
        {icon}
      </div>

      {/* Label */}
      <div className="font-heading font-semibold text-lg">
        {label}
      </div>

      {/* Description */}
      {description && isHovered && (
        <div className="text-sm opacity-90 mt-1">
          {description}
        </div>
      )}

      {/* Count Badge */}
      {count && (
        <span className="absolute top-2 right-2 bg-white/20 px-2 py-1 rounded-full text-xs">
          {count}
        </span>
      )}

      {/* Notification Dot */}
      {notification && notification > 0 && (
        <span className="absolute top-1 right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
      )}

      {/* Progress Bar */}
      {progressBar && (
        <div className="mt-2 bg-black/20 rounded-full h-2">
          <div
            className="bg-green-400 h-2 rounded-full transition-all"
            style={{ width: `${(progressBar.current / progressBar.total) * 100}%` }}
          />
        </div>
      )}

      {/* Streak */}
      {streak && (
        <div className="absolute bottom-2 left-2 flex items-center gap-1 text-xs">
          🔥 {streak}
        </div>
      )}
    </button>
  );
}
```

---

## 📱 實作優先級

### Phase 1: 核心輸入階段（已有功能優化）
- ✅ 1️⃣ 觀看字幕 - 優化 layout
- ✅ 2️⃣ 重要對話 - 優化 layout
- ✅ 3️⃣ 生字筆記 - 優化 layout
- ✅ 4️⃣ 開始測驗 - 已實作

### Phase 2: 學習強化（新功能）
- 🔥 5️⃣ 每日複習 - **高優先級**
- 🔥 6️⃣ 跟讀練習 - **中優先級**

---

## ✅ 設計檢查清單

### 視覺質量
- [ ] 無 emoji（使用 SVG icons from Heroicons）
- [ ] 所有圖標來自一致集合
- [ ] Hover 狀態不改變 layout
- [ ] 使用主題顏色（非 var()）
- [ ] 進度條可見且有意義

### 互動
- [ ] 所有可點擊元素有 cursor-pointer
- [ ] Hover 狀態提供清晰的視覺反饋
- [ ] 過渡平滑（150-300ms）
- [ ] 鍵盤導航可見 focus 狀態

### 響應式
- [ ] 手機端（320px）可正常使用
- [ ] 平板端（768px）合理佈局
- [ ] 桌面端（1024px+）最佳體驗
- [ ] 無水平滾動（手機卡片式除外）

### 可訪問性
- [ ] 所有圖標有 aria-label
- [ ] 顏色不是唯一的指示器
- [ ] 鍵盤可操作
- [ ] 焦點順序合理

---

## 🚀 下一步行動

選擇實作方案：
1. **直接實作全部 6 個按鈕** - 完整替換現有 UI
2. **分階段實作** - 先做 Phase 1，再做 Phase 2
3. **先做原型** - 創建獨立頁面預覽效果

請告訴我您的選擇，我會立即開始編碼！
