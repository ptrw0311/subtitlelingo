import { useState, useEffect } from 'react';
import { vocabularyDB, importantDialoguesDB } from '../config/turso-api';

const USER_ID = 'demo_user';

export default function LearningButtons({ selectedMovie }) {
  const [stats, setStats] = useState({
    dialoguesCount: 0,
    vocabularyCount: 0,
    masteredCount: 0,
    reviewCount: 0,
    streak: 0
  });

  useEffect(() => {
    if (selectedMovie) {
      fetchStats();
    }
  }, [selectedMovie]);

  const fetchStats = async () => {
    try {
      // 取得對話數量
      const dialoguesResult = await importantDialoguesDB.getByMovieId(selectedMovie.id);
      const dialoguesCount = dialoguesResult.data ? dialoguesResult.data.length : 0;

      // 取得生字數量
      const vocabResult = await vocabularyDB.getByMovieId(selectedMovie.id);
      const vocabularyCount = vocabResult.data ? vocabResult.data.length : 0;

      // 計算已掌握生字數量（mastery_level >= 3）
      const masteredCount = vocabResult.data
        ? vocabResult.data.filter(v => v.mastery_level >= 3).length
        : 0;

      // 計算待複習數量（基於 Leitner Box）
      const reviewCount = vocabResult.data
        ? vocabResult.data.filter(v => {
            if (!v.next_review_date) return false;
            const nextReview = new Date(v.next_review_date);
            return nextReview <= new Date();
          }).length
        : 0;

      // 計算連續學習天數
      const streak = Math.floor(Math.random() * 30) + 1; // 暫時用隨機值

      setStats({
        dialoguesCount,
        vocabularyCount,
        masteredCount,
        reviewCount,
        streak
      });
    } catch (error) {
      console.error('取得統計資料失敗:', error);
    }
  };

  const buttons = [
    {
      id: 'subtitle',
      tag: 'INPUT',
      tagColor: 'bg-teal-400/20 text-teal-400',
      tagText: 'text-teal-300',
      icon: '📽️',
      title: '觀看字幕',
      description: '完整英文字幕 + 雙語對照',
      gradient: 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)',
      action: () => console.log('觀看字幕')
    },
    {
      id: 'dialogue',
      tag: 'UNDERSTAND',
      tagColor: 'bg-blue-400/20 text-blue-400',
      tagText: 'text-blue-300',
      icon: '💬',
      title: '重要對話',
      description: '精選對話 + 情境學習',
      gradient: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
      badge: stats.dialoguesCount || 12,
      badgeColor: 'bg-blue-500/30 text-blue-300',
      action: () => console.log('重要對話')
    },
    {
      id: 'vocabulary',
      tag: 'VOCAB',
      tagColor: 'bg-purple-400/20 text-purple-400',
      tagText: 'text-purple-300',
      icon: '📚',
      title: '生字筆記',
      description: '影片生字 + 掌握度追蹤',
      gradient: 'linear-gradient(135deg, #9333ea 0%, #7e22ce 100%)',
      badge: stats.vocabularyCount > 0
        ? `${stats.masteredCount}/${stats.vocabularyCount}`
        : `${stats.masteredCount}/${stats.vocabularyCount || 0}`,
      badgeText: '已掌握',
      badgeColor: 'bg-purple-500/30 text-purple-300',
      action: () => console.log('生字筆記')
    },
    {
      id: 'quiz',
      tag: 'QUIZ',
      tagColor: 'bg-orange-400/20 text-orange-400',
      tagText: 'text-orange-300',
      icon: '🎯',
      title: '開始測驗',
      description: '四選一測驗 + 成績追蹤',
      gradient: 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)',
      action: () => console.log('開始測驗')
    },
    {
      id: 'srs',
      tag: 'SRS',
      tagColor: 'bg-pink-400/20 text-pink-400',
      tagText: 'text-pink-300',
      icon: '🔄',
      title: '每日複習',
      description: '今日待複習 + Leitner Box',
      gradient: 'linear-gradient(135deg, #db2777 0%, #be185d 100%)',
      badge: '🔥',
      badgeText: stats.reviewCount > 0 ? `${stats.reviewCount} 個` : `${stats.streak} 天`,
      badgeColor: 'bg-orange-500/30 text-orange-300',
      action: () => console.log('每日複習')
    },
    {
      id: 'speaking',
      tag: 'SPEAK',
      tagColor: 'bg-green-400/20 text-green-400',
      tagText: 'text-green-300',
      icon: '🎤',
      title: '跟讀練習',
      description: 'Shadowing + 錄音評分',
      gradient: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
      action: () => console.log('跟讀練習')
    }
  ];

  return (
    <div className="mb-8">
      <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6">
        {/* 標題 */}
        <div className="mb-6">
          <h2 className="font-heading text-2xl font-bold text-white mb-2">
            學習模式
          </h2>
          <p className="text-slate-400 text-sm">
            選擇您的學習方式，按照 Input → Understand → Vocab → Quiz → SRS → Speak 的流程學習
          </p>
        </div>

        {/* 3x2 網格佈局 - 桌面端 */}
        <div className="grid grid-cols-3 gap-4">
          {buttons.map((button) => (
            <button
              key={button.id}
              onClick={button.action}
              className={`
                relative hover:opacity-90
                rounded-xl p-5 text-left
                transition-all duration-200
                border-2 border-transparent hover:border-white/30
                group shadow-lg
              `}
              style={{
                background: button.gradient,
                transform: 'translateY(0)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 12px 24px rgba(0, 0, 0, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.3)';
              }}
            >
              {/* 標籤 - 左上角 */}
              <div className={`inline-block px-2 py-1 rounded text-xs font-bold mb-3 bg-white/20 text-white`}>
                {button.tag}
              </div>

              {/* 圖示與標題 */}
              <div className="flex items-start gap-3 mb-3">
                <div className="text-4xl group-hover:scale-110 transition-transform">
                  {button.icon}
                </div>
                <div className="flex-1">
                  <h3 className="font-heading font-bold text-xl text-white mb-1">
                    {button.title}
                  </h3>
                </div>
              </div>

              {/* 描述 */}
              <p className="text-sm text-white/90 mb-2">
                {button.description}
              </p>

              {/* 徽章 - 右下角（如果有） */}
              {button.badge && (
                <div className="absolute bottom-4 right-4 flex items-center gap-1">
                  <span className={`text-lg font-bold bg-white/20 text-white px-3 py-1 rounded`}>
                    {button.badge}
                  </span>
                  {button.badgeText && (
                    <span className="text-xs text-white/80 font-medium">
                      {button.badgeText}
                    </span>
                  )}
                </div>
              )}
            </button>
          ))}
        </div>

        {/* 提示訊息 */}
        <div className="mt-6 p-4 bg-slate-900/50 rounded-lg border border-slate-600">
          <p className="text-sm text-slate-400">
            💡 <span className="text-teal-400 font-semibold">建議學習順序：</span>
            觀看字幕 → 重要對話 → 生字筆記 → 開始測驗 → 每日複習 → 跟讀練習
          </p>
        </div>
      </div>
    </div>
  );
}
